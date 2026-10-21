import { saveSettings } from '../db.js';
import { todayISO, addDays } from '../util.js';

// Erster Start: kurze Einführung und Startwerte. Resolved, sobald fertig.
export function runOnboarding() {
  const root = document.getElementById('lock-root');
  return new Promise((resolve) => {
    root.innerHTML = `<div class="full"><form class="inner" id="ob">
      <div class="blobs"><i></i><i></i><i></i></div>
      <img class="hero-berry" src="icons/icon-512.png" alt="">
      <h1 style="text-align:center">Willkommen bei<br><span class="squiggle">Strawberry</span> 🍓</h1>
      <p style="text-align:center" class="muted">Dein privater Zyklus-Begleiter. Alles bleibt auf deinem iPhone: kein Konto, keine Cloud, keine Werbung.</p>

      <label class="field" style="margin-top:22px"><span>Wie heißt du?</span>
        <input type="text" name="name" maxlength="30" placeholder="Optional" autocomplete="given-name"></label>
      <label class="field"><span>Wann hat deine letzte Periode begonnen?</span>
        <input type="date" name="last" max="${todayISO()}" min="${addDays(todayISO(), -90)}"></label>
      <div class="grid2">
        <label class="field"><span>Zykluslänge ca.</span>
          <input type="number" name="cycle" value="28" min="18" max="45" inputmode="numeric"></label>
        <label class="field"><span>Periode dauert ca.</span>
          <input type="number" name="period" value="5" min="2" max="10" inputmode="numeric"></label>
      </div>
      <p class="muted small">Unsicher? Lass die Standardwerte einfach stehen. Die App lernt mit jedem eingetragenen Zyklus dazu.</p>

      <div class="notice" style="margin:16px 0"><span>⚠️</span><span>Vorhersagen sind Schätzungen und <b>keine Verhütungsmethode</b>. Tipps ersetzen keine ärztliche Beratung.</span></div>
      <button class="btn berry block" type="submit">Los geht's</button>
    </form></div>`;

    root.querySelector('#ob').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const clamp = (v, lo, hi, d) => { const n = Math.round(Number(v)); return n >= lo && n <= hi ? n : d; };
      await saveSettings({
        onboarded: true,
        name: String(f.get('name') || '').trim(),
        lastPeriodStart: f.get('last') || null,
        cycleLength: clamp(f.get('cycle'), 18, 45, 28),
        periodLength: clamp(f.get('period'), 2, 10, 5),
      });
      root.innerHTML = '';
      resolve();
    });
  });
}
