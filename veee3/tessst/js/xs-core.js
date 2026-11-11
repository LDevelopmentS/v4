// Classic script (no ES modules), so it also runs when index.html is opened directly.
window.XSM = window.XSM || {};
(function () {
// xString shared logic: platforms, casing, name variants, dates, query building, search URLs, toast/copy.
// No DOM building here except the toast; no localStorage.

const CATEGORY_ORDER = [
  'Name & Aliases', 'Name + Location', 'Employer & School', 'Birthday', 'Date of Loss', 'Phone', 'Email & Username'
];

// group: full = every query, groupB = ids + contact only, groupC = ids + location/work/birthday + contact
// slug: optional icon at assets/icons/<slug>.svg (falls back to letters if the file is missing)
const PLATFORM_LIST = [
  { label: 'Facebook',    key: 'Facebook',    group: 'full',   slug: 'facebook', color: '1877F2' },
  { label: 'Instagram',   key: 'Instagram',   group: 'groupB', slug: 'instagram', color: 'E4405F' },
  { label: 'Twitter / X', key: 'X / Twitter', group: 'full',   slug: 'x', color: 'FFFFFF' },
  { label: 'YouTube',     key: 'YouTube',     group: 'full',   slug: 'youtube', color: 'FF0000' },
  { label: 'LinkedIn',    key: 'LinkedIn',    group: 'groupC', slug: 'linkedin', color: '4A9BE8' },
  { label: 'TikTok',      key: 'TikTok',      group: 'groupB', slug: 'tiktok', color: 'FFFFFF' },
  { label: 'Pinterest',   key: 'Pinterest',   group: 'groupB', slug: 'pinterest', color: 'E60023' },
  { label: 'Strava',      key: 'Strava',      group: 'groupB', slug: 'strava', color: 'FC4C02' },
  { label: 'Foursquare',  key: 'Foursquare',  group: 'groupB', slug: 'foursquare', color: '6B7BFF' },
  { label: 'Tumblr',      key: 'Tumblr',      group: 'groupB', slug: 'tumblr', color: '6C88AA' },
  { label: 'Google',      key: 'Google',      group: 'full',   slug: 'google', color: '4285F4' },
  { label: 'RocketReach', key: 'RocketReach', group: 'groupC', slug: 'rocketreach', color: '4C8DFF' },
  { label: 'SignalHire',  key: 'SignalHire',  group: 'groupC', slug: 'signalhire', color: '2BB673' }
];

/* ---------- auto-casing ---------- */
function toProperCase(str) {
  let out = String(str).toLocaleLowerCase();
  out = out.replace(/(^|[\s\-\/.(\u2013])(\p{L})/gu, (m, sep, ch) => sep + ch.toLocaleUpperCase());
  out = out.replace(/\b([ODL])'(\p{L})/gu, (m, a, b) => `${a}'${b.toLocaleUpperCase()}`);
  out = out.replace(/\bMc(\p{L})/gu, (m, a) => `Mc${a.toLocaleUpperCase()}`);
  out = out.replace(/\b(Ii|Iii|Iv)\b/g, m => m.toUpperCase());
  return out;
}
function toStateCase(str) {
  const t = String(str).trim();
  return /^\p{L}{2}$/u.test(t) ? t.toLocaleUpperCase() : toProperCase(str);
}
function toLowerClean(str) { return String(str).trim().toLocaleLowerCase(); }

/* ---------- names ---------- */
function isMergeLast() {
  const el = document.getElementById('mergeLastName');
  return !!(el && el.checked);
}

// "Middle and Last as Last name": the last two words count as one last name.
function getNameParts(fullName, merge = isMergeLast()) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (merge && parts.length >= 3) {
    const last = parts.splice(-2).join(' ');
    parts.push(last);
  }
  return parts;
}

function getNamePartsLabeled(fullName, merge = isMergeLast()) {
  const parts = getNameParts(fullName, merge);
  const n = parts.length;
  const idx = i => parts[i - 1];
  const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth'];
  if (n === 0) return [];
  if (n === 1) return [['First Name', idx(1)]];
  if (n === 2) return [['First Name', idx(1)], ['Last Name', idx(2)]];
  const out = [];
  for (let i = 1; i <= n - 2; i++) out.push([`${ordinals[i - 1] || `Name Part ${i}`} Name`, idx(i)]);
  out.push(['Middle Name', idx(n - 1)]);
  out.push(['Last Name', idx(n)]);
  return out;
}

function combinationsOfSize(arr, size) {
  const result = [];
  const helper = (start, combo) => {
    if (combo.length === size) { result.push(combo.slice()); return; }
    for (let i = start; i < arr.length; i++) { combo.push(arr[i]); helper(i + 1, combo); combo.pop(); }
  };
  helper(0, []);
  return result;
}

function dedupe(arr) {
  const seen = new Set();
  return arr.filter(s => {
    const key = s.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function nameVariants(fullName, merge = isMergeLast()) {
  const trimmed = fullName.trim();
  const parts = getNameParts(trimmed, merge);
  const n = parts.length;
  const variants = [trimmed];
  const idx = i => parts[i - 1];

  if (n === 3) {
    const FN = idx(1), MN = idx(2), LN = idx(3);
    variants.push(`${FN} ${LN}`, `${MN} ${LN}`, `${FN} ${MN}`);
  } else if (n === 4) {
    const FN = idx(1), SN = idx(2), MN = idx(3), LN = idx(4);
    variants.push(
      `${FN} ${MN} ${LN}`, `${SN} ${MN} ${LN}`, `${FN} ${LN}`,
      `${FN} ${MN}`, `${SN} ${MN}`, `${FN} ${SN}`, `${SN} ${LN}`,
      `${FN} ${SN} ${LN}`, `${MN} ${LN}`, `${FN} ${SN} ${MN}`
    );
  } else if (n === 5) {
    const FN = idx(1), SN = idx(2), TN = idx(3), MN = idx(4), LN = idx(5);
    variants.push(
      `${FN} ${LN}`, `${FN} ${MN}`, `${FN} ${TN}`, `${FN} ${SN}`, `${FN} ${SN} ${TN}`,
      `${SN} ${TN}`, `${SN} ${MN}`, `${SN} ${LN}`, `${TN} ${MN}`, `${TN} ${LN}`,
      `${FN} ${SN} ${MN}`, `${FN} ${SN} ${LN}`, `${FN} ${TN} ${MN}`, `${FN} ${TN} ${LN}`,
      `${FN} ${MN} ${LN}`, `${SN} ${MN} ${LN}`, `${TN} ${MN} ${LN}`, `${SN} ${TN} ${MN}`,
      `${SN} ${TN} ${LN}`, `${SN} ${TN} ${MN} ${LN}`, `${FN} ${SN} ${MN} ${LN}`, `${FN} ${TN} ${MN} ${LN}`,
      `${FN} ${SN} ${TN} ${LN}`, `${MN} ${LN}`, `${FN} ${SN} ${TN} ${MN}`
    );
  } else if (n === 6) {
    for (let size = 2; size <= 5; size++) combinationsOfSize(parts, size).forEach(c => variants.push(c.join(' ')));
  }
  return dedupe(variants);
}

/* ---------- phone + dates ---------- */
function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1-${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+1-${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  return raw.trim();
}

function buildDatePartsObj(mmRaw, ddRaw, yyyyRaw) {
  const isPh = s => /^x+$/i.test(s);
  const mm = (mmRaw || '').trim(), dd = (ddRaw || '').trim(), yyyy = (yyyyRaw || '').trim();
  if (!mm && !dd && !yyyy) return null;
  if ([mm, dd, yyyy].every(p => !p || isPh(p))) return null;

  const mmPad = isPh(mm) ? 'XX' : (mm ? mm.padStart(2, '0') : '');
  const ddPad = isPh(dd) ? 'XX' : (dd ? dd.padStart(2, '0') : '');
  const yyyyOut = isPh(yyyy) ? 'XXXX' : yyyy;

  let full;
  if (mmPad && ddPad && yyyyOut) full = `${mmPad}/${ddPad}/${yyyyOut}`;
  else if (mmPad && ddPad) full = `${mmPad}/${ddPad}`;
  else if (mmPad && yyyyOut) full = `${mmPad}/${yyyyOut}`;
  else if (ddPad && yyyyOut) full = `${ddPad}/${yyyyOut}`;
  else if (yyyyOut) full = yyyyOut;
  else if (mmPad) full = mmPad;
  else full = ddPad;

  const short = (mmPad && ddPad && !(isPh(mmPad) && isPh(ddPad))) ? `${mmPad}/${ddPad}` : null;
  return { mm: mmPad, dd: ddPad, yyyy: yyyyOut, full, short };
}

function extractDateComponents(raw) {
  const trimmed = (raw || '').trim();
  const isPlaceholder = s => /^x+$/i.test(s.trim());
  const keepMD = s => isPlaceholder(s) ? 'XX' : s;
  const keepY = s => isPlaceholder(s) ? 'XXXX' : s;
  if (!trimmed) return { mm: '', dd: '', yyyy: '' };

  const segs = trimmed.split('/').map(s => s.trim());
  let mm = '', dd = '', yyyy = '';
  if (segs.length >= 3) {
    mm = keepMD(segs[0]); dd = keepMD(segs[1]); yyyy = keepY(segs[2]);
  } else if (segs.length === 2) {
    const [a, b] = segs;
    const bLooksLikeYear = /^\d{4}$/.test(b) || (isPlaceholder(b) && b.length === 4);
    mm = keepMD(a);
    if (bLooksLikeYear) yyyy = keepY(b); else dd = keepMD(b);
  } else {
    const [a] = segs;
    if (!isPlaceholder(a) && a) { if (/^\d{4}$/.test(a)) yyyy = a; else mm = a; }
  }
  return { mm, dd, yyyy };
}

function parseDateTextToObj(raw) {
  const { mm, dd, yyyy } = extractDateComponents(raw);
  return buildDatePartsObj(mm, dd, yyyy);
}

// Converts an older {mm,dd,yyyy} save shape into "MM/DD/YYYY" text so older saves still load.
function composeDateText(d) {
  if (!d) return '';
  if (typeof d.raw === 'string') return d.raw;
  const mm = d.mm || d.dobMonth || '', dd = d.dd || d.dobDay || '', yyyy = d.yyyy || d.dobYear || '';
  if (!mm && !dd && !yyyy) return '';
  return `${mm || 'XX'}/${dd || 'XX'}/${yyyy || 'XXXX'}`;
}

/* ---------- query generation ---------- */
function buildQueries({ nameVariantsList, aliases, aliasUsernames, locations, phones, emails, employers, schools, dobList, dateOfLossList }) {
  const cleanLocations = locations.filter(l => l.city || l.state);
  const identifiers = [...nameVariantsList, ...aliases.filter(Boolean)];
  const usernames = [
    ...emails.filter(Boolean).map(e => e.split('@')[0].trim()).filter(Boolean),
    ...aliasUsernames.filter(Boolean)
  ];

  const full = [];
  const display = {};
  CATEGORY_ORDER.forEach(c => display[c] = []);
  const pushBoth = (category, text) => { full.push(text); display[category].push(text); };

  identifiers.forEach(id => {
    pushBoth('Name & Aliases', id);
    cleanLocations.forEach(loc => {
      if (loc.city) pushBoth('Name + Location', `${id}, ${loc.city}`);
      if (loc.state) pushBoth('Name + Location', `${id}, ${loc.state}`);
      if (loc.city && loc.state) pushBoth('Name + Location', `${id}, ${loc.city}, ${loc.state}`);
    });
    employers.filter(Boolean).forEach(emp => pushBoth('Employer & School', `${id}, ${emp}`));
    schools.filter(Boolean).forEach(sch => pushBoth('Employer & School', `${id}, ${sch}`));

    if (dobList.length) pushBoth('Birthday', `${id}, Birthday`);
    dobList.forEach(dob => {
      if (dob.short) pushBoth('Birthday', `${id}, ${dob.short}`);
      pushBoth('Birthday', `${id}, ${dob.full}`);
    });

    dateOfLossList.forEach(dol => {
      const df = dol.full;
      pushBoth('Date of Loss', `${id}, ${df}`);
      cleanLocations.forEach(loc => {
        if (loc.city) pushBoth('Date of Loss', `${id}, ${loc.city}, ${df}`);
        if (loc.state) pushBoth('Date of Loss', `${id}, ${loc.state}, ${df}`);
        if (loc.city && loc.state) pushBoth('Date of Loss', `${id}, ${loc.city}, ${loc.state}, ${df}`);
      });
    });
  });

  phones.filter(Boolean).forEach(p => pushBoth('Phone', formatPhone(p)));
  emails.filter(Boolean).forEach(e => pushBoth('Email & Username', e));
  usernames.forEach(u => pushBoth('Email & Username', u));

  // groupB: Instagram, TikTok, Pinterest, Strava, Foursquare, Tumblr
  const groupB = [];
  identifiers.forEach(id => groupB.push(id));
  phones.filter(Boolean).forEach(p => groupB.push(formatPhone(p)));
  emails.filter(Boolean).forEach(e => groupB.push(e));
  usernames.forEach(u => groupB.push(u));

  // groupC: LinkedIn, RocketReach, SignalHire
  const groupC = [];
  identifiers.forEach(id => {
    groupC.push(id);
    cleanLocations.forEach(loc => {
      if (loc.city) groupC.push(`${id}, ${loc.city}`);
      if (loc.state) groupC.push(`${id}, ${loc.state}`);
      if (loc.city && loc.state) groupC.push(`${id}, ${loc.city}, ${loc.state}`);
    });
    employers.filter(Boolean).forEach(emp => groupC.push(`${id}, ${emp}`));
    schools.filter(Boolean).forEach(sch => groupC.push(`${id}, ${sch}`));
    if (dobList.length) groupC.push(`${id}, Birthday`);
    dobList.forEach(dob => {
      if (dob.short) groupC.push(`${id}, ${dob.short}`);
      groupC.push(`${id}, ${dob.full}`);
    });
  });
  phones.filter(Boolean).forEach(p => groupC.push(formatPhone(p)));
  emails.filter(Boolean).forEach(e => groupC.push(e));
  usernames.forEach(u => groupC.push(u));

  Object.keys(display).forEach(k => display[k] = dedupe(display[k]));
  return { full: dedupe(full), groupB: dedupe(groupB), groupC: dedupe(groupC), display };
}

/* ---------- platform URLs ---------- */
// Google region switch (rail option, radio name="googleRegion"): US -> .com, CA -> .ca
function googleTld() {
  const checked = document.querySelector('input[name="googleRegion"]:checked');
  return checked && checked.value === 'CA' ? 'ca' : 'com';
}

const PLATFORM_URL_BUILDERS = {
  'Facebook': q => `https://www.facebook.com/search/people/?q=${encodeURIComponent(q)}&_rdc=1&_rdr`,
  'Instagram': q => `https://imginn.com/search/?q=${encodeURIComponent(q)}`,
  'X / Twitter': q => `https://www.x.com/search?q=${encodeURIComponent(q)}&src=typed_query&f=user`,
  'YouTube': q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=EgIQAg%253D%253D`,
  'LinkedIn': q => `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(q)}&origin=GLOBAL_SEARCH_HEADER`,
  'TikTok': q => `https://www.tiktok.com/search/user?q=${encodeURIComponent(q)}&lang=en`,
  'Pinterest': q => `https://www.pinterest.com/search/users/?q=${encodeURIComponent(q)}&rs=filter`,
  'Strava': q => `https://www.strava.com/athletes/search?utf8=%E2%9C%93&text=${encodeURIComponent(q)}&gsf=1`,
  'Tumblr': q => `https://www.tumblr.com/search/${encodeURIComponent(q)}`,
  'Google': q => `https://www.google.${googleTld()}/search?q=${encodeURIComponent(q)}&aqs=chrome..69i57.331j0j4&sourceid=chrome&ie=UTF-8`,
  'RocketReach': q => `https://rocketreach.co/person?start=1&pageSize=10&keyword=${encodeURIComponent(q)}&_rdc=1&_rdr`,
  'SignalHire': q => `https://www.signalhire.com/profiles/search?q=${encodeURIComponent(q)}`,
  'Foursquare': q => `https://www.foursquare.com/search?tab=pagesResults&query=${encodeURIComponent(q)}`
};

function buildSearchUrl(query, platformName) {
  return (PLATFORM_URL_BUILDERS[platformName] || PLATFORM_URL_BUILDERS['Google'])(query);
}

/* ---------- toast + clipboard ---------- */
function showToast(message) {
  let toast = document.getElementById('copyToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'copyToast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

function copyText(text) {
  navigator.clipboard.writeText(text).catch(() => alert('Could not copy to clipboard.'));
}

  window.XSM['xs-core'] = { CATEGORY_ORDER, PLATFORM_LIST, toProperCase, toStateCase, toLowerClean, isMergeLast, getNameParts, getNamePartsLabeled, dedupe, nameVariants, formatPhone, parseDateTextToObj, composeDateText, buildQueries, googleTld, buildSearchUrl, showToast, copyText };
})();
