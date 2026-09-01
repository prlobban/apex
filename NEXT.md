# APEX — pick up here (updated 2026-09-01)

Rebuilt from scratch on 2026-09-01. The old 4-week hybrid block is gone; the app is now
**seven day pages and nothing else**, running the September PPL program.

## What changed
- **Removed:** Today view, Program view, Timer, Progress, Profile, JSON export, `timer.js`,
  Google Fonts, all colour. The old `makeWeek()` / 4-week generator is gone with them.
- **Now:** `index.html` is a day nav + `<main>`. `app.js` renders one day at a time.
- **Look:** black & white only, `system-ui` default font. White paper, black ink, hairline
  rules. Icon is a white barbell on a black tile (`tools/generate-icons.mjs`).
- **Logging:** per set — two boxes + a tick. `localStorage`, key `apex.v2.<dayId>`.
- **START DAY FRESH** button on every day: confirms, clears that day, stamps a start time.
- `sw.js` cache bumped to `apex-v3`.

## The program it runs
The September PPL block, agreed 2026-09-01. Source of truth is the vault doc
`90-agent-output/ppl-program-2026-09.md` (promote target: `20-fitness/`).

```
Mon Push A    Tue Pull A    Wed Legs A    Thu Push B
Fri Pull B    Sat Legs B    Sun Mobility + gate test
```

Run every day, **run always goes first**, 20-minute filled gap, then lift. Leg days get the
shortest run. Every day starts with the same `DAILY()` block: foot activation, run, gap work.

Key rules baked into the notes: one heavy anchor per session (215 must go ≤6 reps to
qualify); right leg leads every unilateral set; calf work last and reps govern; no loaded
ab work; heavy hinge exactly once a week (Wed).

## Open items
1. **Export is back** (kept by request, 2026-09-01) — `EXPORT JSON` / `COPY JSON` at the foot
   of every day, covering all seven days, self-describing. COPY is the one that works in a
   standalone PWA on iOS. This is the handoff for Astra to review loads against real data.
2. **Loads are estimates.** Bench 235 / squat 300 / DL 315 are from memory and untested.
   The percentages in the notes (91% / 84% / 88%) rest on them. First 6 weeks should
   establish real numbers via 215 AMRAP tests.
3. **Gate test lives on Sunday** in-app and is the thing that unlocks mileage. If he isn't
   filling it in, the running ramp has no brake.

## Baselines (don't re-ask)
6'0", 175 lb, lean, recomp at ~175. Home gym: barbell + plates **215 lb total max**, squat
rack, pull-up bar (**too low to hang leg raises**), adjustable bench incl. decline, DBs
5-60 (no 30s), one 40 lb KB, bands L/M/H, ab wheel, 14 lb med ball (ground slams only),
18" box, foam roller, massage gun. **No pool, no bike** — excluded by request.

Injuries: right Achilles fully torn ~mid-2025, ~99%, needs thorough warm-up. **Right medial
foot tendon currently symptomatic** (likely tib post) — 2 weeks off running, back at 1 mi/day
and frozen there until the heel-raise symmetry gate clears. Back tweak 2026-08-03, resolved.
