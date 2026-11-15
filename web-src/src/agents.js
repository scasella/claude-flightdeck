// Agent lanes and the agent detail: focus card (layout 10), expanded card or preview.
import { html } from "htm/preact";
import { AgentBar, Mark, liveRun } from "./bars.js";
import { toggleCard } from "./store.js";
import { LAYOUT, clockOf, stColor } from "./util.js";

function Lane({ c, i, sel }) {
  const on = sel === i, { elapsed } = liveRun(c);
  return html`<div class="row lane" data-key=${i + ":" + c.label} data-state=${c.state} title=${c.type + " · " + c.model + " · " + c.steps + " steps"} tabIndex="0" onClick=${() => toggleCard(i)}>
    <${Mark} state=${c.state}/><span class=${"t lbl " + (on ? "b" : "")}><span class=${on ? "sel b" : "faint"}>${on ? "> " : "  "}</span>${i < 6 ? html`<span class="faint keyhint">${"[" + (i + 1) + "] "}</span>${c.label}` : (i + 1) + ": " + c.label}</span><${AgentBar} c=${c} cls="r bar"/><span class="dim clk">${elapsed == null ? c.t : clockOf(elapsed)}</span>
  </div>`;
}

export function Lanes({ S, sel, cls }) {
  const a = S.agents, run = a.filter((x) => x.state === "running").length, failed = a.filter((x) => x.state === "error").length;
  return html`<section class=${cls}>
    <div class="row sec"><span class="b ttl">agents</span><span class="dim meta">${"· " + run + " running · " + a.length + " total"}</span>${failed ? html`<span class="c-warn b meta">${"· " + failed + " failed"}</span>` : null}<span class="r faint meta">${"1-" + Math.min(6, a.length) + " expand"}</span></div>
    ${!a.length ? html`<div class="faint">no subagents yet</div>` : null}
    ${a.length && S.earlier ? html`<div class="faint">${"+" + S.earlier + " earlier"}</div>` : null}
    ${a.map((c, i) => html`<${Lane} key=${i + ":" + c.label} c=${c} i=${i} sel=${sel}/>`)}
  </section>`;
}

function ToolTrail({ tools }) {
  const counts = {};
  tools.forEach((t) => { const n = t.split(" ")[0]; counts[n] = (counts[n] || 0) + 1; });
  return html`<div class="fcols">
    <div class="ftrail"><div class="faint sec">tool trail</div>${tools.map((t, j) => { const parts = t.split(" -> "); return html`<div class="row"><span class="faint">${String(j + 1).padStart(2, " ")}</span><span class="c-agent b">${parts[0]}</span><span class="t">${parts.slice(1).join(" -> ")}</span></div>`; })}</div>
    <div class="ftally"><div class="faint sec">tools used</div>${Object.keys(counts).map((n) => html`<div class="row"><span class="c-agent">${n}</span><span class="r b">${counts[n]}</span></div>`)}</div>
  </div>`;
}

// Layout 10: the open agent is the hero - meta, timeline, full tool trail, tool tally, answer.
function FocusCard({ c, i }) {
  const color = c.state === "error" ? "c-warn" : c.state === "running" ? "c-agent" : "c-gate";
  const meta = [["type", c.type], ["model", c.model], ["state", c.state], ["steps", c.steps], ["elapsed", c.t]];
  return html`<section class=${"box " + color + " focus fill"}>
    <div class="row"><${Mark} state=${c.state}/><span class="b t ftitle">${(i + 1) + ": " + c.label}</span><span class="r dim">[ ] prev/next</span></div>
    <div class="fmeta">${meta.map((m) => html`<span><span class="dim">${m[0] + " "}</span><span class=${"b " + (m[0] === "state" ? stColor[c.state] : "")}>${m[1]}</span></span>`)}</div>
    <${AgentBar} c=${c} cls="ftrack bar"/>
    <${ToolTrail} tools=${c.tools}/>
    <div class="faint sec">answer</div>
    <div class="wrap fanswer">${c.answer ? c.answer : c.state === "running" ? "still working..." : "no answer"}</div>
  </section>`;
}

const tok = (n) => (n >= 1000 ? Math.round(n / 1000) + "k" : String(n || 0));

// The picked (or previewed) agent: what it was asked, where it stands, what it did and what it said.
function Expanded({ c, i, note }) {
  const meta = [["type", c.type], ["model", c.model], ["state", c.state], ["steps", c.steps], ["elapsed", c.t],
    ["context", tok(c.ctx)], ["output", tok(c.out)], ["stop", c.stop]].filter((m) => m[1] !== undefined && m[1] !== "");
  return html`<section class=${"box " + (c.state === "error" ? "c-warn" : "c-agent") + " focus fill"}>
    ${note ? html`<div class="faint">${note}</div>` : null}
    <div class="row"><${Mark} state=${c.state}/><span class="b t ftitle">${(i + 1) + ": " + c.label}</span></div>
    ${c.task ? html`<div class="wrap dim">${c.task}</div>` : null}
    <div class="fmeta">${meta.map((m) => html`<span><span class="dim">${m[0] + " "}</span><span class=${"b " + (m[0] === "state" ? stColor[c.state] : "")}>${m[1]}</span></span>`)}</div>
    <${AgentBar} c=${c} cls="ftrack bar"/>
    <${ToolTrail} tools=${c.tools}/>
    <div class="faint sec">answer</div>
    <div class="wrap fanswer">${c.answer ? c.answer : c.state === "running" ? "still working..." : "no answer"}</div>
  </section>`;
}

// With nothing picked, the detail panel shows the newest running agent (else the newest one).
export function Detail({ S, card }) {
  const a = S.agents;
  if (LAYOUT === 10 && a[card]) return html`<${FocusCard} c=${a[card]} i=${card}/>`;
  if (LAYOUT !== 10 && a[card]) return html`<${Expanded} c=${a[card]} i=${card}/>`;
  if (a.length && LAYOUT !== 10) {
    let i = a.map((x) => x.state).lastIndexOf("running");
    if (i < 0) i = a.length - 1;
    return html`<${Expanded} c=${a[i]} i=${i} note=${"preview · press " + (i + 1) + " to pin"}/>`;
  }
  return html`<div class="box faint fill">press 1-6 to open an agent</div>`;
}
