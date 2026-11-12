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
export function init() {
  document.getElementById('urlInput').addEventListener('input', updateCounter);
  document.getElementById('openBtn').addEventListener('click', openLinks);
  document.getElementById('clearBtn').addEventListener('click', clearInput);
}
