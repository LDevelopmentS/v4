import { save } from './storage.js';
const KEY = 'ease:theme'; // shared by every tool. Keep in sync with boot-theme.js.

export function init() {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const paint = () => btn.setAttribute('aria-pressed', root.dataset.theme === 'light' ? 'true' : 'false');

  btn.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    save(KEY, root.dataset.theme);
    paint();
  });
  // Another tab changed the theme: follow it.
  window.addEventListener('storage', e => {
    if (e.key !== KEY) return;
    root.dataset.theme = e.newValue === 'light' ? 'light' : 'dark';
    paint();
  });
  paint();
}
