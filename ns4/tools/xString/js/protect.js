// Classic script (no ES modules), so it also runs when index.html is opened directly.
window.XSM = window.XSM || {};
(function () {
// Page protection carried over from the original xString page: blocks F12, Ctrl+Shift+I/J/C, Ctrl+U and right-click.
function init() {
  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) ||
        (e.ctrlKey && k === 'u')) {
      e.preventDefault();
    }
  });
  document.addEventListener('contextmenu', e => e.preventDefault());
}

  window.XSM['protect'] = { init };
  init();
})();
