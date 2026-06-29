# APEX rebuild — pick up here (paused 2026-06-28)

Resuming the personal fitness-plan app rebuild. Framework is **built and verified**;
next session = design the real plan + wire data. Read this top-to-bottom to resume.

## Where things stand
- New project at `C:\Users\daysh\apex\` (git initialized, not committed/pushed yet).
- Framework done: `index.html`, `styles.css`, `program.js` (THE PLAN — data only),
  `app.js` (router/render/logging), `timer.js` (interval+rest), `sw.js`, `manifest`.
- Verified booting + all 5 views render + logging persists (jsdom smoke test passes:
  `node smoke-test.mjs`). Serve with `npx http-server -p 8137` (Python isn't installed).
- `program.js` holds a PLACEHOLDER week only — the real plan replaces it.

## What Pearce wants (confirmed this session)
One all-inclusive **6-day** plan. Every day a DIFFERENT flavor, all feeding **four pillars**:
1. **Running / endurance** (a PRIORITY) — mostly OFF-track; **≤1 track day/week** for now.
   Real distance, e.g. a 10k run day, not just 5k.
2. **Strength** — wants to be super strong, "throw weight around like nothing."
3. **Physique** — 8-pack, lats, **big strong legs**; strong AND aesthetic.
4. **Mobility / flexibility** — woven in: full flexibility routines, mobility, and deep
   hip/joint prehab (90/90 hip work, tib raises, hip rotations, etc.).

Day-type ideas he named: long run; swim day (casual swimmer, has pool); **one-kettlebell
full-body intense circuit** (he owns ONE ~40lb KB); a hard circuit day; a hard strength day;
≤1 track day; flexibility/mobility days layered on top of other work.

**Schedule:** everything ASSIGNED to specific days at the start, but he can MOVE sessions
around. (app already supports opening any day; reordering UI is a possible nice-to-have.)

## Open items for tomorrow
1. **Equipment checklist** — he asked me to list everything I think this plan needs; he'll
   confirm what he has. DRAFT BELOW — present it first thing.
2. **Design the weekly template** — map the 4 pillars across 6 days as a fixed-but-moveable
   week. Then fill `program.js` with the real block (likely 4–8 weeks w/ progression).
3. **Data storage decision** — he wants Astra to read all in-app logs, but kept SEPARATE
   from Lane One's data. Options: (a) NEW Supabase project, or (b) Google Cloud tables.
   Decide, then wire the app to sync logs there. (Interim: read localStorage via debug
   Chrome — run `launch-chrome-debug.cmd`, then `eval_js` on the running app.)
4. **Garmin MCP** — PARKED. He's deciding. Would need a local server logging into Garmin
   Connect with his creds (.env) to pull runs/HR/sleep. Revisit when he says go.

## Known baselines (already on file — don't re-ask)
6'0", 175lb (open to ~185, lean). Bench ~235 / Squat ~290–300 / DL ~315. Home gym: barbell,
squat rack, pull-up bar, DBs to 60lb, plates to ~250lb total (can't go truly heavy).
Run ~5mi/wk, 2mi @ ~9:00, **goal sub-23:00 5k**. Achilles ~99% — warm up thoroughly.
NEW: ~40lb kettlebell (x1), reliable pool access (casual swimmer).

## Equipment checklist DRAFT (confirm have / don't have)
Have (on file): barbell + plates (~250lb), squat rack, pull-up bar, DBs to 60lb, ~40lb KB,
pool access, Garmin watch.
Ask about:
- Adjustable bench (flat/incline)
- Resistance bands — mini/loop bands + long/pull-apart bands
- Medicine ball / slam ball (power circuits)
- Jump rope
- Plyo box (jumps, step-ups)
- Foam roller + lacrosse/massage ball (mobility)
- Yoga mat
- Ab wheel (core/8-pack)
- Dip station / parallettes
- Gymnastic rings or TRX/suspension trainer
- Yoga blocks + strap (splits/flexibility)
- Weight vest (running/calisthenics overload)
- Trap/hex bar (heavy legs w/o lower-back load — fits Achilles/back caution)
- Heavier/second kettlebell (currently only one 40lb)
- Hurdles or agility ladder (drills, he's an ex-hurdler)
- Massage gun
- Sandbag (odd-object strength/conditioning)
