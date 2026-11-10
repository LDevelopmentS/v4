// App data (targets, selection, sidebar switches) and saving. Storage goes through storage.js only.
import { load, save } from './storage.js';
import { KEYS, DEFAULT_TOGGLES } from './config.js';

export const app = { rows: [], selectedId: null, toggles: { ...DEFAULT_TOGGLES } };
let seq = 0;
const str = v => (typeof v === 'string' ? v : '');

function parse(raw, fallback) {
  try { const v = JSON.parse(raw); return v == null ? fallback : v; } catch (e) { return fallback; }
}

export function makeRow(d = {}) {
  return { id: ++seq, name: str(d.name), city: str(d.city), state: str(d.state), extra: str(d.extra) };
}

export function loadAll() {
  const rows = parse(load(KEYS.rows), []);
  app.rows = Array.isArray(rows) ? rows.map(makeRow) : [];
  if (!app.rows.length) app.rows.push(makeRow());
  const t = parse(load(KEYS.ui), null);
  if (t && typeof t === 'object') {
    Object.keys(DEFAULT_TOGGLES).forEach(k => { if (typeof t[k] === 'boolean') app.toggles[k] = t[k]; });
  }
}

export function saveRows() {
  save(KEYS.rows, JSON.stringify(app.rows.map(({ name, city, state, extra }) => ({ name, city, state, extra }))));
}
export function saveToggles() { save(KEYS.ui, JSON.stringify(app.toggles)); }

export function addRowData(d) { const r = makeRow(d); app.rows.push(r); saveRows(); return r; }
export function removeRowData(id) {
  app.rows = app.rows.filter(r => r.id !== id);
  if (app.selectedId === id) app.selectedId = null;
  saveRows();
}
export function selectedRow() { return app.rows.find(r => r.id === app.selectedId) || null; }

// 'pse' and 'user' replace the normal table; otherwise 'standard'.
export function mode() {
  const t = app.toggles;
  return t.pseSearchToggle ? 'pse' : t.userModeToggle ? 'user' : 'standard';
}
