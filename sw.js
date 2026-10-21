// Service Worker: macht die App offline-fähig.
// Bei jeder Code-Änderung VERSION erhöhen, damit das iPhone die neue Version lädt.
const VERSION = 'strawberry-v5';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'js/app.js', 'js/db.js', 'js/ui.js', 'js/util.js', 'js/cycle.js', 'js/data.js', 'js/tips.js', 'js/tips-data.js', 'js/lock.js',
  'js/views/today.js', 'js/views/calendar.js', 'js/views/log.js', 'js/views/insights.js',
  'js/views/knowledge.js', 'js/views/settings.js', 'js/views/onboarding.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Netzwerk zuerst (damit Updates sofort ankommen), offline aus dem Cache.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});
