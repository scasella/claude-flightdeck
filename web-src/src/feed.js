// Feed polling. Every running session writes feeds/<key>.js; sessions.js lists the fresh ones and
// focus.js names the session that last opened this page. The picker switches between them; the
// choice survives a reload.
import { snapshot } from "./motion.js";
import { current, feed, feedAt, lastOk, now, sessions } from "./store.js";
import { sessionDir } from "./util.js";

// The page polls the same files every 2s; only a changed feed restarts the running clocks.
let lastFeed = "", lastList = "", seenFocus = null, shownKey;
// The last pane before a new feed, so the next draw can show what changed. Null after a session switch.
export const motion = { prev: null };

try { current.value = localStorage.getItem("fd.session"); } catch (e) { /* storage blocked: start unpicked */ }

function takeFeed(d) {
  lastOk.value = now.value = Date.now();
  const j = JSON.stringify(d);
  if (j === lastFeed) return;
  lastFeed = j;
  const pane = document.getElementById("pane");
  motion.prev = shownKey === current.value && pane.firstChild ? snapshot(pane) : null;
  shownKey = current.value;
  feedAt.value = Date.now();
  feed.value = d;
}

export function pickSession(key) {
  if (key === current.value) return;
  current.value = key;
  try { localStorage.setItem("fd.session", key); } catch (e) { /* storage blocked: choice lasts this load */ }
  lastFeed = "";
  if (sessions.value[key]) takeFeed(sessions.value[key]);
}

function listOf(all) {
  return Object.keys(all).map((k) => k + " " + all[k].model + " " + all[k].status + " " + sessionDir(all[k])).join("|");
}

// A change in another session (one ended, one went idle) redraws the list even when this feed is unchanged.
function settle() {
  const got = window.FD_FEEDS || {}, all = {};
  window.FD_FEEDS = {};
  for (const k in got) if (got[k]) all[k] = got[k];
  sessions.value = all;
  const keys = Object.keys(all), list = listOf(all);
  if (list !== lastList) { lastList = list; lastFeed = ""; }
  if (!keys.length) return;
  if (!all[current.value]) { current.value = null; pickSession(keys[0]); return; }
  takeFeed(all[current.value]);
}

function addScript(id, src, done) {
  const old = document.getElementById(id);
  if (old) old.remove();
  const s = document.createElement("script");
  s.id = id;
  s.src = src + "?" + Date.now();
  s.onload = s.onerror = () => { s.remove(); done(); };
  document.head.appendChild(s);
}

function loadFeeds() {
  const keys = (window.FD_INDEX && window.FD_INDEX.keys) || [];
  let left = keys.length;
  if (!left) return settle();
  keys.forEach((k) => addScript("fd-feed-" + k, "feeds/" + encodeURIComponent(k) + ".js", () => { if (--left === 0) settle(); }));
}

// A session that opens the page (or presses w) brings it to that session.
function followFocus() {
  const f = window.FD_FOCUS;
  if (!f || f === seenFocus) return;
  seenFocus = f;
  if (f !== current.value) { current.value = f; lastFeed = ""; }
}

export function load() {
  // From disk the feeds are scripts (fetch is blocked on file://): reload them each poll.
  if (location.protocol === "file:") {
    addScript("fd-focus", "focus.js", () => { followFocus(); addScript("fd-index", "sessions.js", loadFeeds); });
    return;
  }
  fetch("state.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) takeFeed(d); }).catch(() => {});
}
