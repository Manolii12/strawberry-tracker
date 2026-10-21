// Lokale Speicherung in IndexedDB. Nichts verlässt das Gerät.
// Alle Einträge werden beim Start in den Speicher geladen (wenige hundert Tage → winzig).

const DB_NAME = 'strawberry';
const DB_VERSION = 1;

export const DEFAULT_SETTINGS = {
  onboarded: false,
  name: '',
  cycleLength: 28,      // Startwert, bis genug eigene Daten da sind
  periodLength: 5,
  lastPeriodStart: null, // aus dem Onboarding, falls noch nichts eingetragen ist
  pinHash: null,
  pinSalt: null,
  lastBackup: null,
};

let db;
export const state = { days: new Map(), settings: { ...DEFAULT_SETTINGS } };

function req(r) {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function store(name, mode = 'readonly') {
  return db.transaction(name, mode).objectStore(name);
}

export async function openDB() {
  const r = indexedDB.open(DB_NAME, DB_VERSION);
  r.onupgradeneeded = () => {
    const d = r.result;
    if (!d.objectStoreNames.contains('days')) d.createObjectStore('days', { keyPath: 'date' });
    if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
  };
  db = await req(r);

  const days = await req(store('days').getAll());
  state.days = new Map(days.map((d) => [d.date, d]));
  const settings = await req(store('kv').get('settings'));
  state.settings = { ...DEFAULT_SETTINGS, ...(settings || {}) };

  // Safari darf Daten nicht still löschen, wenn die App persistent ist.
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
}

export function getDay(date) {
  return state.days.get(date) || { date };
}

function isEmpty(e) {
  return !e.flow && !e.symptoms?.length && !e.mood?.length && !e.energy && !e.sleep && !e.body && !e.activity?.length && !e.pain && !e.note?.trim();
}

export async function saveDay(entry) {
  if (isEmpty(entry)) {
    state.days.delete(entry.date);
    await req(store('days', 'readwrite').delete(entry.date));
  } else {
    entry.updated = Date.now();
    state.days.set(entry.date, entry);
    await req(store('days', 'readwrite').put(entry));
  }
}

export async function saveSettings(patch) {
  Object.assign(state.settings, patch);
  await req(store('kv', 'readwrite').put(state.settings, 'settings'));
}

export function exportData() {
  const { pinHash, pinSalt, ...settings } = state.settings;
  return {
    app: 'strawberry-tracker',
    version: 1,
    exported: new Date().toISOString(),
    settings,
    days: [...state.days.values()].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export async function importData(data) {
  if (data?.app !== 'strawberry-tracker' || !Array.isArray(data.days)) {
    throw new Error('Das ist keine Strawberry-Tracker-Sicherung.');
  }
  const valid = data.days.filter((d) => typeof d?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date));
  const tx = db.transaction(['days', 'kv'], 'readwrite');
  tx.objectStore('days').clear();
  for (const d of valid) tx.objectStore('days').put(d);
  const { pinHash, pinSalt } = state.settings;
  const settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}), pinHash, pinSalt, onboarded: true };
  tx.objectStore('kv').put(settings, 'settings');
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  state.days = new Map(valid.map((d) => [d.date, d]));
  state.settings = settings;
  return valid.length;
}

export async function wipeAll() {
  const tx = db.transaction(['days', 'kv'], 'readwrite');
  tx.objectStore('days').clear();
  tx.objectStore('kv').clear();
  await new Promise((resolve) => { tx.oncomplete = resolve; });
  state.days = new Map();
  state.settings = { ...DEFAULT_SETTINGS };
}
