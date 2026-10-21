import { openDB, state } from './db.js';
import { installDelegation, setRender } from './ui.js';
import { lockIfNeeded, installAutoLock } from './lock.js';
import { runOnboarding } from './views/onboarding.js';
import * as today from './views/today.js';
import * as calendar from './views/calendar.js';
import * as insights from './views/insights.js';
import * as knowledge from './views/knowledge.js';
import * as settings from './views/settings.js';
import './views/log.js';

const routes = { heute: today, kalender: calendar, einblicke: insights, wissen: knowledge, einstellungen: settings };
let current = null;

function route() {
  const name = location.hash.replace(/^#\/?/, '') || 'heute';
  return routes[name] ? name : 'heute';
}

function render() {
  const name = route();
  const view = document.getElementById('view');
  view.innerHTML = routes[name].render();
  document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('active', a.dataset.tab === name));
  if (current !== name) { window.scrollTo(0, 0); current = name; }
}

async function main() {
  installDelegation();
  setRender(render);
  await openDB();
  await lockIfNeeded();
  if (!state.settings.onboarded) await runOnboarding();
  render();
  installAutoLock();
  window.addEventListener('hashchange', render);
  // Datum kann sich ändern, wenn die App über Mitternacht offen bleibt.
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

main().catch((e) => {
  console.error(e);
  document.getElementById('view').innerHTML = `<div class="card"><h3>Hoppla 🍓</h3><p>Die App konnte nicht starten: ${String(e.message || e)}</p></div>`;
});
