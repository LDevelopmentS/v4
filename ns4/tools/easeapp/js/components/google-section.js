// Logic for the Google / PSE data section (partials/google.html).
// Shows the active search result of that network.

export const name = 'google-section';

export function register(Alpine) {
  Alpine.data('googleSection', () => ({
    get state() { return Alpine.store('networks').byId.goog; },
    get d() { return this.state.instances[this.state.activeClone] ?? this.state.instances[0]; },
    get isPlus() { return Alpine.store('form').reportType === 'plus'; },

  }));
}
