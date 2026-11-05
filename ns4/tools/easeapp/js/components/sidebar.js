// Network list in the rail. Switching a network on opens its section in the form.
// Announces changes (network:toggle); it does not generate any report text.
import { networks } from '../config/networks.js';
import { cloneLabel } from '../lib/clone-label.js';
import { nullOff } from '../config/null-mode.js';

export const name = 'sidebar';

export function register(Alpine) {
  Alpine.data('sidebar', () => ({
    networks,

    state(id) { return Alpine.store('networks').byId[id]; },
    isChecked(id) { return this.state(id).checked; },
    isLocked(id) { return this.state(id).instances.length > 1; }, // can't switch off while clones exist

    // Null report: networks other than Google and Others are out of play (dimmed and not clickable)
    isNullOff(id) { return nullOff(Alpine.store('form').isNull, id); },

    total(id) { return this.state(id).instances.length; },

    // Accounts after the first one, shown as a list under the network
    clones(id) { return this.state(id).instances.slice(1); },
    // Name of a clone in the list, e.g. "Others 2 (Yelp)" (rules: js/lib/clone-label.js)
    cloneLabel(net, inst, number) { return cloneLabel(net, inst, number); },
    isOpenClone(id, index) { return this.state(id).activeClone === index ? 'true' : null; },
    addClone(id) { Alpine.store('networks').add(id); },
    selectClone(id, index) { Alpine.store('networks').select(id, index); },
    removeClone(id, index) { Alpine.store('networks').requestRemove(id, index); }, // asks first when the account has text

    // Keeps the open account in view inside the (capped, scrolling) clone list.
    reveal(id) {
      this.$nextTick(() => {
        const list = this.$root.querySelector(`[data-clones="${id}"]`);
        const row = list?.querySelector('[aria-current="true"]');
        if (!list || !row || !list.scrollTo) return;
        const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const top = row.offsetTop - (list.clientHeight - row.offsetHeight) / 2;
        list.scrollTo({ top: Math.max(0, top), behavior: calm ? 'auto' : 'smooth' });
      });
    },

    toggle(id, checked) {
      const st = this.state(id);
      st.checked = checked;

      const section = document.getElementById('section-' + id); // Google and Others get theirs later
      if (checked && section) {
        st.activeClone = 0;
        Alpine.store('app').activeSection = id;
        this.$nextTick(() => {
          const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
          section.scrollIntoView?.({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
        });
      }
      this.$dispatch('network:toggle', { id, checked });
    },
  }));
}
