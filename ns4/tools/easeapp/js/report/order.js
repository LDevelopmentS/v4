// Puts the network paragraphs in the order set by config/hierarchy.js.
import { TIERS, KIND_TIERS, SLOTS } from '../config/hierarchy.js';

// Which tier a paragraph belongs to: its own kind (page or website), otherwise the tier of its network.
export function tierFor(netId, accountType) {
  if (KIND_TIERS.includes(accountType)) return accountType;
  if (netId === 'goog') return 'google';
  if (netId === 'other') return 'other';
  return 'social';
}

// entries: [{ html, owner, tier, group, slot }]. Order: tier, then group (one network, or one kind of "Other" account),
// then matched before possible inside that group, so "Facebook (Possible)" sits right after the last Facebook account
// and not at the bottom of the whole tier. Stable, so paragraphs that tie keep the order they were written in.
export function orderEntries(entries) {
  const slotRank = (e) => SLOTS.indexOf(e.slot ?? 'matched');
  return entries
    .map((e, i) => ({ e, i }))
    .sort((a, b) =>
      TIERS.indexOf(a.e.tier) - TIERS.indexOf(b.e.tier)
      || (a.e.group ?? 0) - (b.e.group ?? 0)
      || slotRank(a.e) - slotRank(b.e)
      || a.i - b.i)
    .map(({ e }) => e);
}
