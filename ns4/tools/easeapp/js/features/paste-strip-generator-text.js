// Quill fields: drop the generator's wording from pasted text so only the identifiers stay.
//   "Match found by alias, visual match."                              -> "alias, visual match"
//   "Possible match found by alias first name, last name, visual match, and link as seen on the given attachment."
//                                      -> "alias first name, last name, visual match, and link as seen on the given attachment"
// It removes only a leading "(Possible) (match/account/...) (was) found/identified by/via/through ..." and the
// trailing period. The end of the text (e.g. "as seen on the given attachment") is part of the identifiers and stays.
import { addPasteTransform } from '../lib/paste-pipeline.js';

export const name = 'paste-strip-generator-text';

const QUALIFIER = '(?:(?:possible|potential|probable|likely)\\s+)?';
const BY = '(?:by|via|through|using|with|based\\s+on|from)';

// "Possible match found by", "Match was identified via", "Account found through:" ...
const LEAD_FOUND = new RegExp(
  `^\\s*${QUALIFIER}(?:(?:match(?:es)?|account|profile|page|result)\\s+)?(?:(?:was|were|is|are)\\s+)?` +
  `(?:found|identified|matched|located|detected|discovered)\\s+${BY}\\s*:?\\s+`, 'i');
// "Possible match by", "Match via" (no verb)
const LEAD_MATCH = new RegExp(`^\\s*${QUALIFIER}match(?:es)?\\s+${BY}\\s*:?\\s+`, 'i');

const stripPeriod = (s) => s.replace(/\.\s*$/, '');

export const strip = (str) => {
  if (!str) return str;
  return stripPeriod(str.replace(LEAD_FOUND, '').replace(LEAD_MATCH, '')).trim();
};

export function register() {
  addPasteTransform({
    name,
    order: 30,
    run(ctx) {
      if (ctx.kind !== 'quill') return;
      if (ctx.insertHtml) ctx.insertHtml = strip(ctx.insertHtml);
      else ctx.text = strip(ctx.text);
    },
  });
}
