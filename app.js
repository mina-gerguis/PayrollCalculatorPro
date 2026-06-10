const BASE = 240.36,
    BONUS = 400,
    OT = 180.27;

const TYPES = [
    { value: 'normal', label: 'يوم طبيعي', hours: 8, meal: 45, cls: 't-normal', icon: '☀️' },
    { value: 'overtime', label: '12 ساعة', hours: 12, meal: 90, cls: 't-overtime', icon: '🕐' },
    { value: 'extra', label: 'يوم إضافي', hours: 8, meal: 45, cls: 't-extra', icon: '⭐' },
    { value: 'extra-overtime', label: 'يوم إضافي 12 ساعة', hours: 12, meal: 90, cls: 't-extra-overtime', icon: '⚡' },
    { value: 'holiday', label: 'إجازة', hours: 0, meal: 0, cls: 't-holiday', icon: '🌴' },
    { value: 'stop', label: 'توقف', hours: 0, meal: 0, cls: 't-stop', icon: '🚦' }
];
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const WDAYS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const KEY = 'salary-calc-data-v2';

function calcVal(t) {
    if (t === 'normal') return BASE + 45;
    if (t === 'overtime') return BASE + OT + 90;
    if (t === 'extra') return (BASE * 2) + 45;
    if (t === 'extra-overtime') return (BASE * 3) + 90;
    if (t === 'holiday') return 0;
    if (t === 'stop') return BASE;
    return 0;
}

let curMonth, curYear, selectedDay = null;
let allData = {};

function monthKey(m, y) { return y + '-' + m; }

function init() {
    const s = load();
    if (s) { allData = s.allData || {}; curMonth = s.curMonth; curYear = s.curYear; }
    if (curMonth == null) {
        const t = new Date(); curMonth = t.getMonth(); curYear = t.getFullYear();
    }
    ensureMonth(curMonth, curYear);
    loadMonthInputs();

    const savedTotal = localStorage.getItem("prevMonthTotal");
    if (savedTotal) {
        document.getElementById("prevMonthValue").textContent = Number(savedTotal).toFixed(2) + " جنيه";
    }

    render();
}

function genDates(m, y) {
    const ds = [];
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        const dt = new Date(y, m, i);
        ds.push(dt.toISOString().split('T')[0]);
    }
    return ds;
}

function ensureMonth(m, y) {
    const k = monthKey(m, y);
    if (!allData[k]) {
        allData[k] = { days: genDates(m, y).map(d => ({ date: d, type: '' })), bonus: 0, transport: 0, annual: 0, incentive: 0 };
    }
}

function getCur() { return allData[monthKey(curMonth, curYear)]; }

function changePeriod(dir) {
    let nm = curMonth + dir, ny = curYear;
    if (nm > 11) { nm = 0; ny++; } if (nm < 0) { nm = 11; ny--; }
    saveMonthInputs();
    curMonth = nm; curYear = ny;
    ensureMonth(curMonth, curYear);
    selectedDay = null;
    loadMonthInputs();
    save(); render();
}

function saveMonthInputs() {
    const d = getCur();
    d.bonus = +(document.getElementById('bonus').value) || 0;
    d.annual = +(document.getElementById('annual').value) || 0;
    d.transport = +(document.getElementById('transport').value) || 0;
    d.incentive = +(document.getElementById('incentive').value) || 0;
}

function loadMonthInputs() {
    const d = getCur();
    document.getElementById('bonus').value = d.bonus || 0;
    document.getElementById('transport').value = d.transport || 0;
    document.getElementById('annual').value = d.annual || 0;
    document.getElementById('incentive').value = d.incentive || 0;
}

function calcMonthTotal(data) {
    const daysTotal = data.days.reduce((s, d) => s + calcVal(d.type), 0);
    return daysTotal + (data.bonus || 0) + (data.annual || 0) + (data.incentive || 0) - (data.transport || 0);
}

function render() {
    const data = getCur();
    document.getElementById('periodLabel').textContent = MONTHS[curMonth] + ' ' + curYear;

    let lg = ''; TYPES.forEach(t => {
        lg += `<div class="legend-item ${t.cls}">${t.icon} ${t.label}<span class="price">${calcVal(t.value).toFixed(0)} ج</span></div>`;
    }); document.getElementById('legend').innerHTML = lg;

    let wd = ''; WDAYS.forEach(w => { wd += `<div>${w}</div>`; });
    document.getElementById('weekdays').innerHTML = wd;

    const days = data.days;
    const pad = new Date(days[0].date).getDay();
    let cal = ''; for (let i = 0; i < pad; i++)cal += '<div></div>';
    days.forEach(d => {
        const dt = new Date(d.date); const num = dt.getDate();
        const tc = d.type ? ` type-${d.type}` : '';
        const sel = selectedDay === d.date ? ' selected' : '';
        cal += `<div class="day-cell${tc}${sel}" onclick="selectDay('${d.date}')">${num}`;
        const tp = TYPES.find(t => t.value === d.type);
        if (tp) cal += `<span class="icon">${tp.icon}</span>`;
        cal += `</div>`;
    });
    document.getElementById('calendar').innerHTML = cal;

    const pop = document.getElementById('popup');
    if (selectedDay) {
        pop.classList.add('show');
        const sd = new Date(selectedDay);
        document.getElementById('popupLabel').innerHTML = `اختر نوع اليوم: <b>${sd.getDate()}/${sd.getMonth() + 1}</b>`;
        let pg = ''; TYPES.forEach(t => {
            const cur = days.find(d => d.date === selectedDay);
            const act = cur?.type === t.value ? ` active ${t.cls}` : '';
            pg += `<button class="popup-btn${act}" style="${cur?.type === t.value ? 'color:inherit' : ''}" onclick="setType('${selectedDay}','${t.value}')">
<span>${t.icon}</span><div><div class="name">${t.label}</div>
<div class="detail">${t.hours} ساعة • وجبة ${t.meal} • ${calcVal(t.value).toFixed(2)} ج</div></div></button>`;
        }); document.getElementById('popupGrid').innerHTML = pg;
    } else { pop.classList.remove('show'); }

    let cc = ''; TYPES.forEach(t => {
        const cnt = days.filter(d => d.type === t.value).length;
        cc += `<div class="count-card ${t.cls}"><div><div class="num">${cnt}</div><div class="lbl">${t.label}</div></div></div>`;
    }); document.getElementById('counts').innerHTML = cc;

    const daysTotal = days.reduce((s, d) => s + calcVal(d.type), 0);
    const b = +(document.getElementById('bonus').value) || 0;
    const tr = +(document.getElementById('transport').value) || 0;
    const an = +(document.getElementById('annual').value) || 0;
    const inc = +(document.getElementById('incentive').value) || 0;
    const currentNet = daysTotal + b + an + inc - tr;

    document.getElementById('currentMonthBreakdown').innerHTML = `
                <h2>🧮 تفاصيل حسبة الشهر الحالي</h2>
                <div class="row"><span>المرتب (أيام العمل)</span><span>${daysTotal.toFixed(2)} ج</span></div>
                <div class="row"><span>إضافات (مواصلات + سنوي + حافز)</span><span style="color: green;">+ ${(b + an + inc).toFixed(2)} ج</span></div>
                <div class="row"><span>سلف وخصومات</span><span style="color: red;">- ${tr.toFixed(2)} ج</span></div>
                <div class="row grand"><h3>صافي الشهر الحالي</h3><span>${currentNet.toFixed(2)} ج</span></div>
            `;

    saveMonthInputs();
    let allGrand = 0;
    let chips = '';

    const keys = Object.keys(allData).sort((a, b) => {
        const [ya, ma] = a.split('-').map(Number);
        const [yb, mb] = b.split('-').map(Number);
        return ya - yb || ma - mb;
    });

    keys.forEach(k => {
        const md = allData[k];
        const mt = calcMonthTotal(md);
        const hasData = md.days.some(d => d.type !== '') || Number(md.bonus) > 0 || Number(md.annual) !== 0 || Number(md.incentive) !== 0 || Number(md.transport) > 0;
        allGrand += mt;
        if (hasData) {
            const [year, month] = k.split('-');
            const mName = MONTHS[Number(month)];
            chips += `<span class="month-chip">${mName} ${year} : <span class="val">${mt.toFixed(0)} ج</span></span>`;
        }
    });

    if (chips !== '') {
        document.getElementById('allTotals').style.display = 'block';
        document.getElementById('allTotals').innerHTML = `
<h2>🏦 المجموع الكلي </h2>
<div style="margin-bottom:8px;flex-wrap:wrap;display:flex;gap:4px">${chips}</div>
<div class="row grand"><h3>الإجمالي الكلي</h3><span>${allGrand.toFixed(2)} جنيه</span></div>`;
    } else {
        document.getElementById('allTotals').style.display = 'none';
    }
}

function selectDay(date) { selectedDay = selectedDay === date ? null : date; render(); }

function setType(date, type) {
    const data = getCur();
    data.days = data.days.map(d => d.date === date ? { ...d, type: d.type === type ? '' : type } : d);
    selectedDay = null; save(); render();
}

function resetMonth() {
    const k = monthKey(curMonth, curYear);
    allData[k] = { days: genDates(curMonth, curYear).map(d => ({ date: d, type: '' })), bonus: 0, transport: 0, annual: 0, incentive: 0 };
    document.getElementById('bonus').value = 0;
    document.getElementById('transport').value = 0;
    document.getElementById('annual').value = 0;
    document.getElementById('incentive').value = 0;
    selectedDay = null; save(); render();
}

function resetAll() {
    if (!confirm('هل أنت متأكد من مسح بيانات كل الشهور؟')) return;
    allData = {};
    ensureMonth(curMonth, curYear);
    document.getElementById('bonus').value = 0;
    document.getElementById('transport').value = 0;
    document.getElementById('annual').value = 0;
    document.getElementById('incentive').value = 0;
    selectedDay = null; save(); render();
}

function save() {
    saveMonthInputs();
    localStorage.setItem(KEY, JSON.stringify({ allData, curMonth, curYear }));
}

function load() { try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch { return null; } }

init();

function archiveAndReset() {
    saveMonthInputs();
    
    let allRegisteredDays = [];
    Object.keys(allData).forEach(k => {
        if (allData[k] && allData[k].days) {
            allRegisteredDays = allRegisteredDays.concat(allData[k].days);
        }
    });

    const filteredDays = allRegisteredDays.filter(d => d.type !== '');
    filteredDays.sort((a, b) => new Date(a.date) - new Date(b.date));

    const countNormal = filteredDays.filter(d => d.type === 'normal').length;
    const countOvertime = filteredDays.filter(d => d.type === 'overtime').length;
    const countExtra = filteredDays.filter(d => d.type === 'extra').length;
    const countExtraOvertime = filteredDays.filter(d => d.type === 'extra-overtime').length;
    const countHoliday = filteredDays.filter(d => d.type === 'holiday').length;
    const countStop = filteredDays.filter(d => d.type === 'stop').length;
    
    const valNormal = countNormal * calcVal('normal');
    const valOvertime = countOvertime * calcVal('overtime');
    const valExtra = countExtra * calcVal('extra');
    const valExtraOvertime = countExtraOvertime * calcVal('extra-overtime');
    const valStop = countStop * calcVal('stop');
    const valHoliday = countHoliday * calcVal('holiday');
    
    let totalNormalHours = (countNormal * 8) + (countExtra * 8);
    let totalOvertimeHours = (countOvertime * 12) + (countExtraOvertime * 12);
    
    const daysTotal = filteredDays.reduce((s, d) => s + calcVal(d.type), 0);
    const b = +(document.getElementById('bonus').value) || 0;
    const tr = +(document.getElementById('transport').value) || 0;
    const an = +(document.getElementById('annual').value) || 0;
    const inc = +(document.getElementById('incentive').value) || 0;
    const currentNet = daysTotal + b + an + inc - tr;

    let daysTableRows = '';
    filteredDays.forEach(d => {
        const tp = TYPES.find(t => t.value === d.type);
        const dayDate = new Date(d.date);
        const formattedDate = dayDate.getDate() + '/' + (dayDate.getMonth() + 1) + '/' + dayDate.getFullYear();
        const dayName = WDAYS[dayDate.getDay()];
        daysTableRows += `<tr><td>${formattedDate} (${dayName})</td><td>${tp ? tp.icon + ' ' + tp.label : d.type}</td><td>${tp ? tp.hours : 0} ساعة</td><td>${calcVal(d.type).toFixed(2)} ج</td></tr>`;
    });

    const printWindow = window.open('', '_blank', 'width=850,height=900');
    printWindow.document.write(`
    <html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>تقرير الراتب</title><style>body{font-family:Tahoma;padding:20px;}.report-card{border:2px solid #2563eb;padding:20px;border-radius:15px;}.section-title{background:#f1f5f9;padding:5px;margin:15px 0;border-right:4px solid #2563eb;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:right;}.net{text-align:center;font-size:20px;color:green;margin-top:20px;}</style></head>
    <body><div class="report-card"><h1>تقرير الراتب (دورة 26-25)</h1><table><thead><tr><th>التاريخ</th><th>النوع</th><th>الساعات</th><th>المبلغ</th></tr></thead><tbody>${daysTableRows}</tbody></table>
    <div class="section-title">ملخص الحسابات</div>
    <p>إجمالي الأيام: ${daysTotal.toFixed(2)} ج | الإضافات: ${(b+an+inc).toFixed(2)} ج | الخصومات: ${tr.toFixed(2)} ج</p>
    <div class="net"><h2>صافي القبض: ${currentNet.toFixed(2)} ج</h2></div>
    <div style="font-size:12px;margin-top:20px;">تصميم: مينا جرجس ©️</div>
    </div></body></html>`);
    printWindow.document.close();

    localStorage.setItem("prevMonthTotal", currentNet);
    allData = {};
    ensureMonth(curMonth, curYear);
    document.getElementById('bonus').value = 0;
    document.getElementById('transport').value = 0;
    document.getElementById('annual').value = 0;
    document.getElementById('incentive').value = 0;
    save(); render();
}
