// Fallback for the sidebar tools (light/dark, lock, tap-to-open) when ES modules cannot run,
// for example when index.html is opened straight from disk. Does nothing when theme.js / rail.js are running.
(function () {
  window.addEventListener('load', function () {
    if (window.__nsModulesOk) return;
    var root = document.documentElement;
    var rail = document.getElementById('rail');
    var themeBtn = document.getElementById('theme-toggle');
    var lockBtn = document.getElementById('rail-lock');
    var brand = rail.querySelector('.rail__brand');
    function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

    function paintTheme() { themeBtn.setAttribute('aria-pressed', root.dataset.theme === 'light' ? 'true' : 'false'); }
    themeBtn.addEventListener('click', function () {
      root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
      put('ease:theme', root.dataset.theme);
      paintTheme();
    });
    paintTheme();

    function paintLock() {
      var on = root.classList.contains('rail-locked');
      lockBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      lockBtn.setAttribute('aria-label', on ? 'Unlock sidebar' : 'Lock sidebar');
      lockBtn.title = on ? 'Unlock sidebar' : 'Lock sidebar';
    }
    lockBtn.addEventListener('click', function () {
      var on = root.classList.toggle('rail-locked');
      rail.classList.remove('is-open');
      put('ease:rail-locked', on ? '1' : '0');
      paintLock();
    });
    paintLock();

    var wasClosed = false;
    rail.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'touch') return;
      wasClosed = !rail.classList.contains('is-open');
      rail.classList.add('is-open');
    });
    brand.addEventListener('click', function (e) { if (wasClosed) { e.preventDefault(); wasClosed = false; } });
    document.addEventListener('pointerdown', function (e) { if (!rail.contains(e.target)) rail.classList.remove('is-open'); });
  });
})();
