// Recent searches (last MAX_HISTORY names). A name is saved 2 seconds after typing stops.
import { load, save } from './storage.js';
import { KEYS } from './config.js';

const MAX_HISTORY = 50;  // the bar shows what fits on one row; the rest sit in the "View all" popup
let timer;

export function getHistory() {
  try { const v = JSON.parse(load(KEYS.history, '[]')); return Array.isArray(v) ? v : []; } catch (e) { return []; }
}
function put(list) {
  save(KEYS.history, JSON.stringify(list));
  document.dispatchEvent(new CustomEvent('si:history'));
}
export function addHistory(name) {
  if (!name) return;
  const list = getHistory().filter(h => String(h).toLowerCase() !== name.toLowerCase());
  list.unshift(name);
  put(list.slice(0, MAX_HISTORY));
}
export function removeHistory(i) { const l = getHistory(); l.splice(i, 1); put(l); }
export function clearHistory() { put([]); }
export function queueHistory(name) {
  clearTimeout(timer);
  timer = setTimeout(() => addHistory(name), 2000);
}
