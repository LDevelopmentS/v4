// The order of the network part of the generated report (data only; the sorting is in report/order.js).
//
// Every network paragraph belongs to one tier. Tiers are written top to bottom. Inside a tier, matched accounts
// come first, then possible ones just below them, then anything marked "extra" (for example Google's public mentions).
// Inside a tier, each network (and each site on Others, in the order first entered) is its own group: its matched accounts come first,
// then its possible ones right after them, then the next network. Paragraphs keep the sidebar order (js/config/networks.js) and then the order the accounts were added.
//
//   social            matched, then possible accounts on the named social networks (Facebook, Instagram, ...)
//   google            Google / public search engine results
//   other             Others (General, E-commerce, Classmates, Myspace, Mugshot, Zoominfo), by the order each site was first entered
//   personal-page     \
//   business-page      |  pages and websites, on any network that offers them.
//   fan-page           |  The tier id is also the account type value stored on the account ("accountType").
//   personal-website   |
//   business-website   |
//   fan-website       /
//
// Not built yet: fan-page, personal-website and fan-website have a place here but no form option or wording.
// To add one, see "Adding a page or website kind" in README.md.
export const TIERS = [
  'social',
  'google',
  'other',
  'personal-page',
  'business-page',
  'fan-page',
  'personal-website',
  'business-website',
  'fan-website',
];

// Account types that are their own tier. Any other type (personal account, Public) goes to the tier of its network.
export const KIND_TIERS = TIERS.filter((id) => id.endsWith('-page') || id.endsWith('-website'));

// Order inside a tier
export const SLOTS = ['matched', 'possible', 'extra'];
