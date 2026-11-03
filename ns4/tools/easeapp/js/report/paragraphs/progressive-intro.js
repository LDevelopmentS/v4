// Progressive report, bullet 1: the intro, then what was found.
//   Null report: "No social media accounts were found for the party at this time."
//   Otherwise a sentence that names where accounts were found, then the text typed in the Findings section (bold), or a bold placeholder if "Findings" is chosen with no text:
//     "Social media accounts for the party were found on Facebook and X (Twitter); he was also found to have a public photo
//      on Poshmark and a business page on Yelp, as well as Google search results. <bold findings text>"
import { buildTally } from '../tally.js';
import { escapeHtml, joinList } from '../helpers/text.js';
import { publicPhrase } from '../helpers/public-media.js';

export const name = 'progressive-intro';

const INTRO =
  `Searches of multiple social media sites including but not limited to Facebook, Instagram, X (Twitter), YouTube, LinkedIn, TikTok, Pinterest, Strava, Foursquare, and Tumblr, in addition to an in-depth Google search was performed with a specific analysis focused on the aforementioned categories. All provided information, as well as discovered information, was utilized in the search.`;

const NULL_SENTENCE = ` No social media accounts were found for the party at this time.`;

const unique = (list) => [...new Set(list)];

// "a business page on Yelp" / "business pages on Yelp and Etsy": one network = "a ...", more than one = plural
function onNetworks(nets, one, many) {
  const names = unique(nets);
  if (names.length === 0) return null;
  return `${names.length === 1 ? one : many} on ${joinList(names.map(escapeHtml))}`;
}

// The sentence about where accounts were found.
// "Found to have" lists what else turned up. Search engine items go last, after "as well as":
//   "...; he was also found to have public posts and photos on Facebook, business pages on Facebook and TikTok,
//    as well as a business website and Google search results."
function accountsSentence(p, he) {
  const personal = unique(p.personalNets);

  // Things found besides accounts. First those on networks, then the search engine ones.
  const onNetworksList = [
    publicPhrase(p.mentions),
    onNetworks(p.personalPageNets, 'a personal page', 'personal pages'),
    onNetworks(p.businessNets, 'a business page', 'business pages'),
    p.mugshots > 0 ? (p.mugshots === 1 ? 'a Mugshot' : 'multiple Mugshots') : null,
  ].filter(Boolean);
  const searchList = [
    p.websiteNets.length > 0 ? (p.websiteNets.length === 1 ? 'a business website' : 'business websites') : null,
    p.google ? 'Google search results' : null,
  ].filter(Boolean);

  let found = '';
  if (onNetworksList.length && searchList.length) found = `${onNetworksList.join(', ')}, as well as ${joinList(searchList)}`;
  else found = joinList(onNetworksList.length ? onNetworksList : searchList);

  if (personal.length) {
    const accounts = `Social media accounts for the party were found on ${joinList(personal.map(escapeHtml))}`;
    return found ? `${accounts}; ${he} was also found to have ${found}.` : `${accounts}.`;
  }
  const none = 'No social media accounts were found for the party at this time';
  return found ? `${none}; however, ${he} was found to have ${found}.` : `${none}.`;
}

export const progressiveIntro = (state) => {
  const { tally, progressive, progText } = buildTally(state);
  if (state.isNull) return INTRO + NULL_SENTENCE + (progText ? ` <strong>${escapeHtml(progText)}</strong>` : '');

  const he = state.subjectGender === 'male' ? 'he' : 'she';
  let text = `${INTRO} ${accountsSentence(progressive, he)}`;

  // The Findings section: its text in bold, or a placeholder when "Findings" is chosen but nothing is typed
  if (progText) text += ` <strong>${escapeHtml(progText)}</strong>`;
  else if (tally.hasNetworkRH) text += ' <strong>(state RH in bold, if any)</strong>';
  return text;
};
