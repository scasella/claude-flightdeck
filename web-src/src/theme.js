// Themes: "Claude" (the pane's own colours) plus Tabby community schemes (MIT, schemes.js).
// Scheme array: [bg, fg, color0..color15]; roles map onto ANSI slots the way terminals tint them.
const ROOT = document.documentElement, ROLE_DEFAULTS = {};
const ROLES = ["bg", "text", "dim", "faint", "track", "main", "agent", "gate", "cleared", "arch", "amber", "warn"];
const LANES = ["main", "agent", "gate", "arch", "warn"];

export function readDefaults() {
  ROLES.forEach((v) => { ROLE_DEFAULTS[v] = getComputedStyle(ROOT).getPropertyValue("--" + v).trim(); });
}

export function themeNames() {
  return ["Claude"].concat(Object.keys(window.TABBY_SCHEMES || {}));
}

function rolesOf(s) {
  return { bg: s[0], text: s[1], dim: s[9] === s[1] ? s[8] : mix(s[1], s[0]), faint: s[10], track: s[10], main: s[5], agent: s[6], gate: s[4], cleared: s[14], arch: s[7], amber: s[13], warn: s[3] };
}

export function applyTheme(name) {
  const s = (window.TABBY_SCHEMES || {})[name];
  const m = s ? balance(rolesOf(s), s.slice(2)) : ROLE_DEFAULTS;
  Object.keys(m).forEach((k) => ROOT.style.setProperty("--" + k, m[k]));
  try { localStorage.setItem("fd-theme", name); } catch (e) { /* storage blocked: theme lasts this load */ }
}

const hex = (h, i) => parseInt(h.substr(1 + i * 2, 2), 16);

function lum(h) {
  const c = [0, 1, 2].map((i) => { const v = hex(h, i) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function ratio(a, b) {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function mixw(a, b, w) {
  let o = "#";
  for (let i = 0; i < 3; i++) o += ("0" + Math.round(hex(a, i) * w + hex(b, i) * (1 - w)).toString(16)).slice(-2);
  return o;
}

const mix = (a, b) => mixw(a, b, 0.62);

const farEnd = (bg) => (ratio("#ffffff", bg) > ratio("#000000", bg) ? "#ffffff" : "#000000");

// A mid-tone background (Grass) leaves no text colour 7:1 on it: darken or lighten it, hue kept, until one does.
function roomyBg(bg) {
  const room = (c) => Math.max(ratio("#ffffff", c), ratio("#000000", c));
  if (room(bg) >= 7.5) return bg;
  const far = ratio("#ffffff", bg) >= ratio("#000000", bg) ? "#000000" : "#ffffff";
  let out = bg, w = 0;
  while (room(out) < 7.5 && w < 1) { w += 0.05; out = mixw(far, bg, w); }
  return out;
}

// Community schemes were made for terminals, not for this page: every role gets a contrast band
// on the background so text stays readable, dim stays above faint, and lanes stay apart.
function balance(m, ansi) {
  const bg = m.bg = roomyBg(m.bg);
  m.text = fit(m.text, bg, 7, 16);
  m.dim = fit(m.dim, bg, 6, Math.max(6, ratio(m.text, bg) / 1.15));
  m.faint = fit(m.faint, bg, 4.5, ratio(m.dim, bg) / 1.2);
  // Bar tracks are graphics: 3:1 is the floor for non-text contrast.
  m.track = fit(m.track, bg, 3.1, 3.6);
  ["main", "agent", "gate", "cleared", "arch", "amber", "warn"].forEach((k) => { m[k] = fit(m[k], bg, 4.5, 21); });
  separate(m, ansi);
  return m;
}

// Moves c toward the far end (white or black) to reach lo, or toward bg to come down to hi.
function fit(c, bg, lo, hi) {
  const r = ratio(c, bg);
  if (r >= lo && r <= hi) return c;
  const end = r < lo ? farEnd(bg) : bg, goal = r < lo ? lo : hi;
  let a = 0, b = 1;
  for (let i = 0; i < 14; i++) { const w = (a + b) / 2; if ((ratio(mixw(end, c, w), bg) < goal) === (r < lo)) a = w; else b = w; }
  return mixw(end, c, b);
}

function dist(a, b) {
  return Math.hypot(...[0, 1, 2].map((i) => hex(a, i) - hex(b, i)));
}

// A lane too close to an earlier one takes the first ANSI colour that is far from all of them.
function separate(m, ansi) {
  LANES.forEach((k, i) => {
    const prev = LANES.slice(0, i).map((p) => m[p]), far = (c) => prev.every((p) => dist(p, c) >= 60);
    if (far(m[k])) return;
    const pick = ansi.concat(["#e05050", "#40c060", "#5080ff", "#e0c040", "#d050d0", "#40c0d0"]).map((c) => fit(c, m.bg, 4.5, 21)).filter(far)[0];
    if (pick) m[k] = pick;
  });
}
