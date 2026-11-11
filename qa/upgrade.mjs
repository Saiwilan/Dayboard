import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const BASE = process.env.QA_BASE || 'http://localhost:4000';
fs.mkdirSync('qa/shots', { recursive: true });
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fails = [];
const ok = (cond, name) => { console.log((cond ? 'PASS' : 'FAIL') + ' ' + name); if (!cond) fails.push(name); };
const api = async (method, path, body) => {
  const r = await fetch(BASE + path, { method, headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  return r.json();
};

const page = await browser.newPage();
await page.setViewport({ width: 1366, height: 768 });
const errors = [];
page.on('pageerror', e => errors.push('display: ' + String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push('display: ' + m.text()); });
const shot = n => page.screenshot({ path: `qa/shots/${n}.png` });
const overflow = () => page.evaluate(() => ({ sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, iw: innerWidth, ih: innerHeight }));
const hscroll = () => page.evaluate(() => {
  const bad = [];
  document.querySelectorAll('#shell *').forEach(el => {
    const ox = getComputedStyle(el).overflowX;
    if (el.scrollWidth > el.clientWidth + 2 && ox !== 'auto' && ox !== 'scroll' && el.clientWidth > 0) bad.push(el.className.toString().slice(0, 30) + ` ${el.scrollWidth}>${el.clientWidth}`);
  });
  return bad;
});

await api('POST', '/api/page', { page: 1 });
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await sleep(2500);

/* 1 — scale, sky, merged tasks */
const m1 = await page.evaluate(() => ({
  fs: getComputedStyle(document.documentElement).fontSize,
  u: getComputedStyle(document.documentElement).getPropertyValue('--u').trim(),
  sky: !!document.querySelector('#sky'),
  skyBg: getComputedStyle(document.querySelector('#sky')).backgroundImage.slice(0, 40),
  railW: document.querySelector('.rail').getBoundingClientRect().width,
  sep: !!document.querySelector('.task-sep'),
  ring: !!document.querySelector('.ringcard'),
  tasks: document.querySelectorAll('.task').length,
}));
ok(m1.fs === '24px', `root font 24px (got ${m1.fs})`);
ok(m1.u === '16px', `--u 16px (got ${m1.u})`);
ok(m1.sky && m1.skyBg.includes('gradient'), 'sky gradient layer present');
ok(Math.abs(m1.railW - 73.6) < 2, `rail unscaled ~73.6px (got ${m1.railW})`);
ok(m1.sep && !m1.ring, 'merged task list, no percentage card');
await shot('up-01-today-light');
let ov = await overflow();
ok(ov.sw <= ov.iw && ov.sh <= ov.ih, `no page overflow (${ov.sw}x${ov.sh})`);
let hs = await hscroll();
ok(hs.length === 0, 'today: no clipped horizontal overflow' + (hs.length ? ' [' + hs.join(', ') + ']' : ''));

/* 2 — Tab select + Enter detail */
await page.keyboard.press('Tab');
await sleep(250);
ok(await page.evaluate(() => !!document.querySelector('.task.sel')), 'Tab selects a task');
await page.keyboard.press('Enter');
await sleep(400);
ok(await page.evaluate(() => !!document.querySelector('.task-detail')), 'Enter opens task detail');
await shot('up-02-task-detail');
await page.keyboard.press('Escape');
await sleep(300);

/* 3 — Space toggles selected task */
const before = await api('GET', '/api/state');
const selId = await page.evaluate(() => selTask);
const tBefore = before.state.tasks.find(t => t.id === selId);
await page.keyboard.press('Space');
await sleep(600);
const after = await api('GET', '/api/state');
const tAfter = after.state.tasks.find(t => t.id === selId);
ok(tBefore && tAfter && tBefore.done !== tAfter.done, 'Space toggles selected task');
await page.keyboard.press('Space');
await sleep(600);

/* 4 — schedule 12h */
await page.keyboard.press('ArrowRight');
await sleep(700);
const sched = await page.evaluate(() => ({
  labels: [...document.querySelectorAll('.tl-hour span')].map(s => s.textContent),
  events: document.querySelectorAll('.tl-event').length,
}));
ok(sched.labels.length > 0 && sched.labels.every(l => /(AM|PM)/.test(l)), `12h timeline labels (${sched.labels.slice(0, 3).join(', ')})`);
await shot('up-03-schedule');
hs = await hscroll();
ok(hs.length === 0, 'schedule: no clipped horizontal overflow' + (hs.length ? ' [' + hs.join(', ') + ']' : ''));

/* 5 — alarms rings-in */
await page.keyboard.press('ArrowRight');
await sleep(700);
const rings = await page.evaluate(() => document.querySelector('#pages').textContent.includes('rings in'));
ok(rings, 'alarm cards show rings-in');
await shot('up-04-alarms');
hs = await hscroll();
ok(hs.length === 0, 'alarms: no clipped horizontal overflow' + (hs.length ? ' [' + hs.join(', ') + ']' : ''));

/* 6 — focus page, then extras: fullscreen calendar + note viewers */
await page.keyboard.press('ArrowRight');
await sleep(700);
await shot('up-04b-focus');
hs = await hscroll();
ok(hs.length === 0, 'focus: no clipped horizontal overflow' + (hs.length ? ' [' + hs.join(', ') + ']' : ''));
const fv = await page.evaluate(() => { const r = document.querySelector('.pomo-ctl').getBoundingClientRect(); return { b: Math.round(r.bottom), ih: innerHeight }; });
ok(fv.b <= fv.ih, `focus controls within viewport (${fv.b}/${fv.ih})`);
await page.keyboard.press('ArrowRight');
await sleep(700);
await shot('up-05-extras');
hs = await hscroll();
ok(hs.length === 0, 'extras: no clipped horizontal overflow' + (hs.length ? ' [' + hs.join(', ') + ']' : ''));
await page.keyboard.press('Tab');
await sleep(200);
ok(await page.evaluate(() => selExtra === 'cal'), 'Tab selects calendar card');
await page.keyboard.press('Enter');
await sleep(500);
ok(await page.evaluate(() => !document.querySelector('#cal-veil').hidden), 'Enter opens fullscreen calendar');
const mo1 = await page.evaluate(() => document.querySelector('#cf-title').textContent);
await page.keyboard.press('ArrowRight');
await sleep(350);
const mo2 = await page.evaluate(() => document.querySelector('#cf-title').textContent);
ok(mo1 !== mo2, `arrow changes month (${mo1} -> ${mo2})`);
await shot('up-06-cal-full');
await page.keyboard.press('Escape');
await sleep(300);
ok(await page.evaluate(() => document.querySelector('#cal-veil').hidden), 'Esc closes calendar');
await page.keyboard.press('Tab');
await sleep(200);
await page.keyboard.press('Enter');
await sleep(500);
ok(await page.evaluate(() => !document.querySelector('#note-veil').hidden), 'Enter opens fullscreen note');
const ni1 = await page.evaluate(() => document.querySelector('#nf-idx').textContent);
await page.keyboard.press('ArrowRight');
await sleep(400);
const ni2 = await page.evaluate(() => document.querySelector('#nf-idx').textContent);
ok(ni1 !== ni2, `arrow switches note (${ni1} -> ${ni2})`);
ok(await page.evaluate(() => !!document.querySelector('#nf-time').textContent), 'note shows time at bottom');
await shot('up-07-note-full');
await page.keyboard.press('Escape');
await sleep(300);

/* 7 — screensaver: light, rotation, quote words, corner clock */
await page.keyboard.press('s');
await sleep(1000);
const sv1 = await page.evaluate(() => ({
  on: document.querySelector('#saver').classList.contains('on'),
  light: document.querySelector('#saver').classList.contains('light'),
  dim: document.body.classList.contains('saver-dim'),
  standby: document.querySelector('#standby').classList.contains('show'),
}));
ok(sv1.on && sv1.light && sv1.dim && sv1.standby, 'saver on: light + shell blur + standby view');
await shot('up-08-saver-standby');
await page.evaluate(() => setSaverView(1));
await sleep(1200);
const sv2 = await page.evaluate(() => ({
  quote: document.querySelector('#sv-quote').classList.contains('show'),
  words: document.querySelectorAll('#q-text .w').length,
  author: document.querySelector('#q-author').textContent.length > 0,
  clock: document.querySelector('#sq-time').textContent.length > 0,
}));
ok(sv2.quote && sv2.words > 3 && sv2.author && sv2.clock, `quote view: ${sv2.words} animated words + author + corner clock`);
await shot('up-09-saver-quote');
await page.evaluate(() => setSaverView(2));
await sleep(1000);
ok(await page.evaluate(() => document.querySelector('#sv-tasks').classList.contains('show') && document.querySelectorAll('#st-list .st-row').length > 0), 'tasks view lists to-dos');
await shot('up-10-saver-tasks');
await page.keyboard.press('ArrowRight');
await sleep(900);
ok(await page.evaluate(() => !document.querySelector('#saver').classList.contains('on') && !document.body.classList.contains('saver-dim')), 'key wakes saver with fade');

/* 8 — fullscreen alarm + Space dismiss */
await page.evaluate(() => showAlarm({ kind: 'alarm', label: 'QA wake up', time: '07:00' }));
await sleep(800);
ok(await page.evaluate(() => !document.querySelector('#alarm-veil').hidden && !!document.querySelector('.alarm-full')), 'alarm fullscreen overlay');
await shot('up-11-alarm');
await page.keyboard.press('Space');
await sleep(700);
ok(await page.evaluate(() => document.querySelector('#alarm-veil').hidden), 'Space dismisses alarm');

/* 9 — 3-minute auto-snooze (fast-forwarded) */
await page.evaluate(() => { showAlarm({ kind: 'alarm', label: 'QA auto snooze', time: '07:00' }); alarmStarted = Date.now() - 181e3; });
await sleep(4800);
const st9 = await api('GET', '/api/state');
const snoozed = st9.state.reminders.find(r => r.label === 'Snooze · QA auto snooze');
ok(!!snoozed, 'auto-snooze creates reminder after 3 min');
ok(await page.evaluate(() => document.querySelector('#alarm-veil').hidden), 'auto-snooze closes alarm');
if (snoozed) await api('DELETE', '/api/reminders/' + snoozed.id);

/* 10 — hardware alert overlay */
await page.evaluate(() => showAlert({ kind: 'ethernet', title: 'Ethernet unplugged', msg: 'QA test alert — link lost' }));
await sleep(800);
ok(await page.evaluate(() => !document.querySelector('#alert-veil').hidden), 'hardware alert fullscreen');
await shot('up-12-alert');
await page.keyboard.press('Space');
await sleep(700);
ok(await page.evaluate(() => document.querySelector('#alert-veil').hidden), 'Space dismisses alert');

/* 11 — dark theme + dark saver */
await page.keyboard.press('t');
await sleep(800);
await page.keyboard.press('1');
await sleep(500);
await shot('up-13-today-dark');
await page.keyboard.press('s');
await sleep(1000);
ok(await page.evaluate(() => document.querySelector('#saver').classList.contains('on') && !document.querySelector('#saver').classList.contains('light')), 'dark saver is dark');
await shot('up-14-saver-dark');
await page.keyboard.press('ArrowRight');
await sleep(800);
await page.keyboard.press('t');
await sleep(800);

/* 12 — settings page has ringtone controls */
await page.keyboard.press('6');
await sleep(700);
const set = await page.evaluate(() => ({
  ring: !!document.querySelector('#set-ring-url'),
  up: !!document.querySelector('#set-ring-upload'),
}));
ok(set.ring && set.up, 'display settings: ringtone URL + upload');
const sov = await page.evaluate(() => { const sc = document.querySelector('.settings-scroll'); return { sw: sc.scrollWidth, cw: sc.clientWidth }; });
ok(sov.sw <= sov.cw, `settings grid no horizontal overflow (${sov.sw}/${sov.cw})`);
hs = await hscroll();
ok(hs.length === 0, 'settings: no clipped horizontal overflow' + (hs.length ? ' [' + hs.join(', ') + ']' : ''));
await shot('up-15-settings');
ov = await overflow();
ok(ov.sw <= ov.iw && ov.sh <= ov.ih, `no overflow after full tour (${ov.sw}x${ov.sh})`);

/* 13 — remote */
const remote = await browser.newPage();
await remote.setViewport({ width: 390, height: 844 });
remote.on('pageerror', e => errors.push('remote: ' + String(e)));
remote.on('console', m => { if (m.type() === 'error') errors.push('remote: ' + m.text()); });
await remote.goto(BASE + '/remote', { waitUntil: 'domcontentloaded' });
await sleep(2200);
await remote.click('[data-act="tab"][data-tab="1"]');
await sleep(500);
await remote.screenshot({ path: 'qa/shots/up-16-remote-today.png' });
await remote.keyboard.press('n');
await sleep(500);
ok(await remote.evaluate(() => !!document.querySelector('#modal-veil textarea[name=description]')), 'remote task modal has description');
await remote.screenshot({ path: 'qa/shots/up-17-remote-task.png' });
await remote.keyboard.press('Escape');
await sleep(200);
await remote.keyboard.press('Escape');
await sleep(300);
await remote.keyboard.press('6');
await sleep(700);
ok(await remote.evaluate(() => !!document.querySelector('#set-ring-url') && !!document.querySelector('#set-ring-upload')), 'remote settings: ringtone controls');
await remote.screenshot({ path: 'qa/shots/up-18-remote-settings.png', fullPage: true });
await remote.evaluate(() => showAlarm({ kind: 'alarm', label: 'QA remote alarm', time: '08:30' }));
await sleep(700);
await remote.screenshot({ path: 'qa/shots/up-19-remote-alarm.png' });
await remote.keyboard.press('Space');
await sleep(700);
ok(await remote.evaluate(() => document.querySelector('#alarm-veil').hidden), 'remote Space dismisses alarm');
const rov = await remote.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
ok(rov.sw <= rov.iw, `remote no horizontal overflow (${rov.sw})`);

/* 14 — ringtone + description API round-trip */
const wav = Buffer.alloc(44 + 1600);
wav.write('RIFF', 0); wav.writeUInt32LE(36 + 1600, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(1600, 40);
for (let i = 0; i < 800; i++) wav.writeInt16LE(Math.round(Math.sin(i / 8) * 8000), 44 + i * 2);
const up = await fetch(BASE + '/api/ringtone?name=qa-test.wav', { method: 'PUT', body: wav });
const upj = await up.json();
ok(upj.ok && upj.url, 'ringtone upload accepted');
const st14 = await api('GET', '/api/state');
ok(st14.state.settings.ringtone === upj.url, 'ringtone saved to settings');
const media = await fetch(BASE + upj.url);
ok(media.ok, 'ringtone served from /media');
await api('PATCH', '/api/settings', { ringtone: '' });
const qaTask = await api('POST', '/api/tasks', { title: 'QA description task', description: 'Hello from QA', tag: 'QA' });
const st14b = await api('GET', '/api/state');
const qt = st14b.state.tasks.find(t => t.title === 'QA description task');
ok(qt && qt.description === 'Hello from QA', 'task description persisted');
if (qt) await api('DELETE', '/api/tasks/' + qt.id);

console.log('\nCONSOLE/PAGE ERRORS:', errors.length ? '\n' + errors.join('\n') : 'none');
console.log(fails.length ? `\n${fails.length} FAILURES` : '\nALL PASS');
await browser.close();
process.exit(fails.length || errors.length ? 1 : 0);