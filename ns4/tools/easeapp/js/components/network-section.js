// Logic for a network's section in the form (partials/network.html, shared by every generic network).
// Shows the active account (instance) of the network.
import { getNetwork } from '../config/networks.js';

export const name = 'network-section';

export function register(Alpine) {
  Alpine.data('networkSection', (netId) => ({
    netId,
    net: getNetwork(netId),
    get cfg() { return this.net.config; },                       // which fields this network has
    get state() { return Alpine.store('networks').byId[netId]; },
    get d() { return this.state.instances[this.state.activeClone] ?? this.state.instances[0]; },

    get isPlus() { return Alpine.store('form').reportType === 'plus'; },
    get hasAccount() { return ['personal', 'personal-page', 'business-page'].includes(this.d.accountType); },
    get hasDemographics() { const c = this.cfg; return !!(c.locPrev || c.locCurr || c.workEd || c.joined); },
    get hidesPrivate() { return this.netId === 'yt' || this.netId === 'pin'; }, // these have no "private" status

    activityDatePlaceholder() { return this.netId === 'pin' ? 'Year (e.g. 2023)' : 'Date (Month Day, Year)'; },
    activityActionPlaceholder() { return this.netId === 'yt' ? 'Action (e.g., posted a video)' : 'Action (e.g., shared a photo)'; },

  }));
}
