/* ============================================================
   APEX — app core
   An 8-day rotating cycle, not a week. Reads the plan from
   window.PROGRAM (program.js) and knows nothing about content.

   "Today" is derived from an anchor date in storage — the date
   that was Day 1 — so the cycle drifts through the calendar the
   way the program does. Miss a day, hit RESYNC on the day you
   are actually on and the anchor moves.
   ============================================================ */
'use strict';

/* ---------- storage (localStorage w/ in-memory fallback) ---------- */
var Store = (function () {
  var ls, mem = {};
  try {
    ls = window.localStorage;
    var t = '__apex__'; ls.setItem(t, '1'); ls.removeItem(t);
  } catch (e) { ls = null; }
  return {
    get: function (k, d) {
      try {
        var v = ls ? ls.getItem(k) : mem[k];
        return v == null ? d : JSON.parse(v);
      } catch (e) { return d; }
    },
    set: function (k, v) {
      var s = JSON.stringify(v);
      try { ls ? ls.setItem(k, s) : (mem[k] = s); } catch (e) { mem[k] = s; }
    },
    del: function (k) {
      try { ls ? ls.removeItem(k) : delete mem[k]; } catch (e) { delete mem[k]; }
    },
  };
})();

var KEY = function (dayId) { return 'apex.v3.' + dayId; };
var getLog = function (dayId) { return Store.get(KEY(dayId), { started: null, sets: {} }); };
var setLog = function (dayId, v) { Store.set(KEY(dayId), v); };

/* ---------- the cycle ----------
   ANCHOR_KEY holds the local date (YYYY-MM-DD) that was Day 1.
   Everything else is arithmetic off that. */
var ANCHOR_KEY = 'apex.v3.anchor';
var CYCLE = function () { return PROGRAM.days.length; };

function ymd(d) {
  var m = String(d.getMonth() + 1), day = String(d.getDate());
  if (m.length < 2) m = '0' + m;
  if (day.length < 2) day = '0' + day;
  return d.getFullYear() + '-' + m + '-' + day;
}
function midnight(dateStr) {
  var p = String(dateStr).split('-');
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
}
function getAnchor() {
  var a = Store.get(ANCHOR_KEY, null);
  if (!a || isNaN(midnight(a))) { a = ymd(new Date()); Store.set(ANCHOR_KEY, a); }
  return a;
}
/* 1-based position in the cycle for today */
function cycleIndexToday() {
  var now = new Date();
  var days = Math.round((midnight(ymd(now)) - midnight(getAnchor())) / 86400000);
  var n = CYCLE();
  return ((days % n) + n) % n;   // 0-based
}
function todayId() { return PROGRAM.days[cycleIndexToday()].id; }
/* make today be day at index i — moves the anchor back i days */
function resyncTo(i) {
  var d = new Date();
  d.setDate(d.getDate() - i);
  Store.set(ANCHOR_KEY, ymd(d));
}
function indexOfId(id) {
  for (var i = 0; i < PROGRAM.days.length; i++) if (PROGRAM.days[i].id === id) return i;
  return 0;
}

/* ---------- dom helper ---------- */
function el(tag, attrs, children) {
  var n = document.createElement(tag);
  attrs = attrs || {};
  Object.keys(attrs).forEach(function (k) {
    var v = attrs[k];
    if (v == null) return;
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  });
  var kids = children == null ? [] : (Array.isArray(children) ? children : [children]);
  kids.forEach(function (c) {
    if (c == null) return;
    n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return n;
}

/* ---------- day helpers ---------- */
function dayById(id) {
  for (var i = 0; i < PROGRAM.days.length; i++) if (PROGRAM.days[i].id === id) return PROGRAM.days[i];
  return PROGRAM.days[0];
}
function fmtStarted(iso) {
  if (!iso) return 'not started';
  var d = new Date(iso);
  if (isNaN(d)) return 'not started';
  var mm = String(d.getMonth() + 1), dd = String(d.getDate());
  var h = d.getHours(), m = String(d.getMinutes());
  if (m.length < 2) m = '0' + m;
  var ap = h >= 12 ? 'pm' : 'am';
  h = h % 12; if (h === 0) h = 12;
  return 'started ' + mm + '/' + dd + ' ' + h + ':' + m + ap;
}

// rows that are just "did you do it" — no numbers worth typing
function isTickOnly(item) {
  return item.cols[0] === '—' && (item.cols[1] === 'done' || item.cols[1] === 'ok');
}

function rxLine(item) {
  var rx = [];
  rx.push(item.sets > 1 ? item.sets + ' x ' + item.target : item.target);
  if (item.load) rx.push(item.load);
  if (item.rest) rx.push('rest ' + item.rest);
  return rx.join('  ·  ');
}

/* ---------- export ---------- */
function buildExport() {
  var out = {
    app: 'APEX',
    version: PROGRAM.version,
    exported: new Date().toISOString(),
    cycleLength: PROGRAM.days.length,
    cycleAnchor: getAnchor(),
    days: [],
  };

  PROGRAM.days.forEach(function (day) {
    var log = getLog(day.id);
    var dayOut = { day: day.name, title: day.title, started: log.started || null, sections: [] };

    day.sections.forEach(function (sec, si) {
      var secOut = { label: sec.label, exercises: [] };

      sec.items.forEach(function (item, ii) {
        var sets = [];
        for (var s = 0; s < item.sets; s++) {
          var rec = log.sets[si + '.' + ii + '.' + s];
          if (!rec) continue;
          if (!rec.a && !rec.b && !rec.done) continue;
          var row = { set: s + 1 };
          if (item.cols[0] !== '—' && rec.a) row[item.cols[0]] = rec.a;
          if (!isTickOnly(item) && rec.b) row[item.cols[1]] = rec.b;
          if (rec.done) row.checked = true;
          sets.push(row);
        }
        if (sets.length) {
          secOut.exercises.push({ name: item.name, prescribed: rxLine(item), sets: sets });
        }
      });

      if (secOut.exercises.length) dayOut.sections.push(secOut);
    });

    if (dayOut.sections.length || dayOut.started) out.days.push(dayOut);
  });

  return JSON.stringify(out, null, 2);
}

function flash(btn, msg) {
  var old = btn.textContent;
  btn.textContent = msg;
  setTimeout(function () { btn.textContent = old; }, 1600);
}

function downloadJSON(btn) {
  try {
    var blob = new Blob([buildExport()], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: 'apex-export-' + new Date().toISOString().slice(0, 10) + '.json' });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  } catch (e) { flash(btn, 'FAILED — USE COPY'); }
}

function copyJSON(btn) {
  var text = buildExport();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(function () { flash(btn, 'COPIED'); })
      .catch(function () { flash(btn, 'FAILED'); });
    return;
  }
  try {
    var ta = el('textarea', { class: 'offscreen' });
    ta.value = text;
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
    flash(btn, 'COPIED');
  } catch (e) { flash(btn, 'FAILED'); }
}

/* ---------- render ---------- */
var currentDay = todayId();

function render() {
  var day = dayById(currentDay);
  var log = getLog(day.id);
  var main = document.getElementById('main');
  main.innerHTML = '';

  /* header */
  var idx = indexOfId(day.id);
  var isToday = idx === cycleIndexToday();
  var todayDay = PROGRAM.days[cycleIndexToday()];

  main.appendChild(el('header', { class: 'dayhead' }, [
    el('div', { class: 'dayhead-top' }, [
      el('h1', {}, day.title),
      el('span', { class: 'daylabel' }, day.name + ' of ' + CYCLE()),
    ]),
    el('p', { class: 'daysub' }, day.sub),
    el('div', { class: 'cyclerow' }, [
      el('span', { class: 'cyclenote' },
        isToday ? 'TODAY' : 'today is ' + todayDay.name.toLowerCase() + ' — ' + todayDay.title),
      el('button', {
        class: 'synclink',
        onclick: function () {
          if (!window.confirm('Make TODAY ' + day.name + ' (' + day.title + ')?\n\nThis re-anchors the whole cycle to today. Use it when you have missed a day or shuffled one.')) return;
          resyncTo(idx);
          render();
        },
      }, isToday ? 'RE-ANCHOR' : 'MAKE TODAY'),
    ]),
    el('div', { class: 'startrow' }, [
      el('button', {
        class: 'startbtn',
        onclick: function () {
          var msg = 'Start ' + day.name + ' fresh?\n\nThis clears everything you logged for this day.';
          if (!window.confirm(msg)) return;
          Store.del(KEY(day.id));
          setLog(day.id, { started: new Date().toISOString(), sets: {} });
          render();
        },
      }, 'START DAY FRESH'),
      el('span', { class: 'started' }, fmtStarted(log.started)),
    ]),
  ]));

  /* sections */
  day.sections.forEach(function (sec, si) {
    main.appendChild(el('h2', { class: 'seclabel' }, sec.label));

    sec.items.forEach(function (item, ii) {
      var rows = [];
      for (var s = 0; s < item.sets; s++) rows.push(setRow(day.id, si, ii, s, item));

      main.appendChild(el('section', { class: 'ex' }, [
        el('div', { class: 'exname' }, item.name),
        el('div', { class: 'exrx' }, rxLine(item)),
        item.note ? el('div', { class: 'exnote' }, item.note) : null,
        el('div', { class: 'sets' }, rows),
      ]));
    });
  });

  /* export — the whole cycle, not just this day */
  main.appendChild(el('footer', { class: 'foot' }, [
    el('button', {
      class: 'linkbtn', onclick: function (e) { downloadJSON(e.target); },
    }, 'EXPORT JSON'),
    el('button', {
      class: 'linkbtn', onclick: function (e) { copyJSON(e.target); },
    }, 'COPY JSON'),
  ]));

  /* nav state */
  var btns = document.querySelectorAll('.daybtn');
  var tid = todayId();
  for (var i = 0; i < btns.length; i++) {
    var d = btns[i].getAttribute('data-day');
    btns[i].classList.toggle('on', d === currentDay);
    btns[i].classList.toggle('istoday', d === tid);
  }
  window.scrollTo(0, 0);
}

function setRow(dayId, si, ii, s, item) {
  var key = si + '.' + ii + '.' + s;
  var log = getLog(dayId);
  var rec = log.sets[key] || { a: '', b: '', done: false };

  function save(patch) {
    var l = getLog(dayId);
    var cur = l.sets[key] || { a: '', b: '', done: false };
    Object.keys(patch).forEach(function (k) { cur[k] = patch[k]; });
    l.sets[key] = cur;
    if (!l.started) l.started = new Date().toISOString();
    setLog(dayId, l);
  }

  var boxA = el('input', {
    class: 'box', type: 'text', inputmode: 'decimal', value: rec.a,
    'aria-label': item.cols[0],
    oninput: function (e) { save({ a: e.target.value }); },
  });
  var boxB = el('input', {
    class: 'box', type: 'text', inputmode: 'decimal', value: rec.b,
    'aria-label': item.cols[1],
    oninput: function (e) { save({ b: e.target.value }); },
  });

  var check = el('button', {
    class: 'check' + (rec.done ? ' on' : ''),
    'aria-label': 'mark set done',
    onclick: function (e) {
      var now = !e.target.classList.contains('on');
      e.target.classList.toggle('on', now);
      save({ done: now });
    },
  }, rec.done ? '✓' : '');

  if (isTickOnly(item)) {
    return el('div', { class: 'setrow' }, [
      el('span', { class: 'setno' }, item.sets > 1 ? String(s + 1) : '·'),
      el('span', { class: 'tickpad' }, ''),
      check,
    ]);
  }

  var muted = item.cols[0] === '—';

  return el('div', { class: 'setrow' }, [
    el('span', { class: 'setno' }, item.sets > 1 ? String(s + 1) : '·'),
    muted ? el('span', { class: 'boxpad' }, '') : el('label', { class: 'field' }, [boxA, el('span', { class: 'unit' }, item.cols[0])]),
    el('label', { class: 'field' }, [boxB, el('span', { class: 'unit' }, item.cols[1])]),
    check,
  ]);
}

/* ---------- boot ---------- */
function boot() {
  var nav = document.getElementById('daynav');
  PROGRAM.days.forEach(function (d) {
    nav.appendChild(el('button', {
      class: 'daybtn' + (d.rest ? ' isrest' : ''), 'data-day': d.id,
      onclick: function () { currentDay = d.id; render(); },
    }, d.short || d.name.slice(0, 3).toUpperCase()));
  });
  render();

  // small handle for the smoke test / console poking
  window.APEX = {
    buildExport: buildExport, render: render,
    todayId: todayId, cycleIndexToday: cycleIndexToday,
    getAnchor: getAnchor, resyncTo: resyncTo,
  };

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(function () {});
}
document.addEventListener('DOMContentLoaded', boot);
