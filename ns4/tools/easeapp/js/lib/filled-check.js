// Shared rule for "is anything filled in?". Used by Discard all and by the leave-page warning,
// so both always agree.
// Only typed text counts (more than spaces). Switches, choices and the number of empty
// accounts/clones/rows do not.

// Fields that hold a choice rather than typed text (their value is never "empty"), and ids/keys.
// Add any new choice field here.
const SKIP = new Set([
  'id', 'key', 'type', 'subType', 'matchStatus', 'accountType', 'mentionMedia', 'activity',
  'finding', 'resultType', 'reportType', 'subjectGender', 'scope', 'hiddenMetrics',
]);

// Visible text of a field: tags removed (fields can hold HTML), non-breaking and zero-width spaces treated as spaces.
export const visibleText = (value) => {
  const text = value.includes('<') || value.includes('&')
    ? (new DOMParser().parseFromString(value, 'text/html').body.textContent ?? '')
    : value;
  return text.replace(/[\s\u00a0\u200b-\u200d\ufeff]+/g, '');
};

// True when any text field inside `node` holds something other than spaces.
export function hasText(node) {
  if (typeof node === 'string') return visibleText(node) !== '';
  if (Array.isArray(node)) return node.some(hasText);
  if (node && typeof node === 'object') {
    return Object.keys(node).some((k) => !SKIP.has(k) && hasText(node[k]));
  }
  return false;
}

// The form store's typed text is in `relatives` and the Findings text; the rest of it is choices. Everything else is in the networks store.
export const isFormFilled = (Alpine) =>
  hasText(Alpine.store('form').relatives) || hasText(Alpine.store('form').progFindingText) || hasText(Alpine.store('networks').byId);
