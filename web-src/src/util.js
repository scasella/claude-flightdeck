// Shared constants and pure helpers for the panels.
export const LAYOUT = Math.max(1, Math.min(10, +(new URLSearchParams(location.search).get("layout") || 1)));
// With no feed fill, a running agent is measured against this typical run time.
export const GUESS_S = 300;
export const MAX_SEGS = 20;
export const SPIN = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";
export const stColor = { running: "c-agent", done: "c-gate", error: "c-warn" };
export const stMark = { running: "⠋", done: "✓", error: "✗" };
export const vColor = { allowed: "c-gate", classifier: "c-cleared", denied: "c-warn", pending: "c-amber" };

export function secs(t) {
  return String(t || "0").split(":").map(Number).reduce((a, n) => a * 60 + (n || 0), 0);
}

export function clockOf(s) {
  s = Math.round(s);
  const m = Math.floor(s / 60), two = (n) => ("0" + n).slice(-2);
  return m >= 60 ? Math.floor(m / 60) + ":" + two(m % 60) + ":" + two(s % 60) : m + ":" + two(s % 60);
}

export function typicalS(c) {
  return c.over ? Math.max(1, secs(c.t)) : c.fill > 0.01 ? secs(c.t) / c.fill : GUESS_S;
}

export function k(n) {
  return n >= 1000 ? Math.round(n / 1000) + "k" : String(n);
}

// Layout 10 always shows one agent: the picked one, else the first running one, else the first.
export function focusIndex(S, card) {
  if (card != null) return card;
  const r = S.agents.findIndex((a) => a.state === "running");
  return r >= 0 ? r : 0;
}

export function sessionDir(f) {
  return (f.session && f.session.cwd || "").replace(/[\\/]+$/, "").split(/[\\/]/).pop() || "session";
}
