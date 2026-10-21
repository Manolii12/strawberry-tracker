// Tageseintrag als Bottom-Sheet. Jede Änderung wird sofort gespeichert.

import { getDay, saveDay } from '../db.js';
import { FLOW, SYMPTOMS, MOODS, LEVELS, ACTIVITIES, DURATIONS, INTENSITIES } from '../data.js';
import { esc, formatLong, todayISO, addDays } from '../util.js';
import { register, openSheet, updateSheet, closeSheet, rerender } from '../ui.js';

let entry = null;

const drops = (n) => (n ? '💧'.repeat(n) : '·');

function html() {
  const e = entry;
  const isToday = e.date === todayISO();
  const pain = e.pain ?? 0;
  return `
    <div class="sheet-head">
      <button class="icon-btn" data-action="log-shift" data-d="-1" aria-label="Vortag">‹</button>
      <div style="text-align:center">
        <div class="eyebrow">${isToday ? 'Heute' : 'Eintrag'}</div>
        <h2>${esc(formatLong(e.date))}</h2>
      </div>
      <button class="icon-btn" data-action="log-shift" data-d="1" aria-label="Folgetag" ${isToday ? 'disabled style="opacity:.3"' : ''}>›</button>
    </div>

    <section>
      <h3>🍓 Periode</h3>
      <div class="chips">
        ${FLOW.map((f) => `<button class="chip flow ${e.flow === f.id ? 'on' : ''}" data-action="log-flow" data-id="${f.id}">
          <span class="drops">${drops(f.drops)}</span>${f.label}</button>`).join('')}
      </div>
    </section>

    <section>
      <h3>🌀 Schmerzstärke <span class="muted small" id="pain-val">${pain ? `${pain}/10` : 'keine'}</span></h3>
      <input class="range" type="range" min="0" max="10" step="1" value="${pain}" data-change="log-pain" data-live aria-label="Schmerzstärke">
    </section>

    <section>
      <h3>🩹 Symptome</h3>
      <div class="chips">
        ${SYMPTOMS.map((s) => `<button class="chip ${e.symptoms?.includes(s.id) ? 'on' : ''}" data-action="log-toggle" data-key="symptoms" data-id="${s.id}">${s.emoji} ${s.label}</button>`).join('')}
      </div>
    </section>

    <section>
      <h3>💭 Stimmung</h3>
      <div class="chips">
        ${MOODS.map((m) => `<button class="chip ${e.mood?.includes(m.id) ? 'on' : ''}" data-action="log-toggle" data-key="mood" data-id="${m.id}">${m.emoji} ${m.label}</button>`).join('')}
      </div>
    </section>

    <section>
      <h3>⚡ Energie</h3>
      <div class="scale">${LEVELS.energy.map((l, i) => `<button class="${e.energy === i + 1 ? 'on' : ''}" data-action="log-level" data-key="energy" data-v="${i + 1}">${l}</button>`).join('')}</div>
    </section>

    <section>
      <h3>🫶 Körpergefühl</h3>
      <div class="scale">${LEVELS.body.map((l, i) => `<button class="${e.body === i + 1 ? 'on' : ''}" data-action="log-level" data-key="body" data-v="${i + 1}">${l}</button>`).join('')}</div>
    </section>

    <section>
      <h3>🌙 Schlaf</h3>
      <div class="scale">${LEVELS.sleep.map((l, i) => `<button class="${e.sleep === i + 1 ? 'on' : ''}" data-action="log-level" data-key="sleep" data-v="${i + 1}">${l}</button>`).join('')}</div>
    </section>

    <section>
      <h3>🏃 Bewegung heute</h3>
      <div class="chips">
        ${ACTIVITIES.map((a) => `<button class="chip ${e.activity?.includes(a.id) ? 'on' : ''}" data-action="log-activity" data-id="${a.id}">${a.emoji} ${a.label}</button>`).join('')}
      </div>
      ${e.activity?.length && !(e.activity.length === 1 && e.activity[0] === 'ruhetag') ? `
        <p class="muted small" style="margin:14px 0 6px">Wie lange insgesamt?</p>
        <div class="chips">${DURATIONS.map((d) => `<button class="chip ${e.minutes === d.id ? 'on' : ''}" data-action="log-pick" data-key="minutes" data-v="${d.id}">${d.label}</button>`).join('')}</div>
        <p class="muted small" style="margin:14px 0 6px">Wie anstrengend?</p>
        <div class="scale" style="grid-template-columns:repeat(3,1fr)">${INTENSITIES.map((l, i) => `<button class="${e.intensity === i + 1 ? 'on' : ''}" data-action="log-pick" data-key="intensity" data-v="${i + 1}">${l}</button>`).join('')}</div>` : ''}
    </section>

    <section>
      <h3>📝 Notiz</h3>
      <textarea data-change="log-note" placeholder="Wie geht's dir heute?">${esc(e.note || '')}</textarea>
    </section>

    <section><button class="btn berry block" data-action="close-sheet">Fertig</button></section>`;
}

export function openLog(date = todayISO()) {
  entry = structuredClone(getDay(date));
  openSheet(html(), { onClose: () => { entry = null; rerender(); } });
}

async function persist(refresh = true) {
  if (refresh) updateSheet(html());
  await saveDay(structuredClone(entry));
}

register({
  'log-today': () => openLog(),
  'log-open': (el) => openLog(el.dataset.date),
  'log-shift': (el) => {
    const next = addDays(entry.date, Number(el.dataset.d));
    if (next > todayISO()) return;
    entry = structuredClone(getDay(next));
    updateSheet(html());
  },
  'log-flow': (el) => {
    entry.flow = entry.flow === el.dataset.id ? null : el.dataset.id;
    persist();
  },
  'log-toggle': (el) => {
    const { key, id } = el.dataset;
    const list = new Set(entry[key] || []);
    list.has(id) ? list.delete(id) : list.add(id);
    entry[key] = [...list];
    persist();
  },
  'log-level': (el) => {
    const v = Number(el.dataset.v);
    entry[el.dataset.key] = entry[el.dataset.key] === v ? null : v;
    persist();
  },
  'log-activity': (el) => {
    const id = el.dataset.id;
    const list = new Set(entry.activity || []);
    if (list.has(id)) list.delete(id);
    else {
      // "Ruhetag" schließt Aktivitäten aus und umgekehrt.
      if (id === 'ruhetag') list.clear(); else list.delete('ruhetag');
      list.add(id);
    }
    entry.activity = [...list];
    if (!entry.activity.length || entry.activity[0] === 'ruhetag') { entry.minutes = null; entry.intensity = null; }
    persist();
  },
  'log-pick': (el) => {
    const v = Number(el.dataset.v);
    entry[el.dataset.key] = entry[el.dataset.key] === v ? null : v;
    persist();
  },
  'log-pain': (el) => {
    entry.pain = Number(el.value) || null;
    document.getElementById('pain-val').textContent = entry.pain ? `${entry.pain}/10` : 'keine';
    persist(false);
  },
  'log-note': (el) => {
    entry.note = el.value;
    persist(false);
  },
});

export { closeSheet };
