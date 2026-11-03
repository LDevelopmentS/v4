// Crash recovery: keeps a copy of the form in the browser's localStorage, and puts it back later.
// Storage and rules live here; features/restore-session.js decides when to use them.
//
// What counts as worth keeping: anything that differs from a fresh form (typed text, a choice, a switch,
// an extra account, row or metric). Whitespace-only text, the open account/section and the report type
// and gender alone do not count. When the form is back to fresh, the saved copy is deleted.
import { visibleText } from './filled-check.js';
import { bumpUid } from './uid.js';
import { defaults as formDefaults } from '../stores/form.js';
import { defaults as networkDefaults, newInstanceFor } from '../stores/networks.js';

const KEY = 'ease-app:session';
const VERSION = 1;                      // raise when the saved shape changes in a way merging can't cover
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // older copies are deleted instead of offered

const clone = (x) => JSON.parse(JSON.stringify(x));

// ---------- storage (every call is safe: a failure just skips the backup)
let timer = null;
let pending = null;

function write(snapshot) {
  try { localStorage.setItem(KEY, JSON.stringify({ v: VERSION, savedAt: Date.now(), snapshot })); } catch { /* storage full or blocked */ }
}
export function flushBackup() {
  clearTimeout(timer); timer = null;
  if (pending) { write(pending); pending = null; }
}
export const saveSoon = (snapshot, ms = 400) => { pending = snapshot; clearTimeout(timer); timer = setTimeout(flushBackup, ms); };
export const saveNow = (snapshot) => { pending = snapshot; flushBackup(); };
export function clearBackup() {
  clearTimeout(timer); timer = null; pending = null;
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
// The saved copy, or null (missing, damaged, from another version or too old; those are deleted).
export function readBackup() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const b = JSON.parse(raw);
    const ok = b && b.v === VERSION && Number.isFinite(b.savedAt) && Date.now() - b.savedAt < MAX_AGE_MS
      && b.snapshot?.form?.relatives && b.snapshot?.networks && typeof b.snapshot.networks === 'object';
    if (!ok) { clearBackup(); return null; }
    return b;
  } catch { clearBackup(); return null; }
}

// ---------- taking a snapshot (plain data, no methods)
export function takeSnapshot(Alpine) {
  const f = Alpine.store('form');
  return {
    form: clone({ reportType: f.reportType, isNull: f.isNull, progFinding: f.progFinding, progFindingText: f.progFindingText, subjectGender: f.subjectGender, relatives: f.relatives }),
    networks: clone(Alpine.store('networks').byId),
    activeSection: Alpine.store('app').activeSection,
  };
}

// A short signature of the form's structure (switches, accounts, rows, metrics). When it changes we save at once instead of waiting.
export const structureOf = (s) => JSON.stringify([
  s.form.isNull, s.form.progFinding, s.form.relatives.found, s.form.relatives.rows?.length, s.form.relatives.progFindings?.length,
  Object.entries(s.networks).map(([id, n]) => [id, n.checked, n.instances?.length,
    (n.instances || []).map((i) => [i.extraMetrics?.length, i.hiddenMetrics?.length])]),
]);

// ---------- is it worth keeping?
const IGNORE = new Set(['id', 'activeClone']);
const norm = (v) => (typeof v === 'string' && visibleText(v) === '' ? '' : v);
function differs(a, b) {
  a = norm(a); b = norm(b);
  if (Array.isArray(a) || Array.isArray(b)) {
    return !Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.some((x, i) => differs(x, b[i]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    return [...new Set([...Object.keys(a), ...Object.keys(b)])].some((k) => !IGNORE.has(k) && differs(a[k], b[k]));
  }
  return a !== b;
}
let fresh; // a fresh form to compare with (built once; ids are ignored)
const withoutTopChoices = (form) => { const { reportType, subjectGender, ...rest } = form; return rest; };
export function isWorthSaving(snapshot) {
  fresh ??= { form: withoutTopChoices(clone(formDefaults())), networks: clone(networkDefaults()) };
  return differs(withoutTopChoices(snapshot.form), fresh.form) || differs(snapshot.networks, fresh.networks);
}

// ---------- putting it back
// Saved values go on top of today's defaults, so a field added to the app since the save still gets its default.
function merge(def, saved) {
  if (Array.isArray(def) || Array.isArray(saved)) return Array.isArray(saved) ? saved : def;
  if (def && typeof def === 'object') {
    if (!saved || typeof saved !== 'object') return def;
    const out = { ...saved };
    for (const k of Object.keys(def)) out[k] = k in saved ? merge(def[k], saved[k]) : def[k];
    return out;
  }
  if (def === null) return saved === undefined ? null : saved;
  return typeof saved === typeof def ? saved : def;
}
function maxId(node, max = 0) {
  if (Array.isArray(node)) node.forEach((x) => { max = maxId(x, max); });
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) max = k === 'id' && Number.isFinite(v) ? Math.max(max, v) : maxId(v, max);
  }
  return max;
}

export function restoreSnapshot(Alpine, snapshot) {
  const form = Alpine.store('form');
  Object.assign(form, merge(withoutTopChoices(formDefaults()), withoutTopChoices(snapshot.form)));
  for (const k of ['reportType', 'subjectGender']) if (typeof snapshot.form[k] === 'string') form[k] = snapshot.form[k];

  const networks = Alpine.store('networks');
  const byId = {};
  for (const id of Object.keys(networks.byId)) {
    const s = snapshot.networks[id];
    const list = Array.isArray(s?.instances) && s.instances.length ? s.instances : [{}];
    const instances = list.map((i) => merge(newInstanceFor(id), i));
    byId[id] = {
      checked: s?.checked === true,
      activeClone: Math.min(Math.max(Number(s?.activeClone) || 0, 0), instances.length - 1),
      instances,
    };
  }
  networks.byId = byId;
  bumpUid(Math.max(maxId(snapshot.form), maxId(snapshot.networks)));
  if (typeof snapshot.activeSection === 'string') Alpine.store('app').activeSection = snapshot.activeSection;
}
