// Agent bars, gauges and the running mark.
import { html } from "htm/preact";
import { useLayoutEffect, useRef, useState } from "preact/hooks";
import { feedAt, now, resized, spin } from "./store.js";
import { GUESS_S, MAX_SEGS, SPIN, secs, stColor, stMark, typicalS } from "./util.js";

// Fill against the typical run time; past it the bar pulses instead of claiming more.
// A running agent's elapsed time grows from the feed's clock between feeds.
export function liveRun(c) {
  const run = c.state === "running";
  if (!run) return { fill: c.fill != null ? c.fill : 1, pulse: !!c.over, elapsed: null };
  // A feed from an older plugin carries only the timeline width, so its running bars use the guess.
  const typ = c.fill != null ? typicalS(c) : GUESS_S;
  const elapsed = secs(c.t) + Math.max(0, now.value - feedAt.value) / 1000;
  return { fill: Math.min(0.95, elapsed / typ), pulse: elapsed / typ > 1, elapsed };
}

let segW = 0;
function segWidth() {
  if (segW) return segW;
  const probe = document.createElement("span");
  probe.className = "segs";
  probe.textContent = "▰".repeat(10);
  probe.style.cssText = "position:absolute;visibility:hidden";
  document.body.appendChild(probe);
  segW = probe.getBoundingClientRect().width / 10;
  probe.remove();
  return segW;
}

// The segment count follows the bar's width, so a narrow window shows fewer, whole segments
// instead of cutting off the filled end.
function useSegments(ref) {
  const [total, setTotal] = useState(MAX_SEGS);
  resized.value;
  useLayoutEffect(() => {
    const w = ref.current && ref.current.clientWidth, sw = segWidth();
    const fit = w && sw ? Math.max(4, Math.min(MAX_SEGS, Math.floor(w / sw))) : MAX_SEGS;
    if (fit !== total) setTotal(fit);
  });
  return total;
}

export function AgentBar({ c, cls }) {
  const ref = useRef(null), total = useSegments(ref);
  const { fill, pulse } = liveRun(c);
  const n = Math.max(1, Math.min(total, Math.round(fill * total)));
  return html`<span ref=${ref} class=${cls + " segs"} style="display:flex"><span class=${stColor[c.state] + (pulse ? " pulse" : "") + " fillbar"} data-fill=${fill} data-pct=${Math.round(fill * 100)}>${"▰".repeat(n)}</span><span class="track">${"▱".repeat(total - n)}</span></span>`;
}

export function Mark({ state }) {
  const text = state === "running" ? SPIN[spin.value] : stMark[state];
  return html`<span class=${stColor[state] + (state === "running" ? " spin" : "")}>${text}</span>`;
}

export function Gauge({ pct, n, cls }) {
  const f = Math.max(0, Math.min(n, Math.round(pct / 100 * n)));
  return html`<span class="bar"><span class=${cls}>${"━".repeat(f)}</span><span class="faint">${"━".repeat(n - f)}</span></span>`;
}
