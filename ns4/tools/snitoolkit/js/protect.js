// Right-click and dev-tools shortcut blocking from the old page.
// Uses addEventListener, so it never replaces another keydown handler (the old code assigned document.onkeydown).
export function init() {
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    const devtools = e.key === 'F12' || (e.ctrlKey && e.shiftKey && (k === 'i' || k === 'j' || k === 'c'));
    const viewSource = e.ctrlKey && k === 'u';
    if (devtools || viewSource) e.preventDefault();
  });
}
