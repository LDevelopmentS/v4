// Classic script in <head>: sets light/dark before first paint (no flash). Cannot import modules.
// Key 'ease:theme' is shared by every tool, so the theme follows you between tools. Nothing saved = dark.
(function () {
  var r = document.documentElement, s = null;
  try { s = localStorage.getItem('ease:theme'); } catch (e) {}
  r.dataset.theme = s === 'light' ? 'light' : 'dark';
})();
