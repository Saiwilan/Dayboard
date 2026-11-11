'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const api = async (method, path, body) => {
  const r = await fetch(path, { method, headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || r.statusText); }
  return r.json();
};
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW1 = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dstr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const h12 = h => h % 12 === 0 ? 12 : h % 12;
const fmt12 = hm => { const [h, m] = hm.split(':').map(Number); return `${h12(h)}:${pad(m)}`; };
const ampm = h => h < 12 ? 'AM' : 'PM';

const I = {
  sun: '<circle cx="12" cy="12" r="4.4"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19"/>',
  cal: '<rect x="3.5" y="5" width="17" height="16" rx="3.5"/><path d="M3.5 10h17M8 2.8V6.5M16 2.8V6.5"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.8 2.6H4.2L6 16Z"/><path d="M10 21a2.2 2.2 0 0 0 4 0"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.6 2M9.5 2.5h5M12 2.5V6"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="2.2"/><rect x="13" y="4" width="7" height="7" rx="2.2"/><rect x="4" y="13" width="7" height="7" rx="2.2"/><rect x="13" y="13" width="7" height="7" rx="2.2"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8l1.2 2.5 2.7.6 2-1.9 1.9 1.9-1.9 2 .6 2.7 2.5 1.2-2.5 1.2-.6 2.7 1.9 2-1.9 1.9-2-1.9-2.7.6-1.2 2.5-1.2-2.5-2.7-.6-2 1.9-1.9-1.9 1.9-2-.6-2.7L2.8 12l2.5-1.2.6-2.7-1.9-2 1.9-1.9 2 1.9 2.7-.6L12 2.8Z"/>',
  check: '<path d="M4.5 12.5l5 5L19.5 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.8h5V7M7 7l1 13h8l1-13M10 11v5.5M14 11v5.5"/>',
  chevL: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  chevR: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>',
  vol: '<path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4Z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>',
  volX: '<path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4Z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
  play: '<path d="M8 5.5v13l10-6.5L8 5.5Z"/>',
  pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
  reset: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 8.9"/><path d="M4.5 4.5v4.4h4.4"/>',
  skip: '<path d="M6 5.5v13l8-6.5L6 5.5ZM18 5.5v13"/>',
  pen: '<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1Z"/>',
  monitor: '<rect x="3" y="4.5" width="18" height="12.5" rx="2.5"/><path d="M9 20.5h6M12 17v3.5"/>',
  power: '<path d="M12 3v8"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/>',
  upload: '<path d="M12 16V4.5M7.5 9 12 4.5 16.5 9M4.5 19.5h15"/>',
  pin: '<path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
  grip: '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01"/>',
  flame: '<path d="M12 3s5.5 4.6 5.5 9.4a5.5 5.5 0 0 1-11 0C6.5 9 9 6.5 9 6.5s.4 2.3 2 2.3C11.6 6.6 12 3 12 3Z"/>',
  note: '<path d="M5 4.5h14v11l-4 4H5v-15Z"/><path d="M15 19.5v-4h4"/>',
};
const icon = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
const logo = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="currentColor"/><path d="M9 19a7 7 0 0 1 14 0" fill="none" stroke="var(--lime)" stroke-width="2.6" stroke-linecap="round"/><circle cx="16" cy="12" r="2.4" fill="var(--lime)"/></svg>';
function wIcon(code, day = 1) {
  const sun = '<circle cx="12" cy="12" r="4.2"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/>';
  const cloud = '<path d="M7 18a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18.3 10 4 4 0 0 1 17.5 18H7Z"/>';
  let inner = sun;
  if (code === 0) inner = day ? sun : '<path d="M19 14.5A8 8 0 0 1 9.5 5a8 8 0 1 0 9.5 9.5Z"/>';
  else if (code <= 3) inner = cloud;
  else if (code <= 48) inner = cloud + '<path d="M5 21h14"/>';
  else if (code <= 67) inner = cloud + '<path d="M8.5 20v2.4M12 20v2.4M15.5 20v2.4"/>';
  else if (code <= 77) inner = cloud + '<path d="M8.5 20.5h.01M12 22h.01M15.5 20.5h.01"/>';
  else if (code <= 82) inner = cloud + '<path d="M8.5 20l-1 2.5M12.5 20l-1 2.5M16.5 20l-1 2.5"/>';
  else inner = cloud + '<path d="M12.5 19l-2 3h3l-2 3"/>';
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}
const wLabel = c => c === 0 ? 'Clear sky' : c <= 2 ? 'Partly cloudy' : c === 3 ? 'Overcast' : c <= 48 ? 'Foggy' : c <= 67 ? 'Rainy' : c <= 77 ? 'Snowy' : c <= 82 ? 'Showers' : 'Thunderstorm';

let state = null, weather = null, tab = 1, schedDate = dstr(new Date());
let lastDeleted = null, toastTimer = null, alarmActive = null, alarmTimer = null, alarmStarted = 0, ringAudio = null;
let dragId = null;

function alarmNextAt(a, now = new Date()) {
  for (let i = 0; i < 8; i++) {
    const d = new Date(now); d.setDate(d.getDate() + i);
    if (!a.days.includes(d.getDay())) continue;
    const at = new Date(`${dstr(d)}T${a.time}`);
    if (at > now) return at;
  }
  return null;
}
function untilStr(at) {
  if (!at) return '';
  let m = Math.round((at - Date.now()) / 60000);
  if (m <= 0) return 'now';
  if (m < 60) return `in ${m}m`;
  const h = Math.floor(m / 60); m = m % 60;
  if (h < 24) return `in ${h}h ${m}m`;
  return `in ${Math.floor(h / 24)}d ${h % 24}h`;
}

const TABS = [['sun', 'Today'], ['cal', 'Plan'], ['bell', 'Alarms'], ['timer', 'Focus'], ['grid', 'Extras'], ['gear', 'Settings']];

function applyTheme() {
  const t = effTheme();
  document.documentElement.dataset.theme = t;
  $('meta[name=theme-color]').content = t === 'dark' ? '#0E0F12' : '#F2EFE7';
  $('#r-theme').innerHTML = icon(t === 'dark' ? 'sun' : 'moon');
}
const effTheme = () => {
  if (state.settings.theme !== 'auto') return state.settings.theme;
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? 'light' : 'dark';
};
const fmtOff = v => (v > 0 ? '+' : '') + v + ' h';
async function load() {
  const j = await api('GET', '/api/state');
  state = j.state;
  if (j.page >= 1 && j.page <= 6) tab = j.page;
  $('#r-logo').innerHTML = logo;
  $('#r-wake').innerHTML = icon('monitor');
  $('#r-sleep').innerHTML = icon('power');
  $('#r-display').innerHTML = icon('grid');
  $('#r-fab').innerHTML = icon('plus');
  applyTheme(); renderTabs(); render(); fetchWeather();
}
async function fetchWeather() { try { weather = await api('GET', '/api/weather'); } catch { weather = { offline: true }; } if (tab === 5) render(); }
setInterval(fetchWeather, 15 * 60e3);

const es = new EventSource('/api/events');
es.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.type === 'state') { state = m.state; applyTheme(); render(); if (ringAudio) ringAudio.volume = state.settings.muted ? 0 : vol(); }
  if (m.type === 'page' && m.page !== tab) setTab(m.page, false);
  if (m.type === 'alarm') showAlarm(m);
  if (m.type === 'alert') { chime('alert'); toast(`${m.title} — ${m.msg}`, false, 10000); }
  if (m.type === 'pomo-done') { chime('pomo'); toast(m.phase === 'focus' ? 'Break over — back to focus' : 'Focus complete — take a break'); }
  if (m.type === 'chime') chime(m.kind || 'pomo');
};

let AC = null;
const vol = () => Math.max(0, Math.min(100, Number(state.settings.volume) || 0)) / 100;
function ac() { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); return AC; }
function tone(f, t, dur, gain = 0.15, type = 'sine') {
  gain *= vol(); if (gain <= 0) return;
  const c = ac(), o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.1);
}
function chime(kind) {
  if (state.settings.muted || vol() <= 0) return;
  try {
    const t = ac().currentTime;
    if (kind === 'alarm') [880, 1108.7, 1318.5].forEach((f, i) => tone(f, t + i * 0.22, 1.1, 0.13));
    else if (kind === 'alert') { tone(523.3, t, 0.35, 0.14, 'square'); tone(392, t + 0.3, 0.5, 0.14, 'square'); }
    else { tone(660, t, 0.5, 0.13, 'triangle'); tone(880, t + 0.25, 0.7, 0.13, 'triangle'); }
  } catch { }
}
function startRing() {
  stopRing();
  if (state.settings.muted || vol() <= 0 || !state.settings.ringtone) return;
  try {
    ringAudio = new Audio(state.settings.ringtone);
    ringAudio.loop = true;
    ringAudio.volume = vol();
    ringAudio.play().catch(() => { ringAudio = null; });
  } catch { ringAudio = null; }
}
function stopRing() { if (ringAudio) { ringAudio.pause(); ringAudio = null; } }

function setTab(n, push = true) {
  n = Math.max(1, Math.min(6, Number(n) || 1));
  if (!push) closeModal();
  tab = n; renderTabs(); render();
  if (push) api('POST', '/api/page', { page: n }).catch(() => {});
}
function renderTabs() {
  $('#r-tabs').innerHTML = TABS.map((t, i) => `<button data-act="tab" data-tab="${i + 1}" aria-current="${tab === i + 1 ? 'page' : 'false'}">${icon(t[0])}${t[1]}</button>`).join('');
}
function render() {
  if (!state) return;
  $('#r-pages').innerHTML = [rToday, rSched, rAlarms, rFocus, rExtras, rSettings][tab - 1]();
  $('#r-fab').style.display = [1, 2, 3, 5].includes(tab) ? '' : 'none';
  if (tab === 6) bindSettings();
  tick();
}

const tasksSorted = done => state.tasks.filter(t => t.done === done).sort((a, b) => a.order - b.order);
const taskRow = t => `
  <div class="r-task ${t.done ? 'done' : ''}" draggable="${!t.done}" data-id="${t.id}">
    ${!t.done ? `<span class="grip">${icon('grip')}</span>` : ''}
    <button class="check" data-act="toggle" data-id="${t.id}" style="width:1.5rem;height:1.5rem;border-radius:50%;border:.14rem solid ${t.done ? 'var(--ok)' : 'currentColor'};background:${t.done ? 'var(--ok)' : 'transparent'};color:${t.done ? '#fff' : 'inherit'};display:flex;align-items:center;justify-content:center;flex:none" aria-label="Toggle done">${t.done ? icon('check') : ''}</button>
    <span class="t">${esc(t.title)}${t.tag ? ` <span class="r-muted">· ${esc(t.tag)}</span>` : ''}</span>
    <button class="icon-btn" style="width:2rem;height:2rem;box-shadow:none;background:var(--line);color:var(--ink)" data-act="edit-task" data-id="${t.id}" aria-label="Edit">${icon('pen')}</button>
    <button class="icon-btn" style="width:2rem;height:2rem;box-shadow:none;background:var(--line);color:var(--danger)" data-act="del-task" data-id="${t.id}" aria-label="Delete">${icon('x')}</button>
  </div>`;

function rToday() {
  const now = new Date();
  const todo = tasksSorted(false), done = tasksSorted(true);
  return `
  <div class="r-page on">
    <div class="card c-butter r-card">
      <div class="r-muted">${DOW[now.getDay()]}, ${MON[now.getMonth()]} ${now.getDate()}</div>
      <div class="r-clock"><span id="r-clock"></span><span class="ampm" id="r-ampm"></span></div>
      <div class="r-muted">${done.length} of ${state.tasks.length} done today</div>
    </div>
    <form class="r-row" data-form="quick">
      <input class="input grow" name="title" placeholder="Add a task…" maxlength="200" required>
      <button class="btn">${icon('plus')}</button>
    </form>
    <div class="r-section">To do · ${todo.length}</div>
    <div style="display:flex;flex-direction:column;gap:.5rem" id="r-todo">${todo.map(taskRow).join('') || '<div class="r-muted">All clear.</div>'}</div>
    <div class="r-section">Completed · ${done.length}</div>
    <div style="display:flex;flex-direction:column;gap:.5rem">${done.map(taskRow).join('') || '<div class="r-muted">Nothing yet.</div>'}</div>
  </div>`;
}

function rSched() {
  const d = new Date(schedDate + 'T00:00');
  const evs = state.events.filter(e => e.date === schedDate).sort((a, b) => a.start.localeCompare(b.start));
  return `
  <div class="r-page on">
    <div class="r-title">Plan
      <span class="right r-row">
        <button class="icon-btn" style="width:2.2rem;height:2.2rem;background:var(--card);color:var(--ink)" data-act="d-prev">${icon('chevL')}</button>
        <button class="icon-btn" style="width:2.2rem;height:2.2rem;background:var(--card);color:var(--ink)" data-act="d-next">${icon('chevR')}</button>
      </span>
    </div>
    <input class="input" type="date" id="r-date" value="${schedDate}">
    <div class="r-muted">${DOW[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()} · ${evs.length} activities</div>
    ${evs.map(e => `
      <div class="card c-${e.color} r-card" style="gap:.3rem">
        <div class="r-row"><b style="font-size:1.1rem">${esc(e.title)}</b>
          <span class="right r-row">
            <button class="icon-btn" style="width:2rem;height:2rem" data-act="edit-event" data-id="${e.id}" aria-label="Edit">${icon('pen')}</button>
            <button class="icon-btn" style="width:2rem;height:2rem;color:var(--danger)" data-act="del-event" data-id="${e.id}" aria-label="Delete">${icon('x')}</button>
          </span></div>
        <div class="r-muted" style="color:inherit;opacity:.75">${e.start} – ${e.end}</div>
      </div>`).join('') || '<div class="card r-card r-muted">Nothing planned. Tap + to add an activity.</div>'}
  </div>`;
}

function rAlarms() {
  const al = [...state.alarms].sort((a, b) => a.time.localeCompare(b.time));
  const rems = [...state.reminders].sort((a, b) => a.at.localeCompare(b.at));
  return `
  <div class="r-page on">
    <div class="r-title">Alarms</div>
    ${al.map(a => `
      <div class="card c-lav r-card" style="gap:.5rem;${a.enabled ? '' : 'opacity:.55'}">
        <div class="r-row">
          <b style="font-size:1.7rem;letter-spacing:-.03em">${fmt12(a.time)} <small style="font-size:.9rem">${ampm(Number(a.time.slice(0, 2)))}</small></b>
          <span class="right r-row">
            <button class="switch" role="switch" aria-checked="${a.enabled}" data-act="toggle-alarm" data-id="${a.id}"></button>
            <button class="icon-btn" style="width:2rem;height:2rem" data-act="edit-alarm" data-id="${a.id}" aria-label="Edit">${icon('pen')}</button>
            <button class="icon-btn" style="width:2rem;height:2rem;color:var(--danger)" data-act="del-alarm" data-id="${a.id}" aria-label="Delete">${icon('x')}</button>
          </span>
        </div>
        <div class="r-row"><span style="font-weight:600">${esc(a.label)}</span></div>
        <div class="r-muted" style="color:inherit;opacity:.7">${a.enabled ? 'rings ' + untilStr(alarmNextAt(a)) : 'turned off'}</div>
        <div class="r-row" style="gap:.3rem">${DOW1.map((s, i) => `<span style="width:1.5rem;height:1.5rem;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;background:rgba(255,255,255,${a.days.includes(i) ? '.95' : '.4'})">${s}</span>`).join('')}</div>
      </div>`).join('')}
    <div class="r-title" style="font-size:1.2rem;margin-top:.6rem">Reminders</div>
    ${rems.map(r => `
      <div class="card r-card r-row" style="${r.fired ? 'opacity:.5' : ''}">
        <span class="grow"><b>${esc(r.label)}</b><div class="r-muted">${r.at.slice(0, 10)} · ${fmt12(r.at.slice(11, 16))} ${ampm(Number(r.at.slice(11, 13)))}</div></span>
        <button class="icon-btn" style="width:2rem;height:2rem;background:var(--line);color:var(--ink)" data-act="edit-rem" data-id="${r.id}" aria-label="Edit">${icon('pen')}</button>
        <button class="icon-btn" style="width:2rem;height:2rem;background:var(--line);color:var(--danger)" data-act="del-rem" data-id="${r.id}" aria-label="Delete">${icon('x')}</button>
      </div>`).join('') || '<div class="r-muted">No reminders.</div>'}
  </div>`;
}

function rFocus() {
  const p = state.pomo, s = state.settings.pomo;
  const rem = p.running ? Math.max(0, p.endsAt - Date.now()) : p.remainingMs;
  const C = 2 * Math.PI * 80;
  const todayMin = p.log.filter(l => l.date === dstr(new Date())).reduce((a, b) => a + b.minutes, 0);
  return `
  <div class="r-page on">
    <div class="card c-butter r-card" style="align-items:center">
      <div class="seg">${[['focus', 'Focus'], ['short', 'Short'], ['long', 'Long']].map(([k, l]) => `<button data-act="pomo-phase" data-phase="${k}" aria-pressed="${p.phase === k}">${l}</button>`).join('')}</div>
      <div class="pomo-ring" style="width:13rem;height:13rem">
        <svg viewBox="0 0 200 200"><circle class="bg" cx="100" cy="100" r="80" fill="none" stroke-width="10"/><circle class="fg" id="pomo-fg" cx="100" cy="100" r="80" fill="none" stroke-width="10" stroke-dasharray="${C}" stroke-dashoffset="${C * (rem / (s[p.phase] * 60000))}"/></svg>
        <div class="pomo-time"><div class="t" id="pomo-time" style="font-size:3.2rem"></div><div class="ph">${p.running ? 'running' : 'paused'}</div></div>
      </div>
      <div class="pomo-ctl">
        <button class="icon-btn" data-act="pomo" data-cmd="reset" aria-label="Reset">${icon('reset')}</button>
        <button class="btn" data-act="pomo" data-cmd="${p.running ? 'pause' : 'start'}">${icon(p.running ? 'pause' : 'play')} ${p.running ? 'Pause' : 'Start'}</button>
        <button class="icon-btn" data-act="pomo" data-cmd="skip" aria-label="Skip">${icon('skip')}</button>
      </div>
      <div class="r-muted" style="color:inherit;opacity:.75">${todayMin} min today · ${p.cycles} sessions all-time</div>
    </div>
    <div class="card r-card">
      <b>Durations</b>
      ${[['focus', 'Focus'], ['short', 'Short break'], ['long', 'Long break']].map(([k, l]) => `
        <div class="r-row"><span class="grow" style="font-weight:600">${l}</span>
          <div class="stepper"><button data-act="dur" data-k="${k}" data-d="-5">−</button><span class="v">${s[k]}m</span><button data-act="dur" data-k="${k}" data-d="5">+</button></div>
        </div>`).join('')}
      <div class="r-row"><span class="grow" style="font-weight:600">Auto-continue</span><button class="switch" role="switch" aria-checked="${s.autoNext}" data-act="autonext"></button></div>
    </div>
  </div>`;
}

function rExtras() {
  const now = new Date();
  const y = now.getFullYear(), mo = now.getMonth();
  const first = (new Date(y, mo, 1).getDay() + 6) % 7;
  const days = new Date(y, mo + 1, 0).getDate();
  const evDates = new Set(state.events.map(e => e.date));
  let cal = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => `<span class="dow">${d}</span>`).join('');
  for (let i = 0; i < first + days; i++) {
    const dn = i - first + 1;
    cal += `<span class="cal-day ${dn === now.getDate() ? 'today' : ''}" style="min-height:1.9rem">${dn >= 1 ? dn : ''}${evDates.has(`${y}-${pad(mo + 1)}-${pad(dn)}`) ? '<span class="ev"></span>' : ''}</span>`;
  }
  const map = {}; state.history.forEach(h => { map[h.date] = h.count; });
  const cells = [];
  const start = new Date(); start.setDate(start.getDate() - 139);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    const c = map[dstr(d)] || 0;
    cells.push(`<i class="${c ? 'l' + Math.min(4, c) : ''}" style="width:.8rem;height:.8rem"></i>`);
  }
  return `
  <div class="r-page on">
    <div class="card c-sky r-card">
      <b>Weather ${weather && !weather.offline ? '· ' + esc(weather.label || '') : ''}</b>
      ${weather && !weather.offline ? `<div class="weather-now">${wIcon(weather.current.weather_code, weather.current.is_day)}<div class="temp">${Math.round(weather.current.temperature_2m)}°</div><div class="cond">${wLabel(weather.current.weather_code)}</div></div>` : '<div class="r-muted">Unavailable.</div>'}
    </div>
    <div class="card c-mint r-card">
      <b>${MON[mo]} ${y}</b>
      <div class="cal-grid" style="flex:none">${cal}</div>
    </div>
    <div class="card c-butter r-card">
      <b>Task activity</b>
      <div class="heat r-heat" style="flex:none;grid-auto-flow:column;grid-template-rows:repeat(7,.8rem);grid-auto-columns:.8rem">${cells.join('')}</div>
    </div>
    <div class="r-title" style="font-size:1.2rem">Notes</div>
    ${state.notes.map(n => `
      <div class="card c-${n.color} r-card r-row">
        <span class="grow" style="font-weight:600">${esc(n.text)}</span>
        <button class="icon-btn" style="width:2rem;height:2rem" data-act="edit-note" data-id="${n.id}" aria-label="Edit">${icon('pen')}</button>
        <button class="icon-btn" style="width:2rem;height:2rem;color:var(--danger)" data-act="del-note" data-id="${n.id}" aria-label="Delete">${icon('x')}</button>
      </div>`).join('') || '<div class="r-muted">Notes appear on the display. Tap + to add one.</div>'}
  </div>`;
}

function rSettings() {
  const s = state.settings;
  return `
  <div class="r-page on">
    <div class="r-title">Settings</div>
    <div class="card r-card">
      <b>Appearance</b>
      <div class="seg" style="flex-wrap:wrap"><button data-act="set-theme" data-v="light" aria-pressed="${s.theme === 'light'}">Light</button><button data-act="set-theme" data-v="dark" aria-pressed="${s.theme === 'dark'}">Dark</button><button data-act="set-theme" data-v="auto" aria-pressed="${s.theme === 'auto'}">Auto</button></div>
      <div class="r-muted">Auto = light by day, dark from evening (18:00–06:00).</div>
      <div class="r-row"><span class="grow" style="font-weight:600">Sun gradient</span>
        <div class="seg"><button data-act="set-sky" data-v="auto" aria-pressed="${s.skyMode === 'auto'}">Auto</button><button data-act="set-sky" data-v="on" aria-pressed="${s.skyMode === 'on'}">On</button><button data-act="set-sky" data-v="off" aria-pressed="${s.skyMode === 'off'}">Off</button></div>
      </div>
      <div class="r-muted">Auto = sky colours by day, plain at night. On = always. Off = plain.</div>
      <div class="r-row"><span class="grow" style="font-weight:600">Sun path shift</span><span class="val" id="sunoff-val">${fmtOff(s.sunOffset)}</span></div>
      <input type="range" id="set-sunoff" min="-6" max="6" step="0.5" value="${s.sunOffset}">
      <div class="r-muted">Moves sunrise &amp; sunset on the display's flowing background.</div>
      <div class="field"><label>Name</label><input class="input" id="set-name" value="${esc(s.name)}"></div>
    </div>
    <div class="card r-card">
      <b>Display</b>
      <div class="r-row"><span class="grow" style="font-weight:600">Brightness</span><span class="val" id="brightness-val">${s.brightness}%</span></div>
      <input type="range" id="set-brightness" min="5" max="100" value="${s.brightness}">
      <div class="r-row"><button class="btn sm" data-act="wake">${icon('monitor')} Screen on</button><button class="btn sm ghost" data-act="sleep">Screen off</button><button class="btn sm ghost" data-act="saver">Screensaver</button></div>
      <div class="field"><label>Auto turn-off (min, 0 = never)</label><input class="input" id="set-autooff" type="number" min="0" max="240" value="${s.autoOffMin}"></div>
    </div>
    <div class="card r-card">
      <b>Screensaver</b>
      <div class="seg"><button data-act="set-saver" data-v="standby" aria-pressed="${s.screensaver.mode === 'standby'}">Standby</button><button data-act="set-saver" data-v="video" aria-pressed="${s.screensaver.mode === 'video'}">Video</button><button data-act="set-saver" data-v="off" aria-pressed="${s.screensaver.mode === 'off'}">Black</button></div>
      <div class="field"><label>Standby content</label>
        <div class="seg" style="flex-wrap:wrap"><button data-act="set-cycle" data-v="rotate" aria-pressed="${s.saverCycle === 'rotate'}">Rotate</button><button data-act="set-cycle" data-v="clock" aria-pressed="${s.saverCycle === 'clock'}">Clock</button><button data-act="set-cycle" data-v="quote" aria-pressed="${s.saverCycle === 'quote'}">Quote</button><button data-act="set-cycle" data-v="tasks" aria-pressed="${s.saverCycle === 'tasks'}">Tasks</button></div>
      </div>
      <div class="field"><label>Start after (min idle)</label><input class="input" id="set-idle" type="number" min="1" max="120" value="${s.screensaver.idleMin}"></div>
      <div class="r-row"><span class="grow" style="font-weight:600">Night tint (red clock)</span><button class="switch" id="set-night" role="switch" aria-checked="${s.screensaver.nightRed}"></button></div>
      <div class="field"><label>Custom video</label><input class="input" id="set-video-url" value="${esc(s.screensaver.video)}" placeholder="/media/… or https://…"></div>
      <div class="r-row"><button class="btn sm" id="set-video-upload">${icon('upload')} Upload video</button><input type="file" id="video-file" accept="video/mp4,video/webm,video/quicktime" hidden></div>
    </div>
    <div class="card r-card">
      <b>Sound</b>
      <div class="r-row"><span class="grow" style="font-weight:600">Mute chimes</span><button class="switch" id="set-mute" role="switch" aria-checked="${s.muted}"></button></div>
      <div class="r-row"><span class="grow" style="font-weight:600">Volume</span><span class="val" id="volume-val">${s.volume}%</span></div>
      <input type="range" id="set-volume" min="0" max="100" value="${s.volume}">
      <div class="field"><label>Alarm ringtone</label><input class="input" id="set-ring-url" value="${esc(s.ringtone || '')}" placeholder="/media/… or https://… (blank = built-in chime)"></div>
      <div class="r-row"><button class="btn sm" id="set-ring-upload">${icon('upload')} Upload ringtone</button><button class="btn sm ghost" data-act="test-chime">${icon('bell')} Test</button><input type="file" id="ring-file" accept=".mp3,.wav,.ogg,.m4a,.aac,audio/*" hidden></div>
    </div>
    <div class="card r-card">
      <b>Alerts</b>
      <div class="r-muted">Send a fullscreen alert to the display — the same overlay as the hardware warnings.</div>
      <div class="field"><label>Type</label>
        <select class="input" id="alert-kind">
          <option value="custom">Custom message</option>
          <option value="ethernet">Ethernet unplugged</option>
          <option value="battery">Battery stopped charging</option>
          <option value="temp">High temperature</option>
        </select>
      </div>
      <div class="field"><label>Title (optional)</label><input class="input" id="alert-title" maxlength="80" placeholder="Defaults to the type's title"></div>
      <div class="field"><label>Message (optional)</label><input class="input" id="alert-msg" maxlength="200" placeholder="Shown under the title"></div>
      <div class="r-row"><button class="btn sm" data-act="send-alert">${icon('bell')} Trigger on display</button></div>
    </div>
    <div class="card r-card">
      <b>Weather location</b>
      <div class="r-row"><input class="input grow" id="geo-q" placeholder="Search city…"><button class="btn sm" id="geo-go">Find</button></div>
      <div id="geo-results" style="display:flex;flex-direction:column;gap:.4rem"></div>
      <div class="r-muted">Now: ${esc(s.weather.label || 'detecting…')}</div>
    </div>
    <div class="card r-card r-muted">
      Dayboard · display at <b>/</b> · this remote at <b>/remote</b>.<br>
      Keys on the display: ←/→ pages, 1–6 jump, Tab select, Enter open, Space done / dismiss alarm, N add, [ ] brightness, O screen, M mute, T theme, S screensaver, ? help.
    </div>
  </div>`;
}

function bindSettings() {
  const on = (id, ev, fn) => { const el = $('#' + id); if (el) el.addEventListener(ev, fn); };
  on('set-name', 'change', e => api('PATCH', '/api/settings', { name: e.target.value.slice(0, 40) }));
  on('set-volume', 'input', e => {
    const v = Number(e.target.value);
    $('#volume-val').textContent = v + '%';
    if (ringAudio) ringAudio.volume = state.settings.muted ? 0 : v / 100;
    clearTimeout(bindSettings._vt);
    bindSettings._vt = setTimeout(() => api('PATCH', '/api/settings', { volume: v }), 200);
  });
  on('set-sunoff', 'input', e => {
    const v = Number(e.target.value);
    $('#sunoff-val').textContent = fmtOff(v);
    clearTimeout(bindSettings._st);
    bindSettings._st = setTimeout(() => api('PATCH', '/api/settings', { sunOffset: v }), 200);
  });
  on('set-brightness', 'input', e => {
    $('#brightness-val').textContent = e.target.value + '%';
    clearTimeout(bindSettings._bt);
    bindSettings._bt = setTimeout(() => api('POST', '/api/display', { cmd: 'brightness', value: Number(e.target.value) }), 150);
  });
  on('set-autooff', 'change', e => api('PATCH', '/api/settings', { autoOffMin: Number(e.target.value) }));
  on('set-idle', 'change', e => api('PATCH', '/api/settings', { screensaver: { idleMin: Number(e.target.value) } }));
  on('set-night', 'click', e => api('PATCH', '/api/settings', { screensaver: { nightRed: e.currentTarget.getAttribute('aria-checked') !== 'true' } }));
  on('set-mute', 'click', e => api('POST', '/api/display', { cmd: 'mute', value: e.currentTarget.getAttribute('aria-checked') !== 'true' }));
  on('set-video-url', 'change', e => api('PATCH', '/api/settings', { screensaver: { video: e.target.value.trim() } }));
  on('set-video-upload', 'click', () => $('#video-file').click());
  on('video-file', 'change', async e => {
    const f = e.target.files[0]; if (!f) return;
    toast('Uploading video…');
    try {
      const r = await fetch('/api/video?name=' + encodeURIComponent(f.name), { method: 'PUT', body: f });
      const j = await r.json();
      if (j.ok) toast('Video ready — choose Video style');
    } catch { toast('Upload failed'); }
  });
  on('set-ring-url', 'change', e => api('PATCH', '/api/settings', { ringtone: e.target.value.trim() }));
  on('set-ring-upload', 'click', () => $('#ring-file').click());
  on('ring-file', 'change', async e => {
    const f = e.target.files[0]; if (!f) return;
    toast('Uploading ringtone…');
    try {
      const r = await fetch('/api/ringtone?name=' + encodeURIComponent(f.name), { method: 'PUT', body: f });
      const j = await r.json();
      if (j.ok) toast('Ringtone ready — tap Test to hear it');
      else toast(j.error || 'Upload failed');
    } catch { toast('Upload failed'); }
  });
  on('geo-go', 'click', async () => {
    const q = $('#geo-q').value.trim(); if (!q) return;
    try {
      const j = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=4`)).json();
      $('#geo-results').innerHTML = (j.results || []).map(g => `<button class="btn sm ghost" data-geo="${g.latitude},${g.longitude},${esc(g.name)}">${esc(g.name)}, ${esc(g.country_code)}</button>`).join('') || '<span class="r-muted">No matches.</span>';
      $$('#geo-results [data-geo]').forEach(b => b.addEventListener('click', () => {
        const [lat, lon, label] = b.dataset.geo.split(',');
        api('PATCH', '/api/settings', { weather: { lat: Number(lat), lon: Number(lon), label } });
        weather = null; fetchWeather(); $('#geo-results').innerHTML = '';
      }));
    } catch { toast('Geocoding unavailable'); }
  });
  const date = $('#r-date');
}

function tick() {
  const now = new Date();
  if (state.settings.theme === 'auto' && document.documentElement.dataset.theme !== effTheme()) applyTheme();
  const c = $('#r-clock');
  if (c) { c.textContent = `${h12(now.getHours())}:${pad(now.getMinutes())}`; $('#r-ampm').textContent = ampm(now.getHours()); }
  const pt = $('#pomo-time');
  if (pt) {
    const p = state.pomo;
    const rem = p.running ? Math.max(0, p.endsAt - Date.now()) : p.remainingMs;
    pt.textContent = `${pad(Math.floor(rem / 60000))}:${pad(Math.floor(rem / 1000) % 60)}`;
    const fg = $('#pomo-fg');
    if (fg) fg.style.strokeDashoffset = 2 * Math.PI * 80 * (rem / (state.settings.pomo[p.phase] * 60000));
  }
}
setInterval(tick, 500);

/* ---------- modals ---------- */
function openModal(html) { $('#modal-veil').innerHTML = `<div class="modal sheet">${html}</div>`; $('#modal-veil').hidden = false; const f = $('#modal-veil input, #modal-veil textarea'); if (f) f.focus(); }
function closeModal() { $('#modal-veil').hidden = true; $('#modal-veil').innerHTML = ''; }
$('#modal-veil').addEventListener('pointerdown', e => { if (e.target === e.currentTarget) closeModal(); });

function taskModal(t) {
  openModal(`<h2>${t ? 'Edit task' : 'New task'}<button class="icon-btn x" data-act="close-modal">${icon('x')}</button></h2>
  <form data-form="task" data-id="${t ? t.id : ''}">
    <div class="field"><label>Task</label><input class="input" name="title" required maxlength="200" value="${t ? esc(t.title) : ''}"></div>
    <div class="field" style="margin-top:.8rem"><label>Description</label><textarea class="input" name="description" maxlength="1000" placeholder="Details shown when the task is opened on the display…">${t ? esc(t.description || '') : ''}</textarea></div>
    <div class="field" style="margin-top:.8rem"><label>Tag</label><input class="input" name="tag" maxlength="24" value="${t ? esc(t.tag) : ''}"></div>
    <div class="actions"><button type="button" class="btn ghost" data-act="close-modal">Cancel</button><button class="btn">Save</button></div>
  </form>`);
}
function eventModal(ev) {
  const e = ev || { title: '', date: schedDate, start: '09:00', end: '10:00', color: 'mint' };
  openModal(`<h2>${ev ? 'Edit activity' : 'New activity'}<button class="icon-btn x" data-act="close-modal">${icon('x')}</button></h2>
  <form data-form="event" data-id="${ev ? ev.id : ''}">
    <div class="field"><label>Title</label><input class="input" name="title" required maxlength="200" value="${esc(e.title)}"></div>
    <div class="row" style="margin-top:.8rem">
      <div class="field"><label>Date</label><input class="input" type="date" name="date" required value="${e.date}"></div>
      <div class="field"><label>Start</label><input class="input" type="time" name="start" required value="${e.start}"></div>
      <div class="field"><label>End</label><input class="input" type="time" name="end" required value="${e.end}"></div>
    </div>
    <div class="field" style="margin-top:.8rem"><label>Colour</label><div class="swatches">${['mint', 'pink', 'butter', 'lav', 'sky', 'peach'].map(c => `<button type="button" data-sw="${c}" aria-pressed="${e.color === c}" style="background:var(--${c})"></button>`).join('')}</div><input type="hidden" name="color" value="${e.color}"></div>
    <div class="actions"><button type="button" class="btn ghost" data-act="close-modal">Cancel</button><button class="btn">Save</button></div>
  </form>`);
}
function alarmModal(a) {
  const e = a || { label: '', time: '07:00', days: [0, 1, 2, 3, 4, 5, 6] };
  openModal(`<h2>${a ? 'Edit alarm' : 'New alarm'}<button class="icon-btn x" data-act="close-modal">${icon('x')}</button></h2>
  <form data-form="alarm" data-id="${a ? a.id : ''}">
    <div class="row"><div class="field"><label>Time</label><input class="input" type="time" name="time" required value="${e.time}"></div>
    <div class="field"><label>Label</label><input class="input" name="label" maxlength="80" value="${esc(e.label)}"></div></div>
    <div class="field" style="margin-top:.8rem"><label>Days</label><div class="swatches">${DOW1.map((s, i) => `<button type="button" data-day="${i}" aria-pressed="${e.days.includes(i)}" style="background:var(--lav);color:var(--lav-ink);width:2.2rem;height:2.2rem;font-weight:700">${s}</button>`).join('')}</div></div>
    <div class="actions"><button type="button" class="btn ghost" data-act="close-modal">Cancel</button><button class="btn">Save</button></div>
  </form>`);
}
function remModal(r) {
  const at = r ? new Date(r.at) : new Date(Date.now() + 3600e3);
  openModal(`<h2>${r ? 'Edit reminder' : 'New reminder'}<button class="icon-btn x" data-act="close-modal">${icon('x')}</button></h2>
  <form data-form="reminder" data-id="${r ? r.id : ''}">
    <div class="field"><label>Remind me to…</label><input class="input" name="label" required maxlength="120" value="${r ? esc(r.label) : ''}"></div>
    <div class="row" style="margin-top:.8rem"><div class="field"><label>Date</label><input class="input" type="date" name="date" required value="${dstr(at)}"></div>
    <div class="field"><label>Time</label><input class="input" type="time" name="time" required value="${pad(at.getHours())}:${pad(at.getMinutes())}"></div></div>
    <div class="actions"><button type="button" class="btn ghost" data-act="close-modal">Cancel</button><button class="btn">Save</button></div>
  </form>`);
}
function noteModal(n) {
  openModal(`<h2>${n ? 'Edit note' : 'New note'}<button class="icon-btn x" data-act="close-modal">${icon('x')}</button></h2>
  <form data-form="note" data-id="${n ? n.id : ''}">
    <div class="field"><label>Note</label><textarea class="input" name="text" required maxlength="500">${n ? esc(n.text) : ''}</textarea></div>
    <div class="field" style="margin-top:.8rem"><label>Colour</label><div class="swatches">${['mint', 'pink', 'butter', 'lav', 'sky', 'peach'].map(c => `<button type="button" data-sw="${c}" aria-pressed="${(n ? n.color : 'butter') === c}" style="background:var(--${c})"></button>`).join('')}</div><input type="hidden" name="color" value="${n ? n.color : 'butter'}"></div>
    <div class="actions"><button type="button" class="btn ghost" data-act="close-modal">Cancel</button><button class="btn">Save</button></div>
  </form>`);
}

document.addEventListener('submit', async e => {
  const f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault();
  const fd = new FormData(f); const v = k => fd.get(k);
  const kind = f.dataset.form, id = f.dataset.id;
  let msg = 'Saved';
  try {
    if (kind === 'quick') { await api('POST', '/api/tasks', { title: v('title') }); f.reset(); toast('Task added'); return; }
    if (kind === 'task') { const b = { title: v('title'), tag: v('tag'), description: v('description') }; id ? await api('PATCH', `/api/tasks/${id}`, b) : await api('POST', '/api/tasks', b); }
    if (kind === 'event') { const b = { title: v('title'), date: v('date'), start: v('start'), end: v('end'), color: v('color') }; id ? await api('PATCH', `/api/events/${id}`, b) : await api('POST', '/api/events', b); }
    if (kind === 'alarm') {
      const days = $$('#modal-veil [data-day]').filter(b => b.getAttribute('aria-pressed') === 'true').map(b => Number(b.dataset.day));
      const b = { time: v('time'), label: v('label'), days };
      id ? await api('PATCH', `/api/alarms/${id}`, b) : await api('POST', '/api/alarms', b);
      const enabled = id ? (state.alarms.find(x => x.id === id) || {}).enabled !== false : true;
      if (enabled && days.length) msg = `Alarm set — rings ${untilStr(alarmNextAt({ time: b.time, days }))}`;
    }
    if (kind === 'reminder') { const b = { label: v('label'), at: `${v('date')}T${v('time')}` }; id ? await api('PATCH', `/api/reminders/${id}`, b) : await api('POST', '/api/reminders', b); msg = `Reminder set — rings ${untilStr(new Date(b.at))}`; }
    if (kind === 'note') { const b = { text: v('text'), color: v('color') }; id ? await api('PATCH', `/api/notes/${id}`, b) : await api('POST', '/api/notes', b); }
    closeModal(); toast(msg);
  } catch (err) { toast(err.message); }
});

function toast(msg, undo, ms = 4200) {
  const t = $('#toast');
  t.innerHTML = esc(msg) + (undo ? ' <button data-act="undo">Undo</button>' : '');
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), ms);
}
async function del(kind, id) {
  const item = state[kind].find(x => x.id === id);
  await api('DELETE', `/api/${kind}/${id}`);
  lastDeleted = { kind, item };
  toast('Deleted', true);
}

function showAlarm(a) {
  alarmActive = a; alarmStarted = Date.now();
  $('#alarm-bell').innerHTML = icon('bell');
  $('#alarm-at').textContent = `${a.kind === 'alarm' ? 'Alarm' : 'Reminder'} · ${fmt12(a.time)} ${ampm(Number(a.time.slice(0, 2)))}`;
  $('#alarm-label').textContent = a.label;
  const v = $('#alarm-veil');
  v.classList.remove('bye'); v.hidden = false;
  startRing();
  if (!ringAudio) chime('alarm');
  clearInterval(alarmTimer);
  alarmTimer = setInterval(() => {
    if (Date.now() - alarmStarted > 180e3) return snoozeAlarm(true);
    if (!ringAudio) chime('alarm');
  }, 4000);
}
function dismissAlarm() {
  alarmActive = null; clearInterval(alarmTimer); stopRing();
  const v = $('#alarm-veil');
  v.classList.add('bye');
  setTimeout(() => { v.hidden = true; v.classList.remove('bye'); }, 460);
}
function snoozeAlarm(auto) {
  if (!alarmActive) return;
  const at = new Date(Date.now() + 5 * 60e3);
  api('POST', '/api/reminders', { label: 'Snooze · ' + alarmActive.label, at: `${dstr(at)}T${pad(at.getHours())}:${pad(at.getMinutes())}` });
  dismissAlarm(); toast(auto ? 'No answer — snoozed 5 minutes' : 'Snoozed 5 minutes');
}

document.addEventListener('click', async e => {
  const sw = e.target.closest('[data-sw]');
  if (sw) { sw.closest('.swatches').querySelectorAll('[data-sw]').forEach(b => b.setAttribute('aria-pressed', b === sw)); const hid = sw.closest('.field').querySelector('input[name=color]'); if (hid) hid.value = sw.dataset.sw; return; }
  const dy = e.target.closest('[data-day]');
  if (dy) { dy.setAttribute('aria-pressed', dy.getAttribute('aria-pressed') !== 'true'); return; }
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, id = b.dataset.id;
  try {
    if (act === 'tab') setTab(Number(b.dataset.tab));
    if (act === 'theme') api('PATCH', '/api/settings', { theme: state.settings.theme === 'dark' ? 'light' : 'dark' });
    if (act === 'set-theme') api('PATCH', '/api/settings', { theme: b.dataset.v });
    if (act === 'set-sky') api('PATCH', '/api/settings', { skyMode: b.dataset.v });
    if (act === 'set-saver') api('PATCH', '/api/settings', { screensaver: { mode: b.dataset.v } });
    if (act === 'set-cycle') api('PATCH', '/api/settings', { saverCycle: b.dataset.v });
    if (act === 'send-alert') {
      await api('POST', '/api/alert', { kind: $('#alert-kind').value, title: $('#alert-title').value, msg: $('#alert-msg').value });
      toast('Alert sent to the display');
    }
    if (act === 'close-modal') closeModal();
    if (act === 'add') { if (tab === 1) taskModal(); if (tab === 2) eventModal(); if (tab === 3) alarmModal(); if (tab === 5) noteModal(); }
    if (act === 'toggle') { const t = state.tasks.find(x => x.id === id); await api('PATCH', `/api/tasks/${id}`, { done: !t.done }); }
    if (act === 'edit-task') taskModal(state.tasks.find(x => x.id === id));
    if (act === 'del-task') del('tasks', id);
    if (act === 'undo' && lastDeleted) { await api('POST', `/api/${lastDeleted.kind}`, lastDeleted.item); lastDeleted = null; $('#toast').classList.remove('on'); }
    if (act === 'd-prev') { const d = new Date(schedDate + 'T00:00'); d.setDate(d.getDate() - 1); schedDate = dstr(d); render(); }
    if (act === 'd-next') { const d = new Date(schedDate + 'T00:00'); d.setDate(d.getDate() + 1); schedDate = dstr(d); render(); }
    if (act === 'edit-event') eventModal(state.events.find(x => x.id === id));
    if (act === 'del-event') del('events', id);
    if (act === 'toggle-alarm') { const a = state.alarms.find(x => x.id === id); api('PATCH', `/api/alarms/${id}`, { enabled: !a.enabled }); }
    if (act === 'edit-alarm') alarmModal(state.alarms.find(x => x.id === id));
    if (act === 'del-alarm') del('alarms', id);
    if (act === 'edit-rem') remModal(state.reminders.find(x => x.id === id));
    if (act === 'del-rem') del('reminders', id);
    if (act === 'edit-note') noteModal(state.notes.find(x => x.id === id));
    if (act === 'del-note') del('notes', id);
    if (act === 'pomo') api('POST', '/api/pomo', { action: b.dataset.cmd });
    if (act === 'pomo-phase') api('POST', '/api/pomo', { phase: b.dataset.phase });
    if (act === 'dur') { const k = b.dataset.k; api('PATCH', '/api/settings', { pomo: { [k]: Math.max(5, Math.min(90, state.settings.pomo[k] + Number(b.dataset.d))) } }); }
    if (act === 'autonext') api('PATCH', '/api/settings', { pomo: { autoNext: !state.settings.pomo.autoNext } });
    if (act === 'wake') { api('POST', '/api/wake'); toast('Display waking'); }
    if (act === 'sleep') { api('POST', '/api/sleep'); toast('Display sleeping'); }
    if (act === 'saver') { api('POST', '/api/saver'); toast('Screensaver started on display'); }
    if (act === 'test-chime') {
      if (!state.settings.muted && vol() > 0 && state.settings.ringtone) {
        const a = new Audio(state.settings.ringtone);
        a.volume = vol();
        a.play().catch(() => chime('alarm'));
        setTimeout(() => a.pause(), 4000);
      } else chime('alarm');
    }
    if (act === 'dismiss') dismissAlarm();
    if (act === 'snooze') snoozeAlarm();
  } catch (err) { toast(err.message); }
});

document.addEventListener('change', e => {
  if (e.target.id === 'r-date') { schedDate = e.target.value; render(); }
});

document.addEventListener('dragstart', e => { const t = e.target.closest('.r-task[draggable="true"]'); if (t) { dragId = t.dataset.id; t.classList.add('dragging'); } });
document.addEventListener('dragend', e => { const t = e.target.closest('.r-task'); if (t) t.classList.remove('dragging'); });
document.addEventListener('dragover', e => { if (e.target.closest('#r-todo .r-task')) e.preventDefault(); });
document.addEventListener('drop', async e => {
  const over = e.target.closest('#r-todo .r-task');
  if (!over || !dragId || over.dataset.id === dragId) return;
  e.preventDefault();
  const ids = tasksSorted(false).map(t => t.id);
  const from = ids.indexOf(dragId), to = ids.indexOf(over.dataset.id);
  ids.splice(to, 0, ...ids.splice(from, 1));
  dragId = null;
  await api('POST', '/api/tasks/reorder', { ids });
});

document.addEventListener('keydown', e => {
  if (e.target.matches('input, textarea, select')) { if (e.key === 'Escape') e.target.blur(); return; }
  if (alarmActive) { if (e.key === ' ' || e.key === 'Escape') { e.preventDefault(); dismissAlarm(); } if (e.key.toLowerCase() === 'z') snoozeAlarm(); return; }
  if (!$('#modal-veil').hidden) { if (e.key === 'Escape') closeModal(); return; }
  if (/^[1-6]$/.test(e.key)) { tab = Number(e.key); renderTabs(); render(); }
  else if (e.key === 'ArrowRight') { tab = tab % 6 + 1; renderTabs(); render(); }
  else if (e.key === 'ArrowLeft') { tab = (tab + 4) % 6 + 1; renderTabs(); render(); }
  else if (e.key.toLowerCase() === 'n') { if (tab === 1) taskModal(); if (tab === 2) eventModal(); if (tab === 3) alarmModal(); if (tab === 5) noteModal(); }
  else if (e.key.toLowerCase() === 't') api('PATCH', '/api/settings', { theme: state.settings.theme === 'dark' ? 'light' : 'dark' });
});

load();