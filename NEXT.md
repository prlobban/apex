# APEX — pick up here (updated 2026-06-29)

The real 4-week block is **seeded and live**. Pearce is running Week 1 and reports
back **Mon 2026-07-06** with an export + how everything felt. Read this to resume.

## Where things stand
- Project at `C:\Users\daysh\apex\` (git committed locally, no remote yet).
- `program.js` now holds the **real research-backed 4-week block** (not the placeholder).
  Built via a `makeWeek(params)` generator — weeks share one template, only loads/volumes
  progress. Wk1–3 progressive, Wk4 deload + re-test.
- `app.js` logging upgraded: **per-set weight/reps/note** for lifts, **watch-run log**
  (distance/time/pace/avg+max HR/note) for runs, done+note for holds/plyos.
- **Export** is now self-describing (resolves keys → week/day/exercise names) so the JSON
  is readable standalone when Pearce hands it back. Profile → Export data.
- Serve: `npx http-server -p 8137` (Python not installed). Smoke test: `node smoke-test.mjs`.

## The plan (confirmed + seeded)
6 days, fixed-but-moveable, 4 pillars (run priority / strength / physique / mobility),
research-backed throughout (frequency 2x/wk, full force-velocity curve for power, 80/20
polarized running, de Salles/Schoenfeld rest intervals, HSR Achilles + band leg curls,
head-to-toe prehab baked into every day):
- D1 Lower (power+strength), D2 Upper (power+strength), D3 Swim+mobility,
  D4 Sprint speed (1 track day, sprint-focused), D5 Long Zone-2 run (continuous ramp),
  D6 KB/circuit+flexibility, D7 Rest.
- Exact loads seeded off his real numbers (squat 235×5/~290, bench 215×5, OHP 135–145,
  pull-ups 18–23, PC ~220 1.5y ago, 5k ~9:30, gasses after 50m swim). Bar caps 215.

## Open items
1. **Week-1 report (Mon 2026-07-06):** review his export, adjust loads, build the NEXT block.
   Todoist task set (Fitness project).
2. **Data storage** — still localStorage only, by his call ("don't want to wire up Supabase
   for now"). Export = the handoff mechanism. Revisit if he wants history/sync later.
3. **Garmin MCP** — still PARKED. Watch data is hand-entered into the run log for now.

## Known baselines (don't re-ask) — see program.js `athlete` block
6'0", 175lb. Home gym: barbell+plates 215 total, squat rack, pull-up bar, DBs 5–60 (NO 30),
one 40lb KB, adjustable bench (incl. decline), bands L/M/H, agility ladder, 14lb med ball
(no wall throws), jump rope, ab wheel, foam roller+lacrosse, massage gun, 18" ice-chest box,
25m pool. Achilles ~99% — warm up. Goal sub-23 5k + jump high + strong/aesthetic.
