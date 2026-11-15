// Other loops, last turn and the session log.
import { html } from "htm/preact";

export function Loops({ l }) {
  return html`<div class="row sec"><span class="b">other loops</span><span class="dim">${l.seen + " seen · " + l.active + " active"}</span><span class="faint" title=${l.seen + " loops seen, " + l.active + " active"}>${"○".repeat(l.seen)}</span></div>`;
}

export function LastTurn({ t }) {
  return html`<section class="box c-main"><div class="row"><span class="c-gate">✓</span><span class="t">${"last turn " + t.secs + "s · " + t.agents + " agents · " + t.edits + " edit"}</span><span class="r c-main">${"+$" + t.cost.toFixed(2)}</span></div></section>`;
}

export function Log({ log }) {
  return html`<section class="box c-agent log fill"><div>session log</div>${log.slice(-40).map((e) => {
    const key = e.at + e.src + e.msg;
    return html`<div class="row" key=${key} data-key=${key}><span class="faint">${e.at}</span><span class="c-agent b">${e.src}</span><span class="r t">${e.msg}</span></div>`;
  })}</section>`;
}
