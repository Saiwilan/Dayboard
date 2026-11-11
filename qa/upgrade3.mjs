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
await api('PATCH', '/api/settings', { theme: 'light', skyMode: 'on', volume: 80, muted: false, sunOffset: 0 });
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await sleep(1800);
const shot = n => page.screenshot({ path: `qa/shots/${n}.png` });
const hscroll = () => page.evaluate(() => [...document.querySelectorAll('#shell *')].filter(el => el.scrollWidth > el.clientWidth + 2 && !['auto', 'scroll'].includes(getComputedStyle(el).overflowX)).map(el => el.className || el.id));

/* --- white inactive rail icons --- */
ok('inactive rail icons white', await page.evaluate(() => [...document.querySelectorAll('.rail-btn:not([aria-current="page"])')].every(b => getComputedStyle(b).color === 'rgb(255, 255, 255)')));
ok('active rail icon sits on accent pill', await page.evaluate(() => getComputedStyle(document.querySelector('.rail-btn[aria-current="page"]')).backgroundColor === 'rgb(26, 28, 33)'));
await shot('r4-1-today');

/* --- settings: volume slider + sky seg --- */
await page.keyboard.press('6');
await sleep(600);
ok('volume slider present', await page.evaluate(() => { const el = document.querySelector('#set-volume'); return el && el.min === '0' && el.max === '100'; }));
ok('sky mode seg present', await page.evaluate(() => document.querySelectorAll('[data-act="set-sky"]').length === 3));
await shot('r4-2-settings');
await page.evaluate(() => { const el = document.querySelector('#set-volume'); el.value = '35'; el.dispatchEvent(new Event('input', { bubbles: true })); });
await sleep(600);
ok('volume label updates', await page.evaluate(() => document.querySelector('#volume-val').textContent === '35%'));
ok('volume persisted', (await api('GET', '/api/state')).state.settings.volume === 35);
ok('volume scales chime gain', await page.evaluate(() => vol() === 0.35));
await api('PATCH', '/api/settings', { volume: 80 });
await sleep(400);

/* --- sky modes --- */
await page.click('[data-act="set-sky"][data-v="off"]');
await sleep(400);
ok('sky off hides gradient', await page.evaluate(() => getComputedStyle(document.querySelector('#sky')).display === 'none'));
ok('skyMode off persisted', (await api('GET', '/api/state')).state.settings.skyMode === 'off');
await page.click('[data-act="set-sky"][data-v="auto"]');
await sleep(400);
const expectAuto = await page.evaluate(() => { const h = new Date().getHours(); return h >= 6 && h < 18; });
ok('sky auto follows daylight', await page.evaluate(e => (getComputedStyle(document.querySelector('#sky')).display !== 'none') === e, expectAuto), expectAuto ? 'day' : 'night');
await page.click('[data-act="set-sky"][data-v="on"]');
await sleep(400);
ok('sky on always shows gradient', await page.evaluate(() => getComputedStyle(document.querySelector('#sky')).display !== 'none'));

/* --- daytime palette: blues + white horizon --- */
ok('midday top is strong blue', await page.evaluate(() => { const c = SKY[4][2]; return c[2] > 200 && c[2] > c[0] * 2; }));
ok('midday horizon near-white', await page.evaluate(() => { const c = SKY[4][4]; return Math.min(c[0], c[1], c[2]) >= 240; }));
ok('morning sky blue too', await page.evaluate(() => { const c = SKY[3][2]; return c[2] > 200 && c[2] > c[0] * 2; }));

/* --- gradient follows time of day --- */
const sunAt = h => page.evaluate(hr => {
  const RD = globalThis.Date;
  globalThis.Date = class extends RD { getHours() { return hr; } getMinutes() { return 0; } };
  updateSky();
  const v = document.querySelector('#sky').style.getPropertyValue('--sun-x');
  globalThis.Date = RD;
  return v;
}, h);
const s9 = await sunAt(9), s13 = await sunAt(13), s17 = await sunAt(17);
ok('sun moves across the day', s9 === '30.0%' && s13 === '50.0%' && s17 === '78.0%', `${s9} / ${s13} / ${s17}`);
await page.evaluate(() => updateSky());

/* --- solid alarm screen + Space to dismiss --- */
await page.evaluate(() => showAlarm({ kind: 'alarm', time: '09:41', label: 'QA solid alarm' }));
await sleep(600);
ok('alarm veil is solid', await page.evaluate(() => { const cs = getComputedStyle(document.querySelector('#alarm-veil')); return cs.backdropFilter === 'none' && cs.backgroundColor !== 'rgba(0, 0, 0, 0)'; }));
ok('alarm button reads Space to dismiss', await page.evaluate(() => document.querySelector('#alarm-veil [data-act="dismiss"]').textContent.trim() === 'Space to dismiss'));
await shot('r4-3-alarm-solid');
await page.keyboard.press(' ');
await sleep(600);
ok('Space dismisses alarm', await page.evaluate(() => document.querySelector('#alarm-veil').hidden));

/* --- remote: initial page + controls --- */
const remote = await browser.newPage();
await remote.setViewport({ width: 390, height: 844 });
remote.on('pageerror', e => errors.push('remote: ' + String(e)));
await remote.goto(BASE + '/remote', { waitUntil: 'domcontentloaded' });
await sleep(1500);
ok('remote opens on display page', await remote.evaluate(() => tab === 6 && document.querySelector('[data-act="tab"][data-tab="6"]').getAttribute('aria-current') === 'page'));
ok('remote volume slider present', await remote.evaluate(() => !!document.querySelector('#set-volume')));
ok('remote sky seg present', await remote.evaluate(() => document.querySelectorAll('[data-act="set-sky"]').length === 3));
ok('remote alarm button stays Dismiss (touch)', await remote.evaluate(() => document.querySelector('#alarm-veil [data-act="dismiss"]').textContent.trim() === 'Dismiss'));
await remote.screenshot({ path: 'qa/shots/r4-4-remote-settings.png' });

/* --- bidirectional page sync --- */
await remote.click('[data-act="tab"][data-tab="3"]');
await sleep(700);
ok('remote tab switch moves display', await page.evaluate(() => page === 3 && document.querySelector('.rail-btn[aria-current="page"]').dataset.page === '3'));
await page.keyboard.press('5');
await sleep(700);
ok('display key switch moves remote', await remote.evaluate(() => tab === 5 && document.querySelector('[data-act="tab"][data-tab="5"]').getAttribute('aria-current') === 'page'));
ok('server tracks current page', (await api('GET', '/api/state')).page === 5);

/* --- remote volume --- */
await remote.click('[data-act="tab"][data-tab="6"]');
await sleep(500);
await remote.evaluate(() => { const el = document.querySelector('#set-volume'); el.value = '50'; el.dispatchEvent(new Event('input', { bubbles: true })); });
await sleep(600);
ok('remote volume persisted', (await api('GET', '/api/state')).state.settings.volume === 50);
await api('PATCH', '/api/settings', { volume: 80 });
await sleep(400);

/* --- legacy sky migration + clamps --- */
await api('PATCH', '/api/settings', { sky: false });
ok('legacy sky:false migrates to off', (await api('GET', '/api/state')).state.settings.skyMode === 'off');
await api('PATCH', '/api/settings', { sky: true });
ok('legacy sky:true migrates to auto', (await api('GET', '/api/state')).state.settings.skyMode === 'auto');
await api('PATCH', '/api/settings', { skyMode: 'on', volume: 150 });
ok('volume clamps to 100', (await api('GET', '/api/state')).state.settings.volume === 100);
await api('PATCH', '/api/settings', { volume: -3 });
ok('volume clamps to 0', (await api('GET', '/api/state')).state.settings.volume === 0);
await api('PATCH', '/api/settings', { volume: 80 });
await sleep(400);

/* --- alert: solid + auto-dismiss 10s on both clients --- */
await api('POST', '/api/alert', { kind: 'custom', title: 'QA auto-dismiss', msg: 'Gone in ten seconds' });
await sleep(700);
ok('alert veil is solid', await page.evaluate(() => { const cs = getComputedStyle(document.querySelector('#alert-veil')); return !document.querySelector('#alert-veil').hidden && cs.backdropFilter === 'none' && cs.backgroundColor === 'rgb(246, 228, 224)'; }));
ok('alert button reads Space to dismiss', await page.evaluate(() => document.querySelector('#alert-veil [data-act="alert-dismiss"]').textContent.trim() === 'Space to dismiss'));
ok('remote shows alert toast', await remote.evaluate(() => document.querySelector('#toast').classList.contains('on') && document.querySelector('#toast').textContent.includes('QA auto-dismiss')));
await shot('r4-5-alert-solid');
await sleep(10200);
ok('display alert auto-dismissed after 10s', await page.evaluate(() => document.querySelector('#alert-veil').hidden && alertActive === null));
ok('remote alert toast auto-hid after 10s', await remote.evaluate(() => !document.querySelector('#toast').classList.contains('on')));

/* --- night sky: stars, shooting star, aurora --- */
await page.bringToFront();
await api('PATCH', '/api/settings', { theme: 'dark' });
await sleep(900);
ok('night canvas runs in dark theme', await page.evaluate(() => night.on === true && getComputedStyle(document.querySelector('#night')).display === 'block'));
ok('starfield populated', await page.evaluate(() => night.stars.length > 50));
await sleep(400);
ok('stars actually painted', await page.evaluate(() => {
  const cv = document.querySelector('#night'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
  return n > 100;
}));
await page.evaluate(() => { night.nextShoot = 0; });
await sleep(200);
ok('shooting star spawns', await page.evaluate(() => night.shoot !== null));
await page.evaluate(() => { night.aurora = { start: performance.now() - 20000, dur: 60000 }; });
await sleep(400);
ok('aurora curtain active', await page.evaluate(() => night.aurora !== null));
await shot('r4-6-night');
await api('PATCH', '/api/settings', { theme: 'light' });
await sleep(600);
ok('night canvas stops in light theme', await page.evaluate(() => night.on === false && getComputedStyle(document.querySelector('#night')).display === 'none'));

/* --- restore + final overflow --- */
await api('PATCH', '/api/settings', { theme: 'light', skyMode: 'auto', volume: 80, muted: false, sunOffset: 0 });
await sleep(500);
await page.keyboard.press('1');
await sleep(500);
ok('no overflow after tour', (await hscroll()).length === 0);
ok('remote no horizontal overflow', await remote.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
console.log('\nCONSOLE/PAGE ERRORS:', errors.length ? errors.join('\n') : 'none');
if (errors.length) fails += errors.length;
console.log(fails ? `\n${fails} FAILURES of ${checks}` : `\nALL PASS (${checks} checks)`);
await browser.close();
process.exit(fails ? 1 : 0);