// Classic script (no ES modules), so it also runs when index.html is opened directly.
window.XSM = window.XSM || {};
(function () {
// xString subject form: dynamic rows, paste auto-casing, name picker, save / load, reading the form.
const { toProperCase, toStateCase, toLowerClean, nameVariants, isMergeLast, googleTld,
         parseDateTextToObj, composeDateText, showToast } = window.XSM['xs-core'];

const $ = id => document.getElementById(id);
const rows = {};
let aliasRowCounter = 0;

/* ---------- row builders ---------- */
function removeButton(row) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'icon-btn';
  b.textContent = '✕';
  b.setAttribute('aria-label', 'Remove');
  b.addEventListener('click', () => row.remove());
  return b;
}
function textInput(placeholder, className, type = 'text') {
  const i = document.createElement('input');
  i.type = type; i.placeholder = placeholder; i.className = className;
  return i;
}
function makeRemovableInput(placeholder, type, className) {
  const row = document.createElement('div');
  row.className = 'dynamic-row';
  row.append(textInput(placeholder, className, type || 'text'), removeButton(row));
  return row;
}
function makeLocationRow() {
  const row = document.createElement('div');
  row.className = 'location-row';
  row.append(textInput('City', 'city-input'), textInput('State', 'state-input'), removeButton(row));
  return row;
}
function makeDateRow(rowClass, inputClass) {
  const row = document.createElement('div');
  row.className = rowClass;
  row.append(textInput('MM/DD/YYYY', `date-text-input ${inputClass}`), removeButton(row));
  return row;
}
const makeDolRow = () => makeDateRow('dol-row', 'dol-date');
const makeDobRow = () => makeDateRow('dob-row', 'dob-date');

function makeAliasRow() {
  const group = 'aliasType' + (aliasRowCounter++);
  const row = document.createElement('div');
  row.className = 'alias-row';

  const top = document.createElement('div');
  top.className = 'alias-row-top';
  top.append(textInput('Alias / nickname / username', 'alias-input'), removeButton(row));

  const toggle = document.createElement('div');
  toggle.className = 'alias-type-toggle';
  [['alias', 'Alias', true], ['username', 'Username', false]].forEach(([value, text, checked]) => {
    const label = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio'; radio.name = group; radio.value = value; radio.checked = checked;
    radio.className = 'alias-type-radio';
    label.append(radio, document.createTextNode(' ' + text));
    toggle.appendChild(label);
  });

  row.append(top, toggle);
  return row;
}

const phoneRow = () => makeRemovableInput('Phone number', 'tel', 'phone-input');
const emailRow = () => makeRemovableInput('Email address', 'text', 'email-input');
const employerRow = () => makeRemovableInput('Employer', 'text', 'employment-input');
const schoolRow = () => makeRemovableInput('School', 'text', 'school-input');

function addDefaultRows() {
  rows.location.appendChild(makeLocationRow());
  rows.phone.appendChild(phoneRow());
  rows.alias.appendChild(makeAliasRow());
  rows.email.appendChild(emailRow());
  rows.employment.appendChild(employerRow());
  rows.school.appendChild(schoolRow());
  rows.dol.appendChild(makeDolRow());
  rows.dob.appendChild(makeDobRow());
}

/* ---------- auto-casing on paste ---------- */
function casingFor(el) {
  if (!el || el.tagName !== 'INPUT') return null;
  if (el.id === 'fullName') return toProperCase;
  if (el.classList.contains('email-input')) return toLowerClean;
  if (el.classList.contains('employment-input')) return toProperCase;
  if (el.classList.contains('school-input')) return toProperCase;
  if (el.classList.contains('city-input')) return toProperCase;
  if (el.classList.contains('state-input')) return toStateCase;
  if (el.classList.contains('alias-input')) {
    const checked = el.closest('.alias-row')?.querySelector('.alias-type-radio:checked');
    return (checked && checked.value === 'username') ? toLowerClean : toProperCase;
  }
  return null;
}

/* ---------- name combination picker ---------- */
function renderNameVariantPreview() {
  const field = $('nameVariantField'), list = $('nameVariantList');
  const val = $('fullName').value.trim();
  list.innerHTML = '';
  field.querySelector('.variant-actions')?.remove();

  if (!val) { field.hidden = true; return; }
  const variants = nameVariants(val, isMergeLast());
  if (variants.length <= 1) { field.hidden = true; return; }
  field.hidden = false;

  variants.forEach(v => {
    const row = document.createElement('label');
    row.className = 'variant-row';
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = true; cb.className = 'name-variant-checkbox'; cb.value = v;
    cb.addEventListener('change', () => row.classList.toggle('unchecked', !cb.checked));
    const span = document.createElement('span');
    span.textContent = v;
    row.append(cb, span);
    list.appendChild(row);
  });

  const setAll = on => () => list.querySelectorAll('.name-variant-checkbox').forEach(cb => {
    cb.checked = on;
    cb.closest('.variant-row').classList.toggle('unchecked', !on);
  });
  const actions = document.createElement('div');
  actions.className = 'variant-actions';
  [['Select all', true], ['Select none', false]].forEach(([text, on]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = text; b.addEventListener('click', setAll(on));
    actions.appendChild(b);
  });
  field.appendChild(actions);
}

/* ---------- save / load ---------- */
function collectFormState() {
  const dateOfBirth = [...document.querySelectorAll('.dob-row')].map(r => ({ raw: r.querySelector('.dob-date').value }));
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    fullName: $('fullName').value,
    mergeLastName: isMergeLast(),
    dob: dateOfBirth[0] || { raw: '' }, // first DOB kept for older versions of the tool
    dateOfBirth,
    googleRegion: googleTld() === 'ca' ? 'CA' : 'US',
    dateOfLoss: [...document.querySelectorAll('.dol-row')].map(r => ({ raw: r.querySelector('.dol-date').value })),
    locations: [...document.querySelectorAll('.location-row')].map(r => ({
      city: r.querySelector('.city-input').value, state: r.querySelector('.state-input').value
    })),
    phones: [...document.querySelectorAll('.phone-input')].map(i => i.value),
    emails: [...document.querySelectorAll('.email-input')].map(i => i.value),
    employers: [...document.querySelectorAll('.employment-input')].map(i => i.value),
    schools: [...document.querySelectorAll('.school-input')].map(i => i.value),
    aliases: [...document.querySelectorAll('.alias-row')].map(r => ({
      value: r.querySelector('.alias-input').value,
      type: r.querySelector('.alias-type-radio:checked')?.value || 'alias'
    })),
    checkedNameVariants: [...document.querySelectorAll('.name-variant-checkbox')].filter(cb => cb.checked).map(cb => cb.value)
  };
}

// Stylesheet used ONLY inside the downloaded record file (a standalone page, not this site).
const SAVED_FILE_CSS = `
:root{--signal:#F6C90E;--line:rgba(255,255,255,0.12);--slate:#B8B8B8;--sans:system-ui,-apple-system,sans-serif;}
*{box-sizing:border-box;}
body{margin:0;background:#0b0b0b;font-family:var(--sans);color:#fff;min-height:100vh;}
#lockedBanner{background:#211b08;color:#F6C90E;border-bottom:1px solid rgba(246,201,14,0.55);padding:10px 20px;font-weight:700;font-size:0.82rem;text-align:center;}
.xs__form{max-width:420px;margin:0 auto;padding:24px 22px 40px;background:#101010;border-left:1px solid var(--line);border-right:1px solid var(--line);min-height:100vh;}
.field-section{margin-bottom:22px;}
.field-section h3{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#f3f3f3;margin:0 0 12px;padding-bottom:6px;border-bottom:1px solid var(--line);}
.field{margin-bottom:14px;}
.field label{display:block;font-size:11px;font-weight:700;color:#f3f3f3;margin-bottom:5px;}
.date-hint{font-weight:400;text-transform:none;color:var(--slate);}
input[type="text"],input[type="tel"]{width:100%;padding:9px 11px;border:1px solid rgba(255,255,255,0.10);font-size:0.88rem;font-family:var(--sans);background:#202020;color:#929292;color-scheme:dark;outline:none;cursor:not-allowed;}
.dynamic-row,.location-row,.dol-row,.dob-row{display:flex;gap:6px;margin-bottom:6px;align-items:center;}
.alias-row{border:1px solid rgba(255,255,255,0.16);padding:7px 8px;margin-bottom:6px;}
.alias-row-top{display:flex;gap:6px;margin-bottom:6px;}
.alias-type-toggle{display:flex;gap:16px;font-size:0.76rem;}
.alias-type-toggle label{display:flex;align-items:center;gap:4px;margin:0;}
`;

function saveAsStaticHtml() {
  const fullName = $('fullName').value.trim();
  if (!fullName) { alert('Enter a full name before saving.'); return; }

  const stateJson = JSON.stringify(collectFormState()).replace(/<\/script/gi, '<\\/script');
  const panel = document.querySelector('.xs__form');
  const clone = panel.cloneNode(true);

  const origInputs = panel.querySelectorAll('input');
  const cloneInputs = clone.querySelectorAll('input');
  origInputs.forEach((o, i) => {
    const c = cloneInputs[i];
    if (!c) return;
    if (o.type === 'radio' || o.type === 'checkbox') {
      if (o.checked) c.setAttribute('checked', ''); else c.removeAttribute('checked');
    } else if (o.type !== 'file') {
      c.setAttribute('value', o.value);
    }
    c.setAttribute('disabled', '');
  });
  clone.querySelectorAll('.add-link, .icon-btn, .variant-actions, #nameVariantField, .xs__actions, .xs__footer').forEach(el => el.remove());

  const closeScript = '<' + '/script>';
  const html =
    '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + fullName.replace(/</g, '&lt;') + ' — Saved Record</title>\n' +
    '<style>' + SAVED_FILE_CSS + '</style>\n</head>\n<body>\n' +
    '<div id="lockedBanner">This is a saved record — fields are locked and cannot be edited.</div>\n' +
    clone.outerHTML + '\n' +
    '<script type="application/json" id="__savedState">' + stateJson + closeScript + '\n</body>\n</html>';

  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fullName.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'search-string-save'}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('Saved — file downloaded');
}

function fillListRows(container, values, makeRowFn, fillRowFn) {
  container.innerHTML = '';
  const list = (values && values.length) ? values : [undefined];
  list.forEach(v => {
    const row = makeRowFn();
    container.appendChild(row);
    fillRowFn(row, v || {});
  });
}

function applyFormState(state) {
  $('fullName').value = state.fullName || '';
  $('mergeLastName').checked = !!state.mergeLastName;
  renderNameVariantPreview();
  if (Array.isArray(state.checkedNameVariants)) {
    const set = new Set(state.checkedNameVariants);
    document.querySelectorAll('.name-variant-checkbox').forEach(cb => {
      cb.checked = set.has(cb.value);
      cb.closest('.variant-row').classList.toggle('unchecked', !cb.checked);
    });
  }

  const dobSaved = (Array.isArray(state.dateOfBirth) && state.dateOfBirth.length) ? state.dateOfBirth : (state.dob ? [state.dob] : []);
  fillListRows(rows.dob, dobSaved, makeDobRow, (r, d) => { r.querySelector('.dob-date').value = composeDateText(d); });

  const region = document.querySelector(`input[name="googleRegion"][value="${state.googleRegion === 'CA' ? 'CA' : 'US'}"]`);
  if (region) region.checked = true;

  fillListRows(rows.dol, state.dateOfLoss, makeDolRow, (r, d) => { r.querySelector('.dol-date').value = composeDateText(d); });
  fillListRows(rows.location, state.locations, makeLocationRow, (r, l) => {
    r.querySelector('.city-input').value = l.city || '';
    r.querySelector('.state-input').value = l.state || '';
  });
  const str = v => (typeof v === 'string' ? v : '') || '';
  fillListRows(rows.phone, state.phones, phoneRow, (r, v) => { r.querySelector('.phone-input').value = str(v); });
  fillListRows(rows.email, state.emails, emailRow, (r, v) => { r.querySelector('.email-input').value = str(v); });
  fillListRows(rows.employment, state.employers, employerRow, (r, v) => { r.querySelector('.employment-input').value = str(v); });
  fillListRows(rows.school, state.schools, schoolRow, (r, v) => { r.querySelector('.school-input').value = str(v); });
  fillListRows(rows.alias, state.aliases, makeAliasRow, (r, a) => {
    r.querySelector('.alias-input').value = a.value || '';
    const want = a.type === 'username' ? 'username' : 'alias';
    const radio = [...r.querySelectorAll('.alias-type-radio')].find(x => x.value === want);
    if (radio) radio.checked = true;
  });
  $('results').innerHTML = '';
}

function loadStateFromFile(file) {
  // An exported "<Name> - Searchstrings.xlsx" (or a copy saved from Excel / Google Sheets)
  if (/\.xlsx$/i.test(file.name) || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    window.XSM['xs-xlsx-import'].readXlsxState(file).then(state => {
      if (!state.fullName && !state.emails.length && !state.phones.length && !state.aliases.length) { alert('No search details were found on the Search String sheet of that file.'); return; }
      applyFormState(state);
      showToast('Loaded details from Excel file');
    }).catch(err => alert('That Excel file could not be read (' + ((err && err.message) || 'unknown error') + '). Use a file exported from this tool; the Search String sheet must still be there.'));
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const raw = reader.result;
    let state = null;
    try { state = JSON.parse(raw); } catch {
      try {
        const el = new DOMParser().parseFromString(raw, 'text/html').getElementById('__savedState');
        if (el) state = JSON.parse(el.textContent);
      } catch { /* fall through */ }
    }
    if (!state) { alert('That file could not be read — is it a valid save file?'); return; }
    applyFormState(state);
    showToast('Loaded saved data');
  };
  reader.onerror = () => alert('Could not read that file.');
  reader.readAsText(file);
}

/* ---------- public ---------- */
// Locks every field (used for read-only saved records).
function lockForm() {
  document.body.classList.add('locked');
  document.querySelectorAll('.xs input, .xs textarea, .xs select').forEach(el => {
    if (el.type !== 'file') el.disabled = true;
  });
  if (!$('lockedBanner')) {
    const banner = document.createElement('div');
    banner.id = 'lockedBanner';
    banner.textContent = 'This is a saved record — fields are locked and cannot be edited.';
    document.body.insertBefore(banner, document.body.firstChild);
  }
}

function resetForm() {
  $('fullName').value = '';
  $('mergeLastName').checked = false;
  Object.values(rows).forEach(c => { c.innerHTML = ''; });
  addDefaultRows();
  $('nameVariantList').innerHTML = '';
  $('nameVariantField').querySelector('.variant-actions')?.remove();
  $('nameVariantField').hidden = true;
}

// Reads the form for Generate. Returns null (after an alert) when there is no name.
function readSubject() {
  const fullName = $('fullName').value.trim();
  if (!fullName) { alert('Enter a full name to generate search strings.'); return null; }

  const vals = sel => [...document.querySelectorAll(sel)].map(i => i.value.trim()).filter(Boolean);
  const aliasEntries = [...document.querySelectorAll('.alias-row')].map(r => ({
    value: r.querySelector('.alias-input').value.trim(),
    type: r.querySelector('.alias-type-radio:checked')?.value || 'alias'
  })).filter(a => a.value);
  const aliases = aliasEntries.filter(a => a.type === 'alias').map(a => a.value);
  const aliasUsernames = aliasEntries.filter(a => a.type === 'username').map(a => a.value);
  const locations = [...document.querySelectorAll('.location-row')].map(r => ({
    city: r.querySelector('.city-input').value.trim(), state: r.querySelector('.state-input').value.trim()
  })).filter(l => l.city || l.state);
  const phones = vals('.phone-input'), emails = vals('.email-input');
  const employers = vals('.employment-input'), schools = vals('.school-input');
  const dobList = [...document.querySelectorAll('.dob-row')].map(r => parseDateTextToObj(r.querySelector('.dob-date').value)).filter(Boolean);
  const dateOfLossList = [...document.querySelectorAll('.dol-row')].map(r => parseDateTextToObj(r.querySelector('.dol-date').value)).filter(Boolean);

  const boxes = [...document.querySelectorAll('.name-variant-checkbox')];
  const nameVariantsList = boxes.length ? boxes.filter(cb => cb.checked).map(cb => cb.value) : nameVariants(fullName, isMergeLast());

  return {
    queryInput: { nameVariantsList, aliases, aliasUsernames, locations, phones, emails, employers, schools, dobList, dateOfLossList },
    formData: { fullName, mergeLast: isMergeLast(), locations, phones, emails, employers, schools, dobList, dateOfLossList, aliasEntries }
  };
}

function initForm() {
  Object.assign(rows, {
    location: $('locationRows'), phone: $('phoneRows'), alias: $('aliasRows'), email: $('emailRows'),
    employment: $('employmentRows'), school: $('schoolRows'), dol: $('dolRows'), dob: $('dobRows')
  });
  const adders = [['addLocation', 'location', makeLocationRow], ['addPhone', 'phone', phoneRow], ['addAlias', 'alias', makeAliasRow],
    ['addEmail', 'email', emailRow], ['addEmployment', 'employment', employerRow], ['addSchool', 'school', schoolRow],
    ['addDol', 'dol', makeDolRow], ['addDob', 'dob', makeDobRow]];
  adders.forEach(([btn, key, fn]) => $(btn).addEventListener('click', () => rows[key].appendChild(fn())));
  addDefaultRows();

  const form = document.querySelector('.xs__form');
  form.addEventListener('paste', e => {
    const fn = casingFor(e.target);
    if (!fn) return;
    const text = (e.clipboardData || window.clipboardData).getData('text');
    if (!text) return;
    e.preventDefault();
    const el = e.target;
    el.setRangeText(fn(text.replace(/\s*[\r\n]+\s*/g, ' ')), el.selectionStart, el.selectionEnd, 'end');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  // Switching an alias row between Alias and Username re-cases what is already in it
  form.addEventListener('change', e => {
    if (!e.target.classList.contains('alias-type-radio')) return;
    const input = e.target.closest('.alias-row').querySelector('.alias-input');
    if (input.value.trim()) input.value = e.target.value === 'username' ? toLowerClean(input.value) : toProperCase(input.value);
  });

  $('fullName').addEventListener('input', renderNameVariantPreview);
  $('mergeLastName').addEventListener('change', renderNameVariantPreview);

  $('saveStateBtn').addEventListener('click', saveAsStaticHtml);
  $('loadStateBtn').addEventListener('click', () => $('loadStateInput').click());
  $('loadStateInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) loadStateFromFile(file);
    e.target.value = '';
  });
}

  window.XSM['xs-form'] = { lockForm, resetForm, readSubject, initForm };
})();
