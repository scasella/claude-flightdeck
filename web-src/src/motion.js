// Motion explains what changed between two feeds: bars glide from their last fill, a finished
// agent's mark flashes once, new log lines arrive tinted. The first render stays still.
const CALM = matchMedia("(prefers-reduced-motion: reduce)");
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export function snapshot(p) {
  const s = { bars: {}, states: {}, log: {} };
  p.querySelectorAll(".lane").forEach((r) => {
    const f = r.querySelector(".fillbar");
    s.bars[r.dataset.key] = f ? f.dataset.pct : null;
    s.states[r.dataset.key] = r.dataset.state;
  });
  p.querySelectorAll(".log .row").forEach((r) => { s.log[r.dataset.key] = 1; });
  return s;
}

function animateLane(r, prev) {
  const key = r.dataset.key, f = r.querySelector(".fillbar"), was = prev.bars[key];
  if (f && was != null && +f.dataset.pct > +was && !CALM.matches) f.animate([{ filter: "brightness(1.7)" }, { filter: "none" }], { duration: 600, easing: EASE });
  if (prev.states[key] !== "running" || r.dataset.state === "running") return;
  const frames = CALM.matches ? [{ opacity: 0.3 }, { opacity: 1 }] : [{ transform: "scale(1.8)", filter: "brightness(1.8)" }, { transform: "none", filter: "none" }];
  r.firstChild.animate(frames, { duration: 500, easing: EASE });
}

export function animateChanges(p, prev) {
  p.querySelectorAll(".lane").forEach((r) => animateLane(r, prev));
  p.querySelectorAll(".log .row").forEach((r) => {
    if (!prev.log[r.dataset.key]) r.animate([{ backgroundColor: "color-mix(in srgb, var(--agent) 28%, transparent)", opacity: 0.2 }, { backgroundColor: "transparent", opacity: 1 }], { duration: 700, easing: EASE });
  });
}
