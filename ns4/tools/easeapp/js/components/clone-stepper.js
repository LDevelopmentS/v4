// The stepper at the top of a network's section:   <  Facebook [ 59 ] of 63  >
// Shows one account at a time. Type a number to jump; out-of-range numbers snap to the nearest account.
// Also holds the + (add an account) and - (delete the open one) buttons.
import { getNetwork } from '../config/networks.js';

export const name = 'clone-stepper';

export function register(Alpine) {
  Alpine.data('cloneStepper', (netId) => ({
    net: getNetwork(netId),
    get state() { return Alpine.store('networks').byId[netId]; },
    get total() { return this.state.instances.length; },
    get current() { return this.state.activeClone + 1; },

    // The + and - at the end of the stepper (same actions as the sidebar's). The first account has no -:
    // it stays, and the network's switch in the sidebar controls it.
    get canRemove() { return this.state.activeClone > 0; },
    add() { Alpine.store('networks').add(netId); },
    remove() { Alpine.store('networks').requestRemove(netId, this.state.activeClone); }, // asks first when the account has text

    go(number) {
      Alpine.store('networks').select(netId, Math.min(Math.max(number, 1), this.total) - 1);
    },

    // Typing: digits only. Enter or leaving the box jumps; Esc cancels; Up/Down step.
    filter(event) { event.target.value = event.target.value.replace(/\D/g, ''); },
    commit(event) {
      const number = parseInt(event.target.value, 10);
      if (!Number.isNaN(number)) this.go(number);
      event.target.value = this.current; // always show where we really are
    },
    key(event) {
      if (event.key === 'Enter') { event.preventDefault(); this.commit(event); }
      else if (event.key === 'Escape') { event.target.value = this.current; }
      else if (event.key === 'ArrowUp') { event.preventDefault(); this.go(this.current + 1); }
      else if (event.key === 'ArrowDown') { event.preventDefault(); this.go(this.current - 1); }
    },
  }));
}
