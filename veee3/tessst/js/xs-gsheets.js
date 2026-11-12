// Classic script (no ES modules). "Copy to Google Sheets": makes a copy of the ORIGINAL Google Sheets template in the signed-in
// person's own Google Drive, titled "<Name> - Searchstrings", fills the 'Search String' inputs with what was entered in the app and opens it.
// Because it is a real copy of the original, every formula keeps working: editing 'Search String' updates URLSource and AutoURL live.
// Uses Google Identity Services (token flow) + Drive API + Sheets API.
// One-time DEVELOPER setup (users never see it): GOOGLE_CLIENT_ID below, and the Drive API + Google Sheets API enabled for that project.
window.XSM = window.XSM || {};
(function () {
const GOOGLE_CLIENT_ID = '645258334003-f7n7c9m0a9lbf9qmlabsnbhnt986ageo.apps.googleusercontent.com';
// The original template (docs.google.com/spreadsheets/d/<this id>/edit)
const TEMPLATE_ID = '1IPYF8Vqd2MsBHJ3O1UjbDlUMZLpGYURDANIibIq0I30';
const SCOPE = 'https://www.googleapis.com/auth/drive'; // needed to copy a file the app did not create
const GIS_SRC = 'https://accounts.google.com/gsi/client';

let token = null, tokenExpires = 0, gisPromise = null;

// Developer-only setup: the Client ID lives in GOOGLE_CLIENT_ID above. Users are never asked for it.
const clientId = () => GOOGLE_CLIENT_ID.trim();

function loadGis() {
  if (window.google && window.google.accounts && window.google.accounts.oauth2) return Promise.resolve();
  if (!gisPromise) gisPromise = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = GIS_SRC; s.async = true;
    s.onload = () => res();
    s.onerror = () => { gisPromise = null; rej(new Error('Could not load Google sign-in (blocked or offline).')); };
    document.head.appendChild(s);
  });
  return gisPromise;
}

function getToken(id) {
  if (token && Date.now() < tokenExpires - 30000) return Promise.resolve(token);
  return loadGis().then(() => new Promise((res, rej) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: id, scope: SCOPE,
      callback: r => {
        if (r.error) return rej(new Error(r.error_description || r.error));
        token = r.access_token; tokenExpires = Date.now() + (r.expires_in || 3600) * 1000; res(token);
      },
      error_callback: e => rej(new Error(e && e.type === 'popup_closed' ? 'Google sign-in was closed.' : 'Google sign-in failed.'))
    });
    client.requestAccessToken({ prompt: token ? '' : 'select_account' });
  }));
}

async function gfetch(url, accessToken, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  if (r.status === 401) token = null;
  if (!r.ok) {
    let m = ''; try { m = (await r.json()).error.message; } catch { /* ignore */ }
    throw new Error(m || `Google request failed (${r.status}).`);
  }
  return r.json();
}

// The template's three "copy all" text boxes (Search String E4 / I4 / M4) are fed by Sort!C2 / F2 / I2. The original formulas skip some
// rows and repeat others (A10 and A12 missing, A13 three times), so replace them with a join of every string.
const SORT_FIXES = [['Sort!C2', 'A'], ['Sort!F2', 'D'], ['Sort!I2', 'G']];

async function makeSheetFromTemplate(title, cells, accessToken) {
  const copy = await gfetch(`https://www.googleapis.com/drive/v3/files/${TEMPLATE_ID}/copy?fields=id`, accessToken, { method: 'POST', body: JSON.stringify({ name: title }) });
  const id = copy.id;
  const values = [];
  for (let r = 3; r <= 97; r++) values.push([cells['C' + r] || '']);
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values`;
  await gfetch(`${base}/${encodeURIComponent("'Search String'!C3:C97")}?valueInputOption=RAW`, accessToken, { method: 'PUT', body: JSON.stringify({ range: "'Search String'!C3:C97", majorDimension: 'ROWS', values }) });
  try {
    await gfetch(`${base}:batchUpdate`, accessToken, { method: 'POST', body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data: SORT_FIXES.map(([range, col]) => ({ range, values: [[`=TEXTJOIN(CHAR(10),TRUE,${col}2:${col}1053)`]] })) }) });
  } catch { /* the sheet is already usable without this refinement */ }
  return id;
}

// Shows a persistent "Open in Google Sheets" link (popup blockers can stop an automatic open after sign-in)
function showLink(anchorEl, url, title) {
  let a = document.getElementById('gsOpenLink');
  if (!a) { a = document.createElement('a'); a.id = 'gsOpenLink'; a.target = '_blank'; a.rel = 'noopener'; a.className = 'expand-toggle'; anchorEl.insertAdjacentElement('afterend', a); }
  a.href = url; a.textContent = `Open "${title}" in Google Sheets`;
}

async function copyToGoogleSheets(formData, btn) {
  const { showToast } = window.XSM['xs-core'];
  const ex = window.XSM['xs-template-export'];
  const id = clientId();
  if (!id) { showToast('Copy to Google Sheets is not set up yet. Please contact the tool admin.'); return { ok: false }; }
  const title = ex.exportFileName(formData.fullName).replace(/\.xlsx$/i, '');
  const label = btn ? btn.textContent : '';
  try {
    if (btn) { btn.disabled = true; btn.textContent = 'Sending to Google…'; }
    const { cells, over } = ex.mapFormToCells(formData);
    const accessToken = await getToken(id);
    const sheetId = await makeSheetFromTemplate(title, cells, accessToken);
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
    if (btn) showLink(btn, url, title);
    window.open(url, '_blank', 'noopener');
    showToast(over.length ? `Created "${title}" in your Google Drive from the original template. Not all fit the template: ${over.join('; ')}` : `Created "${title}" in your Google Drive from the original template`);
    return { ok: true, url };
  } catch (e) {
    showToast(e.message || 'Could not create the Google Sheet');
    return { ok: false, error: e };
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = label; }
  }
}

window.XSM['xs-gsheets'] = { copyToGoogleSheets };
})();
