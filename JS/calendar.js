// ═══════════════════════════════════════════
//  ShimanoServiceCenter · calendar.js
// ═══════════════════════════════════════════

const Calendar = (() => {
  let _year, _month, _selected, _onPick, _containerId;

  const MONTHS = ['Január','Február','Március','Április','Május','Június',
                  'Július','Augusztus','Szeptember','Október','November','December'];
  const DAYS   = ['H','K','SZ','CS','P','SZ','V'];

  function _pad(n) { return String(n).padStart(2,'0'); }
  function _dateKey(y, m, d) { return `${y}-${_pad(m+1)}-${_pad(d)}`; }

  function _build(year, month, selected) {
    const today = new Date(); today.setHours(0,0,0,0);
    const first = new Date(year, month, 1);
    const startCol = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = `
      <div class="cal-header">
        <button class="cal-nav" id="cal-prev">&#8249;</button>
        <span class="cal-title">${year} / ${MONTHS[month]}</span>
        <button class="cal-nav" id="cal-next">&#8250;</button>
      </div>
      <div class="cal-grid">
        ${DAYS.map(d => `<div class="cal-day-name">${d}</div>`).join('')}
    `;

    for (let i = 0; i < startCol; i++) html += `<div class="cal-cell"></div>`;

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d); date.setHours(0,0,0,0);
      const key  = _dateKey(year, month, d);
      const past = date < today;
      const wend = date.getDay() === 0 || date.getDay() === 6;
      const now  = date.getTime() === today.getTime();
      const sel  = key === selected;

      let cls = 'cal-cell';
      if (past || wend) cls += ' disabled';
      if (now)          cls += ' today';
      if (sel)          cls += ' selected';

      const attr = (!past && !wend) ? `data-date="${key}"` : '';
      html += `<div class="${cls}" ${attr}>${d}</div>`;
    }
    html += `</div>`;
    return html;
  }

  function _attach() {
    const container = document.getElementById(_containerId);
    if (!container) return;
    container.querySelector('#cal-prev')?.addEventListener('click', () => {
      _month--; if (_month < 0) { _month = 11; _year--; } _render();
    });
    container.querySelector('#cal-next')?.addEventListener('click', () => {
      _month++; if (_month > 11) { _month = 0; _year++; } _render();
    });
    container.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
      cell.addEventListener('click', () => {
        _selected = cell.dataset.date;
        _onPick && _onPick(_selected);
        container.querySelectorAll('.cal-cell').forEach(c => c.classList.remove('selected'));
        cell.classList.add('selected');
      });
    });
  }

  function _render() {
    const container = document.getElementById(_containerId);
    if (!container) return;
    container.innerHTML = _build(_year, _month, _selected);
    _attach();
  }

  return {
    init(containerId, onPick) {
      const now = new Date();
      _containerId = containerId;
      _year        = now.getFullYear();
      _month       = now.getMonth();
      _selected    = null;
      _onPick      = onPick;
      _render();
    },
    reset() { _selected = null; _render(); },
  };
})();