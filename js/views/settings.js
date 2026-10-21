import { state, saveSettings, exportData, importData, wipeAll } from '../db.js';
import { esc, formatShort, toast, todayISO } from '../util.js';
import { register, rerender } from '../ui.js';
import { pinPad, setPin, clearPin } from '../lock.js';

export const APP_VERSION = '1.0.0';

export function render() {
  const s = state.settings;
  return `
    <header class="top">
      <div><div class="eyebrow">Deine App</div><h1>Einstellungen</h1></div>
      <a class="icon-btn" href="#/heute" aria-label="Zurück">✕</a>
    </header>

    <div class="card">
      <label class="field"><span>Wie soll ich dich nennen?</span>
        <input type="text" value="${esc(s.name)}" data-change="set-name" maxlength="30" placeholder="Name"></label>
      <div class="grid2">
        <label class="field"><span>Zykluslänge (Start)</span>
          <input type="number" min="18" max="45" value="${s.cycleLength}" data-change="set-num" data-key="cycleLength"></label>
        <label class="field"><span>Periodenlänge (Start)</span>
          <input type="number" min="2" max="10" value="${s.periodLength}" data-change="set-num" data-key="periodLength"></label>
      </div>
      <p class="muted small" style="margin:0">Diese Werte gelten nur, bis du mindestens zwei Zyklen eingetragen hast. Danach rechnet die App mit deinen echten Daten.</p>
    </div>

    <h2>💾 Backup</h2>
    <div class="card stack">
      <p style="margin:0">Deine Daten liegen <b>nur auf diesem Gerät</b>. Wenn du die App vom Home-Bildschirm löschst oder das iPhone wechselst, sind sie ohne Backup weg.</p>
      <p class="muted small" style="margin:0">Letztes Backup: ${s.lastBackup ? formatShort(s.lastBackup.slice(0, 10)) : 'noch nie'}</p>
      <button class="btn berry block" data-action="export">Backup erstellen (z. B. in iCloud Drive sichern)</button>
      <label class="btn ghost block" style="cursor:pointer">Backup wiederherstellen
        <input type="file" accept="application/json,.json" data-change="import" hidden></label>
    </div>

    <h2>🔒 Privatsphäre</h2>
    <div class="card stack">
      <div class="row between"><span>PIN-Sperre</span>
        <button class="chip ${s.pinHash ? 'on' : ''}" data-action="toggle-pin">${s.pinHash ? 'An' : 'Aus'}</button></div>
      <p class="muted small" style="margin:0">Die PIN schützt vor neugierigen Blicken, verschlüsselt die Daten aber nicht. Die App sperrt sich nach 1 Minute im Hintergrund.</p>
    </div>

    <h2>ℹ️ Über die App</h2>
    <div class="card">
      <p style="margin-top:0">Strawberry Tracker ist ein privates, nicht-kommerzielles Projekt. Es gibt keine Werbung, kein Tracking und keinen Server: Alles wird lokal gespeichert.</p>
      <div class="notice" style="margin:12px 0"><span>⚠️</span><span><b>Keine Verhütungsmethode.</b> Fruchtbare Tage und Eisprung sind Kalenderschätzungen. Die Tipps ersetzen keine ärztliche Beratung.</span></div>
      <p class="muted small" style="margin:0">Version ${APP_VERSION}</p>
    </div>

    <h2>Daten löschen</h2>
    <div class="card"><button class="btn danger block" data-action="wipe">Alle Daten löschen</button></div>`;
}

async function shareOrDownload(blob, filename) {
  const file = new File([blob], filename, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Strawberry Backup' });
      return true;
    } catch (e) {
      if (e.name === 'AbortError') return false;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return true;
}

register({
  'set-name': async (el) => { await saveSettings({ name: el.value.trim() }); toast('Gespeichert'); },
  'set-num': async (el) => {
    const v = Math.round(Number(el.value));
    if (!v || v < Number(el.min) || v > Number(el.max)) { toast(`Bitte ${el.min}–${el.max} Tage`); rerender(); return; }
    await saveSettings({ [el.dataset.key]: v });
    toast('Gespeichert');
  },
  export: async () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 1)], { type: 'application/json' });
    if (await shareOrDownload(blob, `strawberry-backup-${todayISO()}.json`)) {
      await saveSettings({ lastBackup: new Date().toISOString() });
      toast('Backup erstellt 🍓');
      rerender();
    }
  },
  import: async (el) => {
    const file = el.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!confirm(`Backup vom ${data.exported?.slice(0, 10) || '?'} laden? Die aktuellen Daten werden dabei ersetzt.`)) return;
      const n = await importData(data);
      toast(`${n} Tage wiederhergestellt`);
      rerender();
    } catch (e) {
      alert(e.message || 'Die Datei konnte nicht gelesen werden.');
    } finally {
      el.value = '';
    }
  },
  'toggle-pin': async () => {
    if (state.settings.pinHash) {
      if (await pinPad({ title: 'Aktuelle PIN eingeben' })) { await clearPin(); toast('PIN entfernt'); }
    } else {
      const pin = await pinPad({ mode: 'set', title: 'Neue 4-stellige PIN' });
      if (pin) { await setPin(pin); toast('PIN aktiviert 🔒'); }
    }
    rerender();
  },
  wipe: async () => {
    if (!confirm('Wirklich ALLE Einträge und Einstellungen löschen? Das kann nicht rückgängig gemacht werden.')) return;
    if (!confirm('Ganz sicher? Ohne Backup sind die Daten endgültig weg.')) return;
    await wipeAll();
    location.hash = '#/heute';
    location.reload();
  },
});
