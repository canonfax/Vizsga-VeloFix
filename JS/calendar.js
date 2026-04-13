
// ShimanoServiceCenter - calendar.js


const Calendar = (() => {
    let _year, _month, _selected, _onPick, _containerId;

    const MONTHS = ['Január','Február','Március','Április','Május','Június',
                    'Július','Augusztus','Szeptember','Október','November','December'];
    const DAYS = ['H','K','Sze','Cs','P','Szo','V'];

    function _pad(n) { return String(n).padStart(2,'0'); }
    function _dateKey(y, m, d,) { return `${y}-${_pad(m+1)}-${_pad(d)}`; }

    function _build(year, month, selected) {
        const today = new Date(); today.setHours(0,0,0,0);
        const first = new Date(year, month, 1);
        const startCol = (first.getDay() +6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
    }
})