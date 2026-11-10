// Entry point. Registers every feature here; add your tool's own features to this list.
// js/app.js is the same code as one classic script (needed when the page is opened from disk). Whichever copy runs first boots; the other skips.
import { init as rail } from './rail.js';
import { init as theme } from './theme.js';
import { init as protect } from './protect.js';
import { init as si } from './si.js';
import { init as guides } from './guides.js';

if (!window.__nsBooted) {
  window.__nsBooted = true;
  [rail, theme, protect, si, guides].forEach(init => init());
}
