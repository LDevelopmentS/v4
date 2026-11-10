// The target table. Three layouts share one data set: standard, username and PSE.
import { app, mode, addRowData, removeRowData, saveRows } from './store.js';
import { SOCIALS, context, userUrl, pseUrl } from './links.js';
import { USER_PLATFORMS, PSE_SITES } from './config.js';
import { queueHistory } from './history.js';
import { el } from './dom.js';

const head = document.getElementById('headRow');
const body = document.getElementById('tableBody');
const count = document.getElementById('rowCount');

function updateCount() { count.textContent = `${app.rows.length} TARGET/S LOADED`; }
function openAll(anchors) {
  anchors.forEach(a => { if (!a.classList.contains('is-blank')) window.open(a.href, '_blank'); });
}
function setLink(a, url) {
  if (url) { a.href = url; a.classList.remove('is-blank'); } else { a.removeAttribute('href'); a.classList.add('is-blank'); }
}
function field(cls, placeholder, value, onInput) {
  const i = el('input', 'cell-input ' + cls);
  i.type = 'text'; i.placeholder = placeholder; i.value = value; i.autocomplete = 'off'; i.spellcheck = false;
  i.addEventListener('input', () => onInput(i.value));
  return i;
}
function goLink() {
  const a = el('a', 'go is-blank', 'GO');
  a.target = '_blank'; a.rel = 'noopener noreferrer';
  return a;
}
function cell(...kids) { const td = el('td'); td.append(...kids); return td; }
function bulkButton(label, onClick) {
  const b = el('button', 'cell-btn', label); b.type = 'button';
  b.addEventListener('click', e => { e.stopPropagation(); onClick(); });
  return b;
}

export function select(id) {
  app.selectedId = id;
  body.querySelectorAll('tr').forEach(tr => tr.classList.toggle('active-row', Number(tr.dataset.id) === id));
}

function visibleSocials() {
  const t = app.toggles;
  return SOCIALS.filter(s => (s.group === 'main' ? t.mainToggle : t.subToggle));
}

function headers(m) {
  if (m === 'user') return ['DEL', 'TARGET USERNAME', 'BULK', ...USER_PLATFORMS.map(p => p.id)];
  if (m === 'pse') return ['DEL', 'FULL NAME', 'CITY, STATE', 'BULK', ...PSE_SITES.map(s => s.label)];
  const t = app.toggles, useFull = !(t.mainToggle && t.subToggle);
  const cols = ['DEL', 'NAME', 'CT', 'ST', 'KEYWORD'];
  if (t.mainToggle || t.subToggle) cols.push('BULK');
  return cols.concat(visibleSocials().map(s => (useFull ? s.full : s.short)));
}

function buildRow(row, m) {
  const tr = el('tr');
  tr.dataset.id = row.id;
  if (row.id === app.selectedId) tr.classList.add('active-row');
  tr.addEventListener('click', () => select(row.id));

  const del = el('button', 'cell-del', '✕'); del.type = 'button'; del.setAttribute('aria-label', 'Remove target');
  del.addEventListener('click', e => { e.stopPropagation(); removeRowData(row.id); tr.remove(); updateCount(); });
  tr.append(cell(del));

  const anchors = [];  // [{a, url(row)}]
  const refresh = () => {
    anchors.forEach(({ a, url }) => setLink(a, url(row)));
    if (bulk) bulk.hidden = !anchors.some(({ a }) => !a.classList.contains('is-blank'));
  };
  let bulk = null;
  const changed = () => { saveRows(); refresh(); };

  if (m === 'user') {
    tr.append(cell(field('cell-input--name', 'Username...', row.name, v => { row.name = v; changed(); })));
    bulk = bulkButton('OPEN ALL', () => openAll(anchors.map(x => x.a)));
    tr.append(cell(bulk));
    USER_PLATFORMS.forEach(p => { const a = goLink(); anchors.push({ a, url: r => userUrl(p, r) }); tr.append(cell(a)); });
  } else if (m === 'pse') {
    tr.append(cell(field('cell-input--name', 'Full name...', row.name, v => { row.name = v; changed(); })));
    const addr = [row.city, row.state].filter(Boolean).join(', ');
    tr.append(cell(field('cell-input--left', 'City, State', addr, v => {
      const i = v.lastIndexOf(',');
      row.city = (i < 0 ? v : v.slice(0, i)).trim(); row.state = i < 0 ? '' : v.slice(i + 1).trim();
      changed();
    })));
    bulk = bulkButton('OPEN', () => openAll(anchors.map(x => x.a)));
    tr.append(cell(bulk));
    PSE_SITES.forEach(s => { const a = goLink(); anchors.push({ a, url: r => pseUrl(s.kind, r) }); tr.append(cell(a)); });
  } else {
    const typed = key => v => {
      row[key] = v; changed();
      if (key === 'name') queueHistory(v.trim());
    };
    tr.append(cell(field('cell-input--name', 'Name...', row.name, typed('name'))));
    tr.append(cell(field('', 'City', row.city, typed('city'))));
    tr.append(cell(field('', 'ST', row.state, typed('state'))));
    tr.append(cell(field('', 'Keyword...', row.extra, typed('extra'))));
    const t = app.toggles;
    if (t.mainToggle || t.subToggle) {
      bulk = bulkButton('OPEN', () => openAll(anchors.map(x => x.a)));
      tr.append(cell(bulk));
    }
    visibleSocials().forEach(s => { const a = goLink(); anchors.push({ a, url: r => s.url(context(r)) }); tr.append(cell(a)); });
  }
  refresh();
  return tr;
}

// Rebuild header and rows from the data (called when a mode or column switch changes).
export function render() {
  const m = mode();
  head.replaceChildren(...headers(m).map(h => el('th', null, h)));
  body.replaceChildren(...app.rows.map(r => buildRow(r, m)));
  updateCount();
}

export function addRow(data) {
  const row = addRowData(data);
  body.append(buildRow(row, mode()));
  updateCount();
  return row;
}
