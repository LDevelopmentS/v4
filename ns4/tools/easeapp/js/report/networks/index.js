// All the network paragraphs, one per account (Google: one per kind of result). They are put in the order set by
// js/config/hierarchy.js (tier, then network, then matched before possible), and inside that in the order of js/config/networks.js.
// Wording lives in one file per network; the exceptions (possible, no account) have their own files.
import { networks } from '../../config/networks.js';
import { getOtherType } from '../../config/other-types.js';
import { buildContext } from './context.js';
import { possible } from './possible.js';
import { noAccount } from './no-account.js';
import { business, personalPage } from './page.js';
import { facebook } from './facebook.js';
import { simple } from './simple.js';
import { twitter } from './twitter.js';
import { youtube } from './youtube.js';
import { linkedin } from './linkedin.js';
import { generic } from './generic.js';
import { other } from './other.js';
import { googleParagraphs } from './google/index.js';
import { tierFor, orderEntries } from '../order.js';
import { nullOff } from '../../config/null-mode.js';

// Which wording each network uses. Networks not listed here use generic.
const WORDING = { fb: facebook, ig: simple, tk: simple, thr: simple, pin: simple, tw: twitter, yt: youtube, li: linkedin, other };

// Pages (not accounts), by account type. Add fan-page etc. here when they exist; the account type is also its tier.
const PAGE_WRITERS = { 'personal-page': personalPage, 'business-page': business };

// Which site an Others account is on, so repeats of one site sit together: the name typed in (General, E-commerce)
// or the kind's fixed name (Classmates, ...). Case and extra spaces are ignored ("Yelp" = "yelp "). A General account
// with no name typed yet has no site to match, so it stays on its own.
function otherSiteKey(data) {
  const type = getOtherType(data.subType);
  const site = type?.named ? (data.networkName ?? '').trim().toLowerCase() : (type?.name ?? '').toLowerCase();
  return site || `unnamed:${data.id}`;
}

// Each paragraph with the ids of the accounts it was written from: { html, owner: [id, ...], tier, slot }.
// (The owner lets the page find the bullet that belongs to an account; see features/clone-highlight.js.)
export function networkEntries({ networks: state = {}, subjectGender, isNull }) {
  const isMale = subjectGender === 'male';
  const entries = [];

  for (const [netIdx, net] of networks.entries()) {
    const st = state[net.id];
    if (!st?.checked) continue;
    if (nullOff(isNull, net.id)) continue; // Null report: only Google and Others are written

    if (net.id === 'goog') {                // search results, not accounts: their own wording
      entries.push(...googleParagraphs(st.instances, { isMale }).map((e) => ({ ...e, group: netIdx * 100 })));
      continue;
    }

    // Others: each site is placed where it was first entered (Yelp, Classmates, Soundcloud, Yelp 2 -> Yelp, Yelp 2,
    // Classmates, Soundcloud). Matched accounts of a site come before its possible ones (see report/order.js).
    const siteOrder = [];
    if (net.id === 'other') {
      for (const data of st.instances) {
        const key = otherSiteKey(data);
        if (!siteOrder.includes(key)) siteOrder.push(key);
      }
    }

    const counters = {};                    // repeats of the same kind of account: 2nd, 3rd, ...
    for (const data of st.instances) {
      const ctx = buildContext(net, data, counters, isMale);
      const writer = PAGE_WRITERS[data.accountType];
      const html = writer ? writer(ctx) : (possible(ctx) ?? noAccount(ctx) ?? (WORDING[net.id] ?? generic)(ctx));
      entries.push({
        html,
        owner: [data.id],
        tier: tierFor(net.id, data.accountType),
        // Sort group: the network's position in the sidebar; on Others, each site is its own group, in the order
        // the sites were first entered, so its possible accounts follow its matched ones.
        group: netIdx * 100 + (net.id === 'other' ? Math.min(siteOrder.indexOf(otherSiteKey(data)), 99) : 0),
        slot: ctx.isPossible ? 'possible' : 'matched',
      });
    }
  }
  return orderEntries(entries);
}

// Just the text of each paragraph
export const networkParagraphs = (state) => networkEntries(state).map((e) => e.html);
