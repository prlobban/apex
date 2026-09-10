/* APEX smoke test — renders every cycle day, logs a set, checks persistence,
   the START DAY FRESH reset, and the cycle anchor. Run: node smoke-test.mjs */
import { JSDOM } from 'jsdom';
import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
const { window } = dom;
global.window = window; global.document = window.document;
window.scrollTo = () => {};

for (const f of ['program.js', 'app.js']) window.eval(fs.readFileSync(f, 'utf8'));
window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

const q = (s) => document.querySelector(s);
const qa = (s) => [...document.querySelectorAll(s)];

// 1. eight cycle-day buttons, nothing else in the chrome
const btns = qa('.daybtn');
if (btns.length !== 8) throw new Error(`expected 8 day buttons, got ${btns.length}`);
console.log('nav      ->', btns.map(b => b.textContent).join(' '));

// 2. every day renders with a title and at least one set row
for (const b of btns) {
  b.click();
  const title = q('.dayhead h1').textContent;
  const rows = qa('.setrow').length;
  const exs = qa('.ex').length;
  if (!title || !rows) throw new Error(`day ${b.dataset.day} rendered empty`);
  console.log(String(b.dataset.day).padEnd(4), '->', title.padEnd(13), `${exs} exercises, ${rows} set rows`);
}

// 3. exactly two rest days, and they land on every 4th
const restIdx = window.PROGRAM.days.map((d, i) => (d.rest ? i : -1)).filter(i => i >= 0);
if (restIdx.join(',') !== '3,7') throw new Error(`rest days at ${restIdx} — expected index 3 and 7`);
console.log('rest     -> day 4 and day 8, every 4th day');

// 4. the cycle anchor maps today onto a day, and resync moves it
const beforeId = window.APEX.todayId();
window.APEX.resyncTo(4);           // pretend today is day 5
if (window.APEX.todayId() !== 'd5') throw new Error('resync did not move the anchor');
window.APEX.resyncTo(window.PROGRAM.days.findIndex(d => d.id === beforeId));
console.log('cycle    -> anchor', window.APEX.getAnchor(), '/ today is', window.APEX.todayId());

// 5. log a weight, confirm it persists across a re-render
q('.daybtn[data-day="d1"]').click();
const box = q('.ex .box');
box.value = '205';
box.dispatchEvent(new window.Event('input', { bubbles: true }));
q('.daybtn[data-day="d2"]').click();
q('.daybtn[data-day="d1"]').click();
if (q('.ex .box').value !== '205') throw new Error('value did not persist');
console.log('persist  -> 205 survived a day switch');

// 6. check toggle persists
const check = q('.check');
check.click();
if (!check.classList.contains('on')) throw new Error('check did not toggle');
q('.daybtn[data-day="d3"]').click();
q('.daybtn[data-day="d1"]').click();
if (!q('.check').classList.contains('on')) throw new Error('check did not persist');
console.log('check    -> toggled and persisted');

// 7. START DAY FRESH wipes the day
window.confirm = () => true;
q('.startbtn').click();
if (q('.ex .box').value !== '') throw new Error('start fresh did not clear the log');
if (q('.check').classList.contains('on')) throw new Error('start fresh did not clear checks');
if (!q('.started').textContent.startsWith('started')) throw new Error('start fresh did not stamp a time');
console.log('reset    ->', q('.started').textContent);

// 8. export produces self-describing JSON covering the whole cycle
q('.daybtn[data-day="d7"]').click();
const sbox = qa('.ex').find(e => e.querySelector('.exname').textContent.startsWith('Rear-foot')).querySelector('.box');
sbox.value = '55';
sbox.dispatchEvent(new window.Event('input', { bubbles: true }));
const json = JSON.parse(window.APEX.buildExport());
if (json.app !== 'APEX') throw new Error('export missing app name');
if (json.cycleLength !== 8 || !json.cycleAnchor) throw new Error('export missing cycle metadata');
const legsB = json.days.find(d => d.title === 'LEGS B');
if (!legsB) throw new Error('export dropped Legs B');
const ex = legsB.sections[0].exercises[0];
if (!ex.prescribed || !ex.sets.length) throw new Error('export entry not self-describing');
console.log('export   ->', json.days.length, 'days,', legsB.day, '/', ex.name, '/', JSON.stringify(ex.sets[0]));

// 9. nothing he vetoed survived as a prescribed movement
//    (the notes may still NAME them — "replaces the dragon flag" — that's the point)
const names = window.PROGRAM.days
  .flatMap(d => d.sections).flatMap(s => s.items)
  .map(i => i.name.toLowerCase());
for (const b of ['dragon flag', 'hollow rock', 'bench reverse crunch',
                 'serratus band punch', 'landmine', 'ankle + foot prep']) {
  if (names.some(n => n.includes(b))) throw new Error(`vetoed movement still prescribed: ${b}`);
}
if (!names.some(n => n.includes('bench stretch crunch'))) throw new Error('bench stretch crunch went missing — he likes that one');

// 10. knee-to-wall survives only on legs + reset days
const kneeDays = window.PROGRAM.days
  .filter(d => d.sections.flatMap(s => s.items).some(i => i.name.startsWith('Knee-to-wall')))
  .map(d => d.id);
if (kneeDays.join(',') !== 'd3,d4,d7,d8') throw new Error(`knee-to-wall on ${kneeDays} — expected d3,d4,d7,d8`);
console.log('warmups  -> no foot block anywhere; knee-to-wall on legs + reset only');
console.log('vetoes   -> dragon flag, bench reverse crunch, hollow rock all gone; stretch crunch kept');

console.log('OK — no render errors');
