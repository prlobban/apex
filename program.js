/* ============================================================
   APEX — THE PROGRAM (data only, no app logic)
   ------------------------------------------------------------
   Edit this file to change the plan. app.js never needs touching.

   DAY     = { id, name, title, sub, run, sections:[SECTION] }
   SECTION = { label, items:[ITEM] }
   ITEM    = { name, sets, target, load, rest, note, cols }
       sets   -> how many logging rows get rendered
       target -> rep / time target shown on the header line
       load   -> target load text ("205-215", "2x60", "")
       cols   -> [leftBoxLabel, rightBoxLabel]; default ['lb','reps']
   ============================================================ */
'use strict';

var X = function (name, sets, target, load, rest, note, cols) {
  return {
    name: name, sets: sets, target: target,
    load: load || '', rest: rest || '', note: note || '',
    cols: cols || ['lb', 'reps'],
  };
};

// Pre-lift block — identical every day, only the run distance changes.
var DAILY = function (runNote) {
  return {
    label: 'BEFORE YOU LIFT',
    items: [
      X('Foot activation', 1, '5 min', '', '',
        'Short foot 2x15. Band inversion 3x20 @3s. Slow heel raise 2x20.', ['—', 'done']),
      X('RUN', 1, runNote, '', '',
        'Run FIRST, always. Flat, non-cambered surface. Cadence 170-180. Pain over 3/10 or altered gait during the run means the leg work is cut today.', ['mi', 'min']),
      X('Gap work', 1, '20 min', '', '',
        'Knee-to-wall 2x10. Balance 2x30s. Then warm up the lift.', ['—', 'done']),
    ],
  };
};

var PROGRAM = {
  name: 'APEX',
  version: '2026-09 PPL',
  days: [

    /* ---------------------------------------------------- MON */
    {
      id: 'mon', name: 'Monday', title: 'PUSH A', sub: 'Heavy bench', run: 'normal',
      sections: [
        DAILY('normal — 1 mi'),
        {
          label: 'LIFT',
          items: [
            X('Barbell bench', 5, '3-5', '205-215', '3:00', 'THE ANCHOR. 215 = 91% of your max.'),
            X('Incline DB press', 3, '8-10', '2x60', '2:00'),
            X('Standing OHP', 3, '6-8', '', '2:00'),
            X('Lateral raise', 4, '15', '', '45s', 'Superset with the triceps below.'),
            X('Overhead band triceps ext', 4, '12', 'band', '45s'),
          ],
        },
        {
          label: 'ABS — lower rectus',
          items: [
            X('Bench reverse crunch', 4, '12-15', 'bw', '45s',
              'Lie on the flat bench, grip behind your head, curl the hips fully off. Ladder: bent knee, then straight leg, then 3s eccentric.'),
            X('Hollow hold', 3, '30s', 'bw', '30s', '', ['—', 'sec']),
          ],
        },
      ],
    },

    /* ---------------------------------------------------- TUE */
    {
      id: 'tue', name: 'Tuesday', title: 'PULL A', sub: 'Heavy vertical / hinge-free', run: 'normal',
      sections: [
        DAILY('normal — 1 mi'),
        {
          label: 'LIFT',
          items: [
            X('Weighted pull-up', 5, '3-5', '+40 KB / 60 DB', '3:00', 'THE ANCHOR.'),
            X('Chest-supported incline DB row', 3, '10-12', '2x60', '90s', 'Lats without erector girth.'),
            X('DB pullover', 3, '12-15', '', '60s', 'Best non-cable lat lengthener you own.'),
            X('Band face pull', 3, '20', 'band', '45s'),
            X('Incline DB curl', 3, '10-12', '', '45s'),
          ],
        },
        {
          label: 'ABS — anti-extension',
          items: [
            X('Ab-wheel rollout', 4, '8-12', 'bw', '60s', 'Ladder: knees, then long lever, then standing.'),
            X('TVA vacuum', 3, '30s', '', '30s', '', ['—', 'sec']),
          ],
        },
        {
          label: 'NOTE',
          items: [
            X('No hinging today', 1, '—', '', '',
              'Legs A is tomorrow. No barbell rows, no deadlifts.', ['—', 'ok']),
          ],
        },
      ],
    },

    /* ---------------------------------------------------- WED */
    {
      id: 'wed', name: 'Wednesday', title: 'LEGS A', sub: 'Heavy bilateral', run: 'SHORTEST',
      sections: [
        DAILY('SHORTEST — 1 mi'),
        {
          label: 'LIFT',
          items: [
            X('Front squat', 5, '3', '215', '3:00', 'THE ANCHOR. 215 = 84% of your front squat max.'),
            X('Snatch-grip 2in deficit deadlift', 3, '3', '215', '2:30', 'The ONLY heavy hinge of the week. 88%.'),
            X('Barbell hip thrust', 4, '10-12', '', '90s', 'Best growth-per-unit-cost lift you have. Zero ankle demand.'),
            X('Slider / band leg curl', 4, '10', '', '75s', 'Foot passive throughout.'),
            X('Seated bent-knee calf raise', 4, '8', 'KB on knee', '90s',
              'LAST in the session. 3s up / 2s hold / 3s down. RIGHT LEG SETS THE REPS, left matches and never exceeds.'),
          ],
        },
        {
          label: 'NOTE',
          items: [
            X('No abs today', 1, '—', '', '',
              'Abs live on the four upper days. Back squat is demoted: 215 goes 10-12 reps, so it fails as an anchor.', ['—', 'ok']),
          ],
        },
      ],
    },

    /* ---------------------------------------------------- THU */
    {
      id: 'thu', name: 'Thursday', title: 'PUSH B', sub: 'Incline / volume', run: 'LONGEST',
      sections: [
        DAILY('LONGEST — 1 mi'),
        {
          label: 'LIFT',
          items: [
            X('Incline barbell press', 4, '6-8', '175-195', '2:30', 'The upper-chest shelf.'),
            X('Flat DB press', 3, '10-12', '2x60', '90s'),
            X('Lateral raise', 4, '15-20', '', '60s'),
            X('Skull crusher', 3, '10-12', '', '60s'),
            X('Band pushdown', 2, '25', 'band', '30s'),
          ],
        },
        {
          label: 'ABS — rectus under stretch',
          items: [
            X('Bench stretch crunch', 4, '12-15', 'bw', '45s',
              'Bench at 20-30 degrees. Shoulder blades level with the top edge, let head and upper back drape back over it. THE BOTTOM IS THE POINT, do not cut it short.'),
            X('Band Pallof press', 3, '12/side', 'light', '30s', 'Light. Anti-rotation only, never heavy.'),
          ],
        },
      ],
    },

    /* ---------------------------------------------------- FRI */
    {
      id: 'fri', name: 'Friday', title: 'PULL B', sub: 'Volume', run: 'normal',
      sections: [
        DAILY('normal — 1 mi'),
        {
          label: 'LIFT',
          items: [
            X('Chin-up', 4, 'AMRAP-1', 'bw', '2:00'),
            X('1-arm DB row', 4, '10-12', '60', '75s', '1s pause at the top.'),
            X('Band pullover', 3, '15', 'band', '60s', 'Anchor over the pull-up bar.'),
            X('Rear delt fly', 4, '20', '', '45s'),
            X('Hammer curl', 3, '12', '', '45s'),
          ],
        },
        {
          label: 'ABS — max lever',
          items: [
            X('Dragon flag progression', 4, '6-10', 'bw', '60s',
              'Off the flat bench, 3s lower. Ladder: tuck, straddle, single leg, full. Start with tuck negatives.'),
            X('Hollow rock', 3, '20', 'bw', '30s'),
          ],
        },
      ],
    },

    /* ---------------------------------------------------- SAT */
    {
      id: 'sat', name: 'Saturday', title: 'LEGS B', sub: 'Unilateral / posterior, RPE 7', run: 'SHORTEST',
      sections: [
        DAILY('SHORTEST — 1 mi'),
        {
          label: 'LIFT',
          items: [
            X('Rear-foot-elevated split squat', 4, '8/leg', '50-60', '90s',
              'RIGHT LEG LEADS and sets the reps. Front foot flat, no bounce.'),
            X('Barbell hip thrust', 4, '10', '', '90s'),
            X('Tempo goblet squat', 3, '10', 'KB 40', '75s', '3s down.'),
            X('Heel-elevated front-rack DB squat', 3, '10-12', '', '75s', 'Quad-biased, no ankle push-off.'),
            X('Single-leg RDL', 3, '10/leg', '', '75s', 'Slow. NEVER to failure.'),
            X('Standing straight-knee SL calf raise', 4, '10', '', '60s',
              'LAST in the session. 3s up / 3s down. Right leads.'),
          ],
        },
      ],
    },

    /* ---------------------------------------------------- SUN */
    {
      id: 'sun', name: 'Sunday', title: 'MOBILITY', sub: 'plus the weekly gate test', run: 'LONGEST',
      sections: [
        DAILY('LONGEST — 1 mi'),
        {
          label: 'MOBILITY — 32 min',
          items: [
            X('Half-kneeling knee-to-wall', 3, '10/side', '', '',
              'REHAB, not stretching. Dorsiflexion restriction on the repaired side drives the pronation that loads your tib post.', ['—', 'done']),
            X('90/90 hip transitions', 3, '8/side', '', '', '', ['—', 'done']),
            X('Couch stretch', 2, '60s/side', '', '', '', ['—', 'sec']),
            X('Adductor rock-back', 2, '10', '', '', '', ['—', 'done']),
            X('T-spine: open book, floor ext, band CARs', 3, '8 min', '', '', '', ['—', 'done']),
            X('Balance + short-foot hold', 3, '30s', '', '', 'Single leg, eyes closed.', ['—', 'sec']),
          ],
        },
        {
          label: 'WEEKLY GATE TEST — log every week',
          items: [
            X('Heel raise to failure — STRAIGHT knee, LEFT', 1, 'max', '', '',
              'Off a step, full ROM, 2s up / 2s down. Stop at the first loss of height.', ['—', 'reps']),
            X('Heel raise to failure — STRAIGHT knee, RIGHT', 1, 'max', '', '',
              'GATE = right within 10% of left.', ['—', 'reps']),
            X('Heel raise to failure — BENT knee, LEFT', 1, 'max', '', '',
              'Soleus. This is the running-specific one.', ['—', 'reps']),
            X('Heel raise to failure — BENT knee, RIGHT', 1, 'max', '', '',
              'GATE = right within 10% of left.', ['—', 'reps']),
            X('Knee-to-wall — LEFT', 1, 'inches', '', '', '', ['—', 'in']),
            X('Knee-to-wall — RIGHT', 1, 'inches', '', '', 'Target: within half an inch of left.', ['—', 'in']),
            X('Morning stiffness — clear days this week', 1, '0-7', '', '',
              'First 10 steps out of bed. Need 10 straight clear days before mileage moves.', ['—', 'days']),
          ],
        },
        {
          label: 'NOTE',
          items: [
            X('No end-range calf stretching', 1, '—', '', '',
              'Pre-gate only. Insertional compression aggravates tendinopathy.', ['—', 'ok']),
          ],
        },
      ],
    },
  ],
};

if (typeof window !== 'undefined') window.PROGRAM = PROGRAM;
if (typeof module !== 'undefined') module.exports = { PROGRAM };
