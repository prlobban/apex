# APEX

Pearce's personal training plan — a self-hosted, offline-capable PWA. Rebuild of the
original single-file `apex`, restructured so the **plan is data, not code**.

## Files

| File                   | What it is                                                        |
|------------------------|------------------------------------------------------------------|
| `index.html`           | App shell: bottom nav + mount point. Loads the scripts.          |
| `styles.css`           | Design system (dark/sharp/mono). All visual tokens live here.    |
| `program.js`           | **THE PLAN.** Data only. This is the file you edit most.         |
| `app.js`               | App core: router, render, persistence, logging. Plan-agnostic.   |
| `timer.js`             | Interval + rest timer (Web Audio beeps).                         |
| `sw.js`                | Service worker — offline cache.                                  |
| `manifest.webmanifest` | PWA install metadata.                                            |

## Why this shape
- **Edit the plan without touching app logic.** Add weeks/days/items in `program.js`;
  `app.js` renders whatever's there.
- **Running is first-class.** Items have a `kind` (`lift`, `run`, `hold`, `plyo`, `note`).
  Run items support intervals/tempo/easy/long/sprint — paces and splits, not just sets/reps.
- **Offline + installable.** Service worker caches everything; add to home screen.

## Run it
Needs to be served over http (service worker + modules). From this folder:
```
python -m http.server 8080
```
Then open http://localhost:8080 . On your phone: open the URL, Share → Add to Home Screen.

## Data model (see top of `program.js` for the full spec)
`PROGRAM → weeks[] → days[] → sections[] → items[]`. Each item's `kind` decides what
gets logged. Logs persist to `localStorage` per week+day.

## Status
Framework only. `program.js` holds a placeholder week — the real plan gets designed next.
Icons in `icons/` are not generated yet (PWA still installs; add `icon-192.png` /
`icon-512.png` when ready).
