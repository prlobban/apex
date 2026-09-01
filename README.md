# APEX

Pearce's training app. A PWA with seven pages — Monday to Sunday — and nothing else.

Live: https://prlobban.github.io/apex/

## What it is

One page per day of the week. Each page opens with a short warm-up, then lists that day's
exercises with a target (`sets x reps`, load, rest), a note where the cue matters, and a row
per set with two boxes and a tick. **START DAY FRESH** wipes that day and stamps a new start
time.

**Running is not in this app.** Pearce runs on his own. The ankle/foot prep stays in the
warm-up regardless — that's tib-post prehab, not running.

At the bottom of every day: **EXPORT JSON** (downloads) and **COPY JSON** (clipboard — the
one that actually works in a standalone PWA on iOS). Both dump all seven days, not just the
one on screen, and the output is self-describing: day, section, exercise, prescribed line,
then the logged sets. That's the handoff back to Astra.

That's the whole app. No timer, no today view, no profile, no charts.

## Files

| File | What it holds |
|---|---|
| `program.js` | **The plan.** Data only — this is the file you edit. |
| `app.js` | Router, render, localStorage logging. Knows nothing about plan content. |
| `styles.css` | Black & white, system font. |
| `index.html` | Shell: day nav + `<main>`. |
| `sw.js` | Offline cache. **Bump `CACHE` when app files change.** |
| `tools/generate-icons.mjs` | Regenerates the icons (black tile, white barbell). |

## Editing the plan

Everything lives in `program.js`. A day looks like:

```js
{
  id: 'mon', name: 'Monday', title: 'PUSH A', sub: 'Heavy bench', run: 'normal',
  sections: [
    DAILY('normal — 1 mi'),
    { label: 'LIFT', items: [
      X('Barbell bench', 5, '3-5', '205-215', '3:00', 'THE ANCHOR. 215 = 91% of your max.'),
    ]},
  ],
}
```

`X(name, sets, target, load, rest, note, cols)` — `sets` decides how many logging rows
render. `cols` sets the two box labels and defaults to `['lb','reps']`; pass
`['—','done']` for a done-toggle row or `['mi','min']` for the run.

After editing app files, bump `CACHE` in `sw.js` so installed clients pull the new version.

## Dev

```
npx http-server -p 8137     # serve
node smoke-test.mjs         # render + persistence check
node tools/generate-icons.mjs
```

## Storage

`localStorage` only, keyed `apex.v2.<dayId>`. Per-device, no sync. Clearing site data wipes
the logs — export first if you care about them.
