import { state, getDay } from '../db.js';
import { getModel, infoFor, PHASES, daysUntilNext } from '../cycle.js';
import { PHASE_INFO, SYMPTOMS, MOODS, FLOW, ACTIVITIES, LEVELS, label } from '../data.js';
import { pickTips, tipCard } from '../tips.js';
import { addDays, diffDays, esc, formatLong, formatShort, todayISO } from '../util.js';

const BLOBS = '<div class="blobs"><i></i><i></i><i></i></div>';

function wheel(info, m) {
  const L = info.length;
  const start = addDays(m.today, -(info.day - 1));
  const R = 140, C = 160, W = 26;
  const segs = [];
  for (let d = 1; d <= L; d++) {
    const di = infoFor(addDays(start, d - 1), m);
    const a0 = ((d - 1) / L) * 2 * Math.PI - Math.PI / 2 + 0.012;
    const a1 = (d / L) * 2 * Math.PI - Math.PI / 2 - 0.012;
    const p = (a) => `${(C + R * Math.cos(a)).toFixed(2)} ${(C + R * Math.sin(a)).toFixed(2)}`;
    const color = PHASES[di?.phase || 'luteal'].color;
    const op = d < info.day ? 0.45 : d === info.day ? 1 : 0.8;
    segs.push(`<path d="M ${p(a0)} A ${R} ${R} 0 0 1 ${p(a1)}" stroke="${color}" stroke-width="${W}" fill="none" opacity="${op}" stroke-linecap="butt"/>`);
  }
  const a = ((info.day - 0.5) / L) * 2 * Math.PI - Math.PI / 2;
  const mx = C + R * Math.cos(a), my = C + R * Math.sin(a);
  return `
    <div class="wheel-wrap">
      <svg viewBox="0 0 320 320" role="img" aria-label="Zyklustag ${info.day} von ${L}">
        <circle cx="${C}" cy="${C}" r="${R}" stroke="var(--bg-2)" stroke-width="${W + 8}" fill="none"/>
        ${segs.join('')}
        <circle cx="${mx}" cy="${my}" r="21" fill="var(--card)" stroke="var(--ink)" stroke-width="2.5"/>
        <text x="${mx}" y="${my + 7}" text-anchor="middle" font-size="20">🍓</text>
      </svg>
      <div class="wheel-center">
        <div class="lbl">Zyklustag</div>
        <div class="big">${info.day}</div>
        <div class="ph">${PHASES[info.phase].emoji} ${PHASES[info.phase].short}</div>
      </div>
    </div>
    <div class="legend">
      ${Object.values(PHASES).map((p) => `<span><i style="background:${p.color}"></i>${p.short}</span>`).join('')}
    </div>`;
}

function headline(info, m) {
  const n = daysUntilNext(m);
  if (info.phase === 'menstruation' && !info.predictedPeriod) {
    return { num: info.day, text: `<b>Periode – Tag ${info.day}</b><br><span class="muted small">Ø ${m.periodLength} Tage lang. Sei lieb zu dir.</span>` };
  }
  if (m.lateBy > 0) {
    return { num: `+${m.lateBy}`, text: `<b>Periode ${m.lateBy === 1 ? 'einen Tag' : `${m.lateBy} Tage`} später als erwartet</b><br><span class="muted small">Schwankungen von ein paar Tagen sind normal. Trag sie ein, sobald sie kommt.</span>` };
  }
  const fertileStart = (() => {
    for (let d = 0; d <= n; d++) {
      const i = infoFor(addDays(m.today, d), m);
      if (i?.fertile) return d;
    }
    return null;
  })();
  const extra = info.fertile
    ? 'Du bist im geschätzten fruchtbaren Fenster.'
    : fertileStart != null && fertileStart > 0 ? `Fruchtbares Fenster in ca. ${fertileStart} Tagen.` : `Erwartet am ${formatShort(m.nextStart)}.`;
  return { num: n, text: `<b>${n === 0 ? 'Periode heute erwartet' : n === 1 ? 'Periode morgen erwartet' : `Noch ${n} Tage bis zur Periode`}</b><br><span class="muted small">${extra}</span>` };
}

function todaySummary(e) {
  const bits = [];
  if (e.flow) bits.push(`🍓 ${label(FLOW, e.flow).label}`);
  if (e.pain) bits.push(`🌀 Schmerz ${e.pain}/10`);
  for (const s of e.symptoms || []) { const x = label(SYMPTOMS, s); if (x) bits.push(`${x.emoji} ${x.label}`); }
  for (const s of e.mood || []) { const x = label(MOODS, s); if (x) bits.push(`${x.emoji} ${x.label}`); }
  if (e.body) bits.push(`🫶 ${LEVELS.body[e.body - 1]}`);
  for (const a of e.activity || []) { const x = label(ACTIVITIES, a); if (x) bits.push(`${x.emoji} ${x.label}`); }
  if (!bits.length) return '<p class="muted" style="margin:6px 0 12px">Noch nichts eingetragen.</p>';
  return `<div class="chips" style="margin:10px 0 14px">${bits.map((b) => `<span class="chip">${esc(b)}</span>`).join('')}</div>`;
}

function backupNotice() {
  const s = state.settings;
  if (state.days.size < 5) return '';
  const age = s.lastBackup ? diffDays(s.lastBackup.slice(0, 10), todayISO()) : Infinity;
  if (age < 30) return '';
  return `<a class="notice soft" href="#/einstellungen" style="text-decoration:none;margin-bottom:14px">
    <span>💾</span><span><b>Zeit für ein Backup</b><br>Deine Daten liegen nur auf diesem iPhone. Sichere sie kurz in iCloud Drive.</span></a>`;
}

export function render() {
  const m = getModel();
  const t = todayISO();
  const info = infoFor(t, m);
  const name = state.settings.name?.trim();
  const e = getDay(t);
  const symptoms = [...new Set([...(e.symptoms || []), ...(getDay(addDays(t, -1)).symptoms || [])])];
  const tips = pickTips({ phase: info?.phase, symptoms, moods: e.mood || [], pain: e.pain || 0, date: t });

  return `${BLOBS}
    <header class="top">
      <div>
        <div class="eyebrow">${esc(formatLong(t))}</div>
        <h1>${name ? `Hallo ${esc(name)}` : 'Hallo du'} <span aria-hidden="true">🍓</span></h1>
      </div>
      <a class="icon-btn" href="#/einstellungen" aria-label="Einstellungen">⚙️</a>
    </header>
    ${backupNotice()}
    ${info ? (() => {
      const h = headline(info, m);
      return `${wheel(info, m)}
        <div class="card headline-card" style="margin-top:18px">
          <div class="num">${h.num}</div><div>${h.text}</div>
        </div>`;
    })() : `<div class="card" style="margin-top:10px"><h3>Los geht's</h3><p class="muted">Trag den ersten Tag deiner letzten Periode ein, dann kann ich deinen Zyklus schätzen.</p><button class="btn berry" data-action="log-today">Periode eintragen</button></div>`}

    <h2><span class="squiggle">Heute für dich</span></h2>
    <div class="tips">${tips.map(tipCard).join('')}</div>

    ${info ? `<h2>${PHASES[info.phase].emoji} ${PHASES[info.phase].name}</h2>
      <div class="card"><p style="margin:0">${PHASE_INFO[info.phase].text}</p>
      <p class="muted small" style="margin:10px 0 0">Zyklus geschätzt ${info.length} Tage · Phasen sind Kalenderschätzungen, dein Körper kann abweichen.</p></div>` : ''}

    <h2>Dein Tag</h2>
    <div class="card">
      ${todaySummary(e)}
      <button class="btn block" data-action="log-today">${Object.keys(e).length > 1 ? 'Eintrag bearbeiten' : 'Jetzt eintragen'}</button>
    </div>`;
}
