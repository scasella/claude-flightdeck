// Entry: sample feed, URL options, the two mounts, keys and the timers.
import "./style.css";
import { render } from "preact";
import { html } from "htm/preact";
import { App } from "./app.js";
import { load } from "./feed.js";
import { ThemePicker } from "./picker.js";
import { feed, keysOpen, now, resized, spin, toggleCard, toggleGate, view } from "./store.js";
import { readDefaults } from "./theme.js";
import { LAYOUT, SPIN, focusIndex } from "./util.js";

function startState() {
  const q = new URLSearchParams(location.search), S = JSON.parse(document.getElementById("sample").textContent);
  if (q.get("state") === "empty") { S.agents = []; S.earlier = 0; }
  feed.value = S;
  if (q.get("card")) view.value = { ...view.value, card: +q.get("card") - 1 };
}

function stepFocus(dir) {
  const S = feed.value, n = S.agents.length;
  view.value = { ...view.value, card: (focusIndex(S, view.value.card) + dir + n) % n };
}

function onKey(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (/^[1-6]$/.test(e.key) && feed.value.agents[+e.key - 1]) toggleCard(+e.key - 1);
  else if ("fso".indexOf(e.key) >= 0 && e.key.length === 1) toggleGate(e.key);
  else if (LAYOUT === 10 && (e.key === "[" || e.key === "]") && feed.value.agents.length) stepFocus(e.key === "]" ? 1 : -1);
  else if (e.key === "?") keysOpen.value = !keysOpen.value;
  else if (e.key === "Escape" && keysOpen.value) keysOpen.value = false;
  else if (e.key === "Escape") view.value = { card: null, gate: null };
}

document.documentElement.dataset.layout = LAYOUT;
readDefaults();
startState();
render(html`<${ThemePicker}/>`, document.getElementById("topbar"));
render(html`<${App}/>`, document.getElementById("pane"));
document.addEventListener("keydown", onKey);
if (window.ResizeObserver) new ResizeObserver(() => { resized.value++; }).observe(document.documentElement);
load();
setInterval(load, 2000);
setInterval(() => { now.value = Date.now(); }, 1000);
setInterval(() => { spin.value = (spin.value + 1) % SPIN.length; }, 120);
