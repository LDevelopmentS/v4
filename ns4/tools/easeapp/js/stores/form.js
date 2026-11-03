// What the person has entered. Fields bind to this, e.g. $store.form.reportType.
import { uid } from '../lib/uid.js';

export const name = 'form-store';

// Repeating pieces get an id so each keeps its own element when others are removed.
export const newRow = () => ({ id: uid(), name: '', link: '' });
export const newFinding = () => ({ id: uid(), type: 'none', text: '' });

export const defaults = () => ({
  reportType: 'plus',     // 'plus' | 'progressive'
  isNull: false,
  progFinding: 'none',    // Progressive only: 'none' | 'relevant' (the Findings section)
  progFindingText: '',    // Progressive only: the findings text typed in the Findings section
  subjectGender: 'male',  // 'male' | 'female'
  relatives: {
    found: null,          // true = Yes, false = No, null = not answered yet
    scope: 'relatives',   // 'relatives' | 'both'
    finding: 'none',      // Plus only: 'none' | 'relevant'
    rhText: '',           // Plus only: the relevant info text
    progFindings: [newFinding()], // Progressive only
    rows: [newRow()],     // names and links
  },
});

export function register(Alpine) {
  Alpine.store('form', {
    ...defaults(),
    reset() { Object.assign(this, defaults()); }, // used by Discard all
  });
}
