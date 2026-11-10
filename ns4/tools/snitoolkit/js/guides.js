// Search Guide and Checklist popups. Each is opened by a switch in the sidebar and closed by its X, Esc or a click outside.
import { load, save } from './storage.js';
import { el } from './dom.js';
import { GUIDE, CHECKLIST, GUIDE_KEY, CHECKLIST_KEY } from './guides-data.js';

const $ = id => document.getElementById(id);
const read = key => { try { const v = JSON.parse(load(key, '{}')); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } };

function checkbox(store, key, id, onChange) {
  const c = el('input', 'chk'); c.type = 'checkbox'; c.checked = !!store[id];
  c.addEventListener('change', () => { if (c.checked) store[id] = true; else delete store[id]; save(key, JSON.stringify(store)); onChange(); });
  return c;
}

function buildGuide(body) {
  const store = read(GUIDE_KEY);
  const wrap = el('div', 'sg');
  GUIDE.forEach(g => {
    const group = el('section', 'sg-group');
    group.append(el('h3', 'sg-title', g.title));
    const cols = el('div', 'sg-cols');
    g.cols.forEach((col, ci) => {
      const stack = el('div', 'sg-stack');
      col.forEach(card => {
        const box = el('div', 'sg-card');
        box.append(el('h4', 'sg-head', card.head));
        card.items.forEach((it, i) => {
          if (typeof it === 'object' && it.note) {
            const n = el('p', 'sg-note'); n.append(el('b', null, it.note + ' '), document.createTextNode(it.text)); box.append(n);
            return;
          }
          const text = typeof it === 'string' ? it : it.t;
          const row = el('label', 'sg-item' + (it.nocheck ? ' sg-item--plain' : ''));
          if (!it.nocheck) row.append(checkbox(store, GUIDE_KEY, `${g.id}.${ci}.${card.id}.${i}`, () => {}));
          row.append(el('span', null, text));
          box.append(row);
        });
        stack.append(box);
      });
      cols.append(stack);
    });
    group.append(cols);
    wrap.append(group);
    if (g.breakAfter) wrap.append(el('div', 'sg-break'));
  });
  body.replaceChildren(wrap);
}

function buildChecklist(body, progress, bar) {
  const store = read(CHECKLIST_KEY);
  const total = CHECKLIST.reduce((n, c) => n + c.sites.length, 0);
  const paint = () => {
    const done = Object.keys(store).length;
    progress.textContent = `${done} / ${total} (${Math.round(done / total * 100)}%)`;
    bar.max = total; bar.value = done;
  };
  const nCols = Math.max(...CHECKLIST.map(c => c.col));
  const cols = Array.from({ length: nCols }, () => el('div', 'cl-col'));
  CHECKLIST.forEach((cat, ci) => {
    const sec = el('section', 'cl-cat');
    sec.append(el('h3', 'cl-title', cat.title));
    cat.sites.forEach(([name, url], i) => {
      const row = el('label', 'cl-row');  // label: the whole row ticks the box; the site link still opens the site
      row.append(checkbox(store, CHECKLIST_KEY, `${ci}.${i}.${name}`, paint));
      const a = el('a', 'cl-link' + (url ? '' : ' is-guess'), name);
      a.href = url || 'https://www.google.com/search?q=' + encodeURIComponent(name);
      a.target = '_blank'; a.rel = 'noopener noreferrer';
      if (!url) a.title = 'Search link. Put the exact URL in js/guides-data.js';
      row.append(a);
      sec.append(row);
    });
    cols[cat.col - 1].append(sec);
  });
  const grid = el('div', 'cl'); grid.append(...cols);
  body.replaceChildren(grid);
  paint();
}

// Scale the popup content down (never up) until it fits the window with no scrolling.
// Content is laid out wider as it shrinks, so fewer lines wrap and the scale stays readable.
function fit(dlg) {
  const body = dlg.querySelector('.modal__body'), inner = body.firstElementChild;
  if (!inner || dlg.hidden) return;
  inner.style.transform = ''; inner.style.width = ''; inner.style.marginBottom = ''; body.style.overflowX = '';
  const d = getComputedStyle(dlg), b = getComputedStyle(body);
  const availH = dlg.clientHeight - parseFloat(d.paddingTop) - parseFloat(d.paddingBottom)
    - dlg.querySelector('.modal__head').offsetHeight - 5 - parseFloat(b.paddingTop) - parseFloat(b.paddingBottom);
  const W = body.clientWidth - parseFloat(b.paddingLeft) - parseFloat(b.paddingRight);
  let H = inner.offsetHeight;
  if (H <= availH && inner.scrollWidth <= W) return;
  let s = 1;
  for (let i = 0; i < 8; i++) {
    inner.style.width = (W / s) + 'px';
    H = inner.offsetHeight;
    const next = Math.max(0.5, Math.min(1, availH / H));
    if (Math.abs(next - s) < 0.004) { s = next; break; }
    s = next;
  }
  inner.style.width = (W / s) + 'px'; H = inner.offsetHeight;
  inner.style.transform = `scale(${s})`;
  inner.style.marginBottom = (H * s - H) + 'px';
  body.style.overflowX = 'hidden';  // the scaled content is exactly window width; only its unscaled layout box overflows
}

// One popup: wires switch <-> dialog, Esc, backdrop, reset.
function popup({ toggle, modal, storeKey, build }) {
  const sw = $(toggle), dlg = $(modal), body = dlg.querySelector('.modal__body');
  const open = () => { build(); dlg.hidden = false; fit(dlg); document.body.classList.add('has-modal'); dlg.querySelector('.modal__close').focus(); };
  const close = () => { dlg.hidden = true; sw.checked = false; document.body.classList.remove('has-modal'); };
  sw.addEventListener('change', () => (sw.checked ? open() : close()));
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('.modal__close')) close(); });
  dlg.querySelector('.modal__reset').addEventListener('click', () => {
    if (confirm('Clear all ticks in this list?')) { save(storeKey, '{}'); build(); fit(dlg); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !dlg.hidden) close(); });
  window.addEventListener('resize', () => fit(dlg));
  return { body };
}

export function init() {
  popup({ toggle: 'guideToggle', modal: 'guideModal', storeKey: GUIDE_KEY, build: () => buildGuide($('guideBody')) });
  popup({ toggle: 'listToggle', modal: 'listModal', storeKey: CHECKLIST_KEY, build: () => buildChecklist($('listBody'), $('listProgress'), $('listBar')) });
}
