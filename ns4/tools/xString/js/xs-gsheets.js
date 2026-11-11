// Classic script (no ES modules). "Copy to Google Sheets": builds the same "<Name> - Searchstrings.xlsx" as Export to Excel and uploads
// it to the signed-in person's own Google Drive, converted to a Google Sheet, then opens it. No pasting.
// Uses Google Identity Services (token flow) + Drive API with the narrow scope drive.file (the app can only touch files it creates).
// One-time DEVELOPER setup: paste the OAuth "Web application" Client ID into GOOGLE_CLIENT_ID below, once, before publishing the tool.
// Users never see or enter it - they just click the button and sign in to Google.
window.XSM = window.XSM || {};
(function () {
const GOOGLE_CLIENT_ID = '645258334003-0808o5ip74cb2230i4p2i6rls0k4duqv.apps.googleusercontent.com';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const GIS_SRC = 'https://accounts.google.com/gsi/client';
const SHEET_MIME = 'application/vnd.google-apps.spreadsheet';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

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

async function uploadAsSheet(blob, title, accessToken) {
  const boundary = 'xs' + Math.random().toString(16).slice(2);
  const meta = JSON.stringify({ name: title, mimeType: SHEET_MIME });
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n`,
    `--${boundary}\r\nContent-Type: ${XLSX_MIME}\r\n\r\n`, blob, `\r\n--${boundary}--`
  ]);
  const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST', headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': `multipart/related; boundary=${boundary}` }, body
  });
  if (r.status === 401) token = null;
  if (!r.ok) { let m = ''; try { m = (await r.json()).error.message; } catch { /* ignore */ } throw new Error(m || `Google Drive upload failed (${r.status}).`); }
  return r.json();
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
    const { blob, over } = ex.buildSearchstringsBlob(formData, window.XSM['xs-results-last'] || null);
    const accessToken = await getToken(id);
    const file = await uploadAsSheet(blob, title, accessToken);
    const url = `https://docs.google.com/spreadsheets/d/${file.id}/edit`;
    if (btn) showLink(btn, url, title);
    window.open(url, '_blank', 'noopener');
    showToast(over.length ? `Created "${title}" in your Google Drive. Not all fit the template: ${over.join('; ')}` : `Created "${title}" in your Google Drive`);
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
