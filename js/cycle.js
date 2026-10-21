// Zykluslogik: erkennt Perioden aus den Einträgen, schätzt Zykluslänge und Phasen.
// Wichtig: Das sind Schätzungen auf Kalenderbasis – keine Verhütungsmethode.

import { state } from './db.js';
import { addDays, diffDays, median, todayISO } from './util.js';

export const BLEEDING = ['light', 'medium', 'heavy'];
const LUTEAL = 14;
const MIN_CYCLE = 15;
const MAX_CYCLE = 60;

export const PHASES = {
  menstruation: { name: 'Menstruation', short: 'Periode', color: 'var(--c-mens)', emoji: '🍓' },
  follikel:     { name: 'Follikelphase', short: 'Follikel', color: 'var(--c-foll)', emoji: '🌱' },
  ovulation:    { name: 'Eisprung-Phase', short: 'Eisprung', color: 'var(--c-ovu)', emoji: '☀️' },
  luteal:       { name: 'Lutealphase', short: 'Luteal', color: 'var(--c-lut)', emoji: '🌙' },
};

// Blutungstage zu Perioden zusammenfassen; ein einzelner Tag Pause unterbricht nicht.
export function detectPeriods() {
  const dates = [...state.days.values()]
    .filter((d) => BLEEDING.includes(d.flow))
    .map((d) => d.date)
    .sort();
  const periods = [];
  for (const date of dates) {
    const last = periods[periods.length - 1];
    if (last && diffDays(last.end, date) <= 2) last.end = date;
    else periods.push({ start: date, end: date });
  }
  for (const p of periods) p.length = diffDays(p.start, p.end) + 1;

  // Startwert aus dem Onboarding nutzen, solange kein echter Eintrag in der Nähe liegt.
  const seed = state.settings.lastPeriodStart;
  if (seed && !periods.some((p) => Math.abs(diffDays(p.start, seed)) < 10)) {
    const len = state.settings.periodLength;
    periods.push({ start: seed, end: addDays(seed, len - 1), length: len, seeded: true });
    periods.sort((a, b) => a.start.localeCompare(b.start));
  }
  return periods;
}

let cache = { key: null, model: null };

export function getModel() {
  const key = `${state.days.size}|${[...state.days.values()].reduce((m, d) => Math.max(m, d.updated || 0), 0)}|${JSON.stringify(state.settings)}|${todayISO()}`;
  if (cache.key === key) return cache.model;

  const today = todayISO();
  const periods = detectPeriods();
  const starts = periods.map((p) => p.start);

  const cycles = [];
  for (let i = 1; i < starts.length; i++) {
    const len = diffDays(starts[i - 1], starts[i]);
    if (len >= MIN_CYCLE && len <= MAX_CYCLE) cycles.push({ start: starts[i - 1], length: len });
  }
  const recent = cycles.slice(-6).map((c) => c.length);
  const cycleLength = recent.length >= 2 ? Math.round(median(recent)) : state.settings.cycleLength;
  const realPeriods = periods.filter((p) => !p.seeded && p.end < today);
  const periodLength = realPeriods.length >= 2
    ? Math.round(median(realPeriods.slice(-6).map((p) => p.length)))
    : state.settings.periodLength;
  const variability = recent.length >= 3 ? Math.max(...recent) - Math.min(...recent) : null;

  const lastStart = starts[starts.length - 1] || null;
  let nextStart = null;
  let lateBy = 0;
  const predicted = [];
  if (lastStart) {
    nextStart = addDays(lastStart, cycleLength);
    // Überfällig: Vorhersagen ab morgen neu verankern.
    let anchor = nextStart;
    if (nextStart <= today) {
      lateBy = diffDays(nextStart, today);
      anchor = addDays(today, 1);
    }
    for (let k = 0; k < 13; k++) predicted.push(addDays(anchor, k * cycleLength));
  }

  const model = { today, periods, starts, cycles, cycleLength, periodLength, variability, lastStart, nextStart, lateBy, predicted };
  cache = { key, model };
  return model;
}

// Phase und Zyklustag für ein beliebiges Datum.
export function infoFor(date, m = getModel()) {
  if (!m.lastStart || date < m.starts[0]) return null;

  const all = [...m.starts, ...m.predicted.filter((p) => p > m.lastStart)];
  let i = all.length - 1;
  while (i > 0 && all[i] > date) i--;
  const start = all[i];
  const next = all[i + 1];
  const isPredictedCycle = start > m.lastStart;
  const length = next ? diffDays(start, next) : m.cycleLength;
  const day = diffDays(start, date) + 1;

  const ovuDay = Math.max(length - LUTEAL, m.periodLength + 2);
  const period = m.periods.find((p) => p.start === start);
  const inPeriod = period && !isPredictedCycle ? date <= period.end : day <= m.periodLength;
  // Bei laufender, noch nicht beendeter Periode zählen geschätzte Resttage mit.
  const inOngoing = period && !period.seeded && start === m.lastStart && date > period.end
    && day <= m.periodLength && period.end >= addDays(m.today, -1);

  let phase;
  if (inPeriod || inOngoing) phase = 'menstruation';
  else if (day < ovuDay - 1) phase = 'follikel';
  else if (day <= ovuDay + 1) phase = 'ovulation';
  else phase = 'luteal';

  return {
    phase,
    day,
    length,
    ovulation: day === ovuDay,
    fertile: day >= ovuDay - 5 && day <= ovuDay + 1,
    predictedPeriod: (isPredictedCycle || inOngoing) && phase === 'menstruation',
    future: date > m.today,
  };
}

export function daysUntilNext(m = getModel()) {
  if (!m.nextStart) return null;
  return diffDays(m.today, m.lateBy ? m.today : m.nextStart);
}
