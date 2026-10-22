/* ============================================================
   APEX — the engine. Pure functions, no DOM, no storage.
   Calendar maths and the "add reps each cycle" rule.
   Runs in the browser (window.ENGINE) and in node (tests).
   ============================================================ */
'use strict';

var ENGINE = (function () {

  /* ---------- dates (local, YYYY-MM-DD) ---------- */
  function ymd(d) {
    var m = String(d.getMonth() + 1), day = String(d.getDate());
    return d.getFullYear() + '-' + (m.length < 2 ? '0' + m : m) + '-' + (day.length < 2 ? '0' + day : day);
  }
  function parse(s) {
    var p = String(s).split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return ymd(d); }
  function diffDays(a, b) { return Math.round((parse(a) - parse(b)) / 86400000); }

  /* ---------- where a date sits in the block ---------- */
  function position(P, anchor, date) {
    var n = diffDays(date, anchor) + 1;            // 1-based block day
    if (n < 1) return { before: true, day: n };
    if (n > P.blockDays) return { after: true, day: n };
    var cycle = Math.ceil(n / 4);
    var week = Math.ceil(n / 7);
    return {
      day: n, cycle: cycle, week: week,
      session: P.order[(n - 1) % 4],
      deload: P.deloadCycles.indexOf(cycle) >= 0,
      testCycle: P.testCycles.indexOf(cycle) >= 0,
    };
  }

  /* ---------- foot score rules ---------- */
  function footStatus(daysById, date) {
    var today = num(daysById[date] && daysById[date].foot);
    var yest = num(daysById[addDays(date, -1)] && daysById[addDays(date, -1)].foot);
    var weekMax = -1;
    for (var i = 1; i <= 7; i++) {
      var v = num(daysById[addDays(date, -i)] && daysById[addDays(date, -i)].foot);
      if (v != null && v > weekMax) weekMax = v;
    }
    var red = (today != null && today >= 5) || (today != null && yest != null && today >= 3 && yest >= 3);
    var hold = !red && ((today != null && today >= 3) || weekMax >= 3);
    return { red: red, hold: hold, today: today };
  }

  /* ---------- heel-raise gate: right within 10% of left, both knees ---------- */
  function heelGate(tests) {
    // newest test values win
    var v = {};
    Object.keys(tests).sort().forEach(function (id) {
      var t = tests[id];
      if (t && t.value !== '' && t.value != null) v[t.key] = Number(t.value);
    });
    var ok = function (r, l) { return v[r] > 0 && v[l] > 0 && v[r] >= 0.9 * v[l]; };
    if (!(v.heel_l_straight > 0) || !(v.heel_l_bent > 0)) return null;     // not tested yet
    return ok('heel_r_straight', 'heel_l_straight') && ok('heel_r_bent', 'heel_l_bent');
  }

  /* ---------- jumps for a date ---------- */
  function jumpsFor(P, pos, gate) {
    var phase = null;
    P.jumps.phases.forEach(function (ph) { if (ph.weeks.indexOf(pos.week) >= 0) phase = ph; });
    if (!phase) return [];
    var gated = phase.gated && gate !== true;
    if (gated) phase = P.jumps.phases[1];          // repeat weeks 3-4
    return phase.rows.map(function (r) {
      var sets = r.sets;
      if (pos.cycle === 1 && r.cycle1Sets) sets = r.cycle1Sets;
      if (pos.deload) sets = Math.max(1, Math.ceil(sets / 2));
      var name = (r.fromWeek6 && pos.week >= 6) ? r.fromWeek6 : r.name;
      return { name: name, sets: sets, reps: r.reps, rest: r.rest, perSide: r.perSide || '', key: slug(r.name) };
    });
  }

  /* ---------- the progression rule ----------
     history: this exercise's past sessions, newest first,
       [{ date, deload, stage, wi, target, sets:[{reps, weight, done}] }]
     Returns today's prescription:
       { stage, wi, label, sets, target, weight, perSide, note }   */
  function prescribe(ex, history, opts) {
    opts = opts || {};
    var stages = ex.stages;
    var real = history.filter(function (h) { return !h.deload && h.sets.some(function (s) { return s.done; }); });

    var st = 0, wi = 0, target = stages[0].lo, note = 'start';

    if (real.length) {
      var last = real[0];
      st = clamp(last.stage, 0, stages.length - 1);
      var stage = stages[st];
      wi = snapWeight(stage, last);
      target = last.target != null ? last.target : stage.lo;

      var done = last.sets.filter(function (s) { return s.done; });
      var need = last.setsPrescribed || stage.sets;
      var hitAll = done.length >= need && done.every(function (s) { return num(s.reps) != null && num(s.reps) >= target; });

      if (hitAll && opts.hold) {
        note = 'hold';
      } else if (hitAll) {
        if (target >= stage.hi) {
          if (stage.weights && wi < stage.weights.length - 1) { wi++; target = stage.lo; note = 'weight up'; }
          else if (st < stages.length - 1) { st++; wi = 0; target = stages[st].lo; note = 'next version'; }
          else { note = 'top of the plan'; }
        } else {
          target = Math.min(stage.hi, target + stage.inc);
          note = stage.inc ? '+' + stage.inc : 'hold';
        }
      } else {
        // missed: below the low number two sessions running -> one step back
        var prev = real[1];
        var below = function (h) {
          return h.sets.some(function (s) { return s.done && num(s.reps) != null && num(s.reps) < stages[clamp(h.stage, 0, stages.length - 1)].lo; });
        };
        if (prev && below(last) && below(prev)) {
          if (stage.weights && wi > 0) { wi--; target = stage.lo; note = 'step back'; }
          else if (st > 0) { st--; wi = 0; target = stages[st].hi; note = 'step back'; }
          else { target = stage.lo; note = 'step back'; }
        } else {
          note = 'repeat';
        }
      }
    }

    var s = stages[st];
    var sets = opts.deload ? Math.max(1, Math.ceil(s.sets / 2)) : s.sets;
    return {
      stage: st, wi: wi, label: s.label,
      sets: sets, target: target,
      weight: s.weights ? s.weights[Math.min(wi, s.weights.length - 1)] : null,
      perSide: s.perSide || ex.perSide || '',
      unit: ex.unit || 'reps',
      lo: s.lo, hi: s.hi, inc: s.inc,
      note: opts.deload ? 'easy week' : note,
      nextRule: ruleText(ex, st),
    };
  }

  /* the user may have lifted a different weight than prescribed:
     whatever they actually lifted becomes the baseline */
  function snapWeight(stage, last) {
    if (!stage.weights) return 0;
    var used = null;
    last.sets.forEach(function (s) { if (s.done && num(s.weight) != null) used = num(s.weight); });
    if (used == null) return clamp(last.wi || 0, 0, stage.weights.length - 1);
    var best = 0;
    for (var i = 0; i < stage.weights.length; i++) if (stage.weights[i] <= used) best = i;
    return best;
  }

  function ruleText(ex, st) {
    var s = ex.stages[st], next = ex.stages[st + 1];
    var unit = (ex.unit === 'secs') ? 's' : (ex.unit === 'm' ? ' m' : ' reps');
    if (s.inc === 1 && unit === ' reps') unit = ' rep';
    var add = s.inc ? '+' + s.inc + unit + ' a set' : 'same each time';
    var top;
    if (s.weights && s.weights.length > 1) top = 'at ' + s.hi + ' → next weight, back to ' + s.lo;
    else if (next) top = 'at ' + s.hi + ' → ' + next.label + (next.lo !== s.hi ? ' at ' + next.lo : '');
    else top = 'at ' + s.hi + ', hold there';
    if (s.lo === s.hi && s.weights && s.weights.length > 1) return 'next weight each cycle';
    return add + ' · ' + top;
  }

  /* ---------- helpers ---------- */
  function num(v) { if (v === '' || v == null) return null; var n = Number(v); return isNaN(n) ? null : n; }
  function clamp(v, a, b) { v = Number(v) || 0; return Math.max(a, Math.min(b, v)); }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); }

  return {
    ymd: ymd, parse: parse, addDays: addDays, diffDays: diffDays,
    position: position, footStatus: footStatus, heelGate: heelGate,
    jumpsFor: jumpsFor, prescribe: prescribe, num: num, slug: slug,
  };
})();

if (typeof window !== 'undefined') window.ENGINE = ENGINE;
if (typeof module !== 'undefined') module.exports = ENGINE;
