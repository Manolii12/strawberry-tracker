# Strawberry Tracker 🍓

Privater, nicht-kommerzieller Zyklus-Tracker als Web-App (PWA). Kein Server und kein Konto. Alle Daten bleiben im Browser-Speicher (IndexedDB) auf dem iPhone.

## Lokal testen
```
python3 -m http.server 8321
```
Danach http://localhost:8321 öffnen.

## Veröffentlichen mit GitHub Pages
1. Auf github.com ein neues **öffentliches** Repository anlegen, z. B. `strawberry`.
2. Diese Dateien und Ordner hochladen (**ohne** `quellen/`, denn die PDFs sind urheberrechtlich geschützt):
   `index.html`, `manifest.webmanifest`, `sw.js`, `css/`, `js/`, `icons/` und `README.md` (nicht `privat/` und `quellen/`)
3. Repository → Settings → Pages → „Deploy from a branch“ → `main` / `(root)` → Save.
4. Nach 1–2 Minuten ist die App unter `https://<user>.github.io/strawberry/` erreichbar.

## Auf dem iPhone installieren
Den Link in **Safari** öffnen → Teilen → „Zum Home-Bildschirm“.

## Wichtig
- Daten liegen nur auf dem Gerät. Ab und zu über Einstellungen → Backup sichern, z. B. in iCloud Drive.
- Wird das Icon vom Home-Bildschirm gelöscht, sind die Daten ohne Backup weg.
- Vorhersagen sind Kalenderschätzungen und **keine Verhütungsmethode**.
- Die Tipps beruhen auf den sechs Quellen in der (lokalen) Quellenauswertung und wählen immer passend zur aktuellen Zyklusphase.

## Updates
Geänderte Dateien erneut ins Repository hochladen. Die App lädt die neue Version beim nächsten Öffnen mit Internetverbindung.
