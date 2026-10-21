import { state } from '../db.js';
import { getModel, infoFor, PHASES } from '../cycle.js';
import { SYMPTOMS, MOODS, ACTIVITIES, LEVELS, label } from '../data.js';
import { esc, formatShort, median } from '../util.js';

function cycleBars(m) {
  const cycles = m.cycles.slice(-6);
  if (!cycles.length) return '<p class="muted">Sobald zwei Perioden eingetragen sind, siehst du hier deine Zykluslängen.</p>';
  const max = Math.max(...cycles.map((c) => c.length), 35);
  return `<div class="bars">${cycles.map((c) => {
    const p = cycles.find(() => true) && m.periods.find((x) => x.start === c.start);
    const pl = p ? p.length : m.periodLength;
    return `<div class="bar-row"><span class="muted">${formatShort(c.start)}</span>
      <div class="bar-track">
        <span style="width:${(pl / max) * 100}%;background:var(--c-mens)"></span>
        <span style="width:${((c.length - pl) / max) * 100}%;background:color-mix(in srgb, var(--c-lut) 55%, transparent)"></span>
      </div><b>${c.length}</b></div>`;
  }).join('')}</div>`;
}

function byPhase(m, key, list) {
  const counts = {};
  const totals = {};
  for (const e of state.days.values()) {
    const info = infoFor(e.date, m);
    if (!info) continue;
    totals[info.phase] = (totals[info.phase] || 0) + 1;
    for (const id of e[key] || []) {
      counts[info.phase] ??= {};
      counts[info.phase][id] = (counts[info.phase][id] || 0) + 1;
    }
  }
  const rows = Object.keys(PHASES).map((ph) => {
    const top = Object.entries(counts[ph] || {}).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (!top.length) return '';
    return `<tr><td><span style="color:${PHASES[ph].color}">●</span> ${PHASES[ph].short}</td>
      <td>${top.map(([id, n]) => { const x = label(list, id); return x ? `${x.emoji} ${esc(x.label)} <span class="muted">${n}×</span>` : ''; }).join(' · ')}</td></tr>`;
  }).join('');
  return rows ? `<table class="phase-table">${rows}</table>` : '<p class="muted">Noch zu wenige Einträge – nach ein, zwei Zyklen wird es hier spannend.</p>';
}

function bodyAndMovement(m) {
  const agg = {};
  for (const e of state.days.values()) {
    const info = infoFor(e.date, m);
    if (!info) continue;
    const a = (agg[info.phase] ??= { body: [], energy: [], moveDays: 0, rest: 0, logged: 0, mins: [] });
    a.logged++;
    if (e.body) a.body.push(e.body);
    if (e.energy) a.energy.push(e.energy);
    if (e.activity?.includes('ruhetag')) a.rest++;
    else if (e.activity?.length) { a.moveDays++; if (e.minutes) a.mins.push(e.minutes); }
  }
  const avg = (xs) => (xs.length ? (xs.reduce((x, y) => x + y, 0) / xs.length).toFixed(1) : '–');
  const rows = Object.keys(PHASES).filter((ph) => agg[ph] && (agg[ph].body.length || agg[ph].moveDays || agg[ph].rest)).map((ph) => {
    const a = agg[ph];
    return `<tr><td><span style="color:${PHASES[ph].color}">●</span> ${PHASES[ph].short}</td>
      <td>🫶 ${avg(a.body)}/5 · ⚡ ${avg(a.energy)}/5<br><span class="muted">🏃 ${a.moveDays}× aktiv${a.mins.length ? ` (Ø ${Math.round(a.mins.reduce((x, y) => x + y, 0) / a.mins.length)} Min)` : ''} · 🛋️ ${a.rest}× Ruhetag</span></td></tr>`;
  }).join('');
  if (!rows) return '<p class="muted">Trag Körpergefühl und Bewegung ein, dann siehst du hier, wie sich beides über deinen Zyklus verändert.</p>';
  return `<table class="phase-table">${rows}</table>
    <p class="muted small" style="margin:10px 0 0">Mittelwerte deiner Einträge (1 = unwohl, 5 = richtig gut). Je mehr Zyklen, desto aussagekräftiger. Das sind deine persönlichen Muster, kein Beleg für allgemeine Regeln.</p>`;
}

function favoriteActivities() {
  const counts = {};
  for (const e of state.days.values()) for (const a of e.activity || []) if (a !== 'ruhetag') counts[a] = (counts[a] || 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  if (!top.length) return '';
  return `<div class="chips" style="margin-top:12px">${top.map(([id, n]) => { const x = label(ACTIVITIES, id); return x ? `<span class="chip">${x.emoji} ${esc(x.label)} <span class="muted">${n}×</span></span>` : ''; }).join('')}</div>`;
}

function painStats(m) {
  const pains = [...state.days.values()].filter((e) => e.pain).map((e) => ({ e, info: infoFor(e.date, m) }));
  if (pains.length < 3) return '';
  const mens = pains.filter((p) => p.info?.phase === 'menstruation').map((p) => p.e.pain);
  return `<div class="card stat"><b>${mens.length ? median(mens).toFixed(0) : '–'}<small style="font-size:16px">/10</small></b><span>typische Schmerzstärke während der Periode</span></div>`;
}

export function render() {
  const m = getModel();
  const n = m.cycles.length;
  const irregular = m.variability != null && m.variability > 7;
  return `
    <header class="top"><div><div class="eyebrow">Deine Muster</div><h1>Einblicke 🌷</h1></div></header>
    <div class="grid2">
      <div class="card stat"><b>${m.cycleLength}</b><span>Ø Zykluslänge (Tage)${n < 2 ? ' · Startwert' : ''}</span></div>
      <div class="card stat"><b>${m.periodLength}</b><span>Ø Periodenlänge (Tage)</span></div>
      <div class="card stat"><b>${m.variability ?? '–'}</b><span>Schwankung (Tage)</span></div>
      <div class="card stat"><b>${state.days.size}</b><span>Tage eingetragen</span></div>
    </div>
    ${irregular ? `<div class="notice soft" style="margin-top:12px"><span>ℹ️</span><span>Deine Zykluslängen schwanken um mehr als 7 Tage. Das kann normal sein, macht Vorhersagen aber ungenauer. Wenn es dich beschäftigt, sprich es bei deiner Gynäkologin an.</span></div>` : ''}

    <h2>Letzte Zyklen</h2>
    <div class="card">${cycleBars(m)}</div>

    <h2>Häufigste Symptome je Phase</h2>
    <div class="card">${byPhase(m, 'symptoms', SYMPTOMS)}</div>

    <h2>Stimmung je Phase</h2>
    <div class="card">${byPhase(m, 'mood', MOODS)}</div>

    <h2>Körpergefühl &amp; Bewegung</h2>
    <div class="card">${bodyAndMovement(m)}${favoriteActivities()}</div>

    ${painStats(m) ? `<h2>Schmerz</h2>${painStats(m)}` : ''}
    <p class="muted small" style="margin-top:18px">Alle Werte werden lokal auf deinem Gerät berechnet.</p>`;
}
