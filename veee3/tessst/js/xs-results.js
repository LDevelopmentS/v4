// Classic script (no ES modules), so it also runs when index.html is opened directly.
window.XSM = window.XSM || {};
(function () {
// xString results: platform copy buttons, filter, grouped list, Excel export.
const { CATEGORY_ORDER, PLATFORM_LIST, buildSearchUrl, getNamePartsLabeled, showToast, copyText } = window.XSM['xs-core'];

const $ = id => document.getElementById(id);

/* ---------- copy as clickable list ---------- */
function removeEmptyParagraphs(container) {
  container.querySelectorAll(':scope > p').forEach(p => {
    const text = p.textContent.replace(/[\s\u00A0\u200B\u200C\u200D\uFEFF]+/g, '');
    if (!text && !p.querySelector('a, img')) p.remove();
  });
}
function applySpacingRules(container) {
  container.querySelectorAll(':scope > p').forEach((p, idx) => {
    p.style.margin = '0';
    if (idx === 1) p.style.marginTop = '1em';
  });
}
function buildCleanedList(queries, platformName) {
  const container = document.createElement('div');
  const header = document.createElement('p');
  header.textContent = queries.length > 1
    ? 'No match found. Please see search queries below.'
    : 'No match found. Please see search query below.';
  container.appendChild(header);

  queries.forEach(q => {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = buildSearchUrl(q, platformName);
    if (platformName === 'Google') a.dataset.googleQ = q;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = q;
    p.appendChild(a);
    container.appendChild(p);
  });
  removeEmptyParagraphs(container);
  applySpacingRules(container);

  const makeSpacer = () => {
    const s = document.createElement('p');
    s.innerHTML = '&nbsp;';
    s.style.margin = '0';
    return s;
  };
  container.insertBefore(makeSpacer(), container.children[1] || null);
  container.appendChild(makeSpacer());
  container.appendChild(makeSpacer());
  return container;
}
function copyCleanedList(queries, platformName, platformLabel) {
  const container = buildCleanedList(queries, platformName);
  const html = container.innerHTML, text = container.innerText;
  const done = () => showToast(`Copied for ${platformLabel}`);
  try {
    const item = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([text], { type: 'text/plain' })
    });
    navigator.clipboard.write([item]).then(done).catch(() => { copyText(text); done(); });
  } catch {
    copyText(text);
    done();
  }
}

/* ---------- Excel export: genuine .xlsx workbook, built in the browser by js/xs-xlsx.js (no library needed) ---------- */
function exportToExcelLegacy(querySets, formData) {
  const { buildXlsx, downloadBlob } = window.XSM['xs-xlsx'];
  const detailRows = [['Field', 'Value']];
  const section = t => detailRows.push([t, '']);
  const blank = () => detailRows.push(['', '']);

  section('NAME');
  getNamePartsLabeled(formData.fullName, formData.mergeLast).forEach(([l, v]) => detailRows.push([l, v]));
  blank();
  section('LOCATION');
  formData.locations.forEach((loc, i) => { detailRows.push([`City ${i + 1}`, loc.city]); detailRows.push([`State ${i + 1}`, loc.state]); });
  blank();
  section('DATES');
  if (formData.dobList.length) formData.dobList.forEach((d, i) => detailRows.push([`DOB ${i + 1}`, d.full]));
  else detailRows.push(['DOB', '']);
  formData.dateOfLossList.forEach((d, i) => detailRows.push([`DOL ${i + 1}`, d.full]));
  blank();
  section('EMAILS');
  formData.emails.forEach((e, i) => detailRows.push([`Email ${i + 1}`, e]));
  blank();
  section('ALIASES');
  formData.aliasEntries.forEach((a, i) => detailRows.push([`${a.type === 'username' ? 'Username' : 'Alias'} ${i + 1}`, a.value]));
  blank();
  section('PHONES');
  formData.phones.forEach((p, i) => detailRows.push([`Phone ${i + 1}`, p]));
  blank();
  section('EMPLOYERS');
  formData.employers.forEach((e, i) => detailRows.push([`Employer ${i + 1}`, e]));
  blank();
  section('SCHOOLS');
  formData.schools.forEach((s, i) => detailRows.push([`School ${i + 1}`, s]));

  const catRows = [['Category', 'Search String']];
  CATEGORY_ORDER.forEach(c => (querySets.display[c] || []).forEach(q => catRows.push([c, q])));

  const cols = PLATFORM_LIST.map(p => ({ label: p.label, key: p.key, rows: querySets[p.group] || [] }));
  const maxRows = cols.reduce((m, c) => Math.max(m, c.rows.length), 0);
  const platRows = [cols.map(c => c.label)];
  for (let r = 0; r < maxRows; r++) platRows.push(cols.map(c => c.rows[r] || ''));
  const platLinks = {};
  cols.forEach((col, ci) => col.rows.forEach((q, ri) => { platLinks[`${ri + 1},${ci}`] = buildSearchUrl(q, col.key); }));

  const blob = buildXlsx([
    { name: 'Input Details', rows: detailRows, cols: [20, 34], sectionCol0: true },
    { name: 'By Platform', rows: platRows, cols: cols.map(() => 32), links: platLinks },
    { name: 'By Category', rows: catRows, cols: [20, 65] }
  ]);
  const safe = formData.fullName.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'search-strings';
  downloadBlob(blob, `${safe}.xlsx`);
  showToast('Excel workbook downloaded');
}

/* ---------- Export to Excel: fills the "Name - Searchstrings" template (js/xs-template-export.js) ---------- */
function exportToExcel(querySets, formData) {
  const ex = window.XSM['xs-template-export'];
  if (!ex || !window.XSM['xs-template']) { exportToExcelLegacy(querySets, formData); return; }
  const { over, fileName } = ex.exportSearchstrings(formData, querySets);
  showToast(over.length ? `Downloaded ${fileName}. Not all fit the template: ${over.join('; ')}` : `Downloaded ${fileName}`);
}

/* ---------- render ---------- */
function clearResults() { $('results').innerHTML = ''; }

function renderResults(querySets, formData) {
  const el = $('results');
  el.innerHTML = '';
  const total = querySets.full.length;

  if (!total) {
    el.innerHTML = '<div class="empty-state"><strong>Nothing generated yet</strong>Fill in a name, city/state, phone, or alias in the subject panel, then select Generate.</div>';
    return;
  }

  const bar = document.createElement('div');
  bar.className = 'action-bar';
  const iconRow = document.createElement('div');
  iconRow.className = 'platform-icon-row';

  PLATFORM_LIST.forEach(p => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'platform-icon-btn';
    btn.title = `Copy every relevant line as a clickable ${p.label} search link`;
    btn.setAttribute('aria-label', `Copy for ${p.label}`);

    const fallback = () => {
      const s = document.createElement('span');
      s.className = 'platform-icon-fallback';
      s.style.color = '#' + p.color;
      s.textContent = p.label.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase();
      return s;
    };
    if (p.color === 'FFFFFF') btn.classList.add('is-white');
    const img = document.createElement('img');
    img.alt = p.label;
    img.loading = 'lazy';
    img.src = `https://cdn.simpleicons.org/${p.slug}/${p.color}`;
    img.addEventListener('error', () => img.replaceWith(fallback()), { once: true });
    btn.appendChild(img);
    btn.addEventListener('click', () => copyCleanedList(querySets[p.group], p.key, p.label));
    iconRow.appendChild(btn);
  });
  bar.appendChild(iconRow);

  const filterRow = document.createElement('div');
  filterRow.className = 'filter-row';
  const filterInput = document.createElement('input');
  filterInput.type = 'text';
  filterInput.placeholder = `Filter ${total} search strings…`;
  const expandToggle = document.createElement('button');
  expandToggle.type = 'button';
  expandToggle.className = 'expand-toggle';
  expandToggle.textContent = 'Expand all';
  const exportBtn = document.createElement('button');
  exportBtn.type = 'button';
  exportBtn.className = 'export-btn';
  exportBtn.textContent = 'Export to Excel';
  exportBtn.addEventListener('click', () => exportToExcel(querySets, formData));
  const gsBtn = document.createElement('button');
  gsBtn.type = 'button';
  gsBtn.className = 'export-btn';
  gsBtn.textContent = 'Copy to Google Sheets';
  gsBtn.title = 'Makes a copy of the original Google Sheet in your Google Drive, filled with these details (formulas stay live), and opens it';
  gsBtn.addEventListener('click', () => { window.XSM['xs-results-last'] = querySets; window.XSM['xs-gsheets'].copyToGoogleSheets(formData, gsBtn); });
  filterRow.append(filterInput, expandToggle, exportBtn, gsBtn);
  bar.appendChild(filterRow);
  el.appendChild(bar);

  const groups = document.createElement('div');
  let allOpen = false;

  CATEGORY_ORDER.forEach((category, catIdx) => {
    const items = querySets.display[category];
    if (!items.length) return;

    const details = document.createElement('details');
    details.className = 'result-group';
    if (catIdx === 0) details.open = true;

    const summary = document.createElement('summary');
    const name = document.createElement('span');
    name.textContent = category;
    const count = document.createElement('span');
    count.className = 'count';
    count.textContent = items.length;
    summary.append(name, count);
    details.appendChild(summary);

    const wrap = document.createElement('div');
    wrap.className = 'rows';
    items.forEach(q => {
      const row = document.createElement('div');
      row.className = 'row';
      row.dataset.text = q.toLowerCase();

      const a = document.createElement('a');
      a.href = buildSearchUrl(q, 'Google');
      a.dataset.googleQ = q;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = q;

      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'copy-mini';
      copy.textContent = 'Copy';
      copy.addEventListener('click', () => { copyText(q); showToast('Copied to clipboard'); });

      row.append(a, copy);
      wrap.appendChild(row);
    });

    const none = document.createElement('div');
    none.className = 'no-matches';
    none.textContent = 'No lines in this group match your filter.';
    none.hidden = true;
    wrap.appendChild(none);

    details.appendChild(wrap);
    groups.appendChild(details);
  });
  el.appendChild(groups);

  filterInput.addEventListener('input', () => {
    const term = filterInput.value.trim().toLowerCase();
    groups.querySelectorAll('.result-group').forEach(group => {
      let visible = 0;
      group.querySelectorAll('.row').forEach(row => {
        const match = !term || row.dataset.text.includes(term);
        row.hidden = !match;
        if (match) visible++;
      });
      group.querySelector('.no-matches').hidden = !(term && visible === 0);
      if (term) group.open = true;
    });
  });

  expandToggle.addEventListener('click', () => {
    allOpen = !allOpen;
    groups.querySelectorAll('.result-group').forEach(g => { g.open = allOpen; });
    expandToggle.textContent = allOpen ? 'Collapse all' : 'Expand all';
  });
}

// Re-point Google links when the region option in the sidebar changes
function initResults() {
  document.addEventListener('change', e => {
    if (!e.target || e.target.name !== 'googleRegion') return;
    document.querySelectorAll('a[data-google-q]').forEach(a => { a.href = buildSearchUrl(a.dataset.googleQ, 'Google'); });
  });
}

  window.XSM['xs-results'] = { clearResults, renderResults, initResults };
})();
