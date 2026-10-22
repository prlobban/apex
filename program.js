/* ============================================================
   APEX — THE PROGRAM (data only, no app logic)
   ------------------------------------------------------------
   APEX Hybrid, 8-week block. The words live in the vault doc
   (apex-hybrid-block-2026-10.md). This file is that doc as data.

   The block is 56 days = 14 four-day cycles:
       Pull · Push · Legs · Recovery, repeated.
   The block start date lives in the database, not here.

   EXERCISE = { id, name, cue, rest, perSide, tags, unit, guess, stages:[STAGE] }
   STAGE    = { label, sets, lo, hi, inc, weights?, perSide? }
     weights -> a ladder of loads (lb); the app shows a weight box.
                No weights = bodyweight / band / version only.
     lo..hi  -> the rep (or seconds / metres) range. Start at lo,
                +inc each cycle while every set hits the target.
                At hi on every set -> next weight on the ladder, or
                the next stage once the ladder runs out.
   Running and jumps change by WEEK, not by what you log.
   ============================================================ */
'use strict';

/* Barbell loads the plates can make (45 bar + pairs of 10, 15, 25).
   155 and 205 are impossible. */
var BAR = [135, 145, 165, 175, 185, 195, 215];
function barFrom(w) { return BAR.filter(function (x) { return x >= w; }); }

/* Dumbbell pairs run 5-60 in 5s, with no 30 pair. */
function dbFrom(w, max) {
  var out = [];
  for (var x = w; x <= (max || 60); x += 5) if (x !== 30) out.push(x);
  return out;
}

function S(label, sets, lo, hi, inc, extra) {
  var s = { label: label, sets: sets, lo: lo, hi: hi, inc: inc == null ? 1 : inc };
  if (extra) Object.keys(extra).forEach(function (k) { s[k] = extra[k]; });
  return s;
}
function bands(names, sets, lo, hi, inc, extra) {
  return names.map(function (n) { return S(n + ' band', sets, lo, hi, inc, extra); });
}

var PROGRAM = {
  version: 'hybrid-2026-10',
  name: 'APEX Hybrid',
  blockDays: 56,
  order: ['pull', 'push', 'legs', 'recovery'],
  deloadCycles: [7, 14],
  testCycles: [1, 7, 14],

  /* easy daily run, mi/day by week 1-8 */
  running: {
    miles: [2.5, 2.75, 2.75, 3.0, 3.0, 3.0, 3.0, 3.0],
    stridesFromWeek: 6,
    stridesOn: 'pull',
    strides: '4 × 15s at ~80%, walk back. Swap them for easy miles, never add.',
    timeTrialDay: 53,
  },

  /* ---------------- jumps: open the Legs session ---------------- */
  jumps: {
    note: 'On the mats, in shoes. A set ends at the first sloppy landing.',
    gateNote: 'Single-leg jumps only go in if the week-4 heel-raise test passed (right within 10% of left). Otherwise repeat the weeks 3-4 jumps.',
    phases: [
      { weeks: [1, 2], rows: [
        { name: 'Two-foot pogo hops', sets: 3, reps: 15, rest: '0:30', cycle1Sets: 2 },
        { name: 'Box jump, step down', sets: 4, reps: 5, rest: '0:45' },
        { name: 'Broad jump + stick the landing', sets: 4, reps: 4, rest: '0:45' },
      ] },
      { weeks: [3, 4], rows: [
        { name: 'Two-foot pogo hops', sets: 3, reps: 20, rest: '0:30' },
        { name: 'Box jump, step down', sets: 5, reps: 5, rest: '0:45' },
        { name: 'Broad jump + stick the landing', sets: 5, reps: 4, rest: '0:45' },
      ] },
      { weeks: [5, 6, 7, 8], gated: true, rows: [
        { name: 'Two-foot pogo hops', sets: 2, reps: 15, rest: '0:30' },
        { name: 'Box jump, step down', sets: 3, reps: 5, rest: '0:45', fromWeek6: 'Seated box jump, from sitting on the bench' },
        { name: 'Broad jump + stick the landing', sets: 3, reps: 4, rest: '0:45' },
        { name: 'Single-leg pogo hops, right first', sets: 2, reps: 10, rest: '0:30', perSide: 'each leg', singleLeg: true },
        { name: 'Skater bound + stick', sets: 3, reps: 4, rest: '0:45', perSide: 'each side', singleLeg: true },
      ] },
    ],
  },

  /* ---------------- the four days ---------------- */
  sessions: {

    pull: {
      title: 'PULL', short: 'PULL', time: '~58 min',
      warmup: 'Band pull-aparts 2×15 · band external rotation 2×15 · scap pull-ups 2×8 · 5 easy pull-ups',
      exercises: [
        { id: 'kb_snatch', name: 'KB snatch', cue: 'Explosive, one arm.', rest: '0:45', perSide: 'each arm', explosive: true,
          stages: [S('40 lb KB', 3, 5, 10), S('40 lb KB', 4, 6, 10), S('50 lb DB', 3, 5, 10)] },
        { id: 'pullup', name: 'Pull-ups', cue: 'Knees bent.', rest: '1:30',
          stages: [S('Regular', 4, 12, 15), S('Wide grip', 4, 10, 15),
                   S('Archer', 4, 4, 8, 1, { perSide: 'each side' }),
                   S('Typewriter', 4, 4, 8, 1, { perSide: 'each side' })] },
        { id: 'chinup', name: 'Chin-ups', rest: '1:15',
          stages: [S('Regular', 3, 12, 15), S('3s lowering on every rep', 3, 8, 12),
                   S('Archer chin-up', 3, 4, 8, 1, { perSide: 'each side' })] },
        { id: 'bb_row', name: 'Barbell row', cue: 'Torso ~45°, flat back, pull to the belly button.', rest: '1:30', guess: true,
          stages: [S('Barbell', 4, 6, 10, 1, { weights: barFrom(145) })] },
        { id: 'shrug', name: 'Barbell shrug', cue: '2s squeeze at the top.', rest: '1:00', guess: true,
          stages: [S('Barbell', 3, 12, 20, 2, { weights: barFrom(185) }),
                   S('215, 3s hold at the top', 3, 12, 20, 2, { weights: [215] })] },
        { id: 'cossack', name: 'KB Cossack squat', cue: 'Weight held at your chest.', rest: '0:45', perSide: 'each side',
          stages: [S('40 lb KB', 3, 8, 12), S('50 lb DB', 3, 8, 12), S('60 lb DB', 3, 8, 12)] },
        { id: 'y_raise', name: 'Incline Y-raise', cue: 'Chest down on the bench at ~30°, arms in a Y.', rest: '0:45',
          stages: [S('DBs', 2, 12, 20, 2, { weights: [5, 10, 15, 20] })] },
        { id: 'face_pull', name: 'Band face pull', cue: 'Thumbs back.', rest: '0:45',
          stages: bands(['Medium', 'Heavy'], 2, 15, 20, 2) },
        { id: 'neck_ext', name: 'Band neck extension', cue: 'Band round the back of the head, anchored in front.', rest: '0:30',
          stages: bands(['Light', 'Medium', 'Heavy'], 2, 15, 25, 2) },
      ],
    },

    push: {
      title: 'PUSH', short: 'PUSH', time: '~58 min',
      warmup: 'Easy rope 2 min · band external rotation 2×15 · push-up plus 2×15 · bench warm-up sets',
      warmupFromWeek3: 'From week 3, if your feet are 0-2: the rope becomes 1 min easy + 3 × 15s fast, stiff-ankle bounces.',
      exercises: [
        { id: 'plyo_pushup', name: 'Plyo push-up', cue: 'Hands leave the floor every rep. The set ends when they stop leaving it.', rest: '1:00', explosive: true,
          stages: [S('Plyo push-up', 4, 8, 12), S('Clap push-up', 4, 8, 12), S('Feet-on-bench clap', 4, 8, 12)] },
        { id: 'bench', name: 'Bench press', cue: 'Grip ~1.5× shoulder width, elbows 45-60°.', rest: '2:00', guess: true,
          stages: [S('Barbell', 4, 8, 12, 1, { weights: barFrom(165) })] },
        { id: 'hspu', name: 'Handstand push-up', rest: '1:30',
          stages: [S('Wall HSPU, head to a cushion', 3, 6, 10), S('Full wall HSPU', 3, 5, 10),
                   S('Deficit, hands on DBs', 3, 5, 10), S('Deficit + 3s lowering', 3, 5, 10)] },
        { id: 'pushup_ladder', name: 'Push-up ladder', rest: '1:30',
          stages: [S('Deficit push-up on DBs', 3, 12, 20), S('Archer push-up', 3, 6, 12, 1, { perSide: 'each side' }),
                   S('Pseudo-planche push-up', 3, 6, 12)] },
        { id: 'pallof', name: 'Band Pallof press', cue: 'Band round a rack upright at chest height. Press out, 2s hold.', rest: '0:30', perSide: 'each side',
          stages: bands(['Medium', 'Heavy'], 3, 10, 16, 2) },
        { id: 'lateral', name: 'DB lateral raise', rest: '0:45', guess: true,
          stages: [S('DBs', 2, 12, 20, 2, { weights: [20, 25] }),
                   S('Lean-away raise off a rack upright', 2, 12, 20, 2, { weights: [25] })] },
        { id: 'ab_wheel', name: 'Ab wheel', rest: '0:45',
          stages: [S('From the knees', 3, 8, 15), S('Knees, roll out further', 3, 8, 15),
                   S('Standing, roll to a wall', 3, 8, 15), S('Full standing', 3, 8, 15)] },
        { id: 'windmill', name: 'KB windmill', cue: 'Weight overhead, eyes on it.', rest: '0:30', perSide: 'each side',
          stages: [S('40 lb KB', 2, 6, 10), S('45 lb DB', 2, 6, 10), S('50 lb DB', 2, 6, 10)] },
        { id: 'neck_flex', name: 'Band neck flexion', cue: 'Band round the forehead, anchored behind.', rest: '0:30',
          stages: bands(['Light', 'Medium', 'Heavy'], 2, 15, 25, 2) },
      ],
    },

    legs: {
      title: 'LEGS', short: 'LEGS', time: '~57 min', jumps: true,
      warmup: 'Easy rope 2 min · ankle rocks ×10 each · tib raises ×20 · slow calf raises 2×15 · single-leg calf hold 2×30s (right first) · band side-walk ×10 each way',
      afterJumps: 'Front-squat warm-up sets (3 min).',
      footer: 'Run after this session, never before it.',
      exercises: [
        { id: 'front_squat', name: 'Front squat', rest: '2:00', guess: true, tags: ['legs'],
          stages: [S('Barbell', 4, 6, 10, 1, { weights: barFrom(165) }),
                   S('215, 2s pause at the bottom', 4, 6, 10, 1, { weights: [215] })] },
        { id: 'pistol', name: 'Pistol squat', cue: 'Right leg first.', rest: '1:00', perSide: 'each leg', tags: ['legs'],
          stages: [S('Holding a 10 lb plate out front', 3, 5, 10), S('Full pistol', 3, 5, 10),
                   S('KB at your chest', 3, 5, 10), S('KB + 3s lowering', 3, 5, 10)] },
        { id: 'sl_rdl', name: 'Single-leg RDL', cue: 'DB in each hand. Weight is per hand.', rest: '1:00', perSide: 'each leg', guess: true, tags: ['legs'],
          stages: [S('DBs', 3, 8, 12, 1, { weights: dbFrom(40) })] },
        { id: 'ham_curl', name: 'Band hamstring curl', cue: 'Lying face down, band anchored to the rack.', rest: '0:45', tags: ['legs'],
          stages: [S('Heavy band', 3, 12, 20, 2), S('Heavy band, 3s lowering', 3, 12, 20, 2),
                   S('Heavy band, one leg at a time', 3, 12, 20, 2, { perSide: 'each leg' })] },
      ],
    },

    recovery: {
      title: 'RECOVERY', short: 'RECOV', time: '~40 min, all light',
      warmup: 'Nothing here should feel hard. Finish with 3 min of foam rolling and the stretch block.',
      exercises: [
        { id: 'decline_situp', name: 'Decline sit-up', cue: 'Adjustable bench set to decline, feet hooked.', rest: '0:45',
          stages: [S('Bodyweight', 3, 12, 20, 2), S('10 lb plate at your chest', 3, 12, 20, 2)] },
        { id: 'side_bend', name: 'Side bend on the 45° back extension', cue: 'Hip side-on to the pad.', rest: '0:30', perSide: 'each side',
          stages: [S('Bodyweight', 3, 12, 20, 2), S('Holding a 10 lb plate', 3, 12, 20, 2)] },
        { id: 'copenhagen', name: 'Copenhagen side plank', rest: '0:30', perSide: 'each side', unit: 'secs',
          stages: [S('Knee on the bench', 3, 20, 40, 5), S('Ankle on the bench', 3, 20, 40, 5)] },
        { id: 'carry', name: 'Suitcase carry', cue: 'Laps of the garage.', rest: '0:45', perSide: 'each side', unit: 'm',
          stages: [S('One DB', 2, 30, 30, 0, { weights: [55, 60] }),
                   S('One 60 lb DB, further', 2, 40, 100, 10, { weights: [60] })] },
        { id: 'sl_calf', name: 'Single-leg calf raise', cue: 'Off the step, 3s down, 2s pause at the bottom. The right leg sets the reps; the left never does more.', rest: '0:30', perSide: 'each leg', tags: ['legs'],
          stages: [S('Bodyweight', 3, 12, 15), S('Holding a DB', 3, 12, 15, 1, { weights: dbFrom(5, 40) })] },
        { id: 'abduction', name: 'Side-lying band hip abduction', rest: '0:30', perSide: 'each side',
          stages: bands(['Light', 'Medium', 'Heavy'], 3, 15, 25, 2) },
        { id: 'wrist_curl', name: 'DB wrist curl', cue: 'Forearms on the bench, palms up.', rest: '0:30', guess: true,
          stages: [S('DB', 2, 15, 25, 2, { weights: dbFrom(20, 40) })] },
        { id: 'rev_wrist_curl', name: 'Reverse wrist curl', cue: 'Forearms on the bench, palms down.', rest: '0:30', guess: true,
          stages: [S('DB', 2, 15, 25, 2, { weights: dbFrom(10, 35) })] },
        { id: 'neck_side', name: 'Band neck side bend', cue: 'Anchored to the side.', rest: '0:30', perSide: 'each side',
          stages: bands(['Light', 'Medium', 'Heavy'], 2, 15, 25, 2) },
        { id: 'ankle_inv', name: 'Band ankle inversion', rest: '0:30', perSide: 'each side',
          stages: [S('Band', 2, 15, 15, 0)] },
      ],
    },
  },

  stretch: [
    'Couch stretch, back foot on the bench: 45s each side',
    '90/90 hip switches: 60s',
    'Hamstring, heel on the bench: 45s each side',
    'Wall calf stretch, straight knee then bent knee: 30s each, each side',
    'Pec stretch, forearm on a rack upright: 45s each side',
  ],

  /* tests by cycle; each key is one input */
  tests: {
    1: ['weight', 'waist', 'broad_jump', 'max_pullups', 'max_chinups', 'heel_r_straight', 'heel_l_straight', 'heel_r_bent', 'heel_l_bent'],
    7: ['weight', 'waist', 'heel_r_straight', 'heel_l_straight', 'heel_r_bent', 'heel_l_bent'],
    14: ['weight', 'waist', 'broad_jump', 'max_pullups', 'max_chinups', 'heel_r_straight', 'heel_l_straight', 'heel_r_bent', 'heel_l_bent', 'bench_repout', 'fs_repout', 'tt_5k'],
  },
  testLabels: {
    weight: 'Weight, 3-morning average (lb)', waist: 'Waist at the belly button (in)',
    broad_jump: 'Standing broad jump, best of 3 (in)',
    max_pullups: 'Max pull-ups', max_chinups: 'Max chin-ups',
    heel_r_straight: 'Heel raises · RIGHT · straight knee', heel_l_straight: 'Heel raises · LEFT · straight knee',
    heel_r_bent: 'Heel raises · RIGHT · bent knee', heel_l_bent: 'Heel raises · LEFT · bent knee',
    bench_repout: 'Bench: reps to near-failure at working weight',
    fs_repout: 'Front squat: reps to near-failure at working weight',
    tt_5k: '5k time trial, day 53 (mm:ss)',
  },
};

if (typeof window !== 'undefined') window.PROGRAM = PROGRAM;
if (typeof module !== 'undefined') module.exports = { PROGRAM: PROGRAM, BAR: BAR };
