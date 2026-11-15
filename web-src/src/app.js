// The pane: header, sessions, gate, agents, detail, loops and log in the chosen layout.
import { Fragment } from "preact";
import { html } from "htm/preact";
import { useLayoutEffect } from "preact/hooks";
import { Detail, Lanes } from "./agents.js";
import { motion } from "./feed.js";
import { animateChanges } from "./motion.js";
import { GateCard, Header, SessionsCard } from "./panels.js";
import { current, feed, keysOpen, narrow, view } from "./store.js";
import { LastTurn, Log, Loops } from "./tail.js";
import { LAYOUT, focusIndex } from "./util.js";

const FOOT = "1-6 expand · f/s/o gate rows · t theme · ? keys · esc back";
const KEYS = [["1-6", "open or close an agent"], ["f s o", "gate rows: file, shell, other"], ["t T", "next or previous theme"],
  ["[ ]", "previous or next agent (layout 10)"], ["esc", "back, close this list"], ["?", "show or hide this list"]];

function KeyList() {
  if (!keysOpen.value) return null;
  return html`<div class="box c-agent keylist" role="dialog" aria-label="keys">
    <div class="row"><span class="c-agent b ttl">keys</span><button class="r more" onClick=${() => { keysOpen.value = false; }}>close</button></div>
    ${KEYS.map((x) => html`<div class="row"><span class="b kk">${x[0]}</span><span class="dim">${x[1]}</span></div>`)}
  </div>`;
}

// Layout 1: three columns. The list sizes to its rows; the detail below takes the rest of the column.
function Columns({ S, card }) {
  // Phones: one column in reading order (main sits in the header above), so tab order matches.
  if (narrow.value) return html`<div class="grid"><div class="col">
    <${SessionsCard}/><${Lanes} S=${S} sel=${view.value.card} cls="box c-agent agents lanes"/><${Detail} S=${S} card=${card}/><${GateCard} S=${S}/><${Loops} l=${S.loops}/><${LastTurn} t=${S.lastTurn}/><${Log} log=${S.log}/>
  </div></div>`;
  return html`<div class="grid">
    <div class="col"><${SessionsCard}/><${GateCard} S=${S}/></div>
    <div class="col"><${Lanes} S=${S} sel=${view.value.card} cls="box c-agent agents lanes"/><${Detail} S=${S} card=${card}/></div>
    <div class="col col3"><${Loops} l=${S.loops}/><${LastTurn} t=${S.lastTurn}/><${Log} log=${S.log}/></div>
  </div>`;
}

// Layouts 2-10: a flat grid where each block is a named area; html[data-layout] picks the arrangement.
function Flat({ S, card }) {
  return html`<div class="grid flat">
    <div class="a-main col"><${SessionsCard}/></div>
    <div class="a-gate col"><${GateCard} S=${S}/></div>
    <div class="a-agents col"><${Lanes} S=${S} sel=${card} cls="box c-agent agents fill"/></div>
    <div class="a-card col"><${Detail} S=${S} card=${card}/></div>
    <div class="a-loops"><${Loops} l=${S.loops}/><${LastTurn} t=${S.lastTurn}/></div>
    <div class="a-log col"><${Log} log=${S.log}/></div>
  </div>`;
}

function useFeedMotion(S) {
  useLayoutEffect(() => {
    const prev = motion.prev;
    motion.prev = null;
    if (prev) animateChanges(document.getElementById("pane"), prev);
  }, [S]);
}

export function App() {
  const S = feed.value;
  useFeedMotion(S);
  const card = LAYOUT === 10 ? focusIndex(S, view.value.card) : view.value.card;
  const Body = LAYOUT > 1 ? Flat : Columns;
  return html`<${Fragment} key=${current.value}><${Header} S=${S}/><${Body} S=${S} card=${card}/><div class="foot faint meta">${FOOT}</div><button class="keysbtn more" aria-expanded=${keysOpen.value} onClick=${() => { keysOpen.value = !keysOpen.value; }}>keys</button><${KeyList}/></${Fragment}>`;
}
