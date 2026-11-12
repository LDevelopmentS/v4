import { save } from './storage.js';
const KEY = 'ease:rail-locked'; // shared by every tool. Keep in sync with boot-rail.js.
const CLASS = 'rail-locked';

// Hover/focus widening is pure CSS. This adds tap-to-open for touch screens and the sidebar lock (shown from 1200px up).
export function init() {
  const root = document.documentElement;
  const rail = document.getElementById('rail');
  const brand = rail.querySelector('.rail__brand');
  const lock = document.getElementById('rail-lock');
  let wasClosedOnTouch = false;

  rail.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch') return;
    wasClosedOnTouch = !rail.classList.contains('is-open');
    rail.classList.add('is-open');
  });
  // The first tap only opens the rail; it must not follow the logo link.
  brand.addEventListener('click', e => { if (wasClosedOnTouch) { e.preventDefault(); wasClosedOnTouch = false; } });
  document.addEventListener('pointerdown', e => { if (!rail.contains(e.target)) rail.classList.remove('is-open'); });

  function paint() {
    const on = root.classList.contains(CLASS);
    lock.setAttribute('aria-pressed', on ? 'true' : 'false');
    lock.setAttribute('aria-label', on ? 'Unlock sidebar' : 'Lock sidebar');
    lock.title = on ? 'Unlock sidebar' : 'Lock sidebar';
  }
  lock.addEventListener('click', () => {
    const on = root.classList.toggle(CLASS);
    rail.classList.remove('is-open');
    save(KEY, on ? '1' : '0');
    paint();
    window.dispatchEvent(new CustomEvent('rail:lock', { detail: { locked: on } }));
  });
  // Another tab changed the lock: follow it.
  window.addEventListener('storage', e => {
    if (e.key !== KEY) return;
    root.classList.toggle(CLASS, e.newValue === '1');
    paint();
  });
  paint();
}
