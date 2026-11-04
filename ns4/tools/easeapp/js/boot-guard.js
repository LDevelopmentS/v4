// Safety net for the startup skeleton (css/skeleton.css). If the app's scripts fail to load,
// main.js never ends the loading state, so this plain script ends it after 10 seconds
// instead of leaving the skeleton shimmering forever. It does nothing if the app got there first.
setTimeout(() => {
  document.body.classList.remove('is-loading');
  document.body.removeAttribute('aria-busy');
}, 10000);
