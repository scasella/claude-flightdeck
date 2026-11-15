// The browser view's feed: the pane's state mapped to the shape web/index.html reads.
import type { AgentCard, Bucket, Gate, LogLine, Loop, Main, Receipt, Usage } from '../types'
import { cardTitle, prettyModel, redact, shorten } from './core'

const STRIP = 70
const ROWS = 6
const CARDS = 6
/** Tool calls kept per agent for the browser's detail card. */
const TOOLS = 12

const pctOf = (u: Usage, kind: RegExp) => u.limits.find(l => kind.test(l.kind))?.pct ?? 0

const clock = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const hms = (at: number) => new Date(at).toTimeString().slice(0, 8)

/** rule: allowed. ask or cleared: classifier. deny: denied. */
const verdictOf = (v: string) => (v === 'rule' ? 'allowed' : v === 'deny' ? 'denied' : 'classifier')

function gateOf(g: Gate) {
  const sum = (b: Bucket) => {
    const t = g.totals[b]
    return t.rule + t.ask + t.cleared + t.deny
  }
  const all = (['file', 'shell', 'other'] as const).map(b => g.totals[b])
  const allowed = all.reduce((n, t) => n + t.rule, 0)
  const denied = all.reduce((n, t) => n + t.deny, 0)
  const checks = sum('file') + sum('shell') + sum('other')
  const rows = (b: Bucket) =>
    g.recent
      .filter(c => c.bucket === b)
      .slice(-ROWS)
      .map(c => ({ v: verdictOf(c.verdict), d: shorten(redact(c.detail || c.tool), 90) }))
  return {
    checks,
    allowed,
    classifier: checks - allowed - denied,
    denied,
    file: sum('file'),
    shell: sum('shell'),
    other: sum('other'),
    strip: g.recent
      .slice(-STRIP)
      .map(c => (c.verdict === 'rule' ? 'a' : c.verdict === 'deny' ? 'd' : 'c'))
      .join(''),
    rows: { f: rows('file'), s: rows('shell'), o: rows('other') },
  }
}

/** Agents report no total, so a running bar measures elapsed time against how long finished ones took. */
const GUESS_MS = 5 * 60_000
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const mid = s.length >> 1
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2
}
function typicalMs(cards: AgentCard[]) {
  const took = (cs: AgentCard[]) => cs.filter(c => c.endedAt != null).map(c => c.endedAt! - c.spawnedAt)
  const all = took(cards)
  return (type: string) => {
    const same = took(cards.filter(c => c.type === type))
    return same.length ? median(same) : all.length ? median(all) : GUESS_MS
  }
}

function agentsOf(cards: AgentCard[], now: number) {
  const shown = cards.slice(-CARDS)
  const typical = typicalMs(cards)
  return shown.map(c => {
    const end = c.endedAt ?? now
    const ratio = c.endedAt != null ? 1 : (now - c.spawnedAt) / Math.max(1, typical(c.type))
    return {
      label: shorten(redact(cardTitle(c)), 60),
      type: c.type,
      model: prettyModel(c.model),
      state: c.status === 'running' ? 'running' : c.status === 'completed' || c.status === 'done' ? 'done' : 'error',
      steps: c.steps,
      t: clock(end - c.spawnedAt),
      fill: c.endedAt != null ? 1 : Math.min(0.95, Math.round(ratio * 100) / 100),
      over: c.endedAt == null && ratio > 1,
      tools: c.tools.slice(-TOOLS).map(n => shorten(redact(`${n.tool} -> ${n.text}`), 80)),
      answer: shorten(redact(c.answer), 600),
      task: shorten(redact(c.description), 160),
      ctx: c.ctx,
      out: c.out,
      stop: c.lastStop ?? '',
    }
  })
}

export type WebInput = {
  m: Main
  u: Usage
  g: Gate
  cards: AgentCard[]
  loops: Loop[]
  lines: LogLine[]
  receipt: Receipt | null
  now: number
}

export function toWeb({ m, u, g, cards, loops, lines, receipt, now }: WebInput) {
  return {
    model: prettyModel(m.model),
    status: m.isRunning ? 'working' : 'idle',
    effort: m.effort || '--',
    mode: m.mode || '--',
    req: m.steps,
    ctx: { pct: u.pct ?? 0, tokens: u.tokens ?? 0, window: u.compactWindow ?? u.window, est: u.isCompactEstimate },
    cost: u.costUsd ?? 0,
    fiveH: pctOf(u, /five|5h/i),
    sevenD: pctOf(u, /seven|7d|week/i),
    ttft: m.speed ? Math.round(m.speed.ttftMs / 100) / 10 : 0,
    gate: gateOf(g),
    agents: agentsOf(cards, now),
    earlier: Math.max(0, cards.length - CARDS),
    loops: { seen: loops.length, active: loops.filter(l => !l.isDone).length },
    lastTurn: receipt
      ? { secs: Math.round(receipt.durationMs / 1000), agents: receipt.agents, edits: receipt.edits, cost: receipt.costDelta ?? 0 }
      : { secs: 0, agents: 0, edits: 0, cost: 0 },
    log: lines.slice(-8).map(l => ({ at: hms(l.at), src: l.who, msg: shorten(redact(l.text), 120) })),
  }
}

/** `<` is escaped so no text closes the script tag. */
const asScript = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c')

/** A session's feed file name (no extension), safe on every file system and as a DOM id. */
export const feedKey = (sessionId: string) => sessionId.replace(/[^\w-]/g, '_')

export type WebFeed = ReturnType<typeof toWeb> & { session: { id: string; cwd: string } }

/**
 * One session's feed, loaded by the page as a script (works from file://, where fetch does not).
 * A null feed is written when the session ends, so its summaries do not outlive it; the page drops it.
 */
export const toFeedScript = (key: string, feed: WebFeed | null) =>
  `(window.FD_FEEDS=window.FD_FEEDS||{})[${asScript(key)}]=${asScript(feed)};\n`

/** The feeds written lately, so the page knows which files to load. */
export const toIndexScript = (keys: string[]) => `window.FD_INDEX=${asScript({ keys })};\n`

/** The session that last opened the web view; the page switches to it when it changes. */
export const toFocusScript = (key: string) => `window.FD_FOCUS=${asScript(key)};\n`
