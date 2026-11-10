// Classic script (no ES modules), so it also runs when index.html is opened directly.
window.XSM = window.XSM || {};
(function () {
// xString entry: wires the form, results, state helper and the Generate / Clear buttons.
const { buildQueries } = window.XSM['xs-core'];
const { initForm, readSubject, resetForm } = window.XSM['xs-form'];
const { initResults, renderResults, clearResults } = window.XSM['xs-results'];
const { init: initStates } = window.XSM['xs-states'];

// Snapshot of the page as first loaded (kept from the original tool).
const ORIGINAL_DOCUMENT_HTML = document.documentElement.outerHTML;

function init() {
  initForm();
  initResults();
  initStates();

  document.getElementById('generateBtn').addEventListener('click', () => {
    const subject = readSubject();
    if (!subject) return;
    renderResults(buildQueries(subject.queryInput), subject.formData);
  });
  document.getElementById('clearGenBtn').addEventListener('click', () => { resetForm(); clearResults(); });
}

  window.XSM['xstring'] = { ORIGINAL_DOCUMENT_HTML, init };
  init();
})();
