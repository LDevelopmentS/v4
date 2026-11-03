// The report, derived from the form. Recalculates whenever a field it reads changes.
import { buildEntries } from '../report/index.js';
import { renderList } from '../report/render.js';

export const name = 'report-store';

export function register(Alpine) {
  Alpine.store('report', {
    get entries() {
      const form = Alpine.store('form');
      return buildEntries({
        reportType: form.reportType,
        isNull: form.isNull,
        progFinding: form.progFinding,
        subjectGender: form.subjectGender,
        relatives: form.relatives,
        networks: Alpine.store('networks').byId,
      });
    },
    get paragraphs() { return this.entries.map((e) => e.html); },
    get html() { return renderList(this.entries); },
  });
}
