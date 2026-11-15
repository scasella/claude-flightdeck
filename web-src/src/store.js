// Page state as signals: only the parts that read a signal redraw when it changes.
import { signal } from "@preact/signals";

export const feed = signal(null);
export const view = signal({ card: null, gate: null });
export const sessions = signal({});
export const current = signal(null);
// The feed is written only on events, so running bars keep moving from these two clocks.
export const now = signal(Date.now());
export const feedAt = signal(Date.now());
export const lastOk = signal(0);
export const spin = signal(0);
export const resized = signal(0);

export function toggleCard(i) {
  view.value = { ...view.value, card: view.value.card === i ? null : i };
}

export function toggleGate(g) {
  view.value = { ...view.value, gate: view.value.gate === g ? null : g };
}

// Phones get one column in reading order and a collapsed gate, so layout follows this query.
const phone = window.matchMedia("(max-width:600px)");
export const narrow = signal(phone.matches);
phone.addEventListener("change", (e) => { narrow.value = e.matches; });
export const keysOpen = signal(false);
