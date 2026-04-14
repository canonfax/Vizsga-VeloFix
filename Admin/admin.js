// ═══════════════════════════════════════════
//  ShimanoServiceCenter · admin.js
// ═══════════════════════════════════════════

(() => {
  let mechanics    = [];
  let appointments = [];
  let sortKey      = 'appointment_date';
  let sortAsc      = true;
  let filterMech   = 'all';

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function fmt(str) {
    if (!str) return '–';
    try {
      return new Date(str).toLocaleString('hu-HU', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
    } catch { return str; }
  }
  function todayStr()   { return new Date().toISOString().slice(0,10); }
  function weekAgoStr() { return new Date(Date.now() - 7*864e5).toISOString().slice(0,10); }

  function renderStats() {
    const today = todayStr(), wago = weekAgoStr();
    $('s-total').textContent = appointments.length;
    $('s-today').textContent = appointments.filter(a => (a.appointment_date||'').startsWith(today)).length;
    $('s-week').textContent  = appointments.filter(a => (a.appointment_date||'').slice(0,10) >= wago).length;
    $('s-mech').textContent  = mechanics.length || '–';
    $('nav-cnt').textContent = appointments.length;
  }

  function renderPills() {
    const wrap = $('pills');
    let html = `<button class="pill active" data-id="all">Mindenki <span class="pill-cnt">${appointments.length}</span></button>`;
    mechanics.forEach(m => {
      const id  = String(m.id ?? m.hairdresser_id);
      const cnt = appointments.filter(a => String(a.hairdresser_id) === id).length;
      html += `<button class="pill" data-id="${id}">${esc(m.name)} <span class="pill-cnt">${cnt}</span></button>`;
    });
    wrap.innerHTML = html;
    wrap.querySelectorAll('.pill').forEach(p => {
      p.addEventListener('click', () => {
        wrap.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
        p.classList.add('active');
        filterMech = p.dataset.id;
        renderTable();
      });
    });
  }

  function renderTable() {
    const tbody = $('tbody');
    const q     = ($('search').value || '').toLowerCase().trim();

    let data = appointments.filter(a => {
      if (filterMech !== 'all' && String(a.hairdresser_id) !== filterMech) return false;
      if (q && !(
        (a.customer_name  || '').toLowerCase().includes(q) ||
        (a.customer_phone || '').toLowerCase().includes(q) ||
        (a.service        || '').toLowerCase().includes(q)
      )) return false;
      return true;
    });

    data = [...data].sort((a, b) => {
      let va, vb;
      if (sortKey === 'mechanic') {
        const ma = mechanics.find(m => String(m.id ?? m.hairdresser_id) === String(a.hairdresser_id));
        const mb = mechanics.find(m => String(m.id ?? m.hairdresser_id) === String(b.hairdresser_id));
        va = ma?.name || ''; vb = mb?.name || '';
      } else { va = a[sortKey] || ''; vb = b[sortKey] || ''; }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ?  1 : -1;
      return 0;
    });

    $('rec-count').textContent = `${data.length} rekord`;

    if (!data.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Nincs találat</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(a => {
      const m = mechanics.find(x => String(x.id ?? x.hairdresser_id) === String(a.hairdresser_id));
      return `<tr>
        <td><span class="badge badge-date">${fmt(a.appointment_date)}</span></td>
        <td>${esc(m?.name || `#${a.hairdresser_id}`)}</td>
        <td>${esc(a.customer_name)}</td>
        <td class="muted">${esc(a.customer_phone)}</td>
        <td><span class="badge badge-svc">${esc(a.service)}</span></td>
        <td class="muted">${fmt(a.created_at)}</td>
      </tr>`;
    }).join('');
  }

  function initSort() {
    document.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const k = th.dataset.sort;
        sortAsc = sortKey === k ? !sortAsc : true;
        sortKey = k;
        document.querySelectorAll('th[data-sort]').forEach(x => x.classList.remove('sorted'));
        th.classList.add('sorted');
        th.querySelector('.sort-ico').textContent = sortAsc ? '↑' : '↓';
        renderTable();
      });
    });
  }

  async function loadData() {
    $('tbody').innerHTML = `<tr class="loading-row"><td colspan="6"><div class="spin"></div><br>Betöltés...</td></tr>`;
    [mechanics, appointments] = await Promise.all([API.getMechanics(), API.getAppointments()]);
    renderStats();
    renderPills();
    renderTable();
    $('ts').textContent = new Date().toLocaleTimeString('hu-HU');
  }

  $('search').addEventListener('input', renderTable);
  $('btn-refresh').addEventListener('click', loadData);
  initSort();
  loadData();
  setInterval(loadData, 30000);
})();