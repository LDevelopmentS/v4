// Progressive report, bullet 2: family members.
import { escapeHtml, joinList, stitch } from '../helpers/text.js';
import { nameHtml } from '../helpers/links.js';
import { validRows, countWords } from '../helpers/relatives.js';

export const name = 'relatives-progressive';

export const relativesProgressive = ({ relatives: rel }) => {
  const scope = rel.scope === 'both' ? 'family members and associates' : 'family members';
  const base = `Searches for the party’s ${scope} were also conducted`;
  const none = `${base}, but none were positively identified at this time.`;

  if (!rel.found) return none;
  const rows = validRows(rel.rows);
  if (rows.length === 0) return none;

  const { verb, noun, pronoun } = countWords(rows.length);
  const names = joinList(rows.map((r) => nameHtml(r.name, r.link, { withSite: true })));
  let text = `${base} and ${rows.length} ${verb} identified: ${names}. `;

  // Only findings marked "Findings" count; text typed under "No findings found" is ignored
  const marked = rel.progFindings.filter((f) => f.type === 'relevant');
  const findings = marked.map((f) => (f.text || '').trim()).filter(Boolean).map(escapeHtml);
  if (findings.length > 0) {
    text += `<strong>${noun} thoroughly investigated and ${stitch(findings)}</strong>`;
  } else if (marked.length > 0) {
    text += `<strong>${noun} thoroughly investigated and (state relevant info found on relatives)</strong>`;
  } else {
    text += `${noun} thoroughly investigated and no apparent relevant information regarding the case was found on ${pronoun} at this time.`;
  }
  return text;
};
