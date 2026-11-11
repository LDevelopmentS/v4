// Classic script (no ES modules), so it also runs when index.html is opened directly.
window.XSM = window.XSM || {};
(function () {
// xString state helper: expands "CA" to "California" and shows a suggestion list under State inputs.
const US_STATES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan',
  MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
  WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia',
  AS: 'American Samoa', GU: 'Guam', MP: 'Northern Mariana Islands', PR: 'Puerto Rico', VI: 'U.S. Virgin Islands',
  UM: 'U.S. Minor Outlying Islands'
};

function init() {
  const names = Object.values(US_STATES).sort((x, y) => x.localeCompare(y));
  const isState = el => el && el.classList && el.classList.contains('state-input');
  const fire = el => { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };

  // Expand a typed abbreviation when leaving the box
  document.getElementById('locationRows').addEventListener('focusout', e => {
    if (!isState(e.target)) return;
    const full = US_STATES[e.target.value.trim().toUpperCase()];
    if (full) { e.target.value = full; fire(e.target); }
  });

  const dd = document.createElement('div');
  dd.id = 'stateDropdown';
  dd.hidden = true;
  document.body.appendChild(dd);

  let current = null, active = -1;

  function matchStates(raw) {
    const q = raw.trim().toLowerCase();
    if (!q) return [];
    const scored = [];
    names.forEach(n => {
      const l = n.toLowerCase();
      let score = -1;
      if (l.startsWith(q)) score = 1;
      else if (l.split(/[\s.]+/).some(w => w.startsWith(q))) score = 2;
      else if (l.includes(q)) score = 3;
      if (score > 0) scored.push({ n, score });
    });
    const abbr = US_STATES[raw.trim().toUpperCase()];
    if (abbr) {
      const i = scored.findIndex(x => x.n === abbr);
      if (i >= 0) scored[i].score = 0; else scored.push({ n: abbr, score: 0 });
    }
    scored.sort((x, y) => x.score - y.score || x.n.localeCompare(y.n));
    return scored.map(x => x.n);
  }

  function position() {
    if (!current) return;
    const r = current.getBoundingClientRect();
    dd.style.width = r.width + 'px';
    dd.style.left = r.left + 'px';
    dd.style.top = (r.bottom + 2) + 'px';
  }
  function hide() { dd.hidden = true; active = -1; }

  function setActive(i) {
    const list = dd.querySelectorAll('.sd-row');
    if (!list.length) return;
    active = (i + list.length) % list.length;
    list.forEach((r, k) => r.classList.toggle('active', k === active));
    const row = list[active];
    if (row.offsetTop < dd.scrollTop) dd.scrollTop = row.offsetTop;
    else if (row.offsetTop + row.offsetHeight > dd.scrollTop + dd.clientHeight) dd.scrollTop = row.offsetTop + row.offsetHeight - dd.clientHeight;
  }
  function choose(name) {
    if (!current) return;
    current.value = name;
    fire(current);
    hide();
  }
  function render() {
    if (!current) return hide();
    const typed = current.value;
    const list = matchStates(typed);
    if (!list.length || (list.length === 1 && list[0].toLowerCase() === typed.trim().toLowerCase())) return hide();
    dd.innerHTML = '';
    const q = typed.trim();
    list.forEach(name => {
      const row = document.createElement('div');
      row.className = 'sd-row';
      row.dataset.name = name;
      const i = name.toLowerCase().indexOf(q.toLowerCase());
      if (i >= 0) {
        const b = document.createElement('b');
        b.textContent = name.slice(i, i + q.length);
        row.append(name.slice(0, i), b, name.slice(i + q.length));
      } else {
        row.textContent = name;
      }
      dd.appendChild(row);
    });
    dd.scrollTop = 0;
    position();
    dd.hidden = false;
    setActive(0);
  }

  document.addEventListener('focusin', e => { if (isState(e.target)) { current = e.target; e.target.setAttribute('autocomplete', 'off'); render(); } });
  document.addEventListener('input', e => { if (isState(e.target)) { current = e.target; render(); } });
  document.addEventListener('focusout', e => { if (isState(e.target)) hide(); });
  document.addEventListener('keydown', e => {
    if (!isState(e.target) || dd.hidden) return;
    const row = dd.querySelectorAll('.sd-row')[active];
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') { if (row) { e.preventDefault(); choose(row.dataset.name); } }
    else if (e.key === 'Tab') { if (row) choose(row.dataset.name); }
    else if (e.key === 'Escape') hide();
  });
  // mousedown (not click) so the textbox keeps focus
  dd.addEventListener('mousedown', e => {
    e.preventDefault();
    const row = e.target.closest('.sd-row');
    if (row) choose(row.dataset.name);
  });
  window.addEventListener('resize', position);
  document.addEventListener('scroll', position, true);
}

  window.XSM['xs-states'] = { init };
})();
