// Small pieces every Google paragraph uses. Pure.
import { escapeHtml, joinList } from '../../helpers/text.js';

export const identifiedBy = (data) => ((data.idBy || '').trim() ? data.idBy.trim() : '(identifiers)');

// "<strong>2 photos...</strong>" or the placeholder
export const relevantInfo = (data) =>
  (data.mediaType || '').trim() ? escapeHtml(data.mediaType.trim()) : '(Relevant information was found.)';

// "personal and employment related"
export function informationFound(data) {
  const types = [];
  if (data.infoPersonal) types.push('personal');
  if (data.infoEmployment) types.push('employment related');
  if (data.infoCriminal) types.push('criminal related');
  if (data.infoLawsuit) types.push('lawsuit related');
  if (data.infoEducation) types.push('education related');
  return types.length ? joinList(types) : '(personal/employment related/criminal related/lawsuit related/education related)';
}

// "2nd", "3rd", ... for the 2nd, 3rd ... Google paragraph of a kind (the first has none)
export { ordinalPrefix } from '../../helpers/grammar.js';
