// Classic script (no ES modules). Minimal, dependency-free .xlsx writer (OOXML in a ZIP, stored/uncompressed).
// Produces a genuine Excel workbook that opens in Microsoft Excel and Google Sheets. No external library needed.
window.XSM = window.XSM || {};
(function () {
const enc = new TextEncoder();

/* ---------- CRC32 + ZIP (store) ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function zip(files) { // files: [{name, data:Uint8Array}]
  const parts = [], central = [];
  let offset = 0;
  const u16 = v => [v & 255, (v >>> 8) & 255];
  const u32 = v => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
  files.forEach(f => {
    const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
    const local = new Uint8Array([0x50, 0x4B, 0x03, 0x04, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(size), ...u32(size), ...u16(name.length), ...u16(0)]);
    parts.push(local, name, f.data);
    central.push(new Uint8Array([0x50, 0x4B, 0x01, 0x02, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(size), ...u32(size), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]), name);
    offset += local.length + name.length + size;
  });
  const cdSize = central.reduce((s, a) => s + a.length, 0);
  const end = new Uint8Array([0x50, 0x4B, 0x05, 0x06, ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(offset), ...u16(0)]);
  return new Blob([...parts, ...central, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/* ---------- OOXML helpers ---------- */
const esc = v => String(v).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
function colName(i) { let s = ''; for (i++; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + (i - 1) % 26) + s; return s; }
const safeSheetName = (n, used) => {
  let base = String(n).replace(/[\\\/?*\[\]:]/g, ' ').trim().slice(0, 31) || 'Sheet', name = base, k = 2;
  while (used.has(name.toLowerCase())) name = base.slice(0, 28) + ' ' + k++;
  used.add(name.toLowerCase());
  return name;
};

// styles: 0 default, 1 header (bold, yellow fill), 2 section label (bold), 3 hyperlink
const STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
  + '<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><u/><sz val="11"/><color rgb="FF0563C1"/><name val="Calibri"/></font></fonts>'
  + '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF6C90E"/><bgColor indexed="64"/></patternFill></fill></fills>'
  + '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
  + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
  + '<cellXfs count="4"><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
  + '<xf numFmtId="49" fontId="1" fillId="2" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>'
  + '<xf numFmtId="49" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>'
  + '<xf numFmtId="49" fontId="2" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/></cellXfs>'
  + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';

function sheetXml(sheet) {
  const rows = sheet.rows || [], links = [];
  let maxC = 0;
  let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">';
  rows.forEach(r => { maxC = Math.max(maxC, r.length); });
  xml += `<dimension ref="A1:${colName(Math.max(maxC - 1, 0))}${Math.max(rows.length, 1)}"/>`;
  xml += '<sheetViews><sheetView workbookViewId="0"' + (sheet.name === sheet._first ? ' tabSelected="1"' : '') + '><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>';
  if (sheet.cols && sheet.cols.length) xml += '<cols>' + sheet.cols.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('') + '</cols>';
  xml += '<sheetData>';
  rows.forEach((r, ri) => {
    xml += `<row r="${ri + 1}">`;
    r.forEach((v, ci) => {
      if (v === '' || v == null) return;
      const ref = colName(ci) + (ri + 1);
      const url = sheet.links && sheet.links[ri + ',' + ci];
      let s = 0;
      if (ri === 0) s = 1; else if (sheet.sectionCol0 && ci === 0 && r[1] === '' ) s = 2; else if (url) s = 3;
      xml += `<c r="${ref}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
      if (url) links.push({ ref, url });
    });
    xml += '</row>';
  });
  xml += '</sheetData>';
  if (links.length) xml += '<hyperlinks>' + links.map((l, i) => `<hyperlink ref="${l.ref}" r:id="rId${i + 1}"/>`).join('') + '</hyperlinks>';
  xml += '</worksheet>';
  return { xml, links };
}

// sheets: [{ name, rows: [[...]], cols: [widths], links: {"row,col": url}, sectionCol0: bool }]
function buildXlsx(sheets) {
  const used = new Set();
  sheets.forEach(s => { s.name = safeSheetName(s.name, used); });
  sheets.forEach(s => { s._first = sheets[0].name; });
  const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const files = [];
  const add = (name, text) => files.push({ name, data: enc.encode(text) });

  add('[Content_Types].xml', X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    + sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')
    + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>');
  add('_rels/.rels', X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  add('xl/workbook.xml', X + `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${REL}"><bookViews><workbookView activeTab="0"/></bookViews><sheets>`
    + sheets.map((s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets></workbook>');
  add('xl/_rels/workbook.xml.rels', X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${REL}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')
    + `<Relationship Id="rId${sheets.length + 1}" Type="${REL}/styles" Target="styles.xml"/></Relationships>`);
  add('xl/styles.xml', STYLES);
  sheets.forEach((s, i) => {
    const { xml, links } = sheetXml(s);
    add(`xl/worksheets/sheet${i + 1}.xml`, xml);
    if (links.length) add(`xl/worksheets/_rels/sheet${i + 1}.xml.rels`, X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + links.map((l, k) => `<Relationship Id="rId${k + 1}" Type="${REL}/hyperlink" Target="${esc(l.url)}" TargetMode="External"/>`).join('') + '</Relationships>');
  });
  return zip(files);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

window.XSM['xs-xlsx'] = { buildXlsx, downloadBlob };
})();
