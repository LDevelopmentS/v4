// The only file that touches localStorage.
export function load(key, fallback = null) {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; }
}
export function save(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* storage blocked: ignore */ }
}
