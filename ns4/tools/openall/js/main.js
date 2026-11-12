// Entry point. Registers every feature here; add your tool's own features to this list.
import { init as rail } from './rail.js';
import { init as theme } from './theme.js';
import { init as linkOpener } from './link-opener.js';
import { init as security } from './security.js';

[rail, theme, linkOpener, security].forEach(init => init());
