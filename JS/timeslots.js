
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

    // Foglalt időintervallumok kiszámítása (start + duration)
    function _getBlockedRanges(bookedSlots) {
        return bookedSlots.map(b => {
            const startMin = _strToMin(b.start);
            const dur = _getDuration(b.service);
            return { from: startMin, to: startMin + dur };
        });
    }

    // Egy slot szabad-e a kiválasztott szervízhez?
    function _isFree(slotStr, selectedDuration, blockedRanges, endMin) {
        const slotMin = _strToMin(slotStr);
        const slotEnd = slotMin + selectedDuration;

        // Nem fér be a munkaidőbe
        if (slotEnd > endMin) return false;

        // Ütközik-e bármely foglalt intervallummal?
        for (const r of blockedRanges) {
            if (slotMin < r.to && slotEnd > r.from) return false;
        }
        return true;
    }

    async function render(containerId, mechanic, dateStr, selectedService, onPick) {
        const wrap = document.getElementById(containerId);
        if (!wrap) return;

        wrap.innerHTML = `<div class="slots-loading"><span class="spin-sm"></span> Időpontok betöltése...</div>`;

        const bookedRaw = await API.getBookedSlots(mechanic.id || mechanic.hairdresser_id, dateStr);
        const blockedRanges = _getBlockedRanges(bookedRaw);
        const allSlots = _genAll(mechanic);
        const selectedDur = _getDuration(selectedService);
        const endMin = _strToMin(mechanic.work_end || '17:00');

        // Mai nap: múlt slotok kizárása
        const now = new Date();
        const todayKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        const isToday = dateStr === todayKey;
        const nowMin = now.getHours() * 60 + now.getMinutes();

        const free = allSlots.filter(slot => {
            if (isToday && _strToMin(slot) <= nowMin) return false;
            return _isFree(slot, selectedDur, blockedRanges, endMin);
        });

        if (!free.length) {
            wrap.innerHTML = `<p class="slots-empty">Erre a napra nincs szabad időpont a kiválasztott szervízhez.</p>`;
            return;
        }

        // Időtartam megjelenítése
        const durLabel = selectedDur >= 60
        ? `${selectedDur/60} óra`
        : `${selectedDur} perc`;

        wrap.innerHTML = `
            <div class="slots-duration-note">⏱ A kiválasztott szervíz időtartama: <strong>${durLabel}</strong></div>
            <div class="slots-grid">${
                free.map(s => `<button class="slot-btn" data-slot="${s}">${s}</button>`).join('')
            }</div>
        `;

        wrap.querySelectorAll('.slot-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                wrap.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                onPick(btn.dataset.slot);
            });
        });
    }

    return { render };
})();