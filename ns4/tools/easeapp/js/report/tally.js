// One pass over everything that was entered, counting what the closing bullet (Plus) and the
// summing-up bullets (Progressive) need. Pure: state in, numbers and lists out.
import { networks as config } from '../config/networks.js';
import { pseText } from './networks/google/pse-names.js';
import { nullOff } from '../config/null-mode.js';

const isPublic = (data) => data.accountType === 'no-page'; // shown as "Public" in the form

// 'public photo/s' -> 'photo' (anything unknown counts as a post)
const mediaKind = (text) => (/photo/i.test(text ?? '') ? 'photo' : /video/i.test(text ?? '') ? 'video' : 'post');

export function buildTally({ reportType, isNull, progFinding, progFindingText, relatives, networks: state = {} }) {
  const tally = {
    personalCount: 0,         // personal accounts (matched)
    personalPageCount: 0,     // personal pages (including ones found through search engines)
    businessCount: 0,         // business pages (including business pages found through search engines)
    googleBusinessCount: 0,   // business websites found through search engines
    possibleSocialCount: 0,   // possible accounts
    mugshotCount: 0,
    possibleMugshotCount: 0,
    hasMentions: false,       // anything found only through a public post, photo or video
    hasGoogle: false,
    hasPossibleGoogle: false,
    googleCount: 0,           // search engine results (matched and possible; not business or public mentions): 1 for a "1 result" set, 2 for a "2+ results" set
    googleMatchedCount: 0,    // ...matched ones only (same counting)
    googlePossibleCount: 0,   // ...possible ones only (same counting)
    hasGlobalRH: false,       // relevant information found anywhere
    hasNetworkRH: false,      // ...on a network (not just through relatives)
  };

  // Lists the Progressive bullets will sentence together
  // (Names are the network, or the search engines for Google. Business pages and websites are kept apart.
  //  mentions: one { net, media } for each Public account, media being post, photo or video.)
  const progressive = { personalNets: [], personalPageNets: [], businessNets: [], websiteNets: [], mentions: [], mugshots: 0, google: false };
  const relProgTexts = []; // ...and on relatives

  // Relatives
  if (reportType === 'plus') {
    if (relatives.found === true && relatives.finding === 'relevant') tally.hasGlobalRH = true;
  } else if (reportType === 'progressive') {
    if (relatives.found === true && relatives.progFindings) {
      for (const pf of relatives.progFindings) {
        if (pf.type === 'relevant') tally.hasGlobalRH = true;
        if (pf.text && pf.text.trim() !== '') relProgTexts.push(pf.text.trim());
      }
    }
  }

  // Progressive: the Findings section (one choice and one text for the whole report). It feeds the FIRST bullet only.
  // Its text counts only when "Findings" is chosen; "No findings found" ignores whatever is typed.
  // (The relatives' findings texts are kept in relProgTexts for the last bullet; they count whatever their radio says.)
  const progText = reportType === 'progressive' && progFinding === 'relevant' ? (progFindingText ?? '').trim() : '';
  if (reportType === 'progressive' && progFinding === 'relevant') tally.hasNetworkRH = true;

  // Networks, in sidebar order
  for (const net of config) {
    const st = state[net.id];
    if (!st?.checked) continue;
    if (nullOff(isNull, net.id)) continue; // Null report: only Google and Others count

    for (const data of st.instances) {
      // Relevant information
      if (reportType === 'plus') {
        if (data.finding === 'relevant') { tally.hasGlobalRH = true; tally.hasNetworkRH = true; }
      }

      if (net.id === 'goog') {
        const engines = pseText(data.pseNames) || '(public search engine)';
        if (data.accountType === 'business-website') {  // business website
          progressive.websiteNets.push(engines);
          tally.googleBusinessCount++;
        } else if (data.accountType === 'personal-page') { // personal page
          progressive.personalPageNets.push(engines);
          tally.personalPageCount++;
        } else if (data.accountType === 'business-page') { // business page
          progressive.businessNets.push(engines);
          tally.businessCount++;
        } else if (isPublic(data)) {
          progressive.mentions.push({ net: engines, media: mediaKind(data.mentionMedia) });
          tally.hasMentions = true;
        } else {
          progressive.google = true;
          const units = data.resultType === 'multiple' ? 2 : 1; // "2+ results" only needs to count as plural
          tally.googleCount += units;
          if (data.matchStatus === 'possible') { tally.hasPossibleGoogle = true; tally.googlePossibleCount += units; }
          else { tally.hasGoogle = true; tally.googleMatchedCount += units; }
        }
        continue;
      }

      // The name Progressive uses for this account (Mugshots are counted, not named)
      let name = net.name;
      if (net.id === 'other') {
        if (data.subType === 'mugshot') {
          progressive.mugshots++;
          name = null;
        } else if (['general', 'ecommerce', 'myspace', 'zoominfo', 'classmates'].includes(data.subType)) {
          name = data.networkName ? data.networkName.trim() : 'Other';
        } else {
          name = null;
        }
      }
      if (name) {
        if (data.accountType === 'business-page') progressive.businessNets.push(name);
        else if (data.accountType === 'personal-page') progressive.personalPageNets.push(name);
        else if (isPublic(data)) progressive.mentions.push({ net: name, media: mediaKind(data.mentionMedia) });
        else progressive.personalNets.push(name);
      }

      // The counts for the closing bullet. An account is counted once, in the first group that fits.
      if (isPublic(data)) tally.hasMentions = true;
      else if (net.id === 'other' && data.subType === 'mugshot') {
        if (data.matchStatus === 'possible') tally.possibleMugshotCount++;
        else tally.mugshotCount++;
      } else if (data.matchStatus === 'possible') tally.possibleSocialCount++;
      else if (data.accountType === 'personal-page') tally.personalPageCount++;
      else if (data.accountType === 'business-page') tally.businessCount++;
      else tally.personalCount++;
    }
  }

  return { tally, progressive, progText, relProgTexts };
}
