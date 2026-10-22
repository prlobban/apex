/* APEX smoke test.
   1. engine: block maths and the "add reps each cycle" rule
   2. app: every session renders, a logged set lands in the outbox
   3. server: sync round-trip through SQLite
   Run: node smoke-test.mjs */
import { JSDOM } from 'jsdom';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PROGRAM: P } = require('./program.js');
const E = require('./engine.js');
const ok = (c, msg) => { if (!c) throw new Error('FAIL: ' + msg); console.log('ok  ', msg); };

/* ---------- 1. engine ---------- */
const pos1 = E.position(P, '2026-10-23', '2026-10-23');
ok(pos1.day === 1 && pos1.session === 'pull' && pos1.cycle === 1 && pos1.week === 1, 'day 1 is Pull, cycle 1, week 1');
ok(E.position(P, '2026-10-23', '2026-10-26').session === 'recovery', 'day 4 is Recovery');
ok(E.position(P, '2026-10-23', '2026-10-27').cycle === 2, 'day 5 starts cycle 2');
const d25 = E.position(P, '2026-10-23', E.addDays('2026-10-23', 24));
ok(d25.cycle === 7 && d25.deload, 'day 25 is cycle 7, an easy week');
ok(E.position(P, '2026-10-23', E.addDays('2026-10-23', 56)).after, 'day 57 is after the block');

const ex = id => Object.values(P.sessions).flatMap(s => s.exercises).find(e => e.id === id);
const sess = (stage, wi, target, reps, weight, extra = {}) => ({
  date: '2026-10-23', deload: false, stage, wi, target, setsPrescribed: reps.length,
  sets: reps.map(r => ({ reps: r, weight, done: true })), ...extra,
});

let rx = E.prescribe(ex('pullup'), []);
ok(rx.sets === 4 && rx.target === 12 && rx.label === 'Regular', 'pull-ups start 4 × 12');
rx = E.prescribe(ex('pullup'), [sess(0, 0, 12, [12, 12, 12, 12])]);
ok(rx.target === 13, 'all sets hit → +1 rep');
rx = E.prescribe(ex('pullup'), [sess(0, 0, 13, [13, 13, 12, 11])]);
ok(rx.target === 13 && rx.note === 'repeat', 'missed a set → repeat');
rx = E.prescribe(ex('pullup'), [sess(0, 0, 15, [15, 15, 15, 15])]);
ok(rx.label === 'Wide grip' && rx.target === 10, 'at 4 × 15 → wide grip at 10');

rx = E.prescribe(ex('bench'), []);
ok(rx.weight === 165 && rx.target === 8, 'bench starts 165 × 8');
rx = E.prescribe(ex('bench'), [sess(0, 0, 12, [12, 12, 12, 12], 165)]);
ok(rx.weight === 175 && rx.target === 8, 'bench at 4 × 12 → 175, back to 8');
rx = E.prescribe(ex('bench'), [sess(0, 0, 8, [8, 8, 8, 8], 185)]);
ok(rx.weight === 185 && rx.target === 9, 'typed weight (185) becomes the baseline');
rx = E.prescribe(ex('bb_row'), []);
ok(rx.weight === 145, 'row starts at 145 (155 is not loadable)');
rx = E.prescribe(ex('front_squat'), [sess(0, 4, 10, [10, 10, 10, 10], 215)]);
ok(rx.label.startsWith('215, 2s pause') && rx.target === 6, 'front squat at 215 × 10 → paused stage');
rx = E.prescribe(ex('copenhagen'), [sess(0, 0, 20, [20, 20, 20])]);
ok(rx.target === 25 && rx.unit === 'secs', 'Copenhagen +5s a cycle');
rx = E.prescribe(ex('carry'), [sess(0, 0, 30, [30, 30], 55)]);
ok(rx.weight === 60 && rx.target === 30, 'carry 55 → 60 lb');
rx = E.prescribe(ex('carry'), [sess(0, 1, 30, [30, 30], 60)]);
ok(rx.weight === 60 && rx.target === 40, 'carry at 60 → +10 m');
rx = E.prescribe(ex('lateral'), [sess(0, 0, 20, [20, 20], 20)]);
ok(rx.weight === 25 && rx.target === 12, 'laterals 20 → 25 lb');

const below = sess(0, 0, 13, [10, 9, 9, 8]);
rx = E.prescribe(ex('pullup'), [below, { ...below, date: '2026-10-19' }]);
ok(rx.target === 12 && rx.note === 'step back', 'below 12 twice → step back');

rx = E.prescribe(ex('bench'), [sess(0, 0, 9, [9, 9, 9, 9], 165)], { deload: true });
ok(rx.sets === 2 && rx.target === 9 + 1 && rx.note === 'easy week', 'easy week halves sets');
const withDeload = [{ ...sess(0, 0, 10, [10, 10], 165), deload: true }, sess(0, 0, 9, [9, 9, 9, 9], 165)];
rx = E.prescribe(ex('bench'), withDeload);
ok(rx.target === 10 && rx.sets === 4, 'easy-week sessions are ignored for progression');
rx = E.prescribe(ex('front_squat'), [sess(0, 0, 6, [6, 6, 6, 6], 165)], { hold: true });
ok(rx.target === 6 && rx.note === 'hold', 'foot hold freezes leg rep adds');

const fs3 = E.footStatus({ '2026-10-24': { foot: 3 }, '2026-10-25': { foot: 3 } }, '2026-10-25');
ok(fs3.red, '3+ two mornings running → red day');
ok(E.footStatus({ '2026-10-22': { foot: 4 } }, '2026-10-25').hold, 'a 4 this week → hold');
const T = (k, v) => ({ key: k, value: v });
ok(E.heelGate({ a: T('heel_r_straight', 18), b: T('heel_l_straight', 20), c: T('heel_r_bent', 19), d: T('heel_l_bent', 20) }) === true, 'heel gate passes at 90%');
ok(E.heelGate({ a: T('heel_r_straight', 17), b: T('heel_l_straight', 20), c: T('heel_r_bent', 19), d: T('heel_l_bent', 20) }) === false, 'heel gate fails at 85%');
const w5 = E.position(P, '2026-10-23', E.addDays('2026-10-23', 30));
ok(E.jumpsFor(P, w5, null).length === 3 && E.jumpsFor(P, w5, true).length === 5, 'week 5 single-leg jumps only after the gate');
ok(E.jumpsFor(P, pos1, null)[0].sets === 2, 'cycle 1 pogos are 2 sets');

/* ---------- 2. app in a fake browser ---------- */
const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
const { window } = dom;
window.scrollTo = () => {};
window.fetch = () => Promise.reject(new Error('offline in test'));
window.confirm = () => true;
for (const f of ['program.js', 'engine.js', 'app.js']) window.eval(fs.readFileSync(f, 'utf8'));
window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
const q = s => window.document.querySelector(s), qa = s => [...window.document.querySelectorAll(s)];

ok(q('.big').textContent === 'Day 1?', 'first run asks for Day 1');
qa('.btn').find(b => b.textContent === 'TODAY').click();
const anchor = window.APEX.db.meta.anchor.value;
for (let i = 0; i < 4; i++) {
  window.APEX.setView(E.addDays(anchor, i));
  const title = q('.big').textContent, cards = qa('.card.ex').length;
  ok(title === ['PULL', 'PUSH', 'LEGS', 'RECOVERY'][i] && cards > 0, `${title} renders ${cards} exercises`);
  ok(qa('textarea.notes').length === 1, `${title} has a notes box`);
}
window.APEX.setView(E.addDays(anchor, 2));
ok(qa('.jumprow').length === 3, 'Legs opens with 3 jump rows in week 1');
window.APEX.setView(anchor);
ok(qa('details.tests').length === 1, 'cycle 1 shows the tests card');
qa('.check')[0].click();
const logged = Object.values(window.APEX.db.sets)[0];
ok(logged && logged.done === 1 && logged.reps === 5 && logged.ex === 'kb_snatch', 'ticking an empty set logs the target');
ok(Object.keys(JSON.parse(window.localStorage.getItem('apex.v4.outbox'))).length >= 2, 'edits wait in the outbox');

/* ---------- 3. server ---------- */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'apex-'));
const port = 18787 + Math.floor(Math.random() * 500);
const srv = spawn(process.execPath, ['server/server.mjs'], {
  env: { ...process.env, PORT: String(port), APEX_DB: path.join(tmp, 't.db'), NODE_NO_WARNINGS: '1' }, stdio: 'pipe',
});
await new Promise(r => srv.stdout.once('data', r));
try {
  const base = `http://127.0.0.1:${port}`;
  const rec = { id: '2026-10-23|bench|1', date: '2026-10-23', ex: 'bench', set_no: 1, weight: 165, reps: 8, done: 1, updated_at: '2026-10-23T10:00:00Z' };
  let r = await fetch(base + '/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records: [{ kind: 'sets', rec }, { kind: 'days', rec: { date: '2026-10-23', notes: 'felt good', foot: 1, updated_at: '2026-10-23T10:00:00Z' } }] }) });
  let j = await r.json();
  ok(j.applied === 2 && j.state.sets.length === 1 && j.state.days[0].notes === 'felt good', 'server stores a set and a day note');
  r = await fetch(base + '/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records: [{ kind: 'sets', rec: { ...rec, reps: 3, updated_at: '2026-10-22T00:00:00Z' } }] }) });
  j = await r.json();
  ok(j.state.sets[0].reps === 8, 'older edit does not overwrite a newer one');
  ok((await fetch(base + '/')).status === 200 && (await fetch(base + '/icons/icon-192.png')).status === 200, 'server serves the app');
  ok((await fetch(base + '/server/server.mjs')).status === 404 && (await fetch(base + '/apex.db')).status === 404, 'server refuses non-app files');
} finally { srv.kill(); }

window.close();
console.log('\nall green');
process.exit(0);
