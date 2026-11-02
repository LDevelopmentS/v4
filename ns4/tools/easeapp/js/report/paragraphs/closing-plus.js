// Plus report: the closing bullet. It sums up what was found and whether anything relevant turned up.
//   "In summation, 2 personal social media profiles and a Mugshot were identified for the subject.
//    After a thorough investigation, no apparent relevant information regarding the case was found at this time."
// With possible search results: "..., public search engine results, and possible public search engine results were identified for the subject."
// A Null report with nothing found says so; a Null report with only search/other results says "did not appear to have any forms of personal social media".
import { buildTally } from '../tally.js';
import { joinList } from '../helpers/text.js';

export const name = 'closing-plus';

const plural = (n, one, many) => (n === 1 ? one : many);

// The things that were found, as phrases for the list ("2 personal social media profiles", "a Mugshot", ...)
function foundPhrases(t) {
  const parts = [];
  if (t.personalCount > 0) parts.push(`${t.personalCount} personal social media ${plural(t.personalCount, 'profile', 'profiles')}`);
  if (t.personalPageCount > 0) parts.push(`${t.personalPageCount} personal ${plural(t.personalPageCount, 'page', 'pages')}`);
  if (t.businessCount > 0) parts.push(`${t.businessCount} business ${plural(t.businessCount, 'page', 'pages')}`);
  if (t.hasMentions) parts.push('public photos/videos/mentions');
  if (t.possibleSocialCount > 0) parts.push(`${t.possibleSocialCount} possible social media ${plural(t.possibleSocialCount, 'account', 'accounts')}`);
  if (t.mugshotCount > 0) parts.push(plural(t.mugshotCount, 'a Mugshot', `${t.mugshotCount} Mugshots`));
  if (t.possibleMugshotCount > 0) parts.push(plural(t.possibleMugshotCount, 'a possible Mugshot', `${t.possibleMugshotCount} possible Mugshots`));
  if (t.googleBusinessCount > 0) parts.push(plural(t.googleBusinessCount, 'a business website', `${t.googleBusinessCount} business websites`));
  // Search engine results: matched, possible, or both (listed as two items). One result is singular, 2+ plural.
  if (t.hasGoogle) parts.push(plural(t.googleMatchedCount, 'a public search engine result', 'public search engine results'));
  if (t.hasPossibleGoogle) parts.push(plural(t.googlePossibleCount, 'a possible public search engine result', 'possible public search engine results'));
  return parts;
}

export const closingPlus = (state) => {
  const { tally: t, allProgTexts } = buildTally(state);
  const parts = foundPhrases(t);
  let list = joinList(parts);

  // How many things the list holds decides "was" or "were" (mentions and search results count as two)
  const total = t.personalCount + t.personalPageCount + t.businessCount + t.possibleSocialCount + t.mugshotCount + t.possibleMugshotCount
    + t.googleBusinessCount + (t.hasMentions ? 2 : 0) + t.googleCount;
  const verb = total === 1 ? 'was' : 'were';

  // Whether relevant information was found anywhere
  const relevant = () => {
    if (!t.hasGlobalRH) return 'no apparent relevant information regarding the case was found at this time.';
    return allProgTexts.length > 0
      ? '<strong>relevant information regarding the case was found.</strong>'
      : '(state the relevant information).';
  };

  if (state.isNull) {
    if (parts.length === 0) {
      return '<strong>After a thorough investigation, no social media presence relating to the subject or any apparent relevant information regarding the case was found at this time.</strong>';
    }
    const he = state.subjectGender === 'male' ? 'he' : 'she';
    // Only search engine results found: "he was discovered on a public search engine result" (one) / "... results" (more)
    const googleParts = (t.hasGoogle ? 1 : 0) + (t.hasPossibleGoogle ? 1 : 0);
    if (t.googleCount > 0 && parts.length === googleParts) {
      const result = list; // already singular ("a public search engine result") or plural, per result count
      return `<strong>In summation, the subject did not appear to have any forms of personal social media; however, ${he} was discovered on ${result}. After a thorough investigation, ${relevant()}</strong>`;
    }
    return `<strong>In summation, the subject did not appear to have any forms of personal social media; however, ${he} was identified on ${list}. After a thorough investigation, ${relevant()}</strong>`;
  }

  if (parts.length === 0) list = 'no accounts or results';
  return `<strong>In summation, ${list} ${verb} identified for the subject. After a thorough investigation, ${relevant()}</strong>`;
};
