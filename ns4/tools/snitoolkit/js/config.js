// Fixed lists and keys for Socmed S&I.
// These storage keys are the same ones the old single-file version used, so saved targets and history carry over.
export const KEYS = { rows: 'ns_si_data_v3', history: 'ns_search_history', ui: 'ns_ui_toggle_states' };

export const DEFAULT_TOGGLES = {
  pseSearchToggle: false, userModeToggle: false, mainToggle: true, subToggle: false,
  engineToggle: false, legalToggle: false, crimToggle: false, finToggle: false, yelpToggle: false
};

export const YELP_URL = 'https://www.yelp.com/find_friends/address_book?fsid=LpiV-_mJLfXiPGsVN3Wkjw';

// Username Mode: direct profile links.
export const USER_PLATFORMS = [
  { id: 'Facebook', url: 'https://facebook.com/' },
  { id: 'Instagram', url: 'https://instagram.com/' },
  { id: 'Twitter', url: 'https://x.com/' },
  { id: 'YouTube', url: 'https://www.youtube.com/@' },
  { id: 'LinkedIn', url: 'https://linkedin.com/in/' },
  { id: 'TikTok', url: 'https://www.tiktok.com/@' },
  { id: 'Pinterest', url: 'https://www.pinterest.com/' },
  { id: 'Poshmark', url: 'https://poshmark.com/closet/' },
  { id: 'VSCO', url: 'https://vsco.co/' },
  { id: 'MySpace', url: 'https://myspace.com/' },
  { id: 'Kik', url: 'https://kik.me/' },
  { id: 'Snapchat', url: 'https://www.snapchat.com/add/' },
  { id: 'Twitch', url: 'https://www.twitch.tv/' },
  { id: 'Flickr', url: 'https://www.flickr.com/photos/' },
  { id: 'Medium', url: 'https://medium.com/@' },
  { id: 'DeviantArt', url: 'https://www.deviantart.com/' },
  { id: 'Tripadvisor', url: 'https://www.tripadvisor.com/profile/' },
  { id: 'OnlyFans', url: 'https://onlyfans.com/' },
  { id: 'Tinder', url: 'https://tinder.com/@' }
];

// PSE Mode: people-search sites (kind is read by links.js).
export const PSE_SITES = [
  { kind: 'true', label: 'Truepeoplesearch' },
  { kind: 'free', label: 'Searchpeoplefree' },
  { kind: 'fast', label: 'Fastpeoplesearch' },
  { kind: 'check', label: 'Fastbackgroundcheck' }
];
