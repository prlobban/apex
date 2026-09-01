/* APEX smoke test — renders every day, logs a set, checks persistence
   and the START DAY FRESH reset. Run: node smoke-test.mjs */
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

// 1. seven day buttons, nothing else in the chrome
const btns = qa('.daybtn');
if (btns.length !== 7) throw new Error(`expected 7 day buttons, got ${btns.length}`);
console.log('nav      ->', btns.map(b => b.textContent).join(' '));

// 2. every day renders with a title and at least one set row
for (const b of btns) {
  b.click();
  const title = q('.dayhead h1').textContent;
  const rows = qa('.setrow').length;
  const exs = qa('.ex').length;
  if (!title || !rows) throw new Error(`day ${b.dataset.day} rendered empty`);
  console.log(String(b.dataset.day).padEnd(4), '->', title.padEnd(9), `${exs} exercises, ${rows} set rows`);
}

// 3. log a weight, confirm it persists across a re-render
q('.daybtn[data-day="mon"]').click();
const box = q('.ex .box');
box.value = '205';
box.dispatchEvent(new window.Event('input', { bubbles: true }));
q('.daybtn[data-day="tue"]').click();
q('.daybtn[data-day="mon"]').click();
if (q('.ex .box').value !== '205') throw new Error('value did not persist');
console.log('persist  -> 205 survived a day switch');

// 4. check toggle persists
const check = q('.check');
check.click();
if (!check.classList.contains('on')) throw new Error('check did not toggle');
q('.daybtn[data-day="wed"]').click();
q('.daybtn[data-day="mon"]').click();
if (!q('.check').classList.contains('on')) throw new Error('check did not persist');
console.log('check    -> toggled and persisted');

// 5. START DAY FRESH wipes the day
window.confirm = () => true;
q('.startbtn').click();
if (q('.ex .box').value !== '') throw new Error('start fresh did not clear the log');
if (q('.check').classList.contains('on')) throw new Error('start fresh did not clear checks');
if (!q('.started').textContent.startsWith('started')) throw new Error('start fresh did not stamp a time');
console.log('reset    ->', q('.started').textContent);

// 6. export produces self-describing JSON covering all seven days
q('.daybtn[data-day="sat"]').click();
const sbox = qa(".ex").find(e => e.querySelector(".exname").textContent.startsWith("Rear-foot")).querySelector(".box");
sbox.value = '55';
sbox.dispatchEvent(new window.Event('input', { bubbles: true }));
const json = JSON.parse(window.APEX.buildExport());
if (json.app !== 'APEX') throw new Error('export missing app name');
const sat = json.days.find(d => d.day === 'Saturday');
if (!sat) throw new Error('export dropped Saturday');
const ex = sat.sections[0].exercises[0];
if (!ex.prescribed || !ex.sets.length) throw new Error('export entry not self-describing');
console.log('export   ->', json.days.length, 'days,', sat.day, '/', ex.name, '/', JSON.stringify(ex.sets[0]));

console.log('OK — no render errors');
