// Terminal-style theme picker: [<] name [>] , t / T cycle, click the name to search.
// Own list instead of <datalist>: themed, keyboard driven, previews on hover.
import { html } from "htm/preact";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { applyTheme, themeNames } from "./theme.js";

const names = themeNames();

function startIndex() {
  let saved = "Claude";
  try { saved = localStorage.getItem("fd-theme") || "Claude"; } catch (e) { /* storage blocked: default theme */ }
  const q = new URLSearchParams(location.search).get("theme");
  return Math.max(0, names.indexOf(q || saved));
}

function matches(query) {
  const q = query.toLowerCase();
  return names.map((n, i) => i).filter((i) => names[i].toLowerCase().indexOf(q) >= 0);
}

function useCycleKeys(step) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "t") step(1); else if (e.key === "T") step(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
}

function ThemeList({ hits, hi, before, onPick, onHover }) {
  const ref = useRef(null);
  useLayoutEffect(() => { const c = ref.current && ref.current.children[hi]; if (c) c.scrollIntoView({ block: "nearest" }); }, [hi, hits]);
  if (!hits.length) return html`<div class="tlist" role="listbox" ref=${ref}><div class="none faint">no match</div></div>`;
  return html`<div class="tlist" role="listbox" ref=${ref}>${hits.map((ix, j) => html`<div class=${(j === hi ? "on " : "") + (ix === before ? "cur" : "")} role="option" onMouseDown=${(e) => { e.preventDefault(); onPick(ix); }} onMouseEnter=${() => onHover(j, ix)}>${names[ix]}</div>`)}</div>`;
}

function searchKeys(e, s) {
  e.stopPropagation();
  if (e.key === "Escape") { e.preventDefault(); s.close(null); return; }
  if (e.key === "Enter") { e.preventDefault(); s.close(s.hits.length ? s.hits[s.hi] : null); return; }
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  e.preventDefault();
  if (!s.hits.length) return;
  const next = (s.hi + (e.key === "ArrowDown" ? 1 : -1) + s.hits.length) % s.hits.length;
  s.setHi(next);
  applyTheme(names[s.hits[next]]);
}

export function ThemePicker() {
  const [cur, setCur] = useState(startIndex);
  const [search, setSearch] = useState(null);
  const [hi, setHi] = useState(0);
  const curRef = useRef(cur), inp = useRef(null), searching = useRef(false);
  const set = (i) => { const c = (i + names.length) % names.length; curRef.current = c; setCur(c); applyTheme(names[c]); };
  useLayoutEffect(() => applyTheme(names[cur]), []);
  useCycleKeys((d) => set(curRef.current + d));
  useLayoutEffect(() => { if (search != null && inp.current) inp.current.focus(); }, [search != null]);
  const before = curRef.current, hits = search == null ? [] : matches(search);
  const shownHi = Math.max(0, Math.min(hi, hits.length - 1));
  const close = (pick) => { if (!searching.current) return; searching.current = false; setSearch(null); set(pick == null ? before : pick); };
  const open = () => { searching.current = true; setHi(Math.max(0, before)); setSearch(""); };
  const onInput = (e) => { const v = e.currentTarget.value, h = matches(v); setHi(0); setSearch(v); if (h.length) applyTheme(names[h[0]]); };
  const s = { hits, hi: shownHi, setHi, close };
  return html`<span class="dim">theme</span><button id="themePrev" aria-label="previous theme" onClick=${() => set(cur - 1)}>${"<"}</button><span id="themeName" class="b" title="click to search, t / T to cycle" hidden=${search != null} onClick=${open}>${names[cur]}</span><span class="tpick">${search == null ? null : html`<input id="themeFind" ref=${inp} aria-label="search themes" autocomplete="off" spellcheck=${false} value=${search} onInput=${onInput} onBlur=${() => close(null)} onKeyDown=${(e) => searchKeys(e, s)}/><${ThemeList} hits=${hits} hi=${shownHi} before=${before} onPick=${close} onHover=${(j, ix) => { setHi(j); applyTheme(names[ix]); }}/>`}</span><button id="themeNext" aria-label="next theme" onClick=${() => set(cur + 1)}>${">"}</button>`;
}
