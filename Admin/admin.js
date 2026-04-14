// ═══════════════════════════════════════════
//  ShimanoServiceCenter · admin.js
// ═══════════════════════════════════════════

(() => {
  let mechanics    = [];
  let appointments = [];
  let sortKey      = 'appointment_date';
  let sortAsc      = true;
  let filterMech   = 'all';
  let filterCard   = 'all';  // 'all' | 'today' | 'week'
  let showFuture   = false;

  const DELETED_KEY = 'shimano_deleted_ids';

  function getDeleted() {
    try { return new Set(JSON.parse(localStorage.getItem(DELETED_KEY) || '[]')); }
    catch { return new Set(); }
  }
  function addDeleted(id) {
    const set = getDeleted();
    set.add(String(id));
    localStorage.setItem(DELETED_KEY, JSON.stringify([...set]));
  }
  function clearDeleted() { localStorage.removeItem(DELETED_KEY); }

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function fmt(str) {
    if (!str) return '–';
    try {
      return new Date(str).toLocaleString('hu-HU', {
        year:'numeric', month:'2-digit', day:'2-digit',
        hour:'2-digit', minute:'2-digit'
      });
    } catch { return str; }
  }
  function todayStr()   { return new Date().toISOString().slice(0,10); }
  function weekAgoStr() { return new Date(Date.now() - 7*864e5).toISOString().slice(0,10); }
  function isFuture(a)  { return a.appointment_date && new Date(a.appointment_date) >= new Date(); }

  // ── Stat kártyák ──
  function renderStats() {
    const deleted = getDeleted();
    const visible = appointments.filter(a => !deleted.has(String(a.id)));
    const today   = todayStr(), wago = weekAgoStr();
    $('s-total').textContent = visible.length;
    $('s-today').textContent = visible.filter(a => (a.appointment_date||'').startsWith(today)).length;
    $('s-week').textContent  = visible.filter(a => (a.appointment_date||'').slice(0,10) >= wago).length;
    $('s-mech').textContent  = mechanics.length || '–';
    $('nav-cnt').textContent = visible.length;

    // Aktív kártya kiemelése
    document.querySelectorAll('.stat-card[data-filter]').forEach(c => {
      c.classList.toggle('active', c.dataset.filter === filterCard);
    });
  }

  // ── Filter pillek ──
  function renderPills() {
    const deleted = getDeleted();
    const visible = appointments.filter(a => !deleted.has(String(a.id)));
    const wrap    = $('pills');
    let html = `<button class="pill active" data-id="all">Mindenki <span class="pill-cnt">${visible.length}</span></button>`;
    mechanics.forEach(m => {
      const id  = String(m.id ?? m.hairdresser_id);
      const cnt = visible.filter(a => String(a.hairdresser_id) === id).length;
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

  // ── Táblázat ──
  function renderTable() {
    const tbody   = $('tbody');
    const q       = ($('search').value || '').toLowerCase().trim();
    const deleted = getDeleted();
    const today   = todayStr();
    const wago    = weekAgoStr();

    let data = appointments.filter(a => {
      if (deleted.has(String(a.id)))                                       return false;
      if (showFuture && !isFuture(a))                                      return false;
      if (filterMech !== 'all' && String(a.hairdresser_id) !== filterMech) return false;

      // Stat kártya szűrő
      if (filterCard === 'today' && !(a.appointment_date||'').startsWith(today)) return false;
      if (filterCard === 'week'  && (a.appointment_date||'').slice(0,10) < wago) return false;

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
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Nincs találat</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(a => {
      const m    = mechanics.find(x => String(x.id ?? x.hairdresser_id) === String(a.hairdresser_id));
      const past = !isFuture(a);
      return `<tr class="${past ? 'row-past' : ''}">
        <td><span class="badge badge-date">${fmt(a.appointment_date)}</span></td>
        <td>${esc(m?.name || `#${a.hairdresser_id}`)}</td>
        <td>${esc(a.customer_name)}</td>
        <td class="muted">${esc(a.customer_phone)}</td>
        <td><span class="badge badge-svc">${esc(a.service)}</span></td>
        <td class="muted">${fmt(a.created_at)}</td>
        <td><button class="btn-delete" data-id="${a.id}" title="Törlés">🗑</button></td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Biztosan elrejted ezt a foglalást?')) return;
        addDeleted(btn.dataset.id);
        renderStats();
        renderPills();
        renderTable();
      });
    });
  }

  // ── Stat kártya kattintás ──
  function initStatCards() {
    document.querySelectorAll('.stat-card[data-filter]').forEach(card => {
      card.addEventListener('click', () => {
        const f = card.dataset.filter;
        // Ha ugyanarra kattint → visszaáll "all"-ra
        filterCard = filterCard === f ? 'all' : f;
        renderStats();
        renderTable();
      });
    });
  }

  // ── Rendezés ──
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

  function initFutureToggle() {
    const btn = $('btn-future');
    btn.addEventListener('click', () => {
      showFuture = !showFuture;
      btn.classList.toggle('active', showFuture);
      btn.textContent = showFuture ? '📅 Összes mutatása' : '📅 Csak jövőbeli';
      renderTable();
    });
  }

  function initClearDeleted() {
    $('btn-restore').addEventListener('click', () => {
      if (!confirm('Visszaállítod az összes elrejtett foglalást?')) return;
      clearDeleted();
      renderStats();
      renderPills();
      renderTable();
    });
  }

  async function loadData() {
    $('tbody').innerHTML = `<tr class="loading-row"><td colspan="7"><div class="spin"></div><br>Betöltés...</td></tr>`;
    [mechanics, appointments] = await Promise.all([API.getMechanics(), API.getAppointments()]);
    renderStats();
    renderPills();
    renderTable();
    $('ts').textContent = new Date().toLocaleTimeString('hu-HU');
  }

  $('search').addEventListener('input', renderTable);
  $('btn-refresh').addEventListener('click', loadData);
  initSort();
  initStatCards();
  initFutureToggle();
  initClearDeleted();
  loadData();
  setInterval(loadData, 30000);
})();