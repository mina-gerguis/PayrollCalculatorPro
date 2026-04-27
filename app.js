  const BASE = 211.538,
            OT = 158.653,
            BONUS = 19.23,
            TRAVEL = 13.84;
            
        const TYPES = [
            { value: 'normal', label: 'يوم عادي', hours: 8, meal: 45, cls: 't-normal', icon: '☀️' },
            { value: 'overtime', label: 'ساعات إضافية', hours: 12, meal: 90, cls: 't-overtime', icon: '🕐' },
            { value: 'extra', label: 'يوم إضافي', hours: 8, meal: 45, cls: 't-extra', icon: '⭐' },
            { value: 'extra-overtime', label: 'إضافي + ساعات', hours: 12, meal: 90, cls: 't-extra-overtime', icon: '⚡' },
            { value: 'holiday', label: 'إجازة', hours: 0, meal: 0, cls: 't-holiday', icon: '🌴' },
            { value: 'stop', label: 'توقف', hours: 0, meal: 0, cls: 't-stop', icon: '🚦' }
        ];
        const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const WDAYS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
        const KEY = 'salary-calc-data-v2';

        function calcVal(t) {
            if (t === 'normal') return BASE + BONUS + TRAVEL + 45;
            if (t === 'overtime') return BASE + BONUS + TRAVEL + OT + 90;
            if (t === 'extra') return (BASE * 2) + BONUS + TRAVEL + 45;
            if (t === 'extra-overtime') return (BASE * 3) + BONUS + TRAVEL + 90;
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
            
            // تحميل الإجمالي المحفوظ من قبل وعرضه
            const savedTotal = localStorage.getItem("prevMonthTotal");
            if(savedTotal) {
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
                allData[k] = { days: genDates(m, y).map(d => ({ date: d, type: '' })), bonus: 0, transport: 0, annual: 0 };
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
        }

        function loadMonthInputs() {
            const d = getCur();
            document.getElementById('bonus').value = d.bonus || 0;
            document.getElementById('transport').value = d.transport || 0;
            document.getElementById('annual').value = d.annual || 0;
        }

        function calcMonthTotal(data) {
            const daysTotal = data.days.reduce((s, d) => s + calcVal(d.type), 0);
            return daysTotal + (data.bonus || 0) + (data.annual || 0) - (data.transport || 0);
        }

        function render() {
            const data = getCur();
            
            document.getElementById('periodLabel').textContent = MONTHS[curMonth] + ' ' + curYear;

            // legend
            let lg = ''; TYPES.forEach(t => {
                lg += `<div class="legend-item ${t.cls}">${t.icon} ${t.label}<span class="price">${calcVal(t.value).toFixed(0)} ج</span></div>`;
            }); document.getElementById('legend').innerHTML = lg;

            // weekdays
            let wd = ''; WDAYS.forEach(w => { wd += `<div>${w}</div>`; });
            document.getElementById('weekdays').innerHTML = wd;

            // calendar
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

            // popup
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

            // counts
            let cc = ''; TYPES.forEach(t => {
                const cnt = days.filter(d => d.type === t.value).length;
                cc += `<div class="count-card ${t.cls}"><div><div class="num">${cnt}</div><div class="lbl">${t.label}</div></div></div>`;
            }); document.getElementById('counts').innerHTML = cc;

            // حسبة الشهر الحالي والتفاصيل
            const daysTotal = days.reduce((s, d) => s + calcVal(d.type), 0);
            const b = +(document.getElementById('bonus').value) || 0;
            const tr = +(document.getElementById('transport').value) || 0;
            const an = +(document.getElementById('annual').value) || 0;
            const currentNet = daysTotal + b + an - tr;

            document.getElementById('currentMonthBreakdown').innerHTML = `
                <h2>🧮 تفاصيل حسبة الشهر الحالي</h2>
                <div class="row"><span>المرتب (أيام العمل)</span><span>${daysTotal.toFixed(2)} ج</span></div>
                <div class="row"><span>إضافات (آخر + سنوي)</span><span style="color: green;">+ ${(b + an).toFixed(2)} ج</span></div>
                <div class="row"><span>سلف وخصومات</span><span style="color: red;">- ${tr.toFixed(2)} ج</span></div>
                <div class="row grand"><h3>صافي الشهر الحالي</h3><span>${currentNet.toFixed(2)} ج</span></div>
            `;

            // all months grand total
            saveMonthInputs();
            let allGrand = 0;
            let chips = '';

            const keys = Object.keys(allData)
                .sort((a, b) => {
                    const [ya, ma] = a.split('-').map(Number);
                    const [yb, mb] = b.split('-').map(Number);
                    return ya - yb || ma - mb;
                });

            keys.forEach(k => {
                const md = allData[k];
                const mt = calcMonthTotal(md);
                
                // التأكد من أن الشهر يحتوي على بيانات (سواء أيام مسجلة أو فلوس)
                const hasData = md.days.some(d => d.type !== '') || Number(md.bonus) > 0 || Number(md.annual) > 0 || Number(md.transport) > 0;

                allGrand += mt; // بنضيف القيمة للإجمالي الكلي في كل الأحوال

                // بنعرض الشهر بس لو فيه بيانات فعلية
                if (hasData) {
                    const [year, month] = k.split('-');
                    const mName = MONTHS[Number(month)];

                    chips += `
                        <span class="month-chip">
                            ${mName} ${year} : 
                            <span class="val">${mt.toFixed(0)} ج</span>
                        </span>
                    `;
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
            allData[k] = { days: genDates(curMonth, curYear).map(d => ({ date: d, type: '' })), bonus: 0, transport: 0, annual: 0 };
            document.getElementById('bonus').value = 0;
            document.getElementById('transport').value = 0;
            document.getElementById('annual').value = 0;
            selectedDay = null; save(); render();
        }
        
        function resetAll() {
            if (!confirm('هل أنت متأكد من مسح بيانات كل الشهور؟')) return;
            allData = {};
            ensureMonth(curMonth, curYear);
            document.getElementById('bonus').value = 0;
            document.getElementById('transport').value = 0;
            document.getElementById('annual').value = 0;
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
            
            let allGrand = 0;
            Object.keys(allData).forEach(k => {
                allGrand += calcMonthTotal(allData[k]);
            });

            localStorage.setItem("prevMonthTotal", allGrand);
            document.getElementById("prevMonthValue").textContent = allGrand.toFixed(2) + " جنيه";

            allData = {};

            ensureMonth(curMonth, curYear);

            document.getElementById('bonus').value = 0;
            document.getElementById('transport').value = 0;
            document.getElementById('annual').value = 0;
            selectedDay = null;

            save();
            render();

            alert("تم حفظ الإجمالي الكلي وتصفير كل البيانات بنجاح ✅");
        }
