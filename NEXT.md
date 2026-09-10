# APEX — pick up here (updated 2026-09-10)

Rebuilt 2026-09-01 as seven weekday pages. **Rebuilt again 2026-09-10 as an 8-day cycle** —
Push / Pull / Legs / Reset, twice, so rest lands on every 4th day and the block no longer
lines up with the calendar week.

## What changed on 2026-09-10

**Structure — the big one.**
- Seven weekday pages → **eight cycle days** `d1`…`d8`:
  `D1 Push A · D2 Pull A · D3 Legs A · D4 Reset · D5 Push B · D6 Pull B · D7 Legs B · D8 Reset + gate`.
- "Today" is no longer `new Date().getDay()`. It's derived from `apex.v3.anchor` — the local
  date that was Day 1 — via `cycleIndexToday()`. Nav underlines today; the header names it.
- **MAKE TODAY / RE-ANCHOR** button in the header moves the anchor when he misses or shuffles
  a day. Without it the cycle silently desyncs from reality, which is the failure mode of every
  non-weekly program.
- Storage key `apex.v2.*` → `apex.v3.*`. Old logs orphaned on purpose, not migrated.
- Export now carries `cycleLength` and `cycleAnchor`.

**Core work — three movements he vetoed are gone.**
- ❌ Dragon flag → ✅ **slider bodysaw** (D6). Same job — longest anti-extension lever with an
  eccentric bias — off the floor instead of the bench, and it's a clean 3-rung ladder.
- ❌ Bench reverse crunch → ✅ **floor reverse crunch, hands on the rack uprights** (D1).
- ❌ Hollow rock → ✅ **slow dead bug** (D6), 3s out / 3s back. *(A serratus band punch sat here
  for one draft and was vetoed. Serratus coverage lives in the reset-day wall slide and the push
  warm-up instead.)*
- ✅ **Bench stretch crunch stays** (D5) — the one bench ab movement he likes, and the only one
  that loads the rectus at long length.
- Hollow hold (D1), ab wheel (D2), TVA vacuum (D2), Pallof (D5) all unchanged — he didn't
  object to any of them.

**Right shoulder — he stopped Push A after set 2 of OHP.**
- **Standing barbell OHP is out** until it passes a test. Replaced by **seated neutral-grip DB
  OHP** — heavy-ish 3×6-8 on D1, volume 3×10-12 on D5, both skippable on a failed screen.
  **No landmine in the gym**, so that option is off the table permanently.
- `SHOULDER()` block on both reset days: isometric ER 5×30s → band ER @0° → serratus wall
  slide → prone/wall Y → face pull → cross-body stretch (conditional).
- `OHP_TEST()` on D8 — three criteria, all or none, then a graded re-entry. It unlocks the
  **barbell**; DB overhead pressing is already happening, governed by the daily screen.
- **Shoulder screen** in every push warm-up: broomstick overhead ×10 as a go/no-go, so a bad
  day is caught before the bar is loaded rather than at set 2.
- Bench technique cues added (grip width, elbow angle, blades). Lateral raises capped at
  shoulder height, neutral thumb.

**Warm-ups are now day-specific**, not one generic block:
- push → T-spine + scap + cuff + shoulder screen
- pull → T-spine + scap pull-up + dead hang + cuff + elbow
- legs → knee-to-wall + hips + **a progressive Achilles ramp** (bilateral fast → slow → single leg)
- reset → knee-to-wall, then straight into the shoulder block
- 🔴 **The foot/ankle prehab block is OUT of every warm-up** (his call). It belongs to the
  pre-run, and the run is not in this app. Knee-to-wall survives only on legs + reset days,
  where it's dorsiflexion prep for loading, not run prep. The smoke test enforces both.

## Where the program lives

Source of truth is the vault doc `20-fitness/apex-program.md`. It owns the running (run first,
the 5-min foot/ankle block that precedes it, the 20-min filled gap, shortest on D3/D7, longest
on D4/D8, frozen at 1 mi/day until the calf gate clears) and the shoulder protocol in full.
**Nothing in the app enforces the running or the pre-run prehab.**

## Open items

1. **Loads are still estimates.** Bench 235 / squat 300 / DL 315 are from memory and untested.
   The percentages in the notes (91% / 84% / 88%) rest on them. Establish real numbers via
   215 AMRAP tests.
2. **Two gates now, and both need filling in** — the calf gate (unlocks mileage) and the
   return-to-OHP test (unlocks overhead pressing). If D8 gets skipped, neither ever opens.
3. **Volume is down ~12%/week** — 6 lifting sessions per 8 days instead of per 7. That's the
   price of the 4th-day rest and it was his call. Watch whether it costs anything; if the
   shoulder settles and he's recovering easily, accessory sets come back before sessions do.

## Baselines (don't re-ask)

6'0", 175 lb, lean, recomp at ~175. Home gym: barbell + plates **215 lb total max**, squat
rack, pull-up bar (**too low to hang leg raises**), adjustable bench incl. decline, DBs 5-60
(no 30s), one 40 lb KB, bands L/M/H, ab wheel, 14 lb med ball (ground slams only), 18" box,
foam roller, massage gun. **No pool, no bike** — excluded by request.

Injuries: right Achilles fully torn ~mid-2025, ~99%, needs a thorough warm-up. Right medial
foot tendon (likely tib post) asymptomatic since ~2026-09-01 but mileage stays at 1 mi/day
until the heel-raise symmetry gate clears — symptoms are not the gate. **Right shoulder
symptomatic from 2026-09-10**, provoked by overhead pressing. Back tweak 2026-08-03, resolved.
