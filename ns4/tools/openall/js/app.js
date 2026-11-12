// Classic-script bundle of the modules in this folder, generated from them (storage, theme, rail, link-opener, security).
// Needed because browsers refuse <script type="module"> when index.html is opened straight from disk (file://). Works over http(s) too.
(function(){
'use strict';
// The only file that touches localStorage.
function load(key, fallback = null) {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* storage blocked: ignore */ }
}

const theme=(function(){
const KEY = 'ease:theme'; // shared by every tool. Keep in sync with boot-theme.js.

function init() {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const paint = () => btn.setAttribute('aria-pressed', root.dataset.theme === 'light' ? 'true' : 'false');

  btn.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    save(KEY, root.dataset.theme);
    paint();
  });
  // Another tab changed the theme: follow it.
  window.addEventListener('storage', e => {
    if (e.key !== KEY) return;
    root.dataset.theme = e.newValue === 'light' ? 'light' : 'dark';
    paint();
  });
  paint();
}

return init;
})();
const rail=(function(){
const KEY = 'ease:rail-locked'; // shared by every tool. Keep in sync with boot-rail.js.
const CLASS = 'rail-locked';

// Hover/focus widening is pure CSS. This adds tap-to-open for touch screens and the sidebar lock (shown from 1200px up).
function init() {
  const root = document.documentElement;
  const rail = document.getElementById('rail');
  const brand = rail.querySelector('.rail__brand');
  const lock = document.getElementById('rail-lock');
  let wasClosedOnTouch = false;

  rail.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch') return;
    wasClosedOnTouch = !rail.classList.contains('is-open');
    rail.classList.add('is-open');
  });
  // The first tap only opens the rail; it must not follow the logo link.
  brand.addEventListener('click', e => { if (wasClosedOnTouch) { e.preventDefault(); wasClosedOnTouch = false; } });
  document.addEventListener('pointerdown', e => { if (!rail.contains(e.target)) rail.classList.remove('is-open'); });

  function paint() {
    const on = root.classList.contains(CLASS);
    lock.setAttribute('aria-pressed', on ? 'true' : 'false');
    lock.setAttribute('aria-label', on ? 'Unlock sidebar' : 'Lock sidebar');
    lock.title = on ? 'Unlock sidebar' : 'Lock sidebar';
  }
  lock.addEventListener('click', () => {
    const on = root.classList.toggle(CLASS);
    rail.classList.remove('is-open');
    save(KEY, on ? '1' : '0');
    paint();
    window.dispatchEvent(new CustomEvent('rail:lock', { detail: { locked: on } }));
  });
  // Another tab changed the lock: follow it.
  window.addEventListener('storage', e => {
    if (e.key !== KEY) return;
    root.classList.toggle(CLASS, e.newValue === '1');
    paint();
  });
  paint();
}

return init;
})();
const link_opener=(function(){
// Intelligent URL extraction.
// Links may be separated by spaces, commas, semicolons, pipes (|), backslashes (\), quotes or brackets,
// may end with "/" or ".", and may even be glued together (a.com,b.com/|c.com\d.com, a.com.b.com, https://a.comhttps://b.com).
const SEPARATORS = /[\s,;|\\"'<>()\[\]{}`]+/;
const VALID = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?([\/?#]\S*)?$/i;

// Top-level domains used to decide where "a.com.b.com" should be cut into two links.
const TLDS = new Set(('com net org io co me dev app xyz site online info biz gov edu mil int tv cc ai ly gg to fm us uk ca au de fr jp cn in br ru it es nl se no dk fi pl ph vn id sg my th kr nz za mx ar ch be at ie ac ne or go').split(' '));
const SECOND_LEVEL = new Set(['com', 'co', 'org', 'net', 'gov', 'edu', 'ac', 'or', 'ne', 'go']);

function splitHost(host) {
  const labels = host.split('.').filter(Boolean);
  const parts = [];
  let cur = [];
  labels.forEach((label, i) => {
    cur.push(label);
    const l = label.toLowerCase();
    const next = labels[i + 1];
    if (!next || cur.length < 2 || labels.length - (i + 1) < 2 || !TLDS.has(l)) return;
    // com.au, co.uk, ne.jp ... belong together
    if (SECOND_LEVEL.has(l) && /^[a-z]{2}$/i.test(next) && TLDS.has(next.toLowerCase())) return;
    parts.push(cur.join('.'));
    cur = [];
  });
  if (cur.length) parts.push(cur.join('.'));
  return parts;
}

function clean(u) {
  return u.replace(/^[.\/:*!?]+/, '').replace(/[.\/:;!?*]+$/, '');
}

function extractUrls(text) {
  const found = [];
  text.split(SEPARATORS).forEach(chunk => {
    chunk.split(/(?=https?:\/\/)/i).forEach(raw => {
      const tok = clean(raw);
      if (!tok) return;
      const m = tok.match(/^(https?:\/\/)?([^\/?#:]*)(:\d+)?(.*)$/i);
      const proto = m[1] || '', port = m[3] || '', rest = m[4] || '';
      const parts = splitHost(m[2]);
      parts.forEach((host, i) => {
        const last = i === parts.length - 1;
        const url = clean((i === 0 ? proto : '') + host + (last ? port + rest : ''));
        if (VALID.test(url)) found.push(url);
      });
    });
  });
  return found;
}

function getValidUrls() {
  const text = document.getElementById('urlInput').value;
  const seen = new Set();
  // Remove duplicates (ignoring case and a trailing slash)
  return extractUrls(text).filter(u => {
    const key = u.toLowerCase().replace(/\/+$/, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function updateCounter() {
  const urls = getValidUrls();
  const counter = document.getElementById('urlCounter');
  counter.textContent = `${urls.length} Link${urls.length !== 1 ? 's' : ''} Found`;

  if (urls.length > 0) {
    counter.classList.add('active');
  } else {
    counter.classList.remove('active');
  }
}

function openLinks() {
  const urls = getValidUrls();

  if (urls.length === 0) {
    alert("No valid URL links detected in the workspace.");
    return;
  }

  urls.forEach(url => {
    let formattedUrl = url;
    // Add protocol if missing for browser to recognize as external link
    if (!/^https?:\/\//i.test(url)) {
      formattedUrl = 'https://' + url;
    }
    window.open(formattedUrl, '_blank');
  });

}

function clearInput() {
  document.getElementById('urlInput').value = '';
  updateCounter();
}

// The page's CSP forbids inline handlers (oninput/onclick), so they are wired here.
function init() {
  document.getElementById('urlInput').addEventListener('input', updateCounter);
  document.getElementById('openBtn').addEventListener('click', openLinks);
  document.getElementById('clearBtn').addEventListener('click', clearInput);
}

return init;
})();
const security=(function(){
// Security Scripts (inherited from the original page)
function init() {
  document.addEventListener("keydown", function (e) {
    if (e.keyCode === 123 || (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) || (e.ctrlKey && e.keyCode === 85)) {
      e.preventDefault();
    }
    if (e.ctrlKey && e.shiftKey && e.key === "C") {
      e.preventDefault();
    }
  });
  document.addEventListener("contextmenu", e => e.preventDefault());
}

return init;
})();
[rail, theme, link_opener, security].forEach(function(init){init();});
})();
