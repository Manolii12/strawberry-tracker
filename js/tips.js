// Tipps auf Basis von sechs Quellen (Auswertung: privat/quellen-auswertung.md).
// Tipps werden immer passend zur aktuellen Zyklusphase gewählt und innerhalb der Phase nach
// eingetragenen Symptomen sortiert. Wo die Phasen-Evidenz dünn ist, steht das als "schwach" am Tipp.

import { esc, hash } from './util.js';
import { SYMPTOMS } from './data.js';
import { TIPS, NEW_SOURCES } from './tips-data.js';

export { TIPS };

export const SOURCES = {
  schoep2019: {
    short: 'Schoep et al. 2019',
    full: 'Schoep ME, Nieboer TE, van der Zanden M, Braat DDM, Nap AW. The impact of menstrual symptoms on everyday life: a survey among 42,879 women. Am J Obstet Gynecol. 2019;220(6):569.e1–569.e7.',
    doi: '10.1016/j.ajog.2019.02.048',
    type: 'Online-Umfrage, 42.879 Frauen (NL)',
  },
  tiranini2022: {
    short: 'Tiranini & Nappi 2022',
    full: 'Tiranini L, Nappi RE. Recent advances in understanding/management of premenstrual dysphoric disorder/premenstrual syndrome. Faculty Reviews. 2022;11:11.',
    doi: '10.12703/r/11-11',
    type: 'Narrativer Review zu PMS/PMDD',
  },
  armour2019: {
    short: 'Armour et al. 2019',
    full: 'Armour M, Parry K, Al-Dabbas MA, et al. Self-care strategies and sources of knowledge on menstruation in 12,526 young women with dysmenorrhea: A systematic review and meta-analysis. PLoS ONE. 2019;14(7):e0220103.',
    doi: '10.1371/journal.pone.0220103',
    type: 'Systematischer Review & Meta-Analyse, 24 Studien',
  },
  tarpey2026: {
    short: 'Tarpey et al. 2026',
    full: 'Tarpey R, Keaver L, Ryan L, McGawley K, Pedlar CR, van Someren K. Self-management strategies for menstrual cycle symptoms: a systematic review. BMC Women\'s Health. 2026;26:491.',
    doi: '10.1186/s12905-026-04717-3',
    type: 'Systematischer Review, 39 RCTs',
  },
  ...NEW_SOURCES,
};

export const CATEGORIES = {
  bewegung: 'Bewegung',
  ernaehrung: 'Ernährung',
  selbstfuersorge: 'Selbstfürsorge',
  wissen: 'Wissen',
};

const NEG_MOODS = ['sensibel', 'gereizt', 'traurig', 'aengstlich', 'gestresst'];


const EV_DOTS = { schwach: 1, mittel: 2, stark: 3 };

function symptomName(id) {
  if (id === 'stimmung') return 'Stimmung';
  return SYMPTOMS.find((s) => s.id === id)?.label || id;
}

const PHASE_LABEL = { menstruation: 'Periode', follikel: 'Follikelphase', ovulation: 'Eisprung-Phase', luteal: 'Lutealphase' };

// Tipps, die zur Phase gehören. Ohne bekannte Phase (noch keine Daten) gelten nur allgemeine Tipps.
export const tipsForPhase = (phase, cat) => TIPS.filter((t) => !t.warn && (!cat || t.cat === cat)
  && (phase ? t.ph.includes(phase) : t.ph.includes('alle')));

// Pro Kategorie ein Tipp aus der aktuellen Phase; Symptom-Treffer zuerst, sonst tägliche Rotation.
export function pickTips({ phase, symptoms = [], moods = [], pain = 0, date }) {
  const active = new Set(symptoms);
  if (moods.some((m) => NEG_MOODS.includes(m))) active.add('stimmung');
  if (pain >= 4) active.add('kraempfe');

  const best = (cat) => {
    let pool = tipsForPhase(phase, cat);
    if (!pool.length) pool = tipsForPhase(null, cat);
    return pool
      .map((t) => {
        const hits = t.s.filter((x) => active.has(x));
        return { t, hits, v: hits.length * 3 + (hash(date + t.id) % 100) / 100 };
      })
      .sort((a, b) => b.v - a.v)[0];
  };

  const out = [];
  for (const cat of ['bewegung', 'ernaehrung', 'selbstfuersorge', 'wissen']) {
    const b = best(cat);
    if (b) out.push({ ...b.t, reason: reasonFor(b, phase) });
  }

  // Sehr starke Schmerzen → Hinweis, dass man das nicht aushalten muss.
  if (pain >= 7) out.push({ ...TIPS.find((t) => t.id === 'R1'), reason: `Schmerz ${pain}/10` });
  return out;
}

function reasonFor({ hits }, phase) {
  const ph = PHASE_LABEL[phase] || 'für jeden Tag';
  return hits.length ? `${ph} · ${hits.map(symptomName).join(', ')}` : ph;
}

export function tipCard(t) {
  const dots = EV_DOTS[t.ev];
  return `<article class="tip ${t.warn ? 'warnung' : t.cat}">
    <div class="cat">${t.warn ? '🩺 Gut zu wissen' : CATEGORIES[t.cat]}</div>
    <p>${esc(t.text)}</p>
    <div class="src">
      ${t.reason ? `<span class="why">${esc(t.reason)}</span>` : ''}
      <span>${t.src.map((k) => SOURCES[k].short).join(' · ')}</span>
      <span class="ev" title="Evidenz: ${t.ev}" aria-label="Evidenz: ${t.ev}">${[1, 2, 3].map((i) => `<i class="${i <= dots ? 'on' : ''}"></i>`).join('')}</span>
    </div>
  </article>`;
}
