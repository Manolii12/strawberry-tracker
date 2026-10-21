// Optionale PIN-Sperre. Achtung: Das ist ein Sichtschutz, keine Verschlüsselung der Daten.

import { state, saveSettings } from './db.js';

const root = () => document.getElementById('lock-root');
const LOCK_AFTER_MS = 60_000;
let hiddenAt = 0;

async function digest(pin, salt) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${pin}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function setPin(pin) {
  const salt = crypto.getRandomValues(new Uint32Array(4)).join('-');
  await saveSettings({ pinSalt: salt, pinHash: await digest(pin, salt) });
}

export async function clearPin() {
  await saveSettings({ pinSalt: null, pinHash: null });
}

// Zeigt das PIN-Pad. mode 'unlock' prüft, mode 'set' fragt zweimal ab. Resolved mit der PIN bzw. true.
export function pinPad({ mode = 'unlock', title = 'Strawberry ist gesperrt' } = {}) {
  return new Promise((resolve) => {
    let entered = '';
    let first = null;
    let heading = title;

    const draw = (shake = false) => {
      root().innerHTML = `<div class="full"><div class="inner" style="text-align:center">
        <img class="hero-berry" src="icons/icon-192.png" alt="" style="width:84px;height:84px;border-radius:22px">
        <h2 style="margin:0">${heading}</h2>
        <div class="pin-dots ${shake ? 'shake' : ''}">${[0, 1, 2, 3].map((i) => `<i class="${i < entered.length ? 'on' : ''}"></i>`).join('')}</div>
        <div class="keypad">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-k="${n}">${n}</button>`).join('')}
          ${mode === 'set' ? '<button data-k="x" style="font-size:15px;font-family:var(--sans)">Abbr.</button>' : '<button></button>'}
          <button data-k="0">0</button><button data-k="<" aria-label="Löschen">⌫</button>
        </div></div></div>`;
    };

    const onKey = async (e) => {
      const k = e.target.closest('[data-k]')?.dataset.k;
      if (!k) return;
      if (k === 'x') { finish(null); return; }
      if (k === '<') { entered = entered.slice(0, -1); draw(); return; }
      if (entered.length >= 4) return;
      entered += k;
      draw();
      if (entered.length < 4) return;

      if (mode === 'unlock') {
        const ok = (await digest(entered, state.settings.pinSalt)) === state.settings.pinHash;
        if (ok) finish(true);
        else { entered = ''; setTimeout(() => draw(true), 150); }
      } else if (first == null) {
        first = entered; entered = ''; heading = 'PIN wiederholen';
        setTimeout(draw, 150);
      } else if (first === entered) {
        finish(entered);
      } else {
        first = null; entered = ''; heading = 'Stimmte nicht überein – neue PIN';
        setTimeout(() => draw(true), 150);
      }
    };

    const finish = (v) => {
      root().removeEventListener('click', onKey);
      root().innerHTML = '';
      resolve(v);
    };

    root().addEventListener('click', onKey);
    draw();
  });
}

export async function lockIfNeeded() {
  if (state.settings.pinHash && !root().innerHTML) await pinPad();
}

export function installAutoLock() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hiddenAt = Date.now();
    else if (hiddenAt && Date.now() - hiddenAt > LOCK_AFTER_MS) lockIfNeeded();
  });
}
