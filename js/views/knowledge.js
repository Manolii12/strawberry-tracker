import { TIPS, SOURCES, CATEGORIES, tipCard } from '../tips.js';
import { PHASES, infoFor } from '../cycle.js';
import { todayISO } from '../util.js';
import { PHASE_INFO } from '../data.js';
import { register, rerender } from '../ui.js';

let filter = 'alle';
let phaseFilter = null; // null = aktuelle Phase

const FILTERS = [
  ['alle', 'Alle'],
  ...Object.entries(CATEGORIES),
  ['warn', '🩺 Wann zum Arzt'],
];

export function render() {
  const current = infoFor(todayISO())?.phase || null;
  const ph = phaseFilter ?? current ?? 'alle';
  const list = TIPS.filter((t) => {
    if (filter === 'warn') return t.warn;
    if (t.warn) return false;
    if (filter !== 'alle' && t.cat !== filter) return false;
    return ph === 'alle' || t.ph.includes(ph) || t.ph.includes('alle');
  });
  const phaseChips = [
    ...Object.entries(PHASES).map(([k, p]) => [k, `${p.emoji} ${p.short}${k === current ? ' · jetzt' : ''}`]),
    ['alle', 'Alle Phasen'],
  ];

  return `
    <header class="top"><div><div class="eyebrow">Mit Quellen</div><h1>Wissen 📖</h1></div></header>

    <details class="card">
      <summary>Wie entstehen die Tipps?</summary>
      <p>Alle Tipps stammen aus sechs wissenschaftlichen Arbeiten (unten). Auf „Heute“ siehst du immer Tipps zu deiner <b>aktuellen Zyklusphase</b>. Hast du Symptome eingetragen, kommen passende Tipps zuerst.</p>
      <p>Ehrlich gesagt: Dass bestimmte Sportarten oder Lebensmittel in einer Phase <i>besser</i> wirken, ist kaum untersucht. Die Reviews empfehlen, „zyklusbewusst, aber nicht starr“ zu sein. Tipps mit wenig Belegen haben deshalb nur einen Punkt.</p>
      <p>Die Punkte zeigen, wie belastbar ein Tipp ist: ●○○ schwach (einzelne kleine Studie), ●●○ mittel, ●●● stark (gut gesichert). Die App ersetzt keine ärztliche Beratung.</p>
    </details>

    <h2>Die vier Phasen</h2>
    ${Object.entries(PHASES).map(([k, p]) => `
      <details class="card">
        <summary><span><span style="color:${p.color}">●</span> ${p.emoji} ${p.name}</span></summary>
        <p>${PHASE_INFO[k].text}</p>
      </details>`).join('')}

    <h2>Tipps</h2>
    <div class="filter">
      ${FILTERS.map(([k, l]) => `<button class="chip ${filter === k ? 'on' : ''}" data-action="kn-filter" data-k="${k}">${l}</button>`).join('')}
    </div>
    ${filter === 'warn' ? '' : `<div class="filter">
      ${phaseChips.map(([k, l]) => `<button class="chip ${ph === k ? 'on' : ''}" data-action="kn-phase" data-k="${k}">${l}</button>`).join('')}
    </div>`}
    <div class="tips">${list.map(tipCard).join('')}</div>

    <h2>Quellen</h2>
    <div class="card">
      ${Object.values(SOURCES).map((s) => `<div class="ref"><b>${s.short}</b> · <span class="muted">${s.type}</span><br>${s.full}
        <br><a href="https://doi.org/${s.doi}" target="_blank" rel="noopener">doi:${s.doi}</a></div>`).join('')}
    </div>`;
}

register({
  'kn-filter': (el) => { filter = el.dataset.k; rerender(); },
  'kn-phase': (el) => { phaseFilter = el.dataset.k; rerender(); },
});
