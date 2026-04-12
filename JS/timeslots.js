
// ShimanoServiceCenter - timeslots.js


const TimeSlots = (() => {

    // Percek → "HH:MM"
    function _minToStr(m) {
        return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
    }
    // "HH:MM" → percek
    function _strToMin(s) {
        const [h, m] = s.split(':').map(Number);
        return h * 60 + m;
    }

    // Feladat neve alapján időtartam percben
    function _getDuration(serviceName) {
        if (!serviceName) return CONFIG.SLOT_MIN;
        const svc = SERVICES.find(s => s.name === serviceName);
        return svc ? svc.duration : CONFIG.SLOT_MIN;
    }

    // Összes lehetséges slot generálása (30 perces egységek)
    function _genAll(mechanic) {
        const slots = [];
        const startMin = _strToMin(mechanic.work_start || '08:00');
        const endMin = _strToMin(mechanic.work_end || '17:00');
        for (let m = startMin; m < endMin; m += CONFIG.SLOT_MIN) {
            slots.push(_minToStr(m));
        }
        return slots;
    }

    // Foglaltidőintervallumok kiszámítása (start + duration)
})