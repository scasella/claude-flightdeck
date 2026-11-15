// The browser view's feed: the pane's state mapped to the shape web/index.html reads.
import type { AgentCard, Bucket, Gate, LogLine, Loop, Main, Receipt, Usage } from '../types'
import { cardTitle, prettyModel, redact, shorten } from './core'

/** Track cells the web timeline draws (TRACK in web/index.html). */
const TRACK = 40
const STRIP = 70
const ROWS = 6
const CARDS = 6

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

function agentsOf(cards: AgentCard[], now: number) {
  const shown = cards.slice(-CARDS)
  const start = Math.min(now, ...shown.map(c => c.spawnedAt))
  const span = Math.max(1, now - start)
  const cell = (ms: number) => Math.round((ms / span) * TRACK)
  return shown.map(c => {
    const end = c.endedAt ?? now
    return {
      label: shorten(redact(cardTitle(c)), 60),
      type: c.type,
      model: prettyModel(c.model),
      state: c.status === 'running' ? 'running' : c.status === 'completed' || c.status === 'done' ? 'done' : 'error',
      steps: c.steps,
      t: clock(end - c.spawnedAt),
      b: cell(c.spawnedAt - start),
      w: Math.max(1, cell(end - c.spawnedAt)),
      tools: c.tools.slice(-3).map(n => shorten(redact(`${n.tool} -> ${n.text}`), 80)),
      answer: shorten(redact(c.answer), 200),
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

/** The page loads this as a script, which works from file:// where fetch does not. `<` is escaped so no text closes the tag. */
export const toWebScript = (state: ReturnType<typeof toWeb>) =>
  `window.FD_STATE=${JSON.stringify(state).replace(/</g, '\\u003c')};\n`
