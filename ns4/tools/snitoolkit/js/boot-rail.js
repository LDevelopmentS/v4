// Classic script in <head>: sets the locked-sidebar class before first paint, so a locked sidebar does not flash narrow.
// Key 'ease:rail-locked' is shared by every tool: lock it in one and it is locked in all. Keep in sync with rail.js.
(function () {
  try {
    if (localStorage.getItem('ease:rail-locked') === '1') document.documentElement.classList.add('rail-locked');
  } catch (e) {}
})();
