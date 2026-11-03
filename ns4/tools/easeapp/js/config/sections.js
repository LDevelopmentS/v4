// Data only. The accordion sections in the form, in order.
// partial: the HTML file with the section's fields (null = not built yet).
// network: sections that belong to a network are only shown while that network is switched on.
// show: an Alpine expression; the section is only shown while it is true.
import { genericNetworks, getNetwork } from './networks.js';

export const sections = [
  { id: 'nullset',  title: 'Report type',            partial: 'partials/report-type.html' },
  { id: 'subject',  title: 'Profile',                partial: 'partials/profile.html' },
  { id: 'relative', title: 'Relatives & associates', partial: 'partials/relatives.html' },
  // Progressive report only: whether anything relevant was found. Sits between Relatives and the networks.
  { id: 'findings', title: 'Findings', partial: 'partials/findings.html', show: "$store.form.reportType === 'progressive'" },
  // One section per network that uses the generic form, all from the same partial.
  ...genericNetworks.map((n) => ({
    id: n.id,
    title: `${n.name} data`,
    partial: 'partials/network.html',
    network: n.id,
    color: n.color,
  })),
  { id: 'other',    title: 'Other social medias',    partial: 'partials/other.html', network: 'other', color: getNetwork('other').color },
  { id: 'goog',     title: 'Google / PSE data',      partial: 'partials/google.html', network: 'goog', color: getNetwork('goog').color },
];
