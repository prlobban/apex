import { JSDOM } from 'jsdom';
import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true });
const { window } = dom;
global.window = window; global.document = window.document;
window.requestAnimationFrame = () => 0; window.cancelAnimationFrame = () => {};
window.scrollTo = () => {};

for (const f of ['program.js', 'timer.js', 'app.js']) window.eval(fs.readFileSync(f, 'utf8'));
window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

const main = () => document.querySelector('#main').textContent.replace(/\s+/g, ' ').trim().slice(0, 70);
for (const v of ['today', 'program', 'timer', 'progress', 'profile']) {
  document.querySelector(`.nav-btn[data-route="${v}"]`).click();
  console.log(v.padEnd(9), '->', main());
}
// drill into a session the real way: click a program-view item
document.querySelector('.nav-btn[data-route="program"]').click();
document.querySelector('#main .card .item').click();
console.log('session  ->', main());
// log a set, confirm it persists
const btn = document.querySelector('#main .item .btn');
btn.click();
console.log('after log ->', btn.textContent.trim());
console.log('OK — no render errors');
