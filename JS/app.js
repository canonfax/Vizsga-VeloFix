// ═══════════════════════════════════════════
//  ShimanoServiceCenter · app.js
// ═══════════════════════════════════════════

(() => {
  let mechanics = [];
  let chosen    = null;
  let selDate   = null;
  let selSlot   = null;
  let selService = null;

  const app = document.getElementById('app');

  function setStep(n) {
    document.querySelectorAll('.step-dot').forEach((el, i) => {
      el.classList.toggle('active', i + 1 === n);
      el.classList.toggle('done',   i + 1 <  n);
    });
    document.querySelectorAll('.step-line').forEach((el, i) => {
      el.classList.toggle('done', i + 1 < n);
    });
  }

  function toast(msg, type = '') {
    const c = document.getElementById('toasts');
    const t = document.createElement('div');
    t.className = 'toast' + (type ? ' ' + type : '');
    t.textContent = msg;
    c.appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3500);
  }

  function fmtDate(s) {
    if (!s) return '–';
    const [y, m, d] = s.split('-');
    return `${y}. ${m}. ${d}.`;
  }

  function getDurLabel(serviceName) {
    const svc = SERVICES.find(s => s.name === serviceName);
    if (!svc) return '';
    const d = svc.duration;
    return d >= 60 ? `${d/60} óra` : `${d} perc`;
  }

  function checkSubmit() {
    const btn = document.getElementById('btn-submit');
    if (btn) btn.disabled = !(selDate && selSlot && selService);
  }

  async function refreshSlots() {
    if (!selDate || !selService || !chosen) return;
    const panel = document.getElementById('slots-panel');
    if (panel) panel.style.display = 'block';
    await TimeSlots.render('slots', chosen, selDate, selService, (slot) => {
      selSlot = slot;
      const sumS = document.getElementById('sum-s');
      if (sumS) sumS.textContent = slot;
      checkSubmit();
    });
    selSlot = null;
    const sumS = document.getElementById('sum-s');
    if (sumS) sumS.textContent = '–';
    checkSubmit();
  }

  // ══════════════════════════════════════════
  //  LÉPÉS 1 – Szerelők
  // ══════════════════════════════════════════
  async function step1() {
    setStep(1);
    chosen = null; selDate = null; selSlot = null; selService = null;

    app.innerHTML = `<div class="loader"><div class="spin"></div><span>Betöltés...</span></div>`;
    mechanics = await API.getMechanics();

    app.innerHTML = `
      <div class="section-intro">
        <div class="section-badge">Shimano Service Center</div>
        <h2 class="section-title">Válassz szakembert</h2>
        <p class="section-sub">Kattints egy technikusra az időpontfoglalás megkezdéséhez</p>
      </div>
      <div class="mechanics-grid" id="mech-grid"></div>
    `;

    const grid = document.getElementById('mech-grid');
    mechanics.forEach((m) => {
      const id = m.id ?? m.hairdresser_id;
      const card = document.createElement('div');
      card.className = 'mech-card';
      card.innerHTML = `
        <div class="mech-shimano-logo">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Shimano_logo.svg/320px-Shimano_logo.svg.png" alt="Shimano" onerror="this.style.display='none'">
        </div>
        <div class="mech-avatar">
          <div class="mech-avatar-inner">👨‍🔧</div>
        </div>
        <h3 class="mech-name">${m.name}</h3>
        <div class="mech-title">${m.title || 'Certified Technician'}</div>
        <div class="mech-hours">
          <span class="hours-ico">🕐</span>
          <span>${m.work_start || '08:00'} – ${m.work_end || '17:00'}</span>
        </div>
        <button class="btn-primary">Időpontot foglalok</button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        chosen = { ...m, id };
        step2();
      });
      grid.appendChild(card);
    });
  }

  // ══════════════════════════════════════════
  //  LÉPÉS 2 – Foglalás
  // ══════════════════════════════════════════
  function step2() {
    setStep(2);
    selDate = null; selSlot = null; selService = null;

    app.innerHTML = `
      <button class="btn-back" id="btn-back">← Vissza</button>

      <div class="booking-who">
        <div class="bw-badge">Kiválasztott technikus</div>
        <div class="bw-name">${chosen.name}</div>
        <div class="bw-title">${chosen.title || 'Certified Technician'}</div>
        <div class="bw-hours">Munkaidő: ${chosen.work_start || '08:00'} – ${chosen.work_end || '17:00'}</div>
      </div>

      <div class="booking-layout">
        <!-- BAL -->
        <div class="booking-left">
          <div class="panel">
            <div class="panel-label">Dátum kiválasztása</div>
            <div id="cal"></div>
          </div>
          <div class="panel" id="slots-panel" style="display:none">
            <div class="panel-label">Szabad időpontok</div>
            <div id="slots"></div>
          </div>
        </div>

        <!-- JOBB -->
        <div class="booking-right">
          <div class="panel">
            <div class="panel-label">Adataid</div>
            <div class="form-group">
              <label>Teljes neved *</label>
              <input id="inp-name" type="text" placeholder="pl. Kovács János" autocomplete="name">
            </div>
            <div class="form-group">
              <label>Telefonszám *</label>
              <input id="inp-phone" type="tel" placeholder="pl. 06301234567" autocomplete="tel">
            </div>
            <div class="form-group">
              <label>Szervíz típusa *</label>
              <select id="inp-svc">
                <option value="">— Válassz szervízt —</option>
                ${SERVICES.map(s => `<option value="${s.name}" data-dur="${s.duration}">${s.name} (${s.duration >= 60 ? s.duration/60+' óra' : s.duration+' perc'})</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="panel summary-panel">
            <div class="panel-label">Összefoglaló</div>
            <div class="sum-row"><span>Technikus</span><strong>${chosen.name}</strong></div>
            <div class="sum-row"><span>Dátum</span><strong id="sum-d">–</strong></div>
            <div class="sum-row"><span>Időpont</span><strong id="sum-s">–</strong></div>
            <div class="sum-row"><span>Szervíz</span><strong id="sum-svc">–</strong></div>
          </div>

          <button class="btn-primary btn-submit" id="btn-submit" disabled>
            Időpontot foglalok →
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-back').addEventListener('click', step1);

    // Szervíz változás → slotok újratöltése
    document.getElementById('inp-svc').addEventListener('change', async (e) => {
      selService = e.target.value || null;
      selSlot = null;
      const sumSvc = document.getElementById('sum-svc');
      if (sumSvc) sumSvc.textContent = selService || '–';
      checkSubmit();
      if (selDate && selService) await refreshSlots();
    });

    // Naptár
    Calendar.init('cal', async (date) => {
      selDate = date;
      selSlot = null;
      const sumD = document.getElementById('sum-d');
      const sumS = document.getElementById('sum-s');
      if (sumD) sumD.textContent = fmtDate(date);
      if (sumS) sumS.textContent = '–';
      checkSubmit();
      if (selService) await refreshSlots();
      else {
        const panel = document.getElementById('slots-panel');
        if (panel) { panel.style.display = 'block'; }
        const slots = document.getElementById('slots');
        if (slots) slots.innerHTML = `<p class="slots-empty">Először válassz szervíztípust!</p>`;
      }
    });

    document.getElementById('btn-submit').addEventListener('click', doSubmit);
  }

  // ══════════════════════════════════════════
  //  SUBMIT
  // ══════════════════════════════════════════
  async function doSubmit() {
    const name    = document.getElementById('inp-name').value.trim();
    const phone   = document.getElementById('inp-phone').value.trim();
    const service = document.getElementById('inp-svc').value;

    if (!name)    return toast('Add meg a neved!', 'err');
    if (!phone)   return toast('Add meg a telefonszámodat!', 'err');
    if (!service) return toast('Válassz szervíztípust!', 'err');
    if (!selDate) return toast('Válassz dátumot!', 'err');
    if (!selSlot) return toast('Válassz időpontot!', 'err');

    const btn = document.getElementById('btn-submit');
    btn.disabled = true;
    btn.textContent = 'Küldés...';

    const res = await API.createAppointment({
      hairdresserId   : chosen.id,
      customerName    : name,
      customerPhone   : phone,
      appointmentDate : `${selDate} ${selSlot}:00`,
      service,
    });

    if (res.ok) {
      step3({ name, service });
    } else {
      toast('Hiba: ' + (res.error || 'Ismeretlen hiba'), 'err');
      btn.disabled = false;
      btn.textContent = 'Időpontot foglalok →';
    }
  }

  // ══════════════════════════════════════════
  //  LÉPÉS 3 – Siker
  // ══════════════════════════════════════════
  function step3({ name, service }) {
    setStep(3);
    const durLabel = getDurLabel(service);
    app.innerHTML = `
      <div class="success-wrap">
        <div class="success-icon">✓</div>
        <h2 class="success-title">Foglalás rögzítve!</h2>
        <p class="success-sub">Köszönjük, <strong>${name}</strong>! Időpontod sikeresen rögzítettük.</p>
        <div class="success-card">
          <div class="sum-row"><span>Technikus</span><strong>${chosen.name}</strong></div>
          <div class="sum-row"><span>Időpont</span><strong>${fmtDate(selDate)} ${selSlot}</strong></div>
          <div class="sum-row"><span>Szervíz</span><strong>${service}</strong></div>
          <div class="sum-row"><span>Időtartam</span><strong>${durLabel}</strong></div>
        </div>
        <button class="btn-primary" id="btn-restart">← Új foglalás</button>
      </div>
    `;
    document.getElementById('btn-restart').addEventListener('click', step1);
  }

  document.addEventListener('DOMContentLoaded', step1);
})();