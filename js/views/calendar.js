import { state } from '../db.js';
import { getModel, infoFor, BLEEDING, PHASES } from '../cycle.js';
import { formatMonth, toISO, todayISO, toast } from '../util.js';
import { register, rerender } from '../ui.js';
import { openLog } from './log.js';

let cursor = new Date();
cursor.setDate(1);

const WD = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function render() {
  const m = getModel();
  const t = todayISO();
  const y = cursor.getFullYear(), mo = cursor.getMonth();
  const first = new Date(y, mo, 1);
  const offset = (first.getDay() + 6) % 7;
  const gridStart = new Date(y, mo, 1 - offset);
  const weeks = Math.ceil((offset + new Date(y, mo + 1, 0).getDate()) / 7);

  const cells = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const iso = toISO(d);
    const e = state.days.get(iso);
    const info = infoFor(iso, m);
    const cls = ['day'];
    if (d.getMonth() !== mo) cls.push('out');
    if (iso === t) cls.push('today');
    if (e && BLEEDING.includes(e.flow)) cls.push('period');
    else if (e?.flow === 'spotting') cls.push('spot');
    else if (info?.predictedPeriod && iso >= t) cls.push('pred');
    else if (info?.ovulation) cls.push('ovu');
    else if (info?.fertile) cls.push('fertile');
    const hasLog = e && (e.symptoms?.length || e.mood?.length || e.note || e.energy || e.sleep || e.body || e.activity?.length || e.pain);
    const bar = info && !cls.includes('period') ? `<span class="phase-bar" style="background:${PHASES[info.phase].color}"></span>` : '';
    cells.push(`<button class="${cls.join(' ')}" data-action="cal-day" data-date="${iso}" aria-label="${iso}">
      ${d.getDate()}${hasLog ? '<span class="dot"></span>' : ''}${bar}</button>`);
  }

  return `
    <div class="cal-head">
      <button class="icon-btn" data-action="cal-move" data-d="-1" aria-label="Voriger Monat">‹</button>
      <h1>${formatMonth(cursor)}</h1>
      <button class="icon-btn" data-action="cal-move" data-d="1" aria-label="Nächster Monat">›</button>
    </div>
    <div class="card" style="padding:14px 10px 16px">
      <div class="cal">
        ${WD.map((w) => `<div class="wd">${w}</div>`).join('')}
        ${cells.join('')}
      </div>
    </div>
    <div class="card small" style="margin-top:12px">
      <div class="stack">
        <div class="row"><span class="day period" style="width:26px;font-size:11px">1</span> Periode (eingetragen)</div>
        <div class="row"><span class="day pred" style="width:26px;font-size:11px">1</span> Periode (vorhergesagt)</div>
        <div class="row"><span class="day fertile" style="width:26px;font-size:11px">1</span> Fruchtbares Fenster (geschätzt)</div>
        <div class="row"><span class="day ovu" style="width:26px;font-size:11px">1</span> Eisprung (geschätzt)</div>
        <div class="row"><span class="day" style="width:26px;font-size:11px;position:relative">1<span class="dot"></span></span> Symptome / Notiz eingetragen</div>
      </div>
      <p class="muted" style="margin:12px 0 0">Tippe auf einen Tag, um ihn einzutragen. Vorhersagen sind Schätzungen und <b>keine Verhütungsmethode</b>.</p>
    </div>
    ${cursor.getMonth() !== new Date().getMonth() || cursor.getFullYear() !== new Date().getFullYear()
      ? '<div style="text-align:center;margin-top:14px"><button class="btn ghost" data-action="cal-today">Zurück zu heute</button></div>' : ''}`;
}

register({
  'cal-move': (el) => { cursor.setMonth(cursor.getMonth() + Number(el.dataset.d)); rerender(); },
  'cal-today': () => { cursor = new Date(); cursor.setDate(1); rerender(); },
  'cal-day': (el) => {
    if (el.dataset.date > todayISO()) return toast('Die Zukunft kann man noch nicht eintragen 🔮');
    openLog(el.dataset.date);
  },
});
