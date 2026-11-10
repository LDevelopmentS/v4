// Every URL the tool can open. Pure functions: no DOM, no storage.
import { abbr, LINKEDIN_GEO } from './states.js';
import { USER_PLATFORMS } from './config.js';
const enc = encodeURIComponent;

// Trimmed copy of a row plus the encoded forms most sites need.
export function context(row) {
  const name = (row.name || '').trim(), city = (row.city || '').trim();
  const state = (row.state || '').trim(), extra = (row.extra || '').trim();
  return { name, city, state, extra, n: enc(name), q: enc([name, city, state, extra].filter(Boolean).join(', ')) };
}

const S = (key, short, full, group, url) => ({ key, short, full, group, url });

// Standard Mode columns, in display order. url(c) takes a context().
export const SOCIALS = [
  S('fb', 'FB', 'Facebook', 'main', c => `https://www.facebook.com/search/people/?q=${c.q}`),
  S('ig', 'IG', 'Instagram', 'main', c => `https://imginn.com/search/${c.q}`),
  S('tw', 'TW', 'Twitter', 'main', c => `https://www.x.com/search?q=${c.q}&f=user`),
  S('yt', 'YT', 'YouTube', 'main', c => `https://www.youtube.com/results?search_query=${c.n}&sp=EgIQAg%253D%253D`),
  S('lk', 'LK', 'LinkedIn', 'main', c => {
    const geo = LINKEDIN_GEO[abbr(c.state)];
    return `https://www.linkedin.com/search/results/people/?keywords=${c.n}&origin=FACETED_SEARCH` + (geo ? `&geoUrn=%5B%22${geo}%22%5D` : '');
  }),
  S('tk', 'TK', 'TikTok', 'main', c => `https://www.tiktok.com/search/user?q=${c.q}`),
  S('pin', 'PIN', 'Pinterest', 'main', c => `https://www.pinterest.com/search/users/?q=${c.q}`),
  S('str', 'STR', 'Strava', 'main', c => `https://www.strava.com/athletes/search?text=${c.q}`),
  S('tum', 'TUM', 'Tumblr', 'main', c => `https://www.tumblr.com/search/${c.q}`),

  S('pos', 'POS', 'Poshmark', 'sub', c => `https://www.poshmark.com/search?type=people&query=${c.q}`),
  S('cla', 'CLA', 'Classmates', 'sub', c => `https://www.classmates.com/siteui/search/results?q=${c.q}`),
  S('ets', 'ETS', 'Etsy', 'sub', c => `https://www.etsy.com/search_results_people.php?search_query=${c.q}`),
  S('sc', 'SC', 'SoundCloud', 'sub', c => `https://soundcloud.com/search/people?q=${c.q}`),
  S('qu', 'QU', 'Quora', 'sub', c => `https://www.quora.com/search?type=profile&q=${c.q}`),
  S('mug', 'MUG', 'Mugshots', 'sub', c => `https://www.mugshots.com/search.html?q=${c.q}`),
  S('vsc', 'VSC', 'VSCO', 'sub', c => `https://vsco.co/search/people/${c.q}`),
  S('my', 'MY', 'MySpace', 'sub', c => `https://www.myspace.com/search/people?q=${c.q}`),
  S('vim', 'VIM', 'Vimeo', 'sub', c => `https://www.vimeo.com/search?q=${c.q}&type=people`),
  S('gfm', 'GFM', 'GoFundMe', 'sub', c => `https://www.gofundme.com/s?q=${c.q}`),
  S('ven', 'VEN', 'Venmo', 'sub', c => `https://account.venmo.com/u/${enc(c.name.replace(/\s+/g, '-'))}`),
  S('spo', 'SPO', 'Spotify', 'sub', c => `https://open.spotify.com/search/${c.n}/users`),
  S('bsk', 'BSK', 'BlueSky', 'sub', c => `https://bsky.app/search?q=${c.q}`),
  S('zom', 'ZOM', 'Zoominfo', 'sub', c => `https://www.zoominfo.com/people/${c.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean).join('/')}`)
];

// Username Mode: '' when there is no username yet.
export function userUrl(platform, row) {
  const u = (row.name || '').trim().replace('@', '');
  return u ? platform.url + enc(u) : '';
}

// PSE Mode. Address is "City, ST" built from the row. '' when both name and address are empty.
export function pseUrl(kind, row) {
  const name = (row.name || '').trim();
  const addr = [row.city, row.state].map(s => (s || '').trim()).filter(Boolean).join(', ');
  if (!name && !addr) return '';
  const nameSlug = name.toLowerCase().replace(/\s+/g, '-');
  const parts = name.toLowerCase().split(/\s+/).filter(Boolean);
  const first = parts[0] || '', last = parts.length > 1 ? parts[parts.length - 1] : '';

  let citySlug, state = '', fullAddrSlug;
  const ap = addr.split(',');
  if (ap.length >= 2) {
    citySlug = ap[ap.length - 2].trim().toLowerCase().replace(/ /g, '-');
    state = abbr(ap[ap.length - 1]);
    fullAddrSlug = `${citySlug}-${state}`;
  } else {
    citySlug = addr.toLowerCase().replace(/ /g, '-');
    fullAddrSlug = citySlug;
  }
  switch (kind) {
    case 'true': return `https://www.truepeoplesearch.com/results?name=${enc(name)}&citystate=${enc(addr)}`;
    case 'free': return `https://www.searchpeoplefree.com/find/${first}-${last}/${state}/${citySlug}`;
    case 'fast': return `https://www.fastpeoplesearch.com/name/${first}-${last}_${fullAddrSlug}`;
    case 'check': return `https://www.fastbackgroundcheck.com/people/${nameSlug}/${fullAddrSlug}`;
  }
  return '';
}

// Sidebar actions (all use the selected row). Each returns '' when it cannot build a URL.
export function engineUrl(kind, row) {
  const c = context(row);
  if (!c.name) return '';
  if (kind === 'google') return `https://www.google.com/search?q=${c.q}`;
  if (kind === 'bing') return `https://www.bing.com/search?q=${c.q}`;
  if (kind === 'ddg') return `https://duckduckgo.com/?q=${c.q}`;
  return '';
}

export function legalUrl(row) {
  const c = context(row);
  if (!c.name) return '';
  return `https://trellis.law/cases/${enc(c.name.replace(/\s+/g, '-'))}?state=${abbr(c.state)}&county=&matter_type=`;
}

export function crimUrl(kind, row) {
  const c = context(row);
  if (!c.name) return '';
  const [first, ...rest] = c.name.split(/\s+/);
  const last = rest.join(' ');
  const st = abbr(c.state);
  switch (kind) {
    case 'recentlybooked': return `https://recentlybooked.com/search?Name=${c.n}&FromDate=2024-01-01&ToDate=2026-12-31`;
    case 'mugshotszone': return `https://mugshots.zone/?s=${enc(first)}+${enc(last)}`;
    case 'arrests': return `https://${/^[a-z]{2}$/.test(st) ? st : 'www'}.arrests.org/search.php?fname=${enc(first)}&lname=${enc(last)}&fpartial=True`;
    case 'localcrimenews': return `https://www.localcrimenews.com/welcome/searchArrests?firstname=${enc(first)}&lastname=${enc(last)}&city=${enc(c.city)}`;
    case 'rainstreet': return `https://rain-street.org/ng/search?fname=${enc(first)}&lname=${enc(last)}&state=${enc(c.state)}&city=${enc(c.city)}`;
  }
  return '';
}

// Wallet search: the Name field is treated as the username.
export function finUrl(kind, row) {
  const handle = enc((row.name || '').trim().replace(/\s+/g, ''));
  if (!handle) return '';
  return kind === 'cash' ? `https://cash.app/$${handle}` : `https://paypal.com/paypalme/${handle}`;
}

export { USER_PLATFORMS };
