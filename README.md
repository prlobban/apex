# APEX

Pearce's training app for the **APEX Hybrid** 8-week block: Pull, Push, Legs, Recovery, repeated 14 times.

Live (tailnet only): **https://ronin.tail91327e.ts.net**. Install on iPhone: open it in Safari with Tailscale on, then Share → Add to Home Screen.

## How it works

- **One screen per date.** The block start date ("Day 1") decides which session a date is. ‹ › step through days. **SLIDE A DAY** pushes the block back one day for a red or missed day.
- **Every exercise shows today's target**, worked out by `engine.js` from what was actually logged last time:
  - all sets hit → add reps
  - top of the range → next weight on the ladder, or the next harder version
  - below the low number twice → one step back
  - easy weeks (cycles 7 and 14) halve the sets and don't count toward progression
  - feet at 3+ this week → leg rep adds hold
- **Tap ✓ on an empty set** to log the target as done. Type a different weight and that becomes the new baseline.
- **Every day has a notes box** for feedback. Each morning also takes a foot score (0-10), the run and weight/waist.
- **Tests** (cycles 1, 7, 14) fold out at the bottom. The week-4 heel-raise test gates the single-leg jumps.

## Storage

- **Phone first, box second.** Every edit is saved in the phone's storage and queued. The app pushes the queue to the box whenever it can reach it, and newer edits win. The dot top-right shows the state: solid = synced, hollow = waiting, dashed = box unreachable.
- **The box** (LXC 101 on the Dojo) runs `server/server.mjs` as the `apex` systemd service on `127.0.0.1:8787`. Data: SQLite at `/home/ronin/apex-data/apex.db`. Nightly backup at 03:30 into `apex-data/backups/`, kept 14 days, on the same disk.
- **HTTPS** comes from `tailscale serve` (userspace mode, since the container has no TUN device).
- **Read it:** `GET /api/export` for JSON, or `ssh ronin-ct sqlite3 ~/apex-data/apex.db` for SQL. Tables: `sets`, `days` (notes, foot, run, weight, waist), `tests`, `meta` (the Day 1 anchor).

## Files

| File | What it holds |
|---|---|
| `program.js` | **The plan.** Exercises, version lists, weight ladders, jumps, running, tests. Data only. |
| `engine.js` | Block maths and the progression rule. Pure functions, tested. |
| `app.js` | The screen, the phone-side store and sync. |
| `server/server.mjs` | Static files + `/api/sync`, `/api/state`, `/api/export`. Zero dependencies (`node:sqlite`). |
| `sw.js` | Offline cache for the app shell. **Bump `CACHE` on every change.** |
| `tools/generate-icons.mjs` | Draws the icon (peak over a barbell). `node tools/generate-icons.mjs` |
| `smoke-test.mjs` | Engine rules, every screen, the outbox, and a server sync round-trip. `node smoke-test.mjs` |

## Deploy

```bash
tar -cf - index.html styles.css app.js engine.js program.js sw.js manifest.webmanifest icons server \
  | ssh ronin-ct 'tar -xf - -C ~/apex && sudo systemctl restart apex'
```
