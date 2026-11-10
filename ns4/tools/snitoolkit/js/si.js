// Socmed S&I: wires the sidebar options to the table. Registered in main.js next to rail and theme.
import { app, mode, loadAll, saveToggles, selectedRow } from './store.js';
import { DEFAULT_TOGGLES, YELP_URL } from './config.js';
import { engineUrl, legalUrl, crimUrl, finUrl } from './links.js';
import { getHistory, removeHistory, clearHistory } from './history.js';
import { render, addRow, select } from './table.js';
import { el } from './dom.js';

const $ = id => document.getElementById(id);
const SECTIONS = { engineToggle: 'engineSection', legalToggle: 'legalSection', crimToggle: 'crimSection', finToggle: 'finSection', yelpToggle: 'yelpSection' };

// Sync switches, sub-menus and table with app.toggles.
function apply() {
  const m = mode(), t = app.toggles;
  Object.keys(DEFAULT_TOGGLES).forEach(id => {
    const input = $(id);
    const locked = (m === 'pse' && id !== 'pseSearchToggle') || (m === 'user' && id !== 'userModeToggle');
    input.checked = t[id];
    input.disabled = locked;
    input.closest('.opt').classList.toggle('is-disabled', locked);
  });
  Object.entries(SECTIONS).forEach(([tid, sid]) => { $(sid).hidden = !(m === 'standard' && t[tid]); });
  render();
}

function renderHistory() {
  const list = $('historyList');
  list.replaceChildren(...getHistory().map((name, i) => {
    const wrap = el('div', 'hist');
    const go = el('button', 'act hist__go'); go.type = 'button'; go.dataset.histLoad = i; go.title = name;
    const tile = el('span', 'tile', String(name).charAt(0).toUpperCase()); tile.setAttribute('aria-hidden', 'true');
    go.append(tile, el('span', 'lbl grow', name));
    const del = el('button', 'hist__del', '✕'); del.type = 'button'; del.dataset.histDel = i; del.setAttribute('aria-label', 'Remove from history');
    wrap.append(go, del);
    return wrap;
  }));
  $('recentWrap').hidden = !list.children.length;
}

// Recent searches bar: only the chips that fit on one row stay; "View all" opens a popup with every one.
function fitHistory() {
  const wrap = $('recentWrap'), list = $('historyList'), more = $('historyMore');
  if (wrap.hidden) return;
  const chips = Array.from(list.children);
  chips.forEach(c => c.classList.remove('is-over'));
  const room = list.clientWidth, gap = 6;
  let used = 0, shown = 0;
  chips.forEach(c => {
    const w = c.offsetWidth + (shown ? gap : 0);
    if (used + w <= room || shown === 0) { used += w; shown++; }
  });
  chips.forEach((c, i) => c.classList.toggle('is-over', i >= shown));
  const hidden = chips.length - shown;
  more.textContent = hidden > 0 ? `+${hidden} more` : 'View all';
  more.classList.toggle('has-more', hidden > 0);
}

function renderHistoryPopup() {
  const dlg = $('historyModal');
  const all = getHistory();
  $('historyCount').textContent = all.length ? `(${all.length})` : '';
  if (dlg.hidden) return;
  const q = $('historySearch').value.trim().toLowerCase();
  const rows = [];
  all.forEach((name, i) => {
    if (q && !String(name).toLowerCase().includes(q)) return;
    const row = el('div', 'hl-row');
    const go = el('button', 'hl-go'); go.type = 'button'; go.dataset.histLoad = i; go.title = name;
    const tile = el('span', 'tile', String(name).charAt(0).toUpperCase()); tile.setAttribute('aria-hidden', 'true');
    go.append(tile, el('span', 'lbl', name));
    const del = el('button', 'hl-del', '✕'); del.type = 'button'; del.dataset.histDel = i; del.setAttribute('aria-label', 'Remove from history');
    row.append(go, del);
    rows.push(row);
  });
  if (!rows.length) rows.push(el('p', 'hl-empty', all.length ? 'No matches.' : 'No recent searches yet.'));
  $('historyAll').replaceChildren(...rows);
}

function openHistoryPopup() {
  const dlg = $('historyModal');
  $('historySearch').value = '';
  dlg.hidden = false;
  document.body.classList.add('has-modal');
  renderHistoryPopup();
  $('historySearch').focus();
}
function closeHistoryPopup() {
  $('historyModal').hidden = true;
  document.body.classList.remove('has-modal');
  $('historyMore').focus();
}

function initHistoryPopup() {
  const dlg = $('historyModal');
  $('historyMore').addEventListener('click', openHistoryPopup);
  $('historySearch').addEventListener('input', renderHistoryPopup);
  $('historyClear').addEventListener('click', () => {
    if (getHistory().length && confirm('Clear all recent searches?')) { clearHistory(); closeHistoryPopup(); }
  });
  dlg.addEventListener('click', e => {
    if (e.target === dlg || e.target.closest('.modal__close')) { closeHistoryPopup(); return; }
    const load = e.target.closest('[data-hist-load]');
    onClick(e);                      // same handler the bar uses: load a search / remove one
    if (load) closeHistoryPopup();   // after loading a search, get out of the way
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !dlg.hidden) closeHistoryPopup(); });
  document.addEventListener('si:history', () => { renderHistoryPopup(); fitHistory(); });
  window.addEventListener('resize', fitHistory);
  if ('ResizeObserver' in window) new ResizeObserver(fitHistory).observe($('recentWrap'));
}

function needRow() {
  const r = selectedRow();
  if (!r) alert('Please click/select a row in the table first.');
  return r;
}
const open = url => { if (url) window.open(url, '_blank'); };

function onClick(e) {
  const b = e.target.closest('button');
  if (!b) return;
  const d = b.dataset;
  if (b.id === 'addRow') { addRow(); return; }
  if (d.histLoad !== undefined) {
    const name = getHistory()[Number(d.histLoad)];
    if (name) select(addRow({ name }).id);
    return;
  }
  if (d.histDel !== undefined) { removeHistory(Number(d.histDel)); return; }
  if (d.action === 'yelp') { window.open(YELP_URL, '_blank'); return; }
  // Only our search buttons below. The shell's own rail buttons (theme, lock) must pass through untouched.
  if (!(d.engine || d.crim || d.fin || d.action)) return;

  const row = needRow();
  if (!row) return;
  if (d.engine) open(engineUrl(d.engine, row));
  else if (d.crim) open(crimUrl(d.crim, row));
  else if (d.action === 'legal') { const u = legalUrl(row); if (u) open(u); else alert('Please enter a name.'); }
  else if (d.fin) { const u = finUrl(d.fin, row); if (u) open(u); else alert('Please enter a username.'); }
}

// The collapsed rail hides, but can still scroll, content wider than itself. Focus or taps can leave it
// nudged sideways (clipped tiles and headings). Snap any sideways scroll back to 0.
function pinSideways(...els) {
  els.forEach(n => n && n.addEventListener('scroll', () => { if (n.scrollLeft) n.scrollLeft = 0; }));
}

export function init() {
  pinSideways($('rail'), document.querySelector('.rail__scroll'));
  loadAll();
  Object.keys(DEFAULT_TOGGLES).forEach(id => {
    $(id).addEventListener('change', e => { app.toggles[id] = e.target.checked; saveToggles(); apply(); });
  });
  $('rail').addEventListener('click', onClick);
  $('recentWrap').addEventListener('click', onClick);  // Recent searches now sit in the page, not the rail
  document.addEventListener('si:history', renderHistory);
  apply();
  renderHistory();
  initHistoryPopup();
  fitHistory();
}
