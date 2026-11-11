import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = new URL('./shots/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--force-device-scale-factor=1', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1366, height: 768 });
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));

const shot = n => page.screenshot({ path: OUT + n + '.png' });
const overflow = () => page.evaluate(() => ({
  x: document.documentElement.scrollWidth > innerWidth,
  y: document.documentElement.scrollHeight > innerHeight,
}));

await page.goto('http://localhost:4000/', { waitUntil: 'domcontentloaded' });
await sleep(700);
await shot('01-today-light');
console.log('p1 overflow', await overflow());

for (const [key, name] of [['2', '02-schedule'], ['3', '03-alarms'], ['4', '04-focus'], ['5', '05-extras'], ['6', '06-settings']]) {
  await page.keyboard.press(key);
  await sleep(450);
  await shot(name);
  console.log(name, 'overflow', await overflow());
}

await page.keyboard.press('t'); await sleep(400);
await page.keyboard.press('1'); await sleep(400);
await shot('07-today-dark');

await page.keyboard.press('n'); await sleep(300);
await page.type('input[name=title]', 'QA smoke task');
await page.keyboard.press('Enter'); await sleep(500);
await shot('08-task-added');
await page.keyboard.press('ArrowDown'); await sleep(250);
await page.keyboard.press('Enter'); await sleep(400);
await shot('09-task-done');
await page.keyboard.press('Delete'); await sleep(400);
await shot('10-undo-toast');
const undo = await page.$('[data-act=undo]');
if (undo) { await undo.click(); await sleep(400); }

await page.keyboard.press('4'); await sleep(300);
await page.keyboard.press(' '); await sleep(1200);
await shot('11-pomo-running');
await page.keyboard.press(' '); await sleep(300);

await page.keyboard.press('s'); await sleep(600);
await shot('12-standby');
await page.keyboard.press('Escape'); await sleep(400);

const now = new Date();
const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
await fetch('http://localhost:4000/api/alarms', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ label: 'QA alarm', time: hm, days: [0, 1, 2, 3, 4, 5, 6] }) });
await sleep(5500);
await shot('13-alarm-firing');
await page.keyboard.press('Enter'); await sleep(300);
const alarms = await (await fetch('http://localhost:4000/api/state')).json();
for (const a of alarms.state.alarms.filter(x => x.label === 'QA alarm')) await fetch('http://localhost:4000/api/alarms/' + a.id, { method: 'DELETE' });

const remote = await browser.newPage();
remote.on('pageerror', e => errors.push('remote pageerror: ' + e.message));
await remote.setViewport({ width: 390, height: 844 });
await remote.goto('http://localhost:4000/remote', { waitUntil: 'domcontentloaded' });
await sleep(600);
await remote.screenshot({ path: OUT + '14-remote-today.png' });
await remote.type('form[data-form=quick] input', 'Added from phone');
await remote.keyboard.press('Enter'); await sleep(500);
await remote.screenshot({ path: OUT + '15-remote-added.png' });
for (const [key, name] of [['2', '16-remote-plan'], ['3', '17-remote-alarms'], ['6', '18-remote-settings']]) {
  await remote.keyboard.press(key); await sleep(400);
  await remote.screenshot({ path: OUT + name + '.png', fullPage: true });
}

console.log('ERRORS:', errors.length ? errors : 'none');
await browser.close();