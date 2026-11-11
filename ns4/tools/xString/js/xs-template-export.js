// Classic script (no ES modules). "Export to Excel" built from the Name - Searchstrings template.
// The template (all sheets, formulas, colours) is embedded in js/xs-template.js; the
// 'Search String' input cells (C3:C97) and the 'AutoURL' link table are filled from what was entered in the app.
// The workbook is flagged to recalculate on open, so Excel / Google Sheets build every search string.
window.XSM = window.XSM || {};
(function () {
const enc = new TextEncoder();

/* ---------- CRC32 + ZIP writer (keeps the template's compressed entries as they are) ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function b64ToBytes(s) { const bin = atob(s), out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }

// files: [{ name, method (0 stored | 8 deflate), crc, usize, data (bytes as stored in the zip) }]
function zipRaw(files) {
  const u16 = v => [v & 255, (v >>> 8) & 255];
  const u32 = v => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
  const parts = [], central = [];
  let offset = 0;
  files.forEach(f => {
    const name = enc.encode(f.name), csize = f.data.length;
    const common = [...u16(20), ...u16(0x0800), ...u16(f.method), ...u16(0), ...u16(0x21), ...u32(f.crc), ...u32(csize), ...u32(f.usize), ...u16(name.length), ...u16(0)];
    const local = new Uint8Array([0x50, 0x4B, 0x03, 0x04, ...common]);
    parts.push(local, name, f.data);
    central.push(new Uint8Array([0x50, 0x4B, 0x01, 0x02, ...u16(20), ...common.slice(0, 26), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]), name);
    offset += local.length + name.length + csize;
  });
  const cdSize = central.reduce((s, a) => s + a.length, 0);
  const end = new Uint8Array([0x50, 0x4B, 0x05, 0x06, ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(offset), ...u16(0)]);
  return new Blob([...parts, ...central, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

const esc = v => String(v).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

/* ---------- map the app's form data onto the template's input cells ---------- */
// Template rows on 'Search String' (column C):
// 3 First, 4 Middle, 5 Last | 6-15 City/State x5 | 16 DOB | 17-26 Employment | 27-36 School | 37 DOI
// 38-47 Alias | 48-57 Phone | 58-77 Email | 78-97 Username
function mapFormToCells(formData) {
  const { getNameParts, formatPhone } = window.XSM['xs-core'];
  const cells = {}, over = [];
  const put = (row, v) => { if (v !== undefined && v !== null && String(v).trim() !== '') cells['C' + row] = String(v).trim(); };
  const fill = (label, list, startRow, max, fn) => {
    list.slice(0, max).forEach((v, i) => put(startRow + i, fn ? fn(v) : v));
    if (list.length > max) over.push(`${label} (${list.length - max} over the template limit of ${max})`);
  };

  const parts = getNameParts(formData.fullName, formData.mergeLast);
  if (parts.length === 1) put(3, parts[0]);
  else if (parts.length === 2) { put(3, parts[0]); put(5, parts[1]); }
  else if (parts.length >= 3) { put(3, parts[0]); put(4, parts.slice(1, -1).join(' ')); put(5, parts[parts.length - 1]); }

  formData.locations.slice(0, 5).forEach((loc, i) => { put(6 + i * 2, loc.city); put(7 + i * 2, loc.state); });
  if (formData.locations.length > 5) over.push(`City/State (${formData.locations.length - 5} over the template limit of 5)`);

  if (formData.dobList.length) put(16, formData.dobList[0].full);
  if (formData.dobList.length > 1) over.push('Date of Birth (template has 1 slot, first one used)');
  if (formData.dateOfLossList.length) put(37, formData.dateOfLossList[0].full);
  if (formData.dateOfLossList.length > 1) over.push('Date of Loss (template has 1 slot, first one used)');

  fill('Employment', formData.employers, 17, 10);
  fill('School', formData.schools, 27, 10);
  fill('Alias', formData.aliasEntries.filter(a => a.type !== 'username').map(a => a.value), 38, 10);
  fill('Phone', formData.phones, 48, 10, formatPhone);
  fill('Email', formData.emails, 58, 20);
  // Usernames = the part before "@" of every email (same as the generator), then usernames typed in as aliases; duplicates dropped
  const emailUsers = formData.emails.map(e => String(e).split('@')[0].trim()).filter(Boolean);
  const typedUsers = formData.aliasEntries.filter(a => a.type === 'username').map(a => a.value);
  fill('Username', window.XSM['xs-core'].dedupe([...emailUsers, ...typedUsers]), 78, 20);
  return { cells, over };
}

/* ---------- AutoURL tab ----------
   In the original template this tab is filled by Google-Sheets-only spill formulas (FILTER / QUERY /
   array formulas). They do not run when the .xlsx is opened, so the tab came up empty. We now write the
   search strings straight into the tab as clickable links, one column per platform, using the same
   strings and URLs the app shows. */
const AUTO_COLS = ['Facebook', 'X / Twitter', 'YouTube', 'Google', 'LinkedIn', 'Instagram', 'TikTok', 'Pinterest', 'Strava', 'Foursquare', 'Tumblr', 'RocketReach', 'SignalHire']; // B..N
const AUTO_FIRST_ROW = 3, AUTO_LAST_ROW = 860; // Table_2 spans B2:N860
const colLetter = i => String.fromCharCode(66 + i); // 0 -> B

function mapQueriesToAutoUrl(querySets) {
  const { PLATFORM_LIST, buildSearchUrl } = window.XSM['xs-core'];
  const maxRows = AUTO_LAST_ROW - AUTO_FIRST_ROW + 1, over = [];
  const cols = AUTO_COLS.map(key => {
    const p = PLATFORM_LIST.find(x => x.key === key);
    const list = (p && querySets && querySets[p.group]) || [];
    if (list.length > maxRows) over.push(`AutoURL ${p.label} (${list.length - maxRows} over the ${maxRows}-row limit)`);
    return list.slice(0, maxRows).map(q => ({ text: q, url: buildSearchUrl(q, key) }));
  });
  return { cols, over };
}

// Link-styled template styles, alternating row shading like the template: [odd row, even row]
function autoStyle(colIdx, row) {
  const odd = row % 2 === 1;
  if (colIdx === 0) return odd ? 71 : 74;
  if (colIdx >= 11) return odd ? 72 : 77;
  return odd ? 72 : 75;
}

function buildAutoUrlSheet(autoCols) {
  const A = window.XSM['xs-template'].auto;
  const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const links = [];
  let rows = '';
  for (let r = AUTO_FIRST_ROW; r <= AUTO_LAST_ROW; r++) {
    let x = `<row r="${r}"><c r="A${r}" s="65"/>`;
    autoCols.forEach((col, ci) => {
      const item = col[r - AUTO_FIRST_ROW], ref = colLetter(ci) + r;
      if (item) {
        x += `<c r="${ref}" s="${autoStyle(ci, r)}" t="inlineStr"><is><t xml:space="preserve">${esc(item.text)}</t></is></c>`;
        links.push({ ref, url: item.url });
      } else {
        x += `<c r="${ref}" s="${r % 2 === 1 ? (ci === 0 ? 71 : 72) : (ci === 0 ? 74 : 75)}"/>`;
      }
    });
    x += `<c r="O${r}" s="73"/><c r="P${r}" s="73"/><c r="Q${r}" s="73"/></row>`;
    rows += x;
  }
  // tail starts with <drawing .../>; <hyperlinks> must come right before it
  const hl = links.length ? '<hyperlinks>' + links.map((l, i) => `<hyperlink ref="${l.ref}" r:id="rIdL${i + 1}"/>`).join('') + '</hyperlinks>' : '';
  const xml = A.head + A.row1 + A.row2 + rows + '</sheetData>' + hl + A.tail;
  const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + `<Relationship Id="rId1" Type="${REL}/drawing" Target="../drawings/drawing6.xml"/>`
    + `<Relationship Id="rId3" Type="${REL}/table" Target="../tables/table2.xml"/>`
    + links.map((l, i) => `<Relationship Id="rIdL${i + 1}" Type="${REL}/hyperlink" Target="${esc(l.url)}" TargetMode="External"/>`).join('')
    + '</Relationships>';
  return { xml, rels };
}

function buildTemplateXlsx(cells, autoCols) {
  const T = window.XSM['xs-template'];
  // rebuild sheet4.xml ('Search String') with the inputs filled in; each cell keeps its template style
  let sheet = '';
  T.segs.forEach((seg, i) => {
    sheet += seg;
    if (i < T.styles.length) {
      const ref = 'C' + (i + 3), v = cells[ref], s = T.styles[i];
      sheet += v == null ? `<c r="${ref}" s="${s}"/>` : `<c r="${ref}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
    }
  });
  const stored = (name, text) => { const d = enc.encode(text); return { name, method: 0, crc: crc32(d), usize: d.length, data: d }; };
  const files = T.entries.map(e => ({ name: e.n, method: e.m, crc: e.c >>> 0, usize: e.u, data: b64ToBytes(e.z) }));
  files.push(stored('xl/worksheets/sheet4.xml', sheet));
  files.push(stored('xl/workbook.xml', T.workbook));
  const auto = buildAutoUrlSheet(autoCols || AUTO_COLS.map(() => []));
  files.push(stored('xl/worksheets/sheet6.xml', auto.xml));
  files.push(stored('xl/worksheets/_rels/sheet6.xml.rels', auto.rels));
  // [Content_Types].xml first, as Excel prefers
  files.sort((a, b) => (a.name === '[Content_Types].xml' ? -1 : b.name === '[Content_Types].xml' ? 1 : 0));
  return zipRaw(files);
}

// "<Name> - Searchstrings.xlsx", using the name typed in the app
function exportFileName(fullName) {
  const clean = String(fullName).replace(/[\\/:*?"<>|\u0000-\u001F]/g, ' ').replace(/\s+/g, ' ').trim() || 'Name';
  return `${clean} - Searchstrings.xlsx`;
}

function exportSearchstrings(formData, querySets) {
  const { cells, over } = mapFormToCells(formData);
  const auto = mapQueriesToAutoUrl(querySets);
  over.push(...auto.over);
  const blob = buildTemplateXlsx(cells, auto.cols);
  window.XSM['xs-xlsx'].downloadBlob(blob, exportFileName(formData.fullName));
  return { over, fileName: exportFileName(formData.fullName) };
}

window.XSM['xs-template-export'] = { mapFormToCells, mapQueriesToAutoUrl, buildTemplateXlsx, exportFileName, exportSearchstrings };
})();
