/* ============================================================
   APEX — THE PROGRAM (data only, no app logic)
   ------------------------------------------------------------
   This is the one file you edit to change your plan. App code in
   app.js never needs to be touched to add weeks, days, or items.

   SHAPE
   -----
   PROGRAM = {
     meta: { name, weeks, goal },
     athlete: { ... }        // your defaults / context
     blocks: { tag -> label } // optional pretty labels for block tags
     weeks: [ WEEK, WEEK, ... ]
   }

   WEEK  = { title, focus, days: [ DAY, ... ] }
   DAY   = { name, kind, sections: [ SECTION, ... ] }
       kind: 'lift' | 'run' | 'mixed' | 'mobility' | 'rest'
   SECTION = { tag, note, items: [ ITEM, ... ] }

   ITEM is one of these kinds — `kind` decides what gets LOGGED:

   lift  -> { kind:'lift', name, sets, reps, load, rest, notes }
            logs: weight + reps + note per set
   run   -> { kind:'run', name, format, reps, distance, pace, rest, notes }
            format: 'interval' | 'tempo' | 'easy' | 'long' | 'sprint'
            logs: watch data (distance, time, pace, HR) + note
   hold  -> { kind:'hold', name, sets, duration, notes }   // mobility/skill
            logs: done + note
   plyo  -> { kind:'plyo', name, sets, reps, notes }
            logs: done + note
   note  -> { kind:'note', text }                          // not logged
   ============================================================ */

// --- tiny constructors so the data below stays readable -------
const lift = (name, sets, reps, load, rest, notes) =>
  ({ kind:'lift', name, sets, reps, load, rest, notes });
const run  = (name, format, o={}) =>
  ({ kind:'run', name, format, reps:o.reps, distance:o.distance, pace:o.pace, rest:o.rest, notes:o.notes });
const hold = (name, sets, duration, notes) =>
  ({ kind:'hold', name, sets, duration, notes });
const plyo = (name, sets, reps, notes) =>
  ({ kind:'plyo', name, sets, reps, notes });
const note = (text) => ({ kind:'note', text });
const sec  = (tag, items, note=null) => ({ tag, note, items });
const day  = (name, kind, sections) => ({ name, kind, sections });

/* ===========================================================
   REST INTERVALS (research-backed)
   - Power / Olympic lifts + heavy compounds: 3 min
     (de Salles 2009: 3–5 min @ 50–90% 1RM maximizes strength.
      Schoenfeld 2016: 3-min beat 1-min for size AND strength.)
   - Accessories / hypertrophy: 2 min
   - Prehab / mobility: 45–60s
   - Jumps / pogos: 2 min (quality, not fatigue)
   - Sprints: full recovery, per drill
   =========================================================== */

/* ===========================================================
   WEEK BUILDER
   Each week is the same 6-day template; only the loads / volumes
   progress. `w` carries the values that change week to week so
   the structure stays in one place (good DRY practice).
   =========================================================== */

// deload helper: trims a set off mains/accessories on the easy week
const setsFor = (w, n) => w.deload ? Math.max(2, n - 1) : n;

function lowerDay(w){
  return day('Lower — Power + Strength', 'mixed', [
    sec('warmup', [
      note('~8 min, 45s each: 90/90 hip switches · hip CARs · banded lateral walks · banded clamshells · leg swings · glute bridges · ankle circles · 2×10 easy pogos to prime.'),
    ], 'Move through it unhurried — this primes the joints you are about to load.'),

    sec('power', [
      lift('Hang Power Clean', setsFor(w,5), 3, w.clean, '3 min',
        'Bar at mid-thigh, slight hinge, then explode hips + shrug to pull the bar up and catch it on your front shoulders in a quarter-squat. Move it FAST — this is for explosive power, not a grind. (Your football PC max was 220; we re-enter light.)'),
      lift('Jump Squat', 4, 4, w.jumpDB, '2-3 min',
        'Hold a light DB in each hand, quarter-squat, jump as high as possible, land soft. Reset every rep. Load stays ~10% of squat max on purpose — speed is the point.'),
      plyo('Weighted Pogo + Iso Hold', 4, '6 reps ('+w.pogo+')',
        'Stiff legs, bounce off the balls of the feet — minimal knee bend, all ankle. First rep of each set: hold the loaded bottom 2s, then 6 fast rebounds. Builds Achilles/ankle stiffness that transfers to sprinting + jumping. Rest 2 min.'),
    ], 'CNS is freshest now — power before strength. Full recovery between sets.'),

    sec('strength', [
      lift('Tempo Back Squat', setsFor(w,4), 6, w.squat, '3 min',
        '3 seconds down, 1-second pause at the bottom, drive up. The tempo makes the weight feel heavier and builds legs hard without loading past the bar\'s 215 cap. Challenging by rep 6, not a max grind.'),
      lift('Romanian Deadlift', setsFor(w,3), 8, w.rdl, '3 min',
        'Soft knees, push hips back, lower the bar down the legs to ~mid-shin until you feel a hamstring stretch, then drive hips forward. Sustainable weight — should NOT wreck you for days.'),
      lift('Bulgarian Split Squat', setsFor(w,3), '8/leg', w.bulg, '2 min',
        'Rear foot up on the bench, drop straight down until the front thigh hits parallel, drive through the front heel. Big-leg + single-leg stability.'),
      lift('Box Step-up', setsFor(w,3), '10/leg', w.step, '2 min',
        'Full foot on the ice chest (~18"), drive through the TOP leg, control down. Don\'t push off the bottom foot — make the top leg do the work.'),
    ]),

    sec('prehab', [
      lift('HSR Calf Raise', 3, 8, w.calf+' · 6s tempo', '90s',
        'Single leg if balance allows. 3s up, 3s down. The slow 6-second rep is what builds Achilles collagen — slow is the medicine, not the half-rep bounce.'),
      lift('Heavy Band Leg Curl', 3, 10, 'Heavy band · 3s eccentric', '90s',
        'Anchor a heavy band, lie prone, curl heel toward butt, lower SLOWLY. Your Nordic substitute — research shows banded curls match Nordic hamstring activation. The slow lowering is the protective part.'),
      hold('Tib Raise', 3, '15 reps',
        'Heels on floor/wall, pull toes up toward shins. Shin/knee health, balances the calves. Rest 60s.'),
      hold('Spanish Squat Iso', 3, '30s',
        'Heavy band anchored at knee height behind you, sit back into a squat and hold. Bulletproofs the knees (patellar tendon). Rest 60s.'),
    ], 'Non-negotiable. If time is short, cut a strength accessory before you cut these.'),
  ]);
}

function upperDay(w){
  return day('Upper — Power + Strength', 'lift', [
    sec('warmup', [
      note('~6 min, 45s each: band pull-aparts · face pulls · YTWs · shoulder CARs · scap push-ups · wrist circles + light wrist curls.'),
    ]),

    sec('power', [
      plyo('Explosive Push-up', 4, '5 reps',
        'Lower under control, then push up as hard as possible so the hands leave the floor (clap optional) — or just a maximally fast concentric. Upper-body RFD. Rest 2 min.'),
      lift('Push Press', 4, 4, w.pushPress, '3 min',
        'Bar on front shoulders, short dip with the legs, then explode it overhead using leg drive. Heavier than a strict press because the legs help — train overhead power.'),
    ]),

    sec('strength', [
      lift('Bench Press', setsFor(w,4), 6, w.bench, '3 min',
        'Controlled to the chest, drive up. Reps left in the tank — not a max.'),
      lift('Weighted Pull-up', setsFor(w,4), '6-8', w.pullup, '3 min',
        'DB between the feet or a loaded pack. Full hang to chin over the bar. You do 18–23 bodyweight, so we load them into the strength range.'),
      lift('Overhead Press (strict)', setsFor(w,3), 8, w.ohp, '2-3 min',
        'No leg drive — strict. Builds the raw shoulder strength under the push press.'),
      lift('DB Row', setsFor(w,3), 10, '55 lb', '2 min',
        'One hand + knee on the bench, row the DB to the hip, squeeze the lat. (Wk-1 review: 50 felt too light — 55 loads the lats properly while you still own all 10; 60 is your uncomfortable max.)'),
      lift('Incline DB Press', setsFor(w,3), 10, '50 lb', '2 min',
        'Bench at ~30–45°. Upper-chest builder for the physique pillar.'),
    ]),

    sec('physique', [
      lift('DB Pullover', 3, 12, '45 lb', '90s',
        'Lie on the bench, DB over chest, lower it back behind your head with a slight elbow bend, pull it back over. Lats + serratus. (Wk-1 review: 35 was too light — 45 gives the lats a real stretch under load.)'),
      lift('Curl + Tricep Ext (superset)', 3, 12, '25 lb each', '90s',
        'Standard DB curl, then overhead DB tricep extension, back to back.'),
      lift('Ab Wheel (from knees)', 3, 8, 'Bodyweight', '90s',
        'Roll out as far as control allows WITHOUT the lower back sagging, pull back with the abs.'),
    ]),

    sec('prehab', [
      lift('Band External Rotation', 3, 15, 'Light/medium band', '60s',
        'Elbow pinned to your side, rotate the forearm outward. Rotator-cuff health.'),
      lift('Eccentric Wrist Extension (Tyler Twist)', 3, 15, 'Light DB or band · 3–4s eccentric', '60s',
        'Lateral-elbow (tennis elbow) prehab — your recurring flare. Palm-down, extend the wrist UP (assist with the other hand to lift if needed), then lower SLOWLY over 3–4s. The slow eccentric on the wrist EXTENSORS is what rebuilds the tendon. Do this on off-days too when the elbow is cranky.'),
      lift('Wrist Curl + Reverse', 2, 15, '15 lb · slow eccentric', '45s',
        'Forearms on thigh, curl the wrist up and lower slow; then flip palm-down for the reverse. Elbow/wrist tendon health.'),
      lift('Forearm Pronation/Supination', 2, '12/side', 'Light DB held at one end', '45s',
        'Rotate palm-up to palm-down under control. Wrist + elbow.'),
    ], 'Lateral elbow is a recurring flare — the eccentric wrist extension above is the priority. Keep direct tricep + heavy grip work MODERATE (no maxing) while it settles.'),
  ]);
}

function swimDay(w){
  return day('Swim + Mobility', 'mobility', [
    sec('swim', [
      run('Warm-up', 'easy', { reps:2, distance:'25m', rest:'20s', notes:'Easy, loosen up.' }),
      run('Main set', 'interval', { reps: w.swimMainReps, distance:'25m', pace:'steady-easy (NOT your 43s sprint pace)', rest:'30s',
        notes:'Conversational effort. ~1:1 work:rest. You gas after 50m, so short repeats with rest build the aerobic tolerance.' }),
      run('Stretch set', 'interval', { reps:2, distance:'50m', pace:'easy', rest:'60s', notes:'Builds your past-50m tolerance. Each week, shift more volume from 25s to 50s as the 50 stops gassing you.' }),
      run('Cool-down', 'easy', { reps:2, distance:'25m', rest:'-', notes:'Very easy.' }),
    ], 'Pool is 25m. '+w.swimTotal+' total. Freestyle. Log it from feel or watch.'),

    sec('mobility', [
      hold('Couch Stretch', 1, '60s/side', 'Rear foot up against a wall, tall torso — hip flexor + quad.'),
      hold('90/90 Hip Hold', 1, '60s/side', 'Both knees at 90°, sit tall, lean over the front shin.'),
      hold('Hamstring Stretch', 1, '60s/side', 'Seated or standing, hinge with a flat back.'),
      hold('Banded Shoulder Dislocates', 1, '15 reps', 'Wide grip on a band, pass it overhead front-to-back. Shoulder.'),
      hold('Thoracic Openers', 1, '10/side', 'Side-lying, open the top arm across — rotate the mid-back.'),
      hold('Deep Squat Sit', 1, '90s', 'Sit in the bottom of a squat, pry knees out with elbows.'),
      hold('Ankle Rocks', 1, '15/side', 'Half-kneel, drive the knee over the toes — ankle dorsiflexion.'),
      hold('Front Split Progression', 1, '90s/side', 'Ease into it, support on blocks/hands.'),
      hold('Middle Split Progression', 1, '90s', 'Wide stance, hinge forward, ease deeper.'),
    ], 'Hold each ~60s unless noted. This is the first of two weekly flexibility anchors.'),

    sec('recovery', [
      note('FOAM ROLL (time × spot): calves 45s/side · quads 45s/side · IT band/lateral thigh 30s/side · adductors 30s/side · glutes 45s/side · hamstrings 30s/side · thoracic/upper back 60s · lats 30s/side.'),
      note('LACROSSE BALL: plantar foot 30s/side · glute/piriformis 45s/side · pecs 30s/side · between shoulder blades 30s/side.'),
    ]),
  ]);
}

function sprintDay(w){
  return day('Sprint Speed (track)', 'run', [
    sec('warmup', [
      note('~12 min, thorough — Achilles priority: easy jog 5 min · leg swings · A-skips 2×20m · B-skips 2×20m · high knees 2×20m · ankle/calf prep · 3 build-up strides 60→80→90%.'),
    ]),
    sec('sprint', [
      note('NO TRACK? Don\'t skip this day — it keeps getting dropped for track access, and it\'s a priority day. Fallback: run the accelerations on flat grass/turf or a quiet flat stretch of road/path (cones or landmarks at 20–30m), same full recovery. For max-velocity, use a ~40–60m flat open stretch or a very slight grass downhill. If there\'s truly no runway, substitute 6–8 × ~5s HILL sprints (near-max, full walk-down recovery) — builds the same power without the top-end distance. The rule: you sprint SOMETHING today.'),
      run('Acceleration', 'sprint', { reps:w.accel, distance:'20–30m', pace:'max, from standing/3-point start', rest:'walk-back + 2–3 min',
        notes:'Drive out low and hard, push the ground back, gradual rise. The first ~5m is everything. Full recovery so every rep is fresh.' }),
      run('Max Velocity', 'sprint', { reps:w.maxV, distance:'40–60m', pace:'95–100%', rest:'3–4 min',
        notes:'Build to top speed over the first 20m, then hold relaxed top-end speed. This is what makes you FAST, not just quick out of the start. Fatigued sprinting trains the wrong thing — full recovery is mandatory.' }),
    ], 'Total fast running stays low (~400–500m). Quality, not conditioning.'),
    sec('power', [
      plyo('Broad Jump', 4, '3 reps', 'Two-foot standing long jump, reset every rep. Max horizontal distance. Rest 90s.'),
      plyo('Bounds', 3, '20m', 'Exaggerated running leaps, max distance per stride. Builds horizontal force for sprinting. Rest 2 min.'),
    ]),
    sec('recovery', [
      note('Cool-down: easy jog + calf/Achilles stretch.'),
    ]),
  ]);
}

function longRunDay(w){
  return day('Long Aerobic Run (Zone 2)', 'run', [
    sec('run', [
      run('Long Run', 'long', { distance:w.longRun, pace:'EASY — HR under ~150 (~11:30–12:30/mi; slower than feels natural)',
        notes:w.longNote+' Wk-1 ran way too hot (HR 160, max 183, walked twice) — your aerobic base is THE limiter, so this MUST be genuinely easy. Keep HR under ~150; if it creeps up, WALK until it drops then jog again — walk breaks are correct here, not failure. 80/20 base-building — the easy volume IS the work. If you can\'t talk, slow down. Log this from your watch below (distance, time, avg pace, avg + max HR).' }),
      run('Strides (optional)', 'sprint', { reps:4, distance:'100m', pace:'relaxed fast', rest:'full walk-back', notes:'After the run, for form. Skip if tired.' }),
    ], 'Record on the Garmin and log the watch data here.'),
  ]);
}

function kbDay(w){
  return day('KB / Circuit + Flexibility', 'mixed', [
    sec('warmup', [
      note('~6 min full-body joint prep — hips, shoulders, ankles, wrists (abbreviated Day 1–2 warmups).'),
    ]),
    sec('circuit', [
      lift('KB Swing', 4, 15, '40 lb KB', '90s/round',
        'Hinge and snap the hips, float the bell to chest height (not a squat, not a shoulder raise — hips do it).'),
      lift('Goblet Squat', 4, 10, '40 lb KB', 'flow',
        'Hold the bell at the chest, squat deep, elbows inside the knees.'),
      lift('KB Clean & Press', 4, '6/side', '40 lb KB', 'flow',
        'Clean the bell to the rack position, press overhead, return. One side then the other.'),
      lift('KB Single-arm Row', 4, '10/side', '40 lb KB', 'flow',
        'Hinge over, row the bell to the hip, squeeze.'),
      lift('Push-ups', 4, 15, 'Bodyweight', 'flow'),
      hold('Jump Rope', 4, '60s', 'Keep it light on the feet.'),
    ], '4 rounds. Rest 90s BETWEEN rounds, minimal rest within — the short rest IS the conditioning stimulus.'),
    sec('mobility', [
      hold('Couch Stretch', 1, '60s/side', null),
      hold('90/90 Hip Hold', 1, '60s/side', null),
      hold('Hamstring Stretch', 1, '60s/side', null),
      hold('Deep Squat Sit', 1, '90s', null),
      hold('Splits Progression', 1, '90s/side', 'Front + middle.'),
    ], 'Second weekly flexibility anchor.'),
  ]);
}

function restDay(){
  return day('Rest', 'rest', [
    sec('recovery', [
      note('Easy 20–30 min walk, light mobility, foam-roll any tight spots. Optional Zone 2 stroll. This is where you actually adapt — take it.'),
    ]),
  ]);
}

function makeWeek(w){
  return {
    title: w.title,
    focus: w.focus,
    days: [
      lowerDay(w), upperDay(w), swimDay(w),
      sprintDay(w), longRunDay(w), kbDay(w), restDay(),
    ],
  };
}

/* ===========================================================
   THE 4-WEEK BLOCK — weeks 1–3 progressive, week 4 deload,
   then re-test (5k + key lifts) and rebuild.
   =========================================================== */
const PROGRAM = {
  meta: {
    name: 'APEX',
    weeks: 4,
    goal: 'Hybrid: sub-23 5k · jump high / fast-twitch · strong + aesthetic · bulletproof joints',
  },
  athlete: {
    bodyweight: 175,
    height: "6'0\"",
    units: 'imperial',
    notes: 'Bar caps 215 lb. DBs 5–60 in 5s, NO 30. One 40 lb KB. Ice-chest box ~18". Bands L/M/H. Agility ladder. Pool 25m. Achilles ~99% — warm up thoroughly.',
    baselines: 'Squat 235×5 (~290 1RM) · Bench 215×5 (~240) · OHP 135–145×5 · Pull-ups 18–23 · PC ~220 (1.5y ago) · 5k ~9:30 pace · 50m swim then gassed.',
  },
  blocks: {
    warmup:'Warm-up / Prehab', power:'Power', strength:'Strength', physique:'Physique',
    prehab:'Injury Prevention', sprint:'Sprint', run:'Run', swim:'Swim',
    mobility:'Mobility', circuit:'KB Circuit', core:'Core', recovery:'Recovery',
  },
  weeks: [
    makeWeek({
      title:'WEEK 1 — BUILD',
      focus:'Establish loads + groove the patterns. Everything submaximal — leave reps in the tank.',
      clean:'135 lb', jumpDB:'15 lb DBs', pogo:'10 lb DBs',
      squat:'185 lb', rdl:'185 lb', bulg:'25 lb DBs', step:'25 lb DBs', calf:'25 lb DB',
      bench:'175 lb', pushPress:'135 lb', ohp:'115 lb', pullup:'+35 lb',
      longRun:'3 mi', longNote:'Built off your current 2mi.',
      accel:6, maxV:4, swimMainReps:8, swimTotal:'~400m',
    }),
    makeWeek({
      title:'WEEK 2 — PROGRESS',
      focus:'Add a little load/volume. Same patterns, slightly heavier or one more rep.',
      clean:'145 lb', jumpDB:'15 lb DBs', pogo:'10 lb DBs',
      squat:'195 lb', rdl:'195 lb', bulg:'30→35 lb DBs', step:'35 lb DBs', calf:'30→35 lb DB',
      bench:'180 lb', pushPress:'140 lb', ohp:'120 lb', pullup:'+40 lb',
      longRun:'3.5 mi', longNote:'Small step up — never jump a single run >10% past your longest of the last month.',
      accel:7, maxV:4, swimMainReps:10, swimTotal:'~450m',
    }),
    makeWeek({
      title:'WEEK 3 — PEAK',
      focus:'Top of the block — highest intensity/volume. Push, but keep form crisp.',
      clean:'155 lb', jumpDB:'20 lb DBs', pogo:'15 lb DBs',
      squat:'205 lb', rdl:'205 lb', bulg:'35 lb DBs', step:'35 lb DBs', calf:'40 lb DB',
      bench:'185 lb', pushPress:'145 lb', ohp:'125 lb', pullup:'+45 lb',
      longRun:'4 mi', longNote:'Longest run of the block.',
      accel:7, maxV:5, swimMainReps:6, swimTotal:'~500m (shift 4 reps to 50m)',
    }),
    makeWeek({
      title:'WEEK 4 — DELOAD + RE-TEST',
      focus:'~50–60% volume, easy. Then re-test: 5k time + squat/bench/clean working weights. Report back and we rebuild.',
      deload:true,
      clean:'115 lb (technical only)', jumpDB:'15 lb DBs', pogo:'10 lb DBs',
      squat:'155 lb', rdl:'155 lb', bulg:'25 lb DBs', step:'25 lb DBs', calf:'25 lb DB',
      bench:'155 lb', pushPress:'115 lb', ohp:'105 lb', pullup:'bodyweight',
      longRun:'2.5 mi easy', longNote:'Cut-back week — keep it light.',
      accel:4, maxV:3, swimMainReps:6, swimTotal:'~300m easy',
    }),
  ],
};

if (typeof window !== 'undefined') window.PROGRAM = PROGRAM;
if (typeof module !== 'undefined') module.exports = { PROGRAM };
