// Entry point. Registers every feature here; add your tool's own features to this list.
import { init as rail } from './rail.js';
import { init as theme } from './theme.js';

[rail, theme].forEach(init => init());
