# APEX

Pearce's training app. A PWA with eight pages — **an 8-day rotating cycle, not a week** — and
nothing else.

Live: https://prlobban.github.io/apex/

## What it is

```
D1 PUSH A   D2 PULL A   D3 LEGS A   D4 RESET
D5 PUSH B   D6 PULL B   D7 LEGS B   D8 RESET + GATE
```

**Rest lands on every 4th day**, so the cycle drifts through the calendar week. That is
deliberate — the program is on a 4-day rhythm and the week is not.

"Today" is derived from an anchor date in storage (the date that was Day 1). The nav marks
today with an underline; the header says which day today actually is. Miss a day or shuffle
one and **MAKE TODAY** on the day you're really on re-anchors the whole cycle.

Each page opens with a **day-specific warm-up**, then lists that day's exercises with a target
(`sets x reps`, load, rest), a note where the cue matters, and a row per set with two boxes and
a tick. **START DAY FRESH** wipes that day and stamps a new start time.

**Running is not in this app**, and neither is the foot/ankle prehab block — that runs before
the run, so it lives with the run in the vault doc, not here.

At the bottom of every day: **EXPORT JSON** (downloads) and **COPY JSON** (clipboard — the
one that actually works in a standalone PWA on iOS). Both dump the whole cycle, not just the
day on screen, and the output is self-describing: day, section, exercise, prescribed line,
then the logged sets, plus the cycle anchor. That's the handoff back to Astra.

That's the whole app. No timer, no today view, no profile, no charts.

## Files

| File | What it holds |
|---|---|
| `program.js` | **The plan.** Data only — this is the file you edit. |
| `app.js` | Cycle arithmetic, render, localStorage logging. Knows nothing about plan content. |
| `styles.css` | Black & white, system font. |
| `index.html` | Shell: day nav + `<main>`. |
| `sw.js` | Offline cache. **Bump `CACHE` when app files change.** |
| `tools/generate-icons.mjs` | Regenerates the icons (black tile, white barbell). |

## Editing the plan

Everything lives in `program.js`. A day looks like:

```js
{
  id: 'd1', name: 'Day 1', short: '1', title: 'PUSH A', sub: 'Heavy bench · normal run',
  sections: [
    WARMUP('push'),
    { label: 'LIFT', items: [
      X('Barbell bench', 5, '3-5', '205-215', '3:00', 'THE ANCHOR. 215 = 91% of your max.'),
    ]},
  ],
}
```

`X(name, sets, target, load, rest, note, cols)` — `sets` decides how many logging rows
render. `cols` sets the two box labels and defaults to `['lb','reps']`; pass `['—','done']`
for a done-toggle row, or `['—','sec']` / `['—','reps']` for a single-value row.

`WARMUP(kind)` takes `push | pull | legs | reset` and builds the day-specific warm-up.
`SHOULDER()` is the right-shoulder rehab block on both reset days. `OHP_TEST()` is the
return-to-overhead-pressing test on D8.

Add `rest: true` to a day to mark it in the nav. The cycle length is just
`PROGRAM.days.length` — add or remove days and the arithmetic follows.

After editing app files, bump `CACHE` in `sw.js` so installed clients pull the new version.

## Dev

```
npx http-server -p 8137     # serve
node smoke-test.mjs         # render + persistence + cycle + veto check
node tools/generate-icons.mjs
```

## Storage

`localStorage` only, keyed `apex.v3.<dayId>`, plus `apex.v3.anchor` for the cycle. Per-device,
no sync. Clearing site data wipes the logs — export first if you care about them.

> The key moved `v2` → `v3` with the 8-day rebuild, so old Mon–Sun logs are orphaned rather
> than migrated. They were per-slot and overwritten each session anyway.
