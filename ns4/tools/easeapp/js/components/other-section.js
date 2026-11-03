// Logic for the "Other social medias" section (partials/other.html).
// Shows the active account of that network; which fields appear depends on its kind.
import { getOtherType } from '../config/other-types.js';
import { metricCatalog, getCatalogMetric } from '../config/metric-catalog.js';
import { uid } from '../lib/uid.js';

export const name = 'other-section';

export function register(Alpine) {
  Alpine.data('otherSection', () => ({
    get state() { return Alpine.store('networks').byId.other; },
    get d() { return this.state.instances[this.state.activeClone] ?? this.state.instances[0]; },
    get kind() { return getOtherType(this.d.subType); },

    get isPlus() { return Alpine.store('form').reportType === 'plus'; },
    get hasAccount() { return ['personal', 'personal-page', 'business-page'].includes(this.d.accountType); },

    get isNamed() { return !!this.kind?.named; },                       // General, E-commerce: type the site's name
    get kindMetrics() { return this.kind?.metrics ?? []; },             // all the counts this kind has
    get metricRows() { return this.kindMetrics.filter((m) => !this.d.hiddenMetrics.includes(m.k)); }, // the ones still shown
    get hasLocation() { return ['general', 'ecommerce', 'myspace', 'zoominfo'].includes(this.d.subType); },
    get hasStatus() { return ['general', 'ecommerce'].includes(this.d.subType); },
    get hasActivityAction() { return this.d.subType === 'general'; },

    // ---- counts added with "+ Add metric" (on top of the kind's own counts)
    menuOpen: false,
    get defaultKeys() { return this.metricRows.map((m) => m.k); },
    // Added counts that apply to this kind (one it already has is skipped, so nothing shows twice)
    get extras() { return this.d.extraMetrics.filter((e) => !this.defaultKeys.includes(e.key)); },
    // What can still be added: this kind's own counts that were removed (first), then the catalog, minus what is already here
    get available() {
      const used = new Set([...this.defaultKeys, ...this.extras.map((e) => e.key)]);
      const removed = this.kindMetrics.filter((m) => this.d.hiddenMetrics.includes(m.k) && !used.has(m.k)).map((m) => ({ k: m.k, ui: m.ui }));
      return [...removed, ...metricCatalog.filter((m) => !used.has(m.k) && !removed.some((r) => r.k === m.k))];
    },
    metricLabel(key) { return getCatalogMetric(key)?.ui ?? this.kindMetrics.find((m) => m.k === key)?.ui ?? key; },
    // The X on one of the kind's own counts: it is hidden and cleared. Adding it back puts it at the end, which is how to reorder.
    removeOwnMetric(key) {
      this.d.hiddenMetrics.push(key);
      this.d.metrics[key].on = false;
      this.d.metrics[key].val = '';
    },
    addMetric(key) { this.d.extraMetrics.push({ id: uid(), key, val: '' }); this.menuOpen = false; },
    removeMetric(id) {
      const i = this.d.extraMetrics.findIndex((e) => e.id === id);
      if (i !== -1) this.d.extraMetrics.splice(i, 1);
    },

  }));
}
