// Classic script (no ES modules). Reads an exported "<Name> - Searchstrings.xlsx" back into the form.
// Works on the file this tool exports and on a copy re-saved from Excel / Google Sheets (deflated zip, shared strings).
// Only the 'Search String' sheet, input column C (rows 3-97), is read.
window.XSM = window.XSM || {};
(function () {
const dec = new TextDecoder();

async function inflateRaw(bytes) {
  const ds = new DecompressionStream('deflate-raw');
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// -> { 'xl/workbook.xml': async () => text, ... }
function openZip(buf) {
  const b = new Uint8Array(buf), dv = new DataView(buf);
  let e = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new Error('not a zip');
  const count = dv.getUint16(e + 10, true);
  let p = dv.getUint32(e + 16, true);
  const files = {};
  for (let k = 0; k < count; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
    const nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
    const name = dec.decode(b.subarray(p + 46, p + 46 + nl));
    files[name] = async () => {
      const start = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true);
      const raw = b.subarray(start, start + csize);
      return dec.decode(method === 0 ? raw : await inflateRaw(raw));
    };
    p += 46 + nl + el + cl;
  }
  return files;
}

const parse = t => new DOMParser().parseFromString(t, 'application/xml');
const kids = (el, tag) => Array.from(el.getElementsByTagName(tag));

async function readSearchStringColumn(file) {
  const zip = openZip(await file.arrayBuffer());
  if (!zip['xl/workbook.xml']) throw new Error('no workbook');
  const wb = parse(await zip['xl/workbook.xml']());
  const sheetEls = kids(wb, 'sheet');
  // normally the tab named "Search String"; otherwise any tab that contains it in its name, then the first visible tab
  const sheetEl = sheetEls.find(s => (s.getAttribute('name') || '').trim().toLowerCase() === 'search string')
    || sheetEls.find(s => /search\s*string/i.test(s.getAttribute('name') || ''))
    || sheetEls.find(s => s.getAttribute('state') !== 'hidden');
  if (!sheetEl) throw new Error('missing Search String sheet');
  const rid = sheetEl.getAttribute('r:id');
  const rels = parse(await zip['xl/_rels/workbook.xml.rels']());
  const rel = kids(rels, 'Relationship').find(r => r.getAttribute('Id') === rid);
  let target = rel.getAttribute('Target').replace(/^\//, '');
  if (!target.startsWith('xl/')) target = 'xl/' + target;

  const sst = [];
  if (zip['xl/sharedStrings.xml']) kids(parse(await zip['xl/sharedStrings.xml']()), 'si').forEach(si => sst.push(kids(si, 't').map(t => t.textContent).join('')));

  const sheet = parse(await zip[target]());
  const out = {};
  kids(sheet, 'c').forEach(c => {
    const m = /^C(\d+)$/.exec(c.getAttribute('r') || '');
    if (!m) return;
    const row = +m[1], t = c.getAttribute('t'), vEl = kids(c, 'v')[0];
    let v = null;
    if (t === 'inlineStr') v = kids(c, 't').map(x => x.textContent).join('');
    else if (vEl) {
      v = vEl.textContent;
      if (t === 's') v = sst[+v];
      else if (!t || t === 'n') { // a number: keep as typed; Excel date serials become MM/DD/YYYY for the date rows
        if ((row === 16 || row === 37) && +v > 1000 && +v < 80000) {
          const d = new Date(Math.round((+v - 25569) * 86400000));
          v = `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}/${d.getUTCFullYear()}`;
        }
      }
    }
    if (v != null && String(v).trim() !== '') out[row] = String(v).trim();
  });
  return out;
}

// Template rows (column C): 3 First, 4 Middle, 5 Last | 6-15 City/State x5 | 16 DOB | 17-26 Employment | 27-36 School
// 37 DOI | 38-47 Alias | 48-57 Phone | 58-77 Email | 78-97 Username
function columnToState(col) {
  const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) if (col[i]) r.push(col[i]); return r; };
  const emails = range(58, 77);
  const emailUsers = new Set(emails.map(e => e.split('@')[0].trim().toLowerCase()));
  const locations = [];
  for (let i = 0; i < 5; i++) if (col[6 + i * 2] || col[7 + i * 2]) locations.push({ city: col[6 + i * 2] || '', state: col[7 + i * 2] || '' });
  const aliases = [
    ...range(38, 47).map(v => ({ value: v, type: 'alias' })),
    // usernames that are just the part before the "@" of an email are re-added automatically by the generator
    ...range(78, 97).filter(v => !emailUsers.has(v.toLowerCase())).map(v => ({ value: v, type: 'username' }))
  ];
  return {
    version: 1,
    fullName: [col[3], col[4], col[5]].filter(Boolean).join(' '),
    mergeLastName: false,
    dateOfBirth: col[16] ? [{ raw: col[16] }] : [],
    dateOfLoss: col[37] ? [{ raw: col[37] }] : [],
    locations,
    phones: range(48, 57),
    emails,
    employers: range(17, 26),
    schools: range(27, 36),
    aliases
  };
}

async function readXlsxState(file) { return columnToState(await readSearchStringColumn(file)); }

window.XSM['xs-xlsx-import'] = { readXlsxState, columnToState, readSearchStringColumn };
})();
