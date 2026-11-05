// Alert window for deleting an account (clone) that has information in it.
//  - Empty accounts are deleted straight away; nothing happens here (stores/networks.js, requestRemove).
//  - An account holding real text (same rule as "Discard all": js/lib/filled-check.js) asks first, in the
//    <dialog class="modal"> in index.html. Both the sidebar's "-" and the form's "-" go through it.
import { getNetwork } from '../config/networks.js';
import { cloneLabel } from '../lib/clone-label.js';

export const name = 'delete-clone';

export function register(Alpine) {
  const dialog = document.getElementById('delete-clone-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return; // the store falls back to a plain confirm()

  const confirmBtn = dialog.querySelector('[data-modal="confirm"]');
  const cancelBtn = dialog.querySelector('[data-modal="cancel"]');
  const nameEl = document.getElementById('delete-clone-name');
  const status = document.getElementById('report-status'); // screen-reader announcement
  let pending = null; // { id, instance, label }

  window.addEventListener('clone:confirm-remove', (e) => {
    const { id, index, instance } = e.detail;
    const inst = Alpine.store('networks').byId[id]?.instances[index];
    if (!inst) return;
    pending = { id, instance, label: cloneLabel(getNetwork(id), inst, index + 1) };
    if (nameEl) nameEl.textContent = pending.label;
    e.detail.handled = true; // tells the store the window is taking care of it
    dialog.showModal();
  });

  cancelBtn?.addEventListener('click', () => dialog.close());
  confirmBtn?.addEventListener('click', () => {
    dialog.close();
    if (!pending) return;
    const store = Alpine.store('networks');
    const at = store.byId[pending.id].instances.findIndex((i) => i.id === pending.instance); // still the same account
    if (at > 0) {
      store.remove(pending.id, at);
      if (status) status.textContent = `${pending.label} was deleted`;
    }
    pending = null;
  });
  // Clicking the dimmed area outside the window cancels
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { pending = null; });
}
