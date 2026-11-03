// Builds the form's accordion before Alpine starts, so Alpine sees the finished page.
// Each section's fields live in their own HTML file (see config/sections.js), so no single
// file grows into the monolith again. A section that fails to load shows a notice; the rest still work.
const fetchText = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.text();
};

import { isNullAllowed } from '../config/null-mode.js';

export async function buildForm(root, sections, load = fetchText) {
  // The account stepper is shared by every network section, so fetch it once.
  const stepper = sections.some((s) => s.network)
    ? load('partials/clone-stepper.html').catch((err) => { console.error('[form] could not load the account stepper', err); return ''; })
    : Promise.resolve('');

  await Promise.all(sections.map(async (s) => {
    const details = document.createElement('details');
    details.className = 'section';
    details.id = `section-${s.id}`;
    details.setAttribute('x-bind:open', `isOpen('${s.id}')`);
    details.setAttribute('x-on:toggle', `onToggle('${s.id}', $event)`);
    if (s.show) details.setAttribute('x-show', s.show);
    if (s.network) {
      // Only visible while the network is switched on; the marker bar takes the brand color.
      details.classList.add('section--brand');
      // (In a Null report only Google and Others stay in the form; see config/null-mode.js)
      const nullHides = isNullAllowed(s.network) ? '' : ' && !$store.form.isNull';
      details.setAttribute('x-show', `$store.networks.byId['${s.network}'].checked${nullHides}`);
      details.setAttribute('x-bind:style', `{ '--brand-color': '${s.color}' }`);
    }

    const summary = document.createElement('summary');
    summary.className = 'section__summary';
    summary.textContent = s.title;

    const body = document.createElement('div');
    body.className = 'section__body';

    details.append(summary, body);
    root.append(details); // appended now so the sections keep their order

    if (!s.partial) {
      body.innerHTML = '<p class="empty">No fields yet.</p>';
      return;
    }
    try {
      const html = await load(s.partial); // our own file, never user input
      body.innerHTML = s.network ? (await stepper + html).replaceAll('__NET__', s.network) : html; // shared partials learn their network here
    } catch (err) {
      console.error(`[form] could not load section "${s.id}"`, err);
      body.innerHTML = '<p class="empty">This section could not be loaded.</p>';
    }
  }));
}
