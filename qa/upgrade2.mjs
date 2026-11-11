import puppeteer from 'puppeteer-core';

const BASE = process.env.QA_BASE || 'http://localhost:4000';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
});
let fails = 0, checks = 0;
const ok = (name, cond, extra = '') => { checks++; if (!cond) fails++; console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' (' + extra + ')' : ''}`); };
const api = async (method, path, body) => {
  const r = await fetch(BASE + path, { method, headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  return r.json();
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await browser.newPage();
await page.setViewport({ width: 1366, height: 768 });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await api('PATCH', '/api/settings', { skyMode: 'on', theme: 'light' });
await api('POST', '/api/page', { page: 1 });
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await sleep(1800);
const shot = n => page.screenshot({ path: `qa/shots/${n}.png` });
const hscroll = () => page.evaluate(() => [...document.querySelectorAll('#shell *')].filter(el => el.scrollWidth > el.clientWidth + 2 && !['auto', 'scroll'].includes(getComputedStyle(el).overflowX)).map(el => el.className || el.id));

/* --- blended rail + sky --- */
ok('rail background transparent', await page.evaluate(() => getComputedStyle(document.querySelector('.rail')).backgroundColor === 'rgba(0, 0, 0, 0)'));
ok('rail has no border', await page.evaluate(() => getComputedStyle(document.querySelector('.rail')).borderRightWidth === '0px'));
ok('sky gradient visible', await page.evaluate(() => getComputedStyle(document.querySelector('#sky')).display !== 'none'));
await shot('r3-1-today');

/* --- settings controls present --- */
await page.keyboard.press('6');
await sleep(600);
ok('auto theme button enabled', await page.evaluate(() => { const b = document.querySelector('[data-act="set-theme"][data-v="auto"]'); return b && !b.disabled; }));
ok('sky seg + sun slider + cycle seg', await page.evaluate(() => document.querySelectorAll('[data-act="set-sky"]').length === 3 && !!document.querySelector('#set-sunoff') && document.querySelectorAll('[data-act="set-cycle"]').length === 4));
ok('settings no horizontal overflow', (await hscroll()).length === 0, JSON.stringify(await hscroll()));
await shot('r3-2-settings');

/* --- sky mode seg --- */
await page.click('[data-act="set-sky"][data-v="off"]');
await sleep(400);
ok('sky off hides gradient', await page.evaluate(() => getComputedStyle(document.querySelector('#sky')).display === 'none'));
ok('sky off persisted', (await api('GET', '/api/state')).state.settings.skyMode === 'off');
await page.click('[data-act="set-sky"][data-v="on"]');
await sleep(400);
ok('sky on restores gradient', await page.evaluate(() => getComputedStyle(document.querySelector('#sky')).display !== 'none'));

/* --- sun path slider --- */
const sunBefore = await page.evaluate(() => document.querySelector('#sky').style.getPropertyValue('--sun-x'));
await page.evaluate(() => { const el = document.querySelector('#set-sunoff'); el.value = '4'; el.dispatchEvent(new Event('input', { bubbles: true })); });
await sleep(600);
const sunAfter = await page.evaluate(() => document.querySelector('#sky').style.getPropertyValue('--sun-x'));
ok('sun slider shifts sun path', sunBefore !== sunAfter, `${sunBefore} -> ${sunAfter}`);
ok('sun offset persisted', (await api('GET', '/api/state')).state.settings.sunOffset === 4);
ok('slider value label', await page.evaluate(() => document.querySelector('#sunoff-val').textContent === '+4 h'));
await page.evaluate(() => { const el = document.querySelector('#set-sunoff'); el.value = '0'; el.dispatchEvent(new Event('input', { bubbles: true })); });
await sleep(500);

/* --- auto theme --- */
await api('PATCH', '/api/settings', { theme: 'auto' });
await sleep(700);
const expectTheme = await page.evaluate(() => { const h = new Date().getHours(); return h >= 6 && h < 18 ? 'light' : 'dark'; });
ok('auto theme resolves by daylight', await page.evaluate(t => document.documentElement.dataset.theme === t, expectTheme), expectTheme);
ok('auto seg pressed', await page.evaluate(() => document.querySelector('[data-act="set-theme"][data-v="auto"]').getAttribute('aria-pressed') === 'true'));
await api('PATCH', '/api/settings', { theme: 'light' });
await sleep(500);

/* --- saver cycle modes + slower quote --- */
await api('PATCH', '/api/settings', { saverCycle: 'quote' });
await sleep(300);
await page.evaluate(() => startSaver());
await sleep(1000);
ok('cycle=quote shows quote only', await page.evaluate(() => document.querySelector('#sv-quote').classList.contains('show') && !document.querySelector('#standby').classList.contains('show')));
ok('fixed cycle does not rotate', await page.evaluate(() => saverRotate === null));
ok('quote word animation halved', await page.evaluate(() => getComputedStyle(document.querySelector('#q-text .w')).animationDuration === '1.4s'));
ok('quote stagger halved', await page.evaluate(() => document.querySelectorAll('#q-text .w')[1].style.animationDelay === '0.18s'));
await shot('r3-3-quote');
await page.evaluate(() => wake());
await sleep(900);
await api('PATCH', '/api/settings', { saverCycle: 'tasks' });
await sleep(300);
await page.evaluate(() => startSaver());
await sleep(900);
ok('cycle=tasks shows tasks', await page.evaluate(() => document.querySelector('#sv-tasks').classList.contains('show')));
await page.evaluate(() => wake());
await sleep(900);
await api('PATCH', '/api/settings', { saverCycle: 'rotate' });
await sleep(300);
await page.evaluate(() => startSaver());
await sleep(900);
ok('cycle=rotate starts at clock and rotates', await page.evaluate(() => document.querySelector('#standby').classList.contains('show') && saverRotate !== null));
await page.evaluate(() => wake());
await sleep(900);

/* --- diagonal sleep wipe --- */
await page.evaluate(() => startSaver(true));
await sleep(120);
ok('wipe engages on sleep', await page.evaluate(() => document.querySelector('#wipe').classList.contains('on')));
await sleep(480);
await shot('r3-4-wipe');
const midPos = await page.evaluate(() => getComputedStyle(document.querySelector('#wipe')).maskPosition || getComputedStyle(document.querySelector('#wipe')).webkitMaskPosition);
const midClip = await page.evaluate(() => getComputedStyle(document.querySelector('#wipe-blur')).clipPath);
ok('blur layer sweeps diagonally', midClip !== 'none' && !midClip.startsWith('polygon(0% 100%, 0% 100%'), midClip);
await sleep(1100);
ok('wipe completes bottom-left to top-right', await page.evaluate(() => (getComputedStyle(document.querySelector('#wipe')).maskPosition || getComputedStyle(document.querySelector('#wipe')).webkitMaskPosition) === '0% 100%'), midPos);
ok('blur layer fully covers at end', await page.evaluate(() => getComputedStyle(document.querySelector('#wipe-blur')).clipPath === 'polygon(0% 100%, 100% 100%, 100% 0%, 100% 0%, 0% 0%)'));
ok('display marked off after wipe', await page.evaluate(() => displayOff === true));
await page.evaluate(() => wake());
await sleep(300);
ok('wake reverses wipe', await page.evaluate(() => !document.querySelector('#wipe').classList.contains('on') && displayOff === false));
await sleep(1200);
ok('wake restores clear screen', await page.evaluate(() => getComputedStyle(document.querySelector('#wipe-blur')).clipPath === 'polygon(0% 100%, 0% 100%, 0% 100%, 0% 100%, 0% 100%)' && (getComputedStyle(document.querySelector('#wipe')).maskPosition || getComputedStyle(document.querySelector('#wipe')).webkitMaskPosition) === '100% 0%'));

/* --- custom alert from API (remote trigger path) --- */
await api('POST', '/api/alert', { kind: 'custom', title: 'QA custom alert', msg: 'Triggered remotely from the phone' });
await sleep(600);
ok('custom alert fullscreen', await page.evaluate(() => !document.querySelector('#alert-veil').hidden && document.querySelector('#alert-title').textContent === 'QA custom alert'));
await shot('r3-5-alert');
await page.keyboard.press(' ');
await sleep(600);
ok('Space dismisses custom alert', await page.evaluate(() => document.querySelector('#alert-veil').hidden));
const defAlert = await api('POST', '/api/alert', { kind: 'battery' });
ok('alert defaults accepted', defAlert.ok === true);
await sleep(400);
await page.keyboard.press(' ');
await sleep(500);

/* --- remote --- */
const remote = await browser.newPage();
await remote.setViewport({ width: 390, height: 844 });
remote.on('pageerror', e => errors.push('remote: ' + String(e)));
await remote.goto(BASE + '/remote', { waitUntil: 'domcontentloaded' });
await sleep(1500);
await remote.keyboard.press('6');
await sleep(600);
ok('remote: sky/sun/cycle controls', await remote.evaluate(() => document.querySelectorAll('[data-act="set-sky"]').length === 3 && !!document.querySelector('#set-sunoff') && document.querySelectorAll('[data-act="set-cycle"]').length === 4));
ok('remote: auto theme button', await remote.evaluate(() => { const b = document.querySelector('[data-act="set-theme"][data-v="auto"]'); return b && !b.disabled; }));
ok('remote: alert trigger card', await remote.evaluate(() => !!document.querySelector('#alert-kind') && !!document.querySelector('[data-act="send-alert"]')));
await remote.screenshot({ path: 'qa/shots/r3-6-remote-settings.png' });
await remote.select('#alert-kind', 'custom');
await remote.type('#alert-title', 'From the phone');
await remote.type('#alert-msg', 'Remote-triggered fullscreen alert');
await remote.click('[data-act="send-alert"]');
await sleep(700);
ok('remote trigger shows on display', await page.evaluate(() => !document.querySelector('#alert-veil').hidden && document.querySelector('#alert-title').textContent === 'From the phone'));
await page.keyboard.press(' ');
await sleep(500);
ok('remote no horizontal overflow', await remote.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));

/* --- cache + redirect --- */
const jsHead = await fetch(BASE + '/remote.js');
ok('js served no-store', jsHead.headers.get('cache-control') === 'no-store');
const html = await (await fetch(BASE + '/')).text();
ok('html asset version stamp', /app\.js\?v=\d+/.test(html) && /style\.css\?v=\d+/.test(html));
const rhtml = await (await fetch(BASE + '/remote')).text();
ok('remote html version stamp', /remote\.js\?v=\d+/.test(rhtml));
const mob = await browser.newPage();
await mob.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await mob.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await sleep(900);
ok('phone opening / lands on remote', mob.url().includes('/remote'), mob.url());
const desk = await browser.newPage();
await desk.setViewport({ width: 1366, height: 768 });
await desk.goto(BASE + '/?display=1', { waitUntil: 'domcontentloaded' });
await sleep(900);
ok('display escape hatch stays on display', !desk.url().includes('/remote'));

/* --- restore + final overflow --- */
await api('PATCH', '/api/settings', { theme: 'light', skyMode: 'auto', sunOffset: 0, saverCycle: 'rotate' });
await sleep(500);
await page.keyboard.press('1');
await sleep(500);
ok('no overflow after tour', (await hscroll()).length === 0);
console.log('\nCONSOLE/PAGE ERRORS:', errors.length ? errors.join('\n') : 'none');
if (errors.length) fails += errors.length;
console.log(fails ? `\n${fails} FAILURES of ${checks}` : `\nALL PASS (${checks} checks)`);
await browser.close();
process.exit(fails ? 1 : 0);