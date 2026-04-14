// ═══════════════════════════════════════════
//  ShimanoServiceCenter · api.js
// ═══════════════════════════════════════════

const API = {

  // GET /api/hairdressers  →  mindig fallback-et használunk
  async getMechanics() {
    return FALLBACK_MECHANICS;
  },

  // GET /api/appointments?api_key=xxx
  async getAppointments() {
    try {
      const r = await fetch(`${CONFIG.API_BASE}/api/appointments?api_key=${CONFIG.API_KEY}`);
      if (r.ok) return await r.json();
      console.error('[API] getAppointments:', r.status, await r.text());
    } catch (e) {
      console.error('[API] getAppointments hiba:', e.message);
    }
    return [];
  },

  // POST /api/appointments?api_key=xxx  (api_key az URL-ben!)
  async createAppointment({ hairdresserId, customerName, customerPhone, appointmentDate, service }) {
    try {
      const payload = {
        hairdresser_id   : Number(hairdresserId),
        api_key          : CONFIG.API_KEY,
        customer_name    : customerName,
        customer_phone   : customerPhone,
        appointment_date : appointmentDate,   // 'YYYY-MM-DD HH:MM:00'
        service          : service,
      };

      const r = await fetch(`${CONFIG.API_BASE}/api/appointments?api_key=${CONFIG.API_KEY}`, {
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify(payload),
      });

      const txt = await r.text();
      let json = {};
      try { json = JSON.parse(txt); } catch {}

      if (r.ok) return { ok: true };
      return { ok: false, error: json.message || json.error || txt || `HTTP ${r.status}` };

    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  // Foglalt slotok lekérése (egy szerelőhöz, egy napra)
  async getBookedSlots(hairdresserId, dateStr) {
    const all = await this.getAppointments();
    return all
      .filter(a =>
        String(a.hairdresser_id) === String(hairdresserId) &&
        (a.appointment_date || '').startsWith(dateStr)
      )
      .map(a => ({
        start : (a.appointment_date || '').slice(11, 16),
        service: a.service || '',
      }));
  },
};