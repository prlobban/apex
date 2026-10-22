/* ============================================================
   APEX — app core
   One screen: a date. The date decides the session (from the
   block start), the engine decides the targets (from what you
   logged), and every edit is saved on the phone first, then
   pushed to the box (SQLite) whenever it can reach it.
   ============================================================ */
'use strict';

var E = ENGINE, P = PROGRAM;

/* ---------- local store + outbox ---------- */
var LS_DB = 'apex.v4.db', LS_OUT = 'apex.v4.outbox', LS_SYNC = 'apex.v4.synced';
var KINDS = { sets: 'id', days: 'date', tests: 'id', meta: 'key' };

var Local = (function () {
  var ls = null, mem = {};
  try { ls = window.localStorage; ls.setItem('__apex', '1'); ls.removeItem('__apex'); } catch (e) { ls = null; }
  return {
    get: function (k, d) { try { var v = ls ? ls.getItem(k) : mem[k]; return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { var s = JSON.stringify(v); try { ls ? ls.setItem(k, s) : (mem[k] = s); } catch (e) { mem[k] = s; } },
  };
})();

var db = Local.get(LS_DB, null) || { sets: {}, days: {}, tests: {}, meta: {} };
Object.keys(KINDS).forEach(function (k) { if (!db[k]) db[k] = {}; });
var outbox = Local.get(LS_OUT, {});
var persist = function () { Local.set(LS_DB, db); Local.set(LS_OUT, outbox); };

function put(kind, rec) {
  rec.updated_at = new Date().toISOString();
  var id = rec[KINDS[kind]];
  db[kind][id] = rec;
  outbox[kind + '|' + id] = rec.updated_at;
  persist();
  scheduleSync();
}
function patchDay(date, patch) {
  var rec = db.days[date] || { date: date };
  Object.keys(patch).forEach(function (k) { rec[k] = patch[k]; });
  put('days', rec);
}
function getMeta(k) { return db.meta[k] ? db.meta[k].value : null; }
function setMeta(k, v) { put('meta', { key: k, value: v }); }

/* ---------- sync with the box ---------- */
var syncState = { busy: false, last: Local.get(LS_SYNC, null), error: null };
var syncTimer = null;
function pending() { return Object.keys(outbox).length; }
function scheduleSync(ms) {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(sync, ms == null ? 1500 : ms);
  paintSync();
}
function sync() {
  if (syncState.busy) return;
  syncState.busy = true; paintSync();
  var sent = {}, records = [];
  Object.keys(outbox).forEach(function (key) {
    var i = key.indexOf('|'), kind = key.slice(0, i), id = key.slice(i + 1);
    var rec = db[kind] && db[kind][id];
    if (rec) { records.push({ kind: kind, rec: rec }); sent[key] = outbox[key]; }
    else delete outbox[key];
  });
  fetch('api/sync', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records: records }),
  }).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(function (res) {
    Object.keys(sent).forEach(function (k) { if (outbox[k] === sent[k]) delete outbox[k]; });
    var changed = false;
    Object.keys(KINDS).forEach(function (kind) {
      (res.state[kind] || []).forEach(function (srv) {
        var id = srv[KINDS[kind]];
        if (outbox[kind + '|' + id]) return;                 // local edit still waiting: local wins
        var loc = db[kind][id];
        if (!loc || String(srv.updated_at) > String(loc.updated_at)) { db[kind][id] = srv; changed = true; }
      });
    });
    syncState.last = new Date().toISOString(); syncState.error = null;
    Local.set(LS_SYNC, syncState.last);
    persist();
    if (changed && !isTyping()) render();
  }).catch(function (e) {
    syncState.error = String(e.message || e);
  }).then(function () {
    syncState.busy = false; paintSync();
    if (pending()) { clearTimeout(syncTimer); syncTimer = setTimeout(sync, 30000); }
  });
}
function isTyping() {
  var a = document.activeElement;
  return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA');
}

/* ---------- dom helper ---------- */
function el(tag, attrs, kids) {
  var n = document.createElement(tag);
  attrs = attrs || {};
  Object.keys(attrs).forEach(function (k) {
    var v = attrs[k];
    if (v == null || v === false) return;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (k === 'value') n.value = v;
    else n.setAttribute(k, v === true ? '' : v);
  });
  (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
    if (c == null || c === false) return;
    n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return n;
}

/* ---------- view state ---------- */
var today = E.ymd(new Date());
var viewDate = today;
var testsOpen = false;

function fmtDate(s) {
  var d = E.parse(s);
  var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var mons = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return days[d.getDay()] + ' ' + mons[d.getMonth()] + ' ' + d.getDate();
}

/* ---------- history for the engine ---------- */
function historyFor(exId, beforeDate) {
  var byDate = {};
  Object.keys(db.sets).forEach(function (id) {
    var s = db.sets[id];
    if (s.ex !== exId || s.date >= beforeDate) return;
    (byDate[s.date] = byDate[s.date] || []).push(s);
  });
  return Object.keys(byDate).sort().reverse().map(function (d) {
    var sets = byDate[d].sort(function (a, b) { return a.set_no - b.set_no; });
    var f = sets[0];
    return {
      date: d, deload: !!f.deload, stage: f.stage, wi: f.wi, target: f.target,
      setsPrescribed: f.sets_prescribed,
      sets: sets.map(function (s) { return { reps: s.reps, weight: s.weight, done: !!s.done }; }),
    };
  });
}

/* ---------- render ---------- */
function render() {
  today = E.ymd(new Date());
  var main = document.getElementById('main');
  main.innerHTML = '';
  main.appendChild(topbar());

  var anchor = getMeta('anchor');
  if (!anchor) { main.appendChild(setupCard()); paintSync(); return; }

  var pos = E.position(P, anchor, viewDate);
  if (pos.before || pos.after) {
    main.appendChild(el('section', { class: 'card center' }, [
      el('h1', { class: 'big', text: pos.before ? 'Not started' : 'Block done' }),
      el('p', { class: 'soft', text: pos.before ? 'Day 1 is ' + fmtDate(anchor) + '.' : 'All 56 days are behind you. Time for block 2.' }),
    ]));
    main.appendChild(notesCard(viewDate));
    main.appendChild(footer(anchor));
    paintSync();
    return;
  }

  var sess = P.sessions[pos.session];
  var foot = E.footStatus(db.days, viewDate);
  var gate = E.heelGate(db.tests);

  /* header */
  var tags = [];
  if (pos.deload) tags.push('EASY WEEK');
  if (pos.testCycle) tags.push('TEST CYCLE');
  if (viewDate === today) tags.push('TODAY');
  main.appendChild(el('header', { class: 'dayhead' }, [
    el('div', { class: 'tagrow' }, tags.map(function (t) { return el('span', { class: 'tag' + (t === 'TODAY' ? ' solid' : ''), text: t }); })),
    el('h1', { class: 'big', text: sess.title }),
    el('p', { class: 'meta', text: 'Day ' + pos.day + ' of ' + P.blockDays + '  ·  Cycle ' + pos.cycle + ' of 14  ·  Week ' + pos.week }),
    el('p', { class: 'soft', text: sess.time + (pos.deload ? ' · half the sets, same weights, no rep adds' : '') }),
  ]));

  if (foot.red) main.appendChild(banner('RED DAY', 'No running and no jumps today. Upper body as normal. Drop running back one step and slide the cycle a day.'));
  else if (foot.hold) main.appendChild(banner('HOLD', 'Feet hit 3+ this week: no rep adds on legs, no running step, no jump step.'));

  main.appendChild(morningCard(pos, foot));

  main.appendChild(blockCard('Warm-up', sess.warmup + (sess.warmupFromWeek3 && pos.week >= 3 ? '\n' + sess.warmupFromWeek3 : ''), 'warmup'));

  if (sess.jumps) {
    main.appendChild(jumpsCard(pos, foot, gate));
    if (sess.afterJumps) main.appendChild(el('p', { class: 'between', text: sess.afterJumps }));
  }

  sess.exercises.forEach(function (ex) {
    var hist = historyFor(ex.id, viewDate);
    var hold = foot.hold && ex.tags && ex.tags.indexOf('legs') >= 0;
    var rx = E.prescribe(ex, hist, { deload: pos.deload, hold: hold });
    main.appendChild(exerciseCard(ex, rx, pos, hist.length === 0));
  });

  if (sess.footer) main.appendChild(el('p', { class: 'between', text: sess.footer }));
  main.appendChild(blockCard('Stretch block · ~7 min', P.stretch.join('\n'), 'stretch'));
  if (pos.testCycle) main.appendChild(testsCard(pos));
  main.appendChild(notesCard(viewDate));
  main.appendChild(footer(anchor));
  paintSync();
}

function topbar() {
  return el('div', { class: 'topbar' }, [
    el('div', { class: 'brand' }, [el('img', { src: 'icons/icon-192.png', alt: '' }), el('span', { text: 'APEX' })]),
    el('div', { class: 'stepper' }, [
      el('button', { class: 'step', 'aria-label': 'previous day', onclick: function () { viewDate = E.addDays(viewDate, -1); render(); } }, '‹'),
      el('button', { class: 'datebtn', onclick: function () { viewDate = today; render(); } }, viewDate === today ? fmtDate(viewDate) : fmtDate(viewDate) + ' ↺'),
      el('button', { class: 'step', 'aria-label': 'next day', onclick: function () { viewDate = E.addDays(viewDate, 1); render(); } }, '›'),
    ]),
    el('button', { id: 'syncdot', class: 'syncdot', onclick: function () { sync(); } }, ''),
  ]);
}

function banner(title, text) {
  return el('div', { class: 'banner' }, [el('strong', { text: title }), el('span', { text: ' ' + text })]);
}

/* ---------- first run ---------- */
function setupCard() {
  var tomorrow = E.addDays(today, 1);
  var input = el('input', { class: 'datein', type: 'date', value: tomorrow });
  return el('section', { class: 'card' }, [
    el('h1', { class: 'big', text: 'Day 1?' }),
    el('p', { class: 'soft', text: 'Pick the day of your first Pull session. Everything else counts from it.' }),
    el('div', { class: 'btnrow' }, [
      el('button', { class: 'btn', onclick: function () { setMeta('anchor', today); render(); } }, 'TODAY'),
      el('button', { class: 'btn', onclick: function () { setMeta('anchor', tomorrow); render(); } }, 'TOMORROW'),
    ]),
    el('div', { class: 'btnrow' }, [input,
      el('button', { class: 'btn ghost', onclick: function () { if (input.value) { setMeta('anchor', input.value); render(); } } }, 'SET')]),
  ]);
}

/* ---------- this morning: feet, run, body ---------- */
function morningCard(pos, foot) {
  var d = db.days[viewDate] || {};
  var scores = [];
  for (var i = 0; i <= 10; i++) (function (v) {
    scores.push(el('button', {
      class: 'score' + (Number(d.foot) === v && d.foot !== '' && d.foot != null ? ' on' : '') + (v >= 5 ? ' hi' : v >= 3 ? ' mid' : ''),
      onclick: function () { patchDay(viewDate, { foot: Number(d.foot) === v ? null : v }); render(); },
    }, String(v)));
  })(i);

  var miles = P.running.miles[pos.week - 1];
  var runLine = foot.red ? 'No run today (red day).' : 'Easy run: ' + miles + ' mi';
  var strides = pos.week >= P.running.stridesFromWeek && pos.session === P.running.stridesOn && !pos.deload;
  if (pos.day === P.running.timeTrialDay) runLine = '5k TIME TRIAL instead of the easy run.';
  else if (strides && !foot.red) runLine += ' + strides: ' + P.running.strides;

  return el('section', { class: 'card' }, [
    el('h2', { class: 'label', text: 'This morning' }),
    el('div', { class: 'sub', text: 'Feet, 0-10' }),
    el('div', { class: 'scores' }, scores),
    el('div', { class: 'sub', text: runLine }),
    el('div', { class: 'fields' }, [
      field('Run (mi)', d.run_mi, function (v) { patchDay(viewDate, { run_mi: v }); }),
      field('Weight (lb)', d.weight, function (v) { patchDay(viewDate, { weight: v }); }),
      field('Waist (in)', d.waist, function (v) { patchDay(viewDate, { waist: v }); }),
    ]),
    strides ? tickLine('Strides done', !!d.strides, function (on) { patchDay(viewDate, { strides: on ? 1 : 0 }); }) : null,
  ]);
}

function field(label, value, onsave) {
  return el('label', { class: 'field' }, [
    el('span', { class: 'flabel', text: label }),
    el('input', { class: 'box', type: 'text', inputmode: 'decimal', value: value == null ? '' : value,
      oninput: function (e) { onsave(e.target.value); } }),
  ]);
}
function tickLine(label, on, onchange) {
  return el('button', { class: 'tickline' + (on ? ' on' : ''), onclick: function () { onchange(!on); render(); } }, [
    el('span', { class: 'tick', text: on ? '✓' : '' }), el('span', { text: label }),
  ]);
}

/* ---------- warm-up / stretch ---------- */
function blockCard(title, text, field) {
  var d = db.days[viewDate] || {};
  var patch = {};
  return el('section', { class: 'card' }, [
    el('h2', { class: 'label', text: title }),
    el('div', { class: 'body' }, text.split('\n').map(function (line) { return el('p', { text: line }); })),
    tickLine('Done', !!d[field], function (on) { patch[field] = on ? 1 : 0; patchDay(viewDate, patch); }),
  ]);
}

/* ---------- jumps ---------- */
function jumpsCard(pos, foot, gate) {
  var rows = E.jumpsFor(P, pos, gate);
  var phase = pos.week >= 5;
  var kids = [
    el('div', { class: 'exhead' }, [el('h2', { class: 'label', text: 'Jumps' }), el('span', { class: 'tag solid', text: 'EXPLOSIVE' })]),
    el('p', { class: 'soft small', text: P.jumps.note }),
  ];
  if (foot.red) { kids.push(el('p', { class: 'warn', text: 'Red day: no jumps.' })); return el('section', { class: 'card' }, kids); }
  if (phase && gate !== true) kids.push(el('p', { class: 'warn', text: gate === false ? 'Heel-raise test did not pass: repeating the weeks 3-4 jumps.' : 'No heel-raise test logged yet: repeating the weeks 3-4 jumps.' }));
  var total = 0;
  rows.forEach(function (r) {
    total += r.sets * r.reps * (r.perSide ? 2 : 1);
    var key = 'jump_' + r.key;
    kids.push(el('div', { class: 'jumprow' }, [
      el('div', {}, [el('div', { class: 'exname', text: r.name }),
        el('div', { class: 'rx', text: r.sets + ' × ' + r.reps + (r.perSide ? ' ' + r.perSide : '') + '  ·  rest ' + r.rest })]),
      setTick(key, 1, pos, { target: r.reps, sets_prescribed: r.sets, stage: 0, wi: 0 }),
    ]));
  });
  kids.push(el('p', { class: 'soft small', text: total + ' jumps today' }));
  return el('section', { class: 'card' }, kids);
}

/* ---------- an exercise ---------- */
function exerciseCard(ex, rx, pos, first) {
  var unit = rx.unit === 'secs' ? 's' : rx.unit === 'm' ? ' m' : '';
  var line = rx.sets + ' × ' + rx.target + unit + (rx.perSide ? ' ' + rx.perSide : '');
  if (rx.weight != null) line += '  ·  ' + rx.weight + ' lb';
  line += '  ·  rest ' + ex.rest;

  var rows = [];
  for (var i = 1; i <= rx.sets; i++) rows.push(setRow(ex, rx, pos, i));

  var badge = null;
  if (rx.note === 'weight up' || rx.note === 'next version') badge = el('span', { class: 'tag solid', text: rx.note.toUpperCase() });
  else if (rx.note === 'step back') badge = el('span', { class: 'tag', text: 'STEP BACK' });
  else if (rx.note === 'hold') badge = el('span', { class: 'tag', text: 'HOLD' });

  return el('section', { class: 'card ex' + (ex.explosive ? ' explosive' : '') }, [
    el('div', { class: 'exhead' }, [
      el('div', { class: 'exname', text: ex.name }),
      badge || (ex.explosive ? el('span', { class: 'tag solid', text: 'EXPLOSIVE' }) : null),
    ]),
    rx.label && rx.label !== 'Barbell' && rx.label !== 'DBs' && rx.label !== 'DB' ? el('div', { class: 'version', text: rx.label }) : null,
    el('div', { class: 'rx', text: line }),
    first && ex.guess ? el('div', { class: 'guess', text: 'Starting weight is a guess. Easy first set → go up. Missed reps → go down. What you log becomes the baseline.' }) : null,
    ex.cue ? el('div', { class: 'cue', text: ex.cue }) : null,
    el('div', { class: 'sets' }, rows),
    el('div', { class: 'rule', text: 'Each cycle: ' + rx.nextRule }),
  ]);
}

function setRow(ex, rx, pos, n) {
  var id = viewDate + '|' + ex.id + '|' + n;
  var rec = db.sets[id];
  var weighted = rx.weight != null;
  function base() {
    return rec || {
      id: id, date: viewDate, session: pos.session, cycle: pos.cycle, deload: pos.deload ? 1 : 0,
      ex: ex.id, set_no: n, stage: rx.stage, wi: rx.wi, target: rx.target, sets_prescribed: rx.sets,
      weight: null, reps: null, done: 0,
    };
  }
  function save(patch) {
    rec = base();
    Object.keys(patch).forEach(function (k) { rec[k] = patch[k]; });
    put('sets', rec);
  }
  var wBox = weighted ? el('input', { class: 'box', type: 'text', inputmode: 'decimal', placeholder: String(rx.weight),
    value: rec && rec.weight != null ? rec.weight : '', 'aria-label': 'weight',
    oninput: function (e) { save({ weight: e.target.value === '' ? null : Number(e.target.value) }); } }) : null;
  var rBox = el('input', { class: 'box', type: 'text', inputmode: 'numeric', placeholder: String(rx.target),
    value: rec && rec.reps != null ? rec.reps : '', 'aria-label': rx.unit,
    oninput: function (e) { save({ reps: e.target.value === '' ? null : Number(e.target.value) }); } });
  var done = rec && rec.done;
  var check = el('button', { class: 'check' + (done ? ' on' : ''), 'aria-label': 'set done',
    onclick: function () {
      var now = !(rec && rec.done);
      var patch = { done: now ? 1 : 0 };
      if (now && (rBox.value === '')) { patch.reps = rx.target; rBox.value = rx.target; }
      if (now && weighted && wBox.value === '') { patch.weight = rx.weight; wBox.value = rx.weight; }
      save(patch);
      check.classList.toggle('on', now); check.textContent = now ? '✓' : '';
    } }, done ? '✓' : '');
  var unitLabel = rx.unit === 'secs' ? 'sec' : rx.unit === 'm' ? 'm' : 'reps';
  return el('div', { class: 'setrow' }, [
    el('span', { class: 'setno', text: String(n) }),
    weighted ? el('label', { class: 'fieldbox' }, [wBox, el('span', { class: 'unit', text: 'lb' })]) : null,
    el('label', { class: 'fieldbox' }, [rBox, el('span', { class: 'unit', text: unitLabel })]),
    check,
  ]);
}

/* a single done-tick (jumps) stored as a set record */
function setTick(exKey, n, pos, extra) {
  var id = viewDate + '|' + exKey + '|' + n;
  var rec = db.sets[id];
  var on = rec && rec.done;
  return el('button', { class: 'check' + (on ? ' on' : ''), 'aria-label': 'done',
    onclick: function () {
      var r = rec || { id: id, date: viewDate, session: pos.session, cycle: pos.cycle, deload: pos.deload ? 1 : 0, ex: exKey, set_no: n,
        stage: extra.stage, wi: extra.wi, target: extra.target, sets_prescribed: extra.sets_prescribed, weight: null, reps: null, done: 0 };
      r.done = r.done ? 0 : 1; r.reps = r.done ? extra.target : null;
      put('sets', r); render();
    } }, on ? '✓' : '');
}

/* ---------- tests ---------- */
function testsCard(pos) {
  var keys = P.tests[pos.cycle] || [];
  var logged = keys.filter(function (k) { var r = db.tests['c' + pos.cycle + '|' + k]; return r && r.value !== '' && r.value != null; }).length;
  var kids = [el('summary', { class: 'label' }, 'Tests · cycle ' + pos.cycle + ' · ' + logged + ' of ' + keys.length + ' logged'),
    el('p', { class: 'soft small', text: 'Do them anywhere in this cycle. Heel raises: single leg off the step, to failure, 2s up / 2s down.' })];
  keys.forEach(function (k) {
    var id = 'c' + pos.cycle + '|' + k;
    var rec = db.tests[id];
    kids.push(field(P.testLabels[k] || k, rec ? rec.value : '', function (v) {
      put('tests', { id: id, date: viewDate, cycle: pos.cycle, key: k, value: v });
    }));
  });
  var gate = E.heelGate(db.tests);
  if (gate !== null) kids.push(el('p', { class: gate ? 'ok' : 'warn', text: gate ? 'Heel-raise gate: PASS (right within 10% of left).' : 'Heel-raise gate: not yet (right is more than 10% behind).' }));
  var box = el('details', { class: 'card tests' }, kids);
  box.open = testsOpen;
  box.addEventListener('toggle', function () { testsOpen = box.open; });
  return box;
}

/* ---------- notes ---------- */
function notesCard(date) {
  var d = db.days[date] || {};
  var t;
  return el('section', { class: 'card' }, [
    el('h2', { class: 'label', text: 'Notes · feedback for this day' }),
    el('textarea', { class: 'notes', rows: '5', placeholder: 'How it went, what felt off, what to change…', value: d.notes || '',
      oninput: function (e) { var v = e.target.value; clearTimeout(t); t = setTimeout(function () { patchDay(date, { notes: v }); }, 400); } }),
  ]);
}

/* ---------- footer: sync, export, block controls ---------- */
function footer(anchor) {
  return el('footer', { class: 'foot' }, [
    el('div', { id: 'syncline', class: 'syncline' }),
    el('div', { class: 'linkrow' }, [
      el('button', { class: 'linkbtn', onclick: function () { sync(); } }, 'SYNC NOW'),
      el('button', { class: 'linkbtn', onclick: function (e) { copyExport(e.target); } }, 'COPY JSON'),
    ]),
    el('div', { class: 'linkrow' }, [
      el('span', { class: 'soft small', text: 'Day 1: ' + fmtDate(anchor) }),
      el('button', { class: 'linkbtn', onclick: function () {
        if (!window.confirm('Slide the block one day?\n\nToday becomes yesterday\'s session again. Use it for a red day or a missed day.')) return;
        setMeta('anchor', E.addDays(anchor, 1)); render();
      } }, 'SLIDE A DAY'),
      el('button', { class: 'linkbtn', onclick: function () {
        var v = window.prompt('Day 1 of the block (YYYY-MM-DD):', anchor);
        if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) { setMeta('anchor', v); render(); }
      } }, 'CHANGE DAY 1'),
    ]),
  ]);
}

function paintSync() {
  var dot = document.getElementById('syncdot');
  var line = document.getElementById('syncline');
  var n = pending();
  var state = syncState.busy ? 'busy' : n ? (syncState.error ? 'off' : 'wait') : 'ok';
  var text = syncState.busy ? 'Syncing…'
    : n ? (syncState.error ? n + ' change' + (n > 1 ? 's' : '') + ' saved on the phone. Box not reachable, will retry.' : n + ' waiting to sync')
    : syncState.last ? 'Synced to the box ' + new Date(syncState.last).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Not synced yet';
  if (dot) { dot.className = 'syncdot ' + state; dot.setAttribute('aria-label', text); }
  if (line) line.textContent = text;
}

function copyExport(btn) {
  var out = { app: 'APEX', version: P.version, exported: new Date().toISOString(), anchor: getMeta('anchor'),
    sets: Object.keys(db.sets).map(function (k) { return db.sets[k]; }),
    days: Object.keys(db.days).map(function (k) { return db.days[k]; }),
    tests: Object.keys(db.tests).map(function (k) { return db.tests[k]; }) };
  var text = JSON.stringify(out, null, 2);
  var done = function (msg) { var o = btn.textContent; btn.textContent = msg; setTimeout(function () { btn.textContent = o; }, 1500); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done('COPIED'); }, function () { done('FAILED'); });
  else done('FAILED');
}

/* ---------- boot ---------- */
function boot() {
  render();
  sync();
  window.addEventListener('online', function () { sync(); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      var t = E.ymd(new Date());
      if (t !== today && viewDate === today) viewDate = t;
      render(); sync();
    }
  });
  window.APEX = { db: db, render: render, sync: sync, setView: function (d) { viewDate = d; render(); } };
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js').catch(function () {});
}
document.addEventListener('DOMContentLoaded', boot);
