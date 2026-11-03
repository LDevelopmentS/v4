// Progressive report, bullet 3: the summation (bold).
//   "In summation, 5 personal social media accounts, 3 business pages, a business website, public posts and photos on Facebook,
//    and Google search results were identified for the party.
//   With possible search results: "..., public search engine results, and possible public search engine results were identified for the party."
//    After a thorough investigation, no apparent relevant information regarding the party’s accident on [Date] was found
//    at this time, nor were any social media posts pertaining to his injuries, treatment, or activities."
// A Null report says the party did not appear to have any personal social media;
//   with search results only: "..., however, he/she was found to have Google search results."
import { buildTally } from '../tally.js';
import { escapeHtml, joinList, stitch } from '../helpers/text.js';
import { publicPhrase } from '../helpers/public-media.js';

export const name = 'progressive-summation';

const plural = (n, one, many) => (n === 1 ? one : many);

export const progressiveSummation = (state) => {
  const poss = state.subjectGender === 'male' ? 'his' : 'her';
  const noRH = `no apparent relevant information regarding the party’s accident on [Date] was found at this time, nor were any social media posts pertaining to ${poss} injuries, treatment, or activities.`;

  const { tally: t, progressive: p, relProgTexts } = buildTally(state);
  // How the closing sentence ends: the text typed in the Relatives findings boxes (whatever their radio says),
  // else a placeholder if one of them is marked "Findings", else "no relevant info".
  // The main Findings section does not feed this bullet.
  const ending = relProgTexts.length ? stitch(relProgTexts.map(escapeHtml))
    : t.hasGlobalRH ? '(state what was found/not found).' : noRH;
  const social = t.personalCount + t.possibleSocialCount;

  // Strict order: accounts, personal pages, business pages, Mugshots, business websites, public posts/photos/videos, Google.
  // Each item also says how many things it stands for, which decides "was" or "were".
  const items = [
    social > 0 && [`${social} personal social media ${plural(social, 'account', 'accounts')}`, social],
    t.personalPageCount > 0 && [`${t.personalPageCount} personal ${plural(t.personalPageCount, 'page', 'pages')}`, t.personalPageCount],
    t.businessCount > 0 && [`${t.businessCount} business ${plural(t.businessCount, 'page', 'pages')}`, t.businessCount],
    p.mugshots > 0 && [plural(p.mugshots, 'a Mugshot', 'multiple Mugshots'), p.mugshots === 1 ? 1 : 2],
    t.googleBusinessCount > 0 && [plural(t.googleBusinessCount, 'a business website', `${t.googleBusinessCount} business websites`), t.googleBusinessCount],
    p.mentions.length > 0 && [publicPhrase(p.mentions), p.mentions.length === 1 ? 1 : 2],
    // Search engine results: matched, possible, or both (listed as two items)
    // (one result is singular, 2+ plural)
    t.hasGoogle && [t.hasPossibleGoogle
      ? plural(t.googleMatchedCount, 'a public search engine result', 'public search engine results')
      : plural(t.googleMatchedCount, 'a Google search result', 'Google search results'), t.googleMatchedCount],
    t.hasPossibleGoogle && [plural(t.googlePossibleCount, 'a possible public search engine result', 'possible public search engine results'), t.googlePossibleCount],
  ].filter(Boolean);

  // Null report: no accounts. With nothing else found it says so; with search results (or other finds) it adds "however, ..."
  if (state.isNull) {
    if (items.length === 0) {
      return `<strong>In summation, the party did not appear to have any forms of personal social media. After a thorough investigation, ${ending}</strong>`;
    }
    const he = state.subjectGender === 'male' ? 'he' : 'she';
    const found = joinList(items.map(([text]) => text));
    return `<strong>In summation, the party did not appear to have any forms of personal social media; however, ${he} was found to have ${found}. After a thorough investigation, ${ending}</strong>`;
  }

  const units = items.reduce((sum, [, n]) => sum + n, 0);
  const list = joinList(items.map(([text]) => text)) || 'no accounts';
  const verb = units === 1 ? 'was' : 'were';
  return `<strong>In summation, ${list} ${verb} identified for the party. After a thorough investigation, ${ending}</strong>`;
};
