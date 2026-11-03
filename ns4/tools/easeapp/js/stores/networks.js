// Per-network state: is it switched on, and the data for each account (instance) of it.
// Every instance has the same shape, so cloning later only adds and removes instances.
import { uid } from '../lib/uid.js';
import { networks as config } from '../config/networks.js';
import { newFinding } from './form.js';

export const name = 'networks-store';

const METRIC_KEYS = ['posts', 'friends', 'followers', 'following', 'photos', 'videos', 'checkins', 'likes', 'pins', 'subscribers', 'connections'];
const field = () => ({ val: '', on: false });

export const newInstance = () => ({
  id: uid(),
  matchStatus: 'matched',            // 'matched' | 'possible'   (Plus only)
  accountType: 'personal',           // 'personal' | 'personal-page' | 'business-page' | 'no-page' (shown as "Public"); more kinds: see config/hierarchy.js
  mentionMedia: 'public post/s',     // when accountType is 'no-page' (Public)
  idBy: '',                          // "Identified by" (HTML from the link field)
  metrics: Object.fromEntries(METRIC_KEYS.map((k) => [k, field()])),
  loc: { prev: field(), curr: field() },
  workEd: { nature: field(), emp: field(), school: field() },
  joined: '',
  activity: 'active',                // 'active' | 'inactive' | 'private'
  actDate: '',
  actDetails: '',
  finding: 'relevant',               // 'relevant' | 'none'
  mediaType: '',                     // the relevant info text
  progFindings: [newFinding()],      // Progressive only
});

// "Other social medias" has its own shape: a kind of account, a free-text location, and a few extra details.
export const newOtherInstance = () => ({
  ...newInstance(),
  subType: 'general',                // 'general' | 'ecommerce' | 'classmates' | 'myspace' | 'mugshot' | 'zoominfo'
  networkName: '',                   // General and E-commerce: the site's name
  metrics: Object.fromEntries(['posts', 'followers', 'following', 'listings', 'connectedTo', 'connectedBy', 'connections'].map((k) => [k, field()])),
  extraMetrics: [],                  // counts added with "+ Add metric": [{ id, key, val }]
  hiddenMetrics: [],                 // keys of this kind's own counts that were removed with the X (they can be added back, at the end)
  loc: '',                           // one free-text location
  school: '', classYear: '',         // Classmates
  countyState: '', arrestDate: '', charge: '', // Mugshot
});

// Google / public search engines: results rather than an account.
export const newGoogleInstance = () => ({
  id: uid(),
  resultType: 'single',              // 'single' (1 result) | 'multiple' (2+ results)
  pseNames: '',                      // the search engine(s), as HTML from the link field
  matchStatus: 'matched',
  idBy: '',
  infoPersonal: false, infoEmployment: false, infoCriminal: false, infoLawsuit: false, infoEducation: false,
  finding: 'relevant',
  mediaType: '',
  accountType: 'personal',           // 'personal' | 'personal-page' | 'business-page' | 'business-website' | 'no-page' (shown as "Public"); more kinds: see config/hierarchy.js
  mentionMedia: 'public post/s',
  progFindings: [newFinding()],
});

// A blank account in the shape each network uses
export const newInstanceFor = (id) => (id === 'other' ? newOtherInstance() : id === 'goog' ? newGoogleInstance() : newInstance());
const make = (n) => newInstanceFor(n.id);
export const defaults = () => Object.fromEntries(
  config.map((n) => [n.id, { checked: false, activeClone: 0, instances: [make(n)] }])
);

// Tell the sidebar and form which account is open (they scroll it into view).
const announce = (id) => window.dispatchEvent(new CustomEvent('clone:change', { detail: { id } }));
// A new account was added (features/clone-highlight.js blinks it).
const announceAdd = (id, index, instance) => window.dispatchEvent(new CustomEvent('clone:add', { detail: { id, index, instance } }));

export function register(Alpine) {
  Alpine.store('networks', {
    byId: defaults(),
    reset() { this.byId = defaults(); }, // used by Discard all

    // ---- accounts ("clones") of a network. Index 0 is the network's first account.
    count(id) { return this.byId[id].instances.length; },

    select(id, index) {
      const st = this.byId[id];
      st.activeClone = Math.min(Math.max(index, 0), st.instances.length - 1);
      Alpine.store('app').activeSection = id;
      announce(id);
    },

    add(id) {
      const st = this.byId[id];
      st.instances.push(newInstanceFor(id));
      this.select(id, st.instances.length - 1); // the new account opens
      announceAdd(id, st.instances.length - 1, st.instances[st.instances.length - 1].id);
    },

    // Removing the open account (or one before it) steps back to the previous one, so you stay on the same account.
    remove(id, index) {
      const st = this.byId[id];
      if (index < 1 || index >= st.instances.length) return; // the first account stays; the network switch controls it
      st.instances.splice(index, 1);
      if (index <= st.activeClone) st.activeClone = Math.max(0, st.activeClone - 1);
      announce(id);
    },
  });
}
