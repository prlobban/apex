/* ============================================================
   APEX — THE PROGRAM (data only, no app logic)
   ------------------------------------------------------------
   Edit this file to change the plan. app.js never needs touching.

   The block is an 8-DAY CYCLE, not a week:
       D1 Push A · D2 Pull A · D3 Legs A · D4 Reset
       D5 Push B · D6 Pull B · D7 Legs B · D8 Reset + gate test
   Rest lands on every 4th day. It does not line up with the
   calendar week, and that is on purpose.

   DAY     = { id, name, short, rest, title, sub, sections:[SECTION] }
   SECTION = { label, items:[ITEM] }
   ITEM    = { name, sets, target, load, rest, note, cols }
       sets   -> how many logging rows get rendered
       target -> rep / time target shown on the header line
       load   -> target load text ("205-215", "2x60", "")
       cols   -> [leftBoxLabel, rightBoxLabel]; default ['lb','reps']
                 ['—','done'] renders a bare tick, no input boxes

   Running is NOT in this app — Pearce runs on his own.
   ============================================================ */
'use strict';

var X = function (name, sets, target, load, rest, note, cols) {
  return {
    name: name, sets: sets, target: target,
    load: load || '', rest: rest || '', note: note || '',
    cols: cols || ['lb', 'reps'],
  };
};

/* ------------------------------------------------------------
   WARM-UPS — day-specific, and they are half the injury plan.
   The foot/ankle prehab block moved OUT of here on 2026-09-10:
   it belongs to the pre-run, and the run is not in this app.
   Each warm-up is now built only for what that session loads.
   kind: push | pull | legs | reset
   ------------------------------------------------------------ */
var WARMUP = function (kind) {
  var items = [];

  /* The foot/ankle block lives in the PRE-RUN, which is not in this app.
     It is not repeated here. Knee-to-wall survives only where it earns its
     place: before loaded legs, and on the reset days where mobility lives. */
  if (kind === 'legs' || kind === 'reset') {
    items.push(X('Knee-to-wall + balance', 1, '2 min', '', '',
      'Half-kneeling knee-to-wall 2x10/side. Single-leg balance 2x30s, eyes closed. Dorsiflexion before anything loads the ankle.', ['—', 'done']));
  }

  if (kind === 'push') {
    items.push(X('T-spine + scap prep', 1, '3 min', '', '',
      'Foam-roller thoracic extension x10. Forearm wall slide 2x10 — REACH tall at the top and let the shoulder blade travel. Scap push-up 2x10. Band pull-apart 2x15.', ['—', 'done']));
    items.push(X('Cuff prep — right side first', 1, '3 min', '', '',
      'Band external rotation at 0 degrees, towel under the elbow, 2x15 with a 2s hold. Then band ER at 90 degrees 1x12, PAIN-FREE RANGE ONLY. This is the work that keeps you pressing.', ['—', 'done']));
    items.push(X('SHOULDER SCREEN — go / no-go', 1, '10 reps', '', '',
      'Broomstick or empty bar pressed overhead x10, slow. Clean and pain-free -> press today. Anything sharp, or pain above 3/10 -> ALL overhead work is off today and the horizontal pressing stays. This is the check you did not have on the day you had to stop after set 2.', ['—', 'pass']));
  } else if (kind === 'pull') {
    items.push(X('T-spine + scap prep', 1, '3 min', '', '',
      'Open book 2x8/side. Band pull-apart 2x15. Scap pull-up 2x8 — blades only, arms stay straight. Dead hang 2x20s, knees tucked.', ['—', 'done']));
    items.push(X('Cuff + elbow prep', 1, '2 min', '', '',
      'Band external rotation at 0 degrees 2x15, 2s hold. Band curl 1x20 light — the elbows take real volume today.', ['—', 'done']));
  } else if (kind === 'legs') {
    items.push(X('Hips', 1, '3 min', '', '',
      'Leg swings 10 each way per leg. Hip CARs 5/side. 90/90 transitions 2x5/side. Glute bridge 2x12.', ['—', 'done']));
    items.push(X('Achilles ramp — the important one', 1, '3 min', '', '',
      'Bilateral heel raise x15 brisk, then x10 slow, then SINGLE LEG x8 left and x8 right, pain-free only. Never load a squat or a hinge on a cold right Achilles. Then bodyweight squat 2x10, second set 3s down.', ['—', 'done']));
  }

  if (kind !== 'reset') {
    items.push(X('Ramp the first lift', 1, '3-4 sets', '', '',
      'Empty bar, then climb to your working weight. Never start cold on the anchor.', ['—', 'done']));
  }

  return { label: 'WARM-UP', items: items };
};

/* Shoulder rehab block — both reset days. Loaded rehab, not rest:
   progressive loading is the treatment for cuff-related shoulder
   pain, and doing nothing is the one option with no evidence. */
var SHOULDER = function () {
  return {
    label: 'RIGHT SHOULDER — rehab block, 10 min',
    items: [
      X('Isometric ER hold', 5, '30s', 'band', '30s',
        'Elbow pinned at your side, 50-70% effort, push out against the band and hold. Pain-modulating. Do this FIRST — it usually makes everything after it feel better.', ['—', 'sec']),
      X('Band ER at 0 degrees', 3, '15', 'band', '45s',
        'Towel under the elbow. 2s out, 3s back. Right side leads and sets the reps, left matches and never exceeds — same rule as the calf.'),
      X('Serratus wall slide', 3, '10', 'bw', '45s',
        'Forearms on the wall, slide up and REACH at the top. Upward rotation of the scapula is what makes room under the acromion. This is the missing link in most overhead pain.', ['—', 'done']),
      X('Prone / wall Y raise', 3, '12', 'light', '45s',
        'Lower trap. Thumbs up, arms at about 45 degrees from your head, lift from the blade not the hand. Light or bodyweight — this never gets heavy.'),
      X('Band face pull, thumbs back', 3, '20', 'band', '45s',
        'Finish in external rotation. Rear delt and cuff in one.'),
      X('Cross-body posterior capsule stretch', 2, '30s/side', '', '',
        'ONLY if internal rotation is visibly tighter on the right. Blade pinned to the floor or wall — otherwise you stretch the capsule forward and make it worse.', ['—', 'sec']),
    ],
  };
};

/* Return-to-OHP test — all three must pass on the same reset day
   before overhead barbell pressing comes back. */
var OHP_TEST = function () {
  return {
    label: 'RETURN-TO-BARBELL-OHP TEST — all three or none',
    items: [
      X('1. Pain-free full elevation', 1, 'pass/fail', '', '',
        'Both arms straight overhead, slow, no shrug and no lean to get there. Compare left to right.', ['—', 'pass']),
      X('2. Empty bar OHP 2x10', 1, 'pass/fail', '', '',
        'Pain 2/10 or less through the whole range, and no increase the next morning. The morning after is half the test.', ['—', 'pass']),
      X('3. Band ER endurance — R within 10% of L', 1, 'reps R', '', '',
        'Band ER at 0 degrees to form failure, 2s out 2s back, left then right. Same 10% symmetry rule as the calf gate. Log the right-side reps.', ['—', 'reps']),
      X('All three passed -> BARBELL OHP returns', 1, '—', '', '',
        'You are already pressing overhead with dumbbells — this test is what unlocks the BARBELL. Re-entry is empty bar 3x10, then half your old load for one full cycle, then normal. Fail any one of the three and seated neutral-grip DB OHP stays — retest next cycle.', ['—', 'ok']),
    ],
  };
};

var PROGRAM = {
  name: 'APEX',
  version: '2026-09 PPL/Reset — 8-day cycle',
  cycleLength: 8,
  days: [

    /* =============================================== D1 PUSH A */
    {
      id: 'd1', name: 'Day 1', short: '1', title: 'PUSH A', sub: 'Heavy bench · normal run',
      sections: [
        WARMUP('push'),
        {
          label: 'LIFT',
          items: [
            X('Barbell bench', 5, '3-5', '205-215', '3:00',
              'THE ANCHOR. 215 = 91% of your max. Grip about 1.5x shoulder width, elbows 45-60 degrees, blades pinned back and down for the whole set. Wide grip and flared elbows are what turn heavy benching into a shoulder problem.'),
            X('Incline DB press', 3, '8-10', '2x60', '2:00', 'Neutral or 45-degree grip, not full pronation.'),
            X('Seated neutral-grip DB OHP', 3, '6-8', '2x50-60', '2:00',
              'REPLACES STANDING BARBELL OHP while the right shoulder is symptomatic. Seated with back support, palms facing each other the whole way. Neutral grip and an independent path per arm is the lowest-compression way to press overhead. Governed by the morning screen: screen failed = skip it, add a 4th set of incline DB press instead.'),
            X('Lateral raise', 4, '15', '', '45s',
              'Stop AT shoulder height, not above. Thumb neutral or slightly up — never pour-the-jug. Superset with the triceps below.'),
            X('Overhead band triceps ext', 4, '12', 'band', '45s'),
          ],
        },
        {
          label: 'ABS — lower rectus / posterior tilt',
          items: [
            X('Floor reverse crunch, rack-anchored', 4, '12-15', 'bw', '45s',
              'On the floor, hands gripping the rack uprights behind your head. Curl the hips fully off the floor, 3s down. The pelvis moves, not the legs. Ladder: bent knee, then straight leg, then 3s eccentric.'),
            X('Hollow hold', 3, '30s', 'bw', '30s', 'Lower back stays flat on the floor. Bring the legs closer to make that true.', ['—', 'sec']),
          ],
        },
      ],
    },

    /* =============================================== D2 PULL A */
    {
      id: 'd2', name: 'Day 2', short: '2', title: 'PULL A', sub: 'Heavy vertical / hinge-free · normal run',
      sections: [
        WARMUP('pull'),
        {
          label: 'LIFT',
          items: [
            X('Weighted pull-up', 5, '3-5', '+40 KB / 60 DB', '3:00', 'THE ANCHOR. Full hang, no kip.'),
            X('Chest-supported incline DB row', 3, '10-12', '2x60', '90s', 'Lats without erector girth.'),
            X('DB pullover', 3, '12-15', '', '60s', 'Best non-cable lat lengthener you own.'),
            X('Band face pull', 3, '20', 'band', '45s', 'Thumbs back, finish in external rotation.'),
            X('Incline DB curl', 3, '10-12', '', '45s'),
          ],
        },
        {
          label: 'ABS — anti-extension, full ROM',
          items: [
            X('Ab-wheel rollout', 4, '8-12', 'bw', '60s',
              'Ribs down, no lumbar sag at end range. Ladder: knees, then long lever, then standing.'),
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

    /* =============================================== D3 LEGS A */
    {
      id: 'd3', name: 'Day 3', short: '3', title: 'LEGS A', sub: 'Heavy bilateral · SHORTEST run',
      sections: [
        WARMUP('legs'),
        {
          label: 'LIFT',
          items: [
            X('Front squat', 5, '3', '215', '3:00', 'THE ANCHOR. 215 = 84% of your front squat max.'),
            X('Snatch-grip 2in deficit deadlift', 3, '3', '215', '2:30', 'The ONLY heavy hinge of the cycle. 88%.'),
            X('Barbell hip thrust', 4, '10-12', '', '90s', 'Best growth-per-unit-cost lift you have. Zero ankle demand.'),
            X('Slider / band leg curl', 4, '10', '', '75s', 'Foot passive throughout.'),
            X('Seated bent-knee calf raise', 4, '8', 'KB on knee', '90s',
              'LAST in the session. 3s up / 2s hold / 3s down. RIGHT LEG SETS THE REPS, left matches and never exceeds.'),
          ],
        },
        {
          label: 'NOTE',
          items: [
            X('No abs today — Reset is tomorrow', 1, '—', '', '',
              'Abs live on the four upper days. Back squat is demoted: 215 goes 10-12 reps, so it fails as an anchor.', ['—', 'ok']),
          ],
        },
      ],
    },

    /* =============================================== D4 RESET */
    {
      id: 'd4', name: 'Day 4', short: '4', rest: true, title: 'RESET', sub: 'Mobility + shoulder · LONGEST run',
      sections: [
        WARMUP('reset'),
        SHOULDER(),
        {
          label: 'MOBILITY — 25 min',
          items: [
            X('Half-kneeling knee-to-wall', 3, '10/side', '', '',
              'REHAB, not stretching. Dorsiflexion restriction on the repaired side drives the pronation that loads your tib post.', ['—', 'done']),
            X('90/90 hip transitions', 3, '8/side', '', '', '', ['—', 'done']),
            X('Couch stretch', 2, '60s/side', '', '', '', ['—', 'sec']),
            X('Adductor rock-back', 2, '10', '', '', '', ['—', 'done']),
            X('T-spine: open book + floor extension', 3, '6 min', '', '',
              'Feeds straight into the shoulder block above — you cannot get overhead through a stiff mid-back.', ['—', 'done']),
            X('Balance + short-foot hold', 3, '30s', '', '', 'Single leg, eyes closed.', ['—', 'sec']),
          ],
        },
        {
          label: 'NOTE',
          items: [
            X('Reset is not a day off', 1, '—', '', '',
              'You still run, and it is the LONGEST run of the cycle. What rests is the lifting. Legs A was yesterday and Push B is tomorrow — the right leg never gets two loaded days back to back.', ['—', 'ok']),
            X('No end-range calf stretching', 1, '—', '', '',
              'Pre-gate only. Insertional compression aggravates tendinopathy.', ['—', 'ok']),
          ],
        },
      ],
    },

    /* =============================================== D5 PUSH B */
    {
      id: 'd5', name: 'Day 5', short: '5', title: 'PUSH B', sub: 'Incline / volume · normal run',
      sections: [
        WARMUP('push'),
        {
          label: 'LIFT',
          items: [
            X('Incline barbell press', 4, '6-8', '175-195', '2:30', 'The upper-chest shelf. Bench at 30 degrees, not 45 — steeper turns it into a shoulder press.'),
            X('Flat DB press', 3, '10-12', '2x60', '90s'),
            X('Seated neutral-grip DB OHP', 3, '10-12', '', '90s',
              'The volume version of D1. Seated, back support, neutral grip, stop the moment the range gets sharp. If the shoulder screen failed this morning, SKIP IT and do a 4th set of flat DB press instead.'),
            X('Lateral raise', 4, '15-20', '', '60s', 'Shoulder height, no higher.'),
            X('Skull crusher', 3, '10-12', '', '60s'),
          ],
        },
        {
          label: 'ABS — rectus under stretch',
          items: [
            X('Bench stretch crunch', 4, '12-15', 'bw', '45s',
              'The one you actually like, so it stayed. Bench at 20-30 degrees, shoulder blades level with the top edge, head and upper back draped back over it. THE BOTTOM IS THE POINT — a muscle grows most where it is loaded long.'),
            X('Band Pallof press', 3, '12/side', 'light', '30s', 'Light. Anti-rotation only, never heavy.'),
          ],
        },
      ],
    },

    /* =============================================== D6 PULL B */
    {
      id: 'd6', name: 'Day 6', short: '6', title: 'PULL B', sub: 'Volume · normal run',
      sections: [
        WARMUP('pull'),
        {
          label: 'LIFT',
          items: [
            X('Chin-up', 4, 'AMRAP-1', 'bw', '2:00'),
            X('1-arm DB row', 4, '10-12', '60', '75s', '1s pause at the top.'),
            X('Band pullover', 3, '15', 'band', '60s', 'Anchor over the pull-up bar.'),
            X('Rear delt fly', 4, '20', '', '45s', 'Never skipped. Rear delt and lower trap volume is what keeps the front of the shoulder out of trouble.'),
            X('Hammer curl', 3, '12', '', '45s'),
          ],
        },
        {
          label: 'ABS — max lever, eccentric',
          items: [
            X('Slider bodysaw', 4, '8-10', 'bw', '60s',
              'REPLACES THE DRAGON FLAG. Forearm plank, feet on sliders. Push yourself back until the shoulders are behind the elbows, then drag in. 3s out. Ribs down and hips level the whole time — the moment the lower back sags the set is over. Ladder: short range, then full range, then feet on the 18in box.'),
            X('Slow dead bug', 3, '8/side', 'bw', '45s',
              'Opposite arm and leg, 3s out and 3s back, lower back GLUED to the floor the whole time. The moment it lifts, shorten the range. This is the control counterpart to the bodysaw — same anti-extension job, limbs moving instead of the body. Progress by lever length, then by a 3s pause at full reach.'),
          ],
        },
      ],
    },

    /* =============================================== D7 LEGS B */
    {
      id: 'd7', name: 'Day 7', short: '7', title: 'LEGS B', sub: 'Unilateral / posterior, RPE 7 · SHORTEST run',
      sections: [
        WARMUP('legs'),
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

    /* =============================================== D8 RESET + GATE */
    {
      id: 'd8', name: 'Day 8', short: '8', rest: true, title: 'RESET + GATE', sub: 'Mobility, shoulder, the tests · LONGEST run',
      sections: [
        WARMUP('reset'),
        SHOULDER(),
        {
          label: 'MOBILITY — 20 min',
          items: [
            X('Half-kneeling knee-to-wall', 3, '10/side', '', '', 'REHAB, not stretching.', ['—', 'done']),
            X('90/90 hip transitions', 3, '8/side', '', '', '', ['—', 'done']),
            X('Couch stretch', 2, '60s/side', '', '', '', ['—', 'sec']),
            X('T-spine: open book + floor extension', 3, '5 min', '', '', '', ['—', 'done']),
            X('Balance + short-foot hold', 3, '30s', '', '', 'Single leg, eyes closed.', ['—', 'sec']),
          ],
        },
        {
          label: 'CALF GATE TEST — log every cycle',
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
            X('Morning stiffness — clear days this cycle', 1, '0-8', '', '',
              'First 10 steps out of bed. Need 10 straight clear days before mileage moves.', ['—', 'days']),
          ],
        },
        OHP_TEST(),
      ],
    },
  ],
};

if (typeof window !== 'undefined') window.PROGRAM = PROGRAM;
if (typeof module !== 'undefined') module.exports = { PROGRAM };
