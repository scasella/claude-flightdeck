// Header, main card, gate card and the sessions box.
import { html } from "htm/preact";
import { useState } from "preact/hooks";
import { Gauge } from "./bars.js";
import { pickSession } from "./feed.js";
import { current, lastOk, narrow, now, sessions, toggleGate, view } from "./store.js";
import { k, sessionDir, vColor } from "./util.js";

function Meter({ label, pct, big, note }) {
  const cls = pct >= 80 ? "c-warn" : pct >= 60 ? "c-amber" : "c-main";
  return html`<div class="meter"><div class="row"><span class="dim">${label}</span>${note ? html`<span class="faint t">${note}</span>` : null}<span class=${"r b" + (big ? " bignum" : "")}>${pct}%</span></div><div class="gwrap"><${Gauge} pct=${pct} n=${30} cls=${cls}/></div></div>`;
}

export function MainCard({ S }) {
  const c = S.ctx, idle = S.status === "idle";
  const facts = [["cost", "$" + S.cost.toFixed(2)], ["effort", S.effort], ["mode", S.mode], ["requests", S.req], ["last ttft", S.ttft + "s"]];
  return html`<section class="box c-main mainband">
    <div class="row"><span class="c-main b t ttl">${S.model + " · main"}</span><span class=${"r " + (idle ? "dim" : "c-main")}>${idle ? "○ idle" : "● working"}</span></div>
    <div class="meters"><${Meter} label="context" pct=${c.pct} big note=${k(c.tokens) + "/" + k(c.window) + (c.est ? " est" : "")}/><${Meter} label="5h" pct=${S.fiveH}/><${Meter} label="7d" pct=${S.sevenD}/></div>
    <div class="facts">${facts.map((f) => html`<span class="fact"><span class="dim">${f[0] + " "}</span><span class="b c-main">${f[1]}</span></span>`)}</div>
  </section>`;
}

function GateKeys({ g, open }) {
  const keys = [["f", "file", g.file], ["s", "shell", g.shell], ["o", "other", g.other]];
  return html`<div class="row wraprow">${keys.map((x) => html`<span class=${"key" + (open === x[0] ? " b c-gate" : "")} tabIndex="0" onClick=${() => toggleGate(x[0])}><span class="dim">[</span><span class="b c-gate">${x[0]}</span><span class="dim">] </span>${x[1] + " " + x[2] + "  "}</span>`)}</div>`;
}

function GateRows({ g, open }) {
  const shown = open ? [open] : ["f", "s", "o"];
  return shown.flatMap((gk) => (g.rows[gk] || []).map((r) => html`<div class="row"><span class=${vColor[r.v] || "dim"}>${r.v === "denied" ? "✗" : "■"}</span><span class="dim">${r.v}</span><span class="t">${r.d}</span></div>`));
}

function GateTally({ g }) {
  const deniedCls = g.denied > 0 ? "c-warn" : "dim";
  return html`<div class="row wraprow"><span><span class="c-gate">${"■ "}</span>${g.allowed} allowed</span><span><span class="c-cleared">${"■ "}</span>${g.classifier} classifier</span><span class=${g.denied > 0 ? "" : "dim"}><span class=${deniedCls}>${"✗ "}</span><span class=${deniedCls}>${g.denied}</span> denied</span></div>`;
}

export function GateCard({ S }) {
  const g = S.gate, open = view.value.gate, [expanded, setExpanded] = useState(false);
  const folded = narrow.value && !expanded;
  const strip = [...g.strip].map((ch) => html`<span class=${ch === "a" ? "c-gate" : ch === "d" ? "c-warn" : "c-cleared"}>${"■"}</span>`);
  return html`<section class="box c-gate gate">
    <div class="row"><span class="c-gate b ttl">GATE · permissions</span><span class="r dim meta">${g.checks} checks</span></div>
    <${GateTally} g=${g}/>
    ${narrow.value ? html`<div><button class="more" aria-expanded=${expanded} onClick=${() => setExpanded(!expanded)}>${expanded ? "hide checks" : "show checks"}</button></div>` : null}
    ${folded ? null : html`<div class="row gstrip"><span class="bar t">${strip}</span></div>
    <${GateKeys} g=${g} open=${open}/>
    ${open ? null : html`<div class="faint sec">recent checks</div>`}
    <${GateRows} g=${g} open=${open}/>`}
  </section>`;
}

// Enter and Space press a role=button row the way they press a real button.
function onActivate(e, act) {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  e.stopPropagation();
  act();
}

function SessionRow({ id, f }) {
  const on = id === current.value, idle = f.status === "idle";
  return html`<div class="row srow" data-key=${"s-" + id} title=${f.session && f.session.cwd || ""} role="button" tabIndex="0" aria-pressed=${on} onClick=${() => pickSession(id)} onKeyDown=${(e) => onActivate(e, () => pickSession(id))}><span class=${on ? "c-agent b" : "faint"}>${on ? "> " : "  "}</span><span class=${on ? "b lbl" : "lbl"}>${sessionDir(f)}</span><span class="dim t">${" " + f.model + " "}</span><span class=${idle ? "dim" : "c-main"}>${idle ? "○" : "●"}</span></div>`;
}

// Every live session as a row; click one to follow it.
export function SessionsCard() {
  const all = sessions.value, keys = Object.keys(all);
  return html`<section class="box c-agent sessions fill">
    <div class="row"><span class="c-agent b ttl">sessions</span><span class="dim t meta">${" · " + keys.length + " live"}</span></div>
    ${keys.length ? null : html`<div class="faint">no live sessions yet</div>`}
    ${keys.map((id) => html`<${SessionRow} key=${id} id=${id} f=${all[id]}/>`)}
  </section>`;
}

function LiveTag() {
  const ok = lastOk.value;
  if (location.protocol === "file:" && !ok) return html`<span class="live faint" id="liveTag">sample</span>`;
  const a = ok ? Math.round((now.value - ok) / 1000) : -1;
  const text = a < 0 ? "no feed" : a > 10 ? "stale " + a + "s" : "live";
  return html`<span class=${"live " + (a < 0 || a > 10 ? "c-warn" : "c-gate")} id="liveTag">${text}</span>`;
}

export function Header({ S }) {
  return html`<div class="top"><${MainCard} S=${S}/><div class="hd">
    <div><span class="b">FLIGHTDECK </span><${LiveTag}/></div>
    <div><span class="c-main">${"■"}</span><span class="dim">${" main  "}</span><span class="c-agent">${"■"}</span><span class="dim">${" agents  "}</span><span class="c-gate">${"■"}</span><span class="dim">${" gate"}</span></div>
  </div></div>`;
}
