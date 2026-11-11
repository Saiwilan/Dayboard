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
const toMin = s => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
const h12 = h => h % 12 === 0 ? 12 : h % 12;
const fmt12 = (hm) => { const [h, m] = hm.split(':').map(Number); return `${h12(h)}:${pad(m)}`; };
const ampm = h => h < 12 ? 'AM' : 'PM';
const fmtRange = (s, e) => ampm(Number(s.slice(0, 2))) === ampm(Number(e.slice(0, 2)))
  ? `${fmt12(s)}–${fmt12(e)} ${ampm(Number(e.slice(0, 2)))}`
  : `${fmt12(s)} ${ampm(Number(s.slice(0, 2)))}–${fmt12(e)} ${ampm(Number(e.slice(0, 2)))}`;
const niceDate = iso => { const d = new Date(iso); return `${MON[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${fmt12(`${pad(d.getHours())}:${pad(d.getMinutes())}`)} ${ampm(d.getHours())}`; };

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
  arrow: '<path d="M7 17L17 7M9 7h8v8"/>',
  chevL: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  chevR: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>',
  vol: '<path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4Z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>',
  volX: '<path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4Z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.6 2.6 0 0 1 5.1.7c0 1.7-2.5 2.2-2.5 3.7M12 17h.01"/>',
  play: '<path d="M8 5.5v13l10-6.5L8 5.5Z"/>',
  pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
  reset: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 8.9"/><path d="M4.5 4.5v4.4h4.4"/>',
  skip: '<path d="M6 5.5v13l8-6.5L6 5.5ZM18 5.5v13"/>',
  flame: '<path d="M12 3s5.5 4.6 5.5 9.4a5.5 5.5 0 0 1-11 0C6.5 9 9 6.5 9 6.5s.4 2.3 2 2.3C11.6 6.6 12 3 12 3Z"/>',
  pen: '<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1Z"/>',
  pin: '<path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
  upload: '<path d="M12 16V4.5M7.5 9 12 4.5 16.5 9M4.5 19.5h15"/>',
  monitor: '<rect x="3" y="4.5" width="18" height="12.5" rx="2.5"/><path d="M9 20.5h6M12 17v3.5"/>',
  note: '<path d="M5 4.5h14v11l-4 4H5v-15Z"/><path d="M15 19.5v-4h4"/>',
  eth: '<rect x="3" y="9" width="18" height="9" rx="2"/><path d="M7 9V6.5M12 9V6.5M17 9V6.5M7 18v2M17 18v2M9.5 13.5h5"/>',
  battery: '<rect x="2.5" y="8" width="17" height="9" rx="2.5"/><path d="M22 11v3M6.5 11.5v2M10.5 11.5v2"/>',
  temp: '<path d="M10 4a2 2 0 0 1 4 0v9.3a4.5 4.5 0 1 1-4 0V4Z"/><path d="M12 9v6"/><circle cx="12" cy="17" r="1.6"/>',
};
const icon = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
const logo = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="currentColor"/><path d="M9 19a7 7 0 0 1 14 0" fill="none" stroke="var(--lime)" stroke-width="2.6" stroke-linecap="round"/><circle cx="16" cy="12" r="2.4" fill="var(--lime)"/></svg>';

function wIcon(code, day = 1) {
  const sun = '<circle cx="12" cy="12" r="4.2"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/>';
  const cloud = '<path d="M7 18a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18.3 10 4 4 0 0 1 17.5 18H7Z"/>';
  let inner = sun;
  if (code === 0) inner = day ? sun : '<path d="M19 14.5A8 8 0 0 1 9.5 5a8 8 0 1 0 9.5 9.5Z"/>';
  else if (code <= 2) inner = cloud;
  else if (code === 3) inner = cloud;
  else if (code <= 48) inner = cloud + '<path d="M5 21h14M7 23.5h10"/>';
  else if (code <= 67) inner = cloud + '<path d="M8.5 20v2.4M12 20v2.4M15.5 20v2.4"/>';
  else if (code <= 77) inner = cloud + '<path d="M8.5 20.5h.01M12 22h.01M15.5 20.5h.01"/>';
  else if (code <= 82) inner = cloud + '<path d="M8.5 20l-1 2.5M12.5 20l-1 2.5M16.5 20l-1 2.5"/>';
  else inner = cloud + '<path d="M12.5 19l-2 3h3l-2 3"/>';
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}
const wLabel = c => c === 0 ? 'Clear sky' : c <= 2 ? 'Partly cloudy' : c === 3 ? 'Overcast' : c <= 48 ? 'Foggy' : c <= 67 ? 'Rainy' : c <= 77 ? 'Snowy' : c <= 82 ? 'Showers' : 'Thunderstorm';

const QUOTES = [
  ['The secret of getting ahead is getting started.', 'Mark Twain'],
  ['It always seems impossible until it is done.', 'Nelson Mandela'],
  ['Simplicity is the ultimate sophistication.', 'Leonardo da Vinci'],
  ['Well begun is half done.', 'Aristotle'],
  ['The best way to predict the future is to invent it.', 'Alan Kay'],
  ['Do what you can, with what you have, where you are.', 'Theodore Roosevelt'],
  ['Small deeds done are better than great deeds planned.', 'Peter Marshall'],
  ['Focus on being productive instead of busy.', 'Tim Ferriss'],
  ['A year from now you may wish you had started today.', 'Karen Lamb'],
  ['Quality is not an act, it is a habit.', 'Aristotle'],
  ['Nature does not hurry, yet everything is accomplished.', 'Lao Tzu'],
  ['You do not rise to the level of your goals. You fall to the level of your systems.', 'James Clear'],
];

let state = null, weather = null;
let page = 1, selTask = null, selEvent = null, selExtra = null, calOff = 0, dayOff = 0;
let saverOn = false, saverMode = 'standby', saverView = 0, saverRotate = null, quoteIdx = -1, lastCycle = 'rotate';
let displayOff = false, lastAct = Date.now(), saverAt = 0;
let alarmActive = null, alarmTimer = null, alarmStarted = 0, ringAudio = null;
let alertActive = null, alertTimer = null;
let noteOpen = false, noteIdx = 0, calOpen = false;
let lastDeleted = null, toastTimer = null;
let settingsBuilt = false;

function fit() {
  const s = Math.min(innerWidth / 1366, innerHeight / 768);
  document.documentElement.style.fontSize = (24 * s) + 'px';
  document.documentElement.style.setProperty('--u', (16 * s) + 'px');
}
addEventListener('resize', fit); fit();

function applyTheme() {
  const t = effTheme();
  document.documentElement.dataset.theme = t;
  $('meta[name=theme-color]').content = t === 'dark' ? '#0E0F12' : '#F2EFE7';
  if (saverOn && saverMode !== 'off') $('#saver').classList.toggle('light', t === 'light');
  updateSky();
}
const effTheme = () => {
  if (state.settings.theme !== 'auto') return state.settings.theme;
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? 'light' : 'dark';
};
const fmtOff = v => (v > 0 ? '+' : '') + v + ' h';

/* ---------- sky gradient (sun path) ---------- */
const SKY = [
  [0, 200, [30, 27, 75, .5], [15, 23, 42, .45], [2, 6, 23, .5], [99, 102, 241, .28], 50, 8],
  [5, 90, [67, 56, 202, .4], [124, 58, 237, .25], [30, 27, 75, .45], [251, 146, 60, .3], 12, 30],
  [6.5, 90, [251, 146, 60, .42], [252, 211, 77, .3], [191, 219, 254, .35], [251, 146, 60, .5], 8, 42],
  [9, 160, [59, 130, 246, .45], [147, 197, 253, .38], [240, 249, 255, .5], [255, 244, 214, .4], 30, 12],
  [13, 180, [37, 99, 235, .5], [96, 165, 250, .4], [248, 250, 252, .55], [255, 251, 235, .45], 50, 6],
  [17, 230, [96, 165, 250, .42], [186, 230, 253, .35], [254, 243, 199, .4], [251, 146, 60, .42], 78, 26],
  [18.75, 270, [249, 115, 22, .45], [251, 146, 60, .32], [124, 58, 237, .25], [249, 115, 22, .5], 92, 45],
  [20.5, 250, [124, 58, 237, .3], [67, 56, 202, .35], [30, 27, 75, .5], [249, 115, 22, .25], 96, 70],
  [24, 200, [30, 27, 75, .5], [15, 23, 42, .45], [2, 6, 23, .5], [99, 102, 241, .28], 50, 8],
];
const lerp = (a, b, t) => a + (b - a) * t;
const rgba = (c, f) => `rgba(${c[0]},${c[1]},${c[2]},${(c[3] * f).toFixed(3)})`;
function skyActive() {
  const m = state.settings.skyMode || 'auto';
  if (m === 'on') return true;
  if (m === 'off') return false;
  const h = new Date().getHours();
  return h >= 6 && h < 18;
}
function updateSky() {
  const el = $('#sky');
  syncNight();
  if (!skyActive()) { el.style.display = 'none'; return; }
  el.style.display = '';
  const now = new Date();
  const t = (now.getHours() + now.getMinutes() / 60 - (Number(state.settings.sunOffset) || 0) + 24) % 24;
  let i = 0;
  while (i < SKY.length - 2 && SKY[i + 1][0] <= t) i++;
  const a = SKY[i], b = SKY[i + 1];
  const f = Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0] || 1)));
  const dark = effTheme() === 'dark' ? 0.55 : 1;
  el.style.setProperty('--sky-deg', lerp(a[1], b[1], f).toFixed(1) + 'deg');
  el.style.setProperty('--sky-a', rgba([lerp(a[2][0], b[2][0], f), lerp(a[2][1], b[2][1], f), lerp(a[2][2], b[2][2], f), lerp(a[2][3], b[2][3], f)], dark));
  el.style.setProperty('--sky-b', rgba([lerp(a[3][0], b[3][0], f), lerp(a[3][1], b[3][1], f), lerp(a[3][2], b[3][2], f), lerp(a[3][3], b[3][3], f)], dark));
  el.style.setProperty('--sky-c', rgba([lerp(a[4][0], b[4][0], f), lerp(a[4][1], b[4][1], f), lerp(a[4][2], b[4][2], f), lerp(a[4][3], b[4][3], f)], dark));
  el.style.setProperty('--sun-glow', rgba([lerp(a[5][0], b[5][0], f), lerp(a[5][1], b[5][1], f), lerp(a[5][2], b[5][2], f), lerp(a[5][3], b[5][3], f)], dark));
  el.style.setProperty('--sun-x', lerp(a[6], b[6], f).toFixed(1) + '%');
  el.style.setProperty('--sun-y', lerp(a[7], b[7], f).toFixed(1) + '%');
}

/* ---------- night sky (stars, shooting stars, aurora) ---------- */
const night = { on: false, w: 0, h: 0, cx: null, stars: [], shoot: null, nextShoot: 0, aurora: null, nextAurora: 0, raf: 0 };
function syncNight() {
  const want = effTheme() === 'dark';
  const cv = $('#night');
  if (want && !night.on) {
    night.on = true; cv.style.display = 'block';
    sizeNight();
    const t = performance.now();
    night.nextShoot = t + 6000 + Math.random() * 18000;
    night.nextAurora = t + 15000 + Math.random() * 45000;
    night.raf = requestAnimationFrame(nightFrame);
  } else if (!want && night.on) {
    night.on = false; cv.style.display = 'none';
    cancelAnimationFrame(night.raf);
    night.shoot = null; night.aurora = null;
  }
}
function sizeNight() {
  const cv = $('#night'), dpr = Math.min(1.5, devicePixelRatio || 1);
  night.w = innerWidth; night.h = innerHeight;
  cv.width = Math.round(night.w * dpr); cv.height = Math.round(night.h * dpr);
  night.cx = cv.getContext('2d'); night.cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const n = Math.round(night.w * night.h / 9000);
  night.stars = Array.from({ length: n }, () => ({
    x: Math.random() * night.w, y: Math.random() * night.h,
    r: 0.4 + Math.random() * 1.1, p: Math.random() * Math.PI * 2, s: 0.4 + Math.random() * 1.2,
  }));
}
addEventListener('resize', () => { if (night.on) sizeNight(); });
function nightFrame(t) {
  if (!night.on) return;
  const cx = night.cx, w = night.w, h = night.h;
  cx.clearRect(0, 0, w, h);
  for (const st of night.stars) {
    const a = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(t / 1000 * st.s + st.p));
    cx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
    cx.beginPath(); cx.arc(st.x, st.y, st.r, 0, 6.2832); cx.fill();
  }
  if (!night.shoot && t > night.nextShoot) {
    night.shoot = { x: w * (0.1 + Math.random() * 0.7), y: h * Math.random() * 0.35, vx: 5 + Math.random() * 5, vy: 2.2 + Math.random() * 2, life: 0, max: 55 + Math.random() * 30 };
  }
  if (night.shoot) {
    const s = night.shoot;
    s.x += s.vx; s.y += s.vy; s.life++;
    const fade = Math.sin(Math.PI * Math.min(1, s.life / s.max));
    const tx = s.x - s.vx * 9, ty = s.y - s.vy * 9;
    const g = cx.createLinearGradient(s.x, s.y, tx, ty);
    g.addColorStop(0, `rgba(255,255,255,${(0.9 * fade).toFixed(3)})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    cx.strokeStyle = g; cx.lineWidth = 1.6; cx.lineCap = 'round';
    cx.beginPath(); cx.moveTo(s.x, s.y); cx.lineTo(tx, ty); cx.stroke();
    if (s.life >= s.max || s.x > w + 60 || s.y > h + 60) { night.shoot = null; night.nextShoot = t + 15000 + Math.random() * 30000; }
  }
  if (!night.aurora && t > night.nextAurora) night.aurora = { start: t, dur: 45000 + Math.random() * 30000 };
  if (night.aurora) {
    const au = night.aurora, pr = (t - au.start) / au.dur;
    if (pr >= 1) { night.aurora = null; night.nextAurora = t + 120000 + Math.random() * 180000; }
    else {
      const env = Math.sin(Math.PI * pr) * 0.14;
      cx.globalCompositeOperation = 'lighter';
      for (let b = 0; b < 3; b++) {
        const baseY = h * (0.14 + b * 0.075), amp = h * 0.05, bandH = h * (0.2 + b * 0.04);
        const top = x => baseY + Math.sin(x * 0.004 + t * 0.0003 + b * 2.1) * amp + Math.sin(x * 0.0013 - t * 0.00017 + b) * amp * 0.6;
        const g = cx.createLinearGradient(0, baseY - amp, 0, baseY + bandH);
        const hue = b === 1 ? '45,212,191' : b === 2 ? '167,139,250' : '74,222,128';
        g.addColorStop(0, `rgba(${hue},0)`);
        g.addColorStop(0.35, `rgba(${hue},${env.toFixed(3)})`);
        g.addColorStop(1, `rgba(${hue},0)`);
        cx.fillStyle = g;
        cx.beginPath(); cx.moveTo(0, top(0));
        for (let x = 24; x <= w; x += 24) cx.lineTo(x, top(x));
        for (let x = w; x >= 0; x -= 24) cx.lineTo(x, top(x) + bandH);
        cx.closePath(); cx.fill();
      }
      cx.globalCompositeOperation = 'source-over';
    }
  }
  night.raf = requestAnimationFrame(nightFrame);
}

/* ---------- sound ---------- */
let AC = null;
const vol = () => Math.max(0, Math.min(100, Number(state.settings.volume) || 0)) / 100;
function ac() { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); return AC; }
function tone(f, t, dur, gain = 0.16, type = 'sine') {
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
    if (kind === 'alarm') { [880, 1108.7, 1318.5].forEach((f, i) => { tone(f, t + i * 0.22, 1.1, 0.14); tone(f * 2, t + i * 0.22, 0.5, 0.04); }); }
    else if (kind === 'pomo') { tone(660, t, 0.5, 0.14, 'triangle'); tone(880, t + 0.25, 0.7, 0.14, 'triangle'); }
    else if (kind === 'alert') { tone(660, t, 0.3, 0.12, 'triangle'); tone(520, t + 0.32, 0.45, 0.12, 'triangle'); }
    else { tone(1200, t, 0.12, 0.05, 'triangle'); }
  } catch { }
}
function stopRing() { if (ringAudio) { ringAudio.pause(); ringAudio = null; } }
function startRing() {
  stopRing();
  if (state.settings.muted || vol() <= 0) return;
  if (state.settings.ringtone) {
    ringAudio = new Audio(state.settings.ringtone);
    ringAudio.loop = true;
    ringAudio.volume = vol();
    ringAudio.play().catch(() => { ringAudio = null; chime('alarm'); });
  } else chime('alarm');
}

/* ---------- data ---------- */
async function load() {
  const j = await api('GET', '/api/state');
  state = j.state;
  if (j.page >= 1 && j.page <= 6) page = j.page;
  applyTheme(); renderRail(); render();
  fetchWeather();
}
async function fetchWeather() {
  try { weather = await api('GET', '/api/weather'); } catch { weather = { offline: true }; }
  if (page === 5) render();
  updateStandby();
}
setInterval(fetchWeather, 15 * 60e3);

const es = new EventSource('/api/events');
es.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.type === 'state') {
    state = m.state; applyTheme(); renderRail(); render();
    if (ringAudio) ringAudio.volume = state.settings.muted ? 0 : vol();
    if (saverOn && saverMode === 'standby' && state.settings.saverCycle !== lastCycle) { lastCycle = state.settings.saverCycle; applyCycle(); }
  }
  if (m.type === 'page' && m.page !== page) setPage(m.page, false);
  if (m.type === 'alarm') showAlarm(m);
  if (m.type === 'alert') showAlert(m);
  if (m.type === 'pomo-done') { chime('pomo'); toast(m.phase === 'focus' ? 'Break over — back to focus' : 'Focus complete — take a break'); }
  if (m.type === 'wake') wake();
  if (m.type === 'sleep') { startSaver(true); }
  if (m.type === 'saver') startSaver();
  if (m.type === 'chime') chime(m.kind || 'pomo');
};

/* ---------- rail ---------- */
const PAGES = [
  ['sun', 'Today'], ['cal', 'Schedule'], ['bell', 'Alarms'], ['timer', 'Focus'], ['grid', 'Extras'], ['gear', 'Settings'],
];
function setPage(n, push = true) {
  n = Math.max(1, Math.min(6, Number(n) || 1));
  if (!push) { closeModal(); closeNote(); closeCal(); }
  page = n; renderRail(); render();
  if (push) api('POST', '/api/page', { page: n }).catch(() => {});
}
function renderRail() {
  $('#rail').innerHTML = `
    <div class="rail-logo">${logo}</div>
    ${PAGES.map((p, i) => `<button class="rail-btn" data-act="nav" data-page="${i + 1}" aria-current="${page === i + 1 ? 'page' : 'false'}" title="${p[1]} (${i + 1})" aria-label="${p[1]}">${icon(p[0])}<span class="num">${i + 1}</span></button>`).join('')}
    <div class="rail-spacer"></div>
    <button class="icon-btn" data-act="theme" title="Theme (T)" aria-label="Toggle theme">${icon(effTheme() === 'dark' ? 'sun' : 'moon')}</button>
    <button class="icon-btn" data-act="mute" title="Mute (M)" aria-label="Toggle sound">${icon(state.settings.muted ? 'volX' : 'vol')}</button>
    <button class="icon-btn" data-act="help" title="Keys (?)" aria-label="Keyboard help">${icon('help')}</button>`;
}

/* ---------- shared bits ---------- */
const tasksSorted = done => state.tasks.filter(t => t.done === done).sort((a, b) => a.order - b.order);
const tasksAll = () => [...tasksSorted(false), ...tasksSorted(true)];
function nextEvent() {
  const now = new Date(); const t = dstr(now); const hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const todayEv = state.events.filter(e => e.date === t && e.end >= hm).sort((a, b) => a.start.localeCompare(b.start));
  if (todayEv[0]) return { e: todayEv[0], when: 'Today' };
  const fut = state.events.filter(e => e.date > t).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  if (fut[0]) return { e: fut[0], when: fut[0].date === dstr(new Date(now.getTime() + 864e5)) ? 'Tomorrow' : DOW[new Date(fut[0].date + 'T00:00').getDay()] };
  return null;
}
function alarmNextAt(a, now = new Date()) {
  for (let i = 0; i < 8; i++) {
    const d = new Date(now); d.setDate(d.getDate() + i);
    if (!a.days.includes(d.getDay())) continue;
    const at = new Date(`${dstr(d)}T${a.time}`);
    if (at > now) return at;
  }
  return null;
}
function nextAlarm() {
  let best = null;
  for (const a of state.alarms.filter(x => x.enabled)) {
    const at = alarmNextAt(a);
    if (at && (!best || at < best.at)) best = { a, at };
  }
  return best;
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
function greetWord(h) { return h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 22 ? 'Good evening' : 'Good night'; }
const dayEvents = () => {
  const d = new Date(); d.setDate(d.getDate() + dayOff);
  return state.events.filter(e => e.date === dstr(d)).sort((a, b) => a.start.localeCompare(b.start));
};

/* ---------- pages ---------- */
function render() {
  if (!state) return;
  const scrolls = {};
  $$('.tasklist').forEach(el => { scrolls[el.dataset.col] = el.scrollTop; });
  const el = $('#pages');
  el.innerHTML = [pageToday, pageSched, pageAlarms, pageFocus, pageExtras, pageSettings][page - 1]();
  if (page !== render.lastPage) { el.firstElementChild.classList.add('anim'); render.lastPage = page; }
  $$('.tasklist').forEach(el => { el.scrollTop = scrolls[el.dataset.col] || 0; });
  const selEl = $('.task.sel, .daylist .row.sel, .note.sel, .xcard.sel');
  if (selEl) selEl.scrollIntoView({ block: 'nearest' });
  if (page === 6) { settingsBuilt = true; syncSettings(); bindSettings(); }
  if (saverOn && saverView === 2) renderSaverTasks();
  tick(true);
}

function pageToday() {
  const now = new Date();
  const todo = tasksSorted(false), done = tasksSorted(true);
  const ne = nextEvent(), na = nextAlarm();
  const taskRow = t => `
    <div class="task ${t.done ? 'done' : ''} ${selTask === t.id ? 'sel' : ''}" data-act="sel" data-id="${t.id}" tabindex="0">
      <button class="check" data-act="toggle" data-id="${t.id}" aria-label="${t.done ? 'Mark not done' : 'Mark done'}">${icon('check')}</button>
      <span class="t">${esc(t.title)}</span>
      ${t.tag ? `<span class="tag">${esc(t.tag)}</span>` : ''}
      <button class="del" data-act="del-task" data-id="${t.id}" aria-label="Delete task">${icon('x')}</button>
    </div>`;
  return `
  <section class="page on">
    <div class="today-grid">
      <div class="today-left">
        <div>
          <div class="greet"><span class="serif">${greetWord(now.getHours())},</span> ${esc(state.settings.name)}</div>
          <div class="clockrow">
            <div class="clock" id="clock"></div>
            <span class="ampm" id="ampm"></span>
            <span class="clock-sec" id="clock-sec"></span>
          </div>
          <div class="dateline"><b>${DOW[now.getDay()]}, ${MON[now.getMonth()]} ${now.getDate()}</b> · ${done.length} of ${state.tasks.length} tasks done</div>
        </div>
        <div class="tasks-wrap">
          <div class="card taskcol c-mint">
            <header><h3>Tasks</h3><span class="chip count">${todo.length} to do</span><span class="chip">${done.length} done</span></header>
            <div class="tasklist" data-col="all">
              ${todo.map(taskRow).join('') || '<div class="empty">All clear. Add one with N.</div>'}
              ${done.length ? `<div class="task-sep">Completed</div>${done.map(taskRow).join('')}` : ''}
            </div>
          </div>
        </div>
      </div>
      <div class="today-right">
        <div class="card c-lav upnext">
          <span class="lbl">Up next</span>
          ${ne ? `<div class="when">${fmt12(ne.e.start)} <small style="font-size:1.1rem">${ampm(Number(ne.e.start.slice(0, 2)))}</small></div>
            <div class="what">${esc(ne.e.title)}</div>
            <span class="chip">${ne.when} · ${fmtRange(ne.e.start, ne.e.end)}</span>`
        : `<div class="what" style="margin-top:.4rem">Nothing scheduled.</div><span class="chip">Enjoy the calm</span>`}
          <button class="icon-btn" data-act="nav" data-page="2" aria-label="Open schedule">${icon('arrow')}</button>
        </div>
        <div class="card c-sky nextalarm">
          ${icon('bell')}
          ${na ? `<div><div class="t">${fmt12(na.a.time)} ${ampm(Number(na.a.time.slice(0, 2)))}</div><div class="lbl">${esc(na.a.label)} · ${untilStr(na.at)}</div></div>` : `<div class="lbl">No alarms set</div>`}
          <button class="icon-btn" style="margin-left:auto" data-act="nav" data-page="3" aria-label="Open alarms">${icon('arrow')}</button>
        </div>
      </div>
    </div>
  </section>`;
}

const TL_START = 7 * 60, TL_END = 23 * 60;
function pageSched() {
  const d = new Date(); d.setDate(d.getDate() + dayOff);
  const evs = dayEvents();
  const cols = [];
  const placed = evs.map(e => {
    let c = 0; while (cols[c] && cols[c] > toMin(e.start)) c++;
    cols[c] = toMin(e.end); return { ...e, col: c };
  });
  const ncol = Math.max(1, cols.length);
  const hours = [];
  for (let h = 7; h <= 23; h++) hours.push(`<div class="tl-hour ${h === 7 ? 'first' : ''} ${h === 23 ? 'last' : ''}" style="top:${(h * 60 - TL_START) / (TL_END - TL_START) * 100}%"><span>${h12(h)} ${ampm(h)}</span></div>`);
  const blocks = placed.map(e => {
    const top = (toMin(e.start) - TL_START) / (TL_END - TL_START) * 100;
    const dur = toMin(e.end) - toMin(e.start);
    const hgt = Math.max(4.2, dur / (TL_END - TL_START) * 100);
    const w = 100 / ncol;
    const size = dur <= 60 ? 'short' : dur <= 90 ? 'med' : '';
    return `<div class="tl-event c-${e.color} ${size} ${selEvent === e.id ? 'sel' : ''}" data-act="edit-event" data-id="${e.id}" style="top:${top}%;height:${hgt}%;left:${e.col * w}%;width:calc(${w}% - .5rem)">
      <div class="t">${esc(e.title)}</div><div class="time">${fmtRange(e.start, e.end)}</div></div>`;
  }).join('');
  return `
  <section class="page on">
    <div class="page-head">
      <div class="page-title">Schedule</div>
      <div class="sub">${dayOff === 0 ? 'Today' : DOW[d.getDay()] + ', ' + MON[d.getMonth()] + ' ' + d.getDate()}</div>
      <div class="right">
        <button class="icon-btn" data-act="day-prev" aria-label="Previous day">${icon('chevL')}</button>
        <button class="btn sm soft" data-act="day-today">Today</button>
        <button class="icon-btn" data-act="day-next" aria-label="Next day">${icon('chevR')}</button>
        <button class="btn sm" data-act="add">${icon('plus')} Event</button>
      </div>
    </div>
    <div class="sched">
      <div class="card timeline-card">
        <div class="timeline"><div class="tl-grid" id="tl-grid">${hours.join('')}${blocks}<div class="tl-now" id="tl-now" hidden></div></div></div>
      </div>
      <div class="sched-side">
        <div class="card c-butter">
          <div class="daybig">${d.getDate()}</div>
          <div style="font-weight:600;font-size:1.1rem">${MON[d.getMonth()]} · ${DOW[d.getDay()]}</div>
          <div class="r-muted" style="margin-top:.3rem">${evs.length} activit${evs.length === 1 ? 'y' : 'ies'} planned</div>
        </div>
        <div class="card daylist" style="flex:1">
          ${evs.map(e => `<div class="row c-${e.color} ${selEvent === e.id ? 'sel' : ''}" data-act="edit-event" data-id="${e.id}"><span class="tm">${fmt12(e.start)} ${ampm(Number(e.start.slice(0, 2)))}</span><span style="flex:1">${esc(e.title)}</span></div>`).join('') || '<div class="empty">A free day. Click the timeline or press N to plan something.</div>'}
        </div>
      </div>
    </div>
  </section>`;
}

function pageAlarms() {
  const al = [...state.alarms].sort((a, b) => a.time.localeCompare(b.time));
  const rems = [...state.reminders].sort((a, b) => a.at.localeCompare(b.at));
  return `
  <section class="page on">
    <div class="page-head">
      <div class="page-title">Alarms & reminders</div>
      <div class="sub">rings on the display, even in standby</div>
      <div class="right"><button class="btn sm" data-act="add">${icon('plus')} Alarm</button><button class="btn sm ghost" data-act="add-rem">${icon('plus')} Reminder</button></div>
    </div>
    <div class="alarms-grid">
      <div class="alarm-list">
        ${al.map(a => `
          <div class="card alarm-card c-${a.enabled ? 'lav' : 'mint'} ${a.enabled ? '' : 'off'}">
            <div class="time">${fmt12(a.time)} <small>${ampm(Number(a.time.slice(0, 2)))}</small></div>
            <div class="mid">
              <div class="lbl">${esc(a.label)}</div>
              <div class="rings">${a.enabled ? `rings ${untilStr(alarmNextAt(a))}` : 'turned off'}</div>
              <div class="days">${DOW1.map((s, i) => `<span class="${a.days.includes(i) ? 'on' : ''}">${s}</span>`).join('')}</div>
            </div>
            <div class="side">
              <button class="switch" role="switch" aria-checked="${a.enabled}" data-act="toggle-alarm" data-id="${a.id}" aria-label="Toggle alarm"></button>
              <button class="del icon-btn" data-act="del-alarm" data-id="${a.id}" aria-label="Delete alarm">${icon('trash')}</button>
            </div>
          </div>`).join('')}
        <button class="add-card" data-act="add">${icon('plus')} New alarm</button>
      </div>
      <div class="card c-peach rem-card">
        <header style="display:flex;align-items:center;margin-bottom:.8rem"><h3 style="font-size:1.05rem;font-weight:700">Reminders</h3><span class="chip" style="margin-left:auto">${rems.filter(r => !r.fired).length} pending</span></header>
        <div class="rem-list">
          ${rems.map(r => `
            <div class="rem ${r.fired ? 'fired' : ''}">
              <span class="bell">${icon('bell')}</span>
              <span class="t">${esc(r.label)}<span class="at">${r.at.slice(5, 10).replace('-', '/')} ${fmt12(r.at.slice(11, 16))} ${ampm(Number(r.at.slice(11, 13)))}${!r.fired ? ` · rings ${untilStr(new Date(r.at))}` : ''}</span></span>
              <button class="del icon-btn" style="width:1.9rem;height:1.9rem" data-act="del-rem" data-id="${r.id}" aria-label="Delete reminder">${icon('x')}</button>
            </div>`).join('') || '<div class="empty">No reminders. Shift+N adds one.</div>'}
        </div>
      </div>
    </div>
  </section>`;
}

function pageFocus() {
  const p = state.pomo, s = state.settings.pomo;
  const total = s[p.phase] * 60000;
  const rem = p.running ? Math.max(0, p.endsAt - Date.now()) : p.remainingMs;
  const frac = 1 - rem / total;
  const C = 2 * Math.PI * 80;
  const todayMin = p.log.filter(l => l.date === dstr(new Date())).reduce((a, b) => a + b.minutes, 0);
  const phases = [['focus', 'Focus'], ['short', 'Short break'], ['long', 'Long break']];
  return `
  <section class="page on">
    <div class="page-head"><div class="page-title">Focus</div><div class="sub">pomodoro · space to start / pause</div></div>
    <div class="focus-grid">
      <div class="card c-butter pomo-card">
        <div class="seg">${phases.map(([k, l]) => `<button data-act="pomo-phase" data-phase="${k}" aria-pressed="${p.phase === k}">${l}</button>`).join('')}</div>
        <div class="pomo-ring">
          <svg viewBox="0 0 200 200"><circle class="bg" cx="100" cy="100" r="80" fill="none" stroke-width="10"/><circle class="fg" id="pomo-fg" cx="100" cy="100" r="80" fill="none" stroke-width="10" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - frac)}"/></svg>
          <div class="pomo-time"><div class="t" id="pomo-time"></div><div class="ph">${p.running ? 'running' : 'paused'} · ${p.phase}</div></div>
        </div>
        <div class="pomo-ctl">
          <button class="icon-btn" data-act="pomo" data-cmd="reset" aria-label="Reset">${icon('reset')}</button>
          <button class="btn" data-act="pomo" data-cmd="${p.running ? 'pause' : 'start'}" id="pomo-main">${icon(p.running ? 'pause' : 'play')} ${p.running ? 'Pause' : 'Start'}</button>
          <button class="icon-btn" data-act="pomo" data-cmd="skip" aria-label="Skip">${icon('skip')}</button>
        </div>
      </div>
      <div class="focus-side">
        <div class="card c-lav">
          <div class="lbl" style="font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:.8rem;opacity:.7;margin-bottom:.6rem">Cycle</div>
          <div class="dots">${Array.from({ length: s.every }, (_, i) => `<span class="${i < p.cycles % s.every || p.phase === 'long' ? 'on' : ''}"></span>`).join('')}</div>
          <div class="r-muted" style="margin-top:.6rem;color:inherit;opacity:.7">${p.cycles} focus sessions all-time · long break every ${s.every}</div>
        </div>
        <div class="card c-mint statrow">
          <div><div class="big">${todayMin}</div><div class="lbl">minutes today</div></div>
          <div><div class="big">${p.log.filter(l => l.date === dstr(new Date())).length}</div><div class="lbl">sessions today</div></div>
        </div>
        <div class="card" style="flex:1">
          <div style="font-weight:700;margin-bottom:.8rem">Durations</div>
          ${[['focus', 'Focus'], ['short', 'Short break'], ['long', 'Long break']].map(([k, l]) => `
            <div class="set-row" style="margin-bottom:.6rem"><span class="lbl">${l}</span>
              <div class="stepper"><button data-act="dur" data-k="${k}" data-d="-5">−</button><span class="v">${s[k]}m</span><button data-act="dur" data-k="${k}" data-d="5">+</button></div>
            </div>`).join('')}
        </div>
      </div>
    </div>
  </section>`;
}

function heatData() {
  const map = {};
  state.history.forEach(h => { map[h.date] = h.count; });
  const weeks = 20;
  const end = new Date();
  const start = new Date(); start.setDate(start.getDate() - (weeks * 7 - 1));
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const cells = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const c = map[dstr(d)] || 0;
    cells.push({ date: dstr(d), c, l: c === 0 ? 0 : c === 1 ? 1 : c === 2 ? 2 : c === 3 ? 3 : 4 });
  }
  let total = 0, best = 0, run = 0, streak = 0;
  const dates = Object.keys(map).sort();
  for (const k of dates) { total += map[k]; }
  let prev = null;
  for (const k of dates) {
    const d = new Date(k + 'T00:00');
    run = prev && (d - prev) === 864e5 ? run + 1 : 1;
    best = Math.max(best, run); prev = d;
  }
  const t = new Date();
  if (!map[dstr(t)]) t.setDate(t.getDate() - 1);
  while (map[dstr(t)]) { streak++; t.setDate(t.getDate() - 1); }
  return { cells, total, best, streak };
}

function calHTML(base, now) {
  const y = base.getFullYear(), mo = base.getMonth();
  const first = (base.getDay() + 6) % 7;
  const days = new Date(y, mo + 1, 0).getDate();
  const prevDays = new Date(y, mo, 0).getDate();
  const evDates = new Set(state.events.map(e => e.date));
  let cal = DOW1.map((d, i) => `<span class="dow">${['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>`).join('');
  for (let i = 0; i < 42; i++) {
    const dn = i - first + 1;
    const inMo = dn >= 1 && dn <= days;
    const date = inMo ? `${y}-${pad(mo + 1)}-${pad(dn)}` : '';
    const isToday = inMo && base.getMonth() === now.getMonth() && base.getFullYear() === now.getFullYear() && dn === now.getDate();
    cal += `<span class="cal-day ${inMo ? '' : 'dim'} ${isToday ? 'today' : ''}">${inMo ? dn : (dn < 1 ? prevDays + dn : dn - days)}${inMo && evDates.has(date) ? '<span class="ev"></span>' : ''}</span>`;
  }
  return cal;
}

function pageExtras() {
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth() + calOff, 1);
  const heat = heatData();
  const w = weather;
  return `
  <section class="page on">
    <div class="page-head"><div class="page-title">Extras</div><div class="sub">the quiet corner · Tab selects, Enter opens</div></div>
    <div class="extras-grid">
      <div class="card c-mint xcard clickable ${selExtra === 'cal' ? 'sel' : ''}" data-act="open-cal" tabindex="0">
        <div class="cal-head">${MON[base.getMonth()]} ${base.getFullYear()}
          <span class="nav"><button class="icon-btn" style="width:2rem;height:2rem" data-act="cal-prev" aria-label="Previous month">${icon('chevL')}</button><button class="icon-btn" style="width:2rem;height:2rem" data-act="cal-next" aria-label="Next month">${icon('chevR')}</button></span>
        </div>
        <div class="cal-grid">${calHTML(base, now)}</div>
      </div>
      <div class="card c-sky xcard">
        <h3>${icon('pin')} Weather <span class="right r-muted" style="color:inherit;opacity:.7">${w && !w.offline ? esc(w.label || '') : ''}</span></h3>
        ${w && !w.offline ? `
          <div class="weather-now">${wIcon(w.current.weather_code, w.current.is_day)}
            <div><div class="temp">${Math.round(w.current.temperature_2m)}°</div></div>
            <div><div class="cond">${wLabel(w.current.weather_code)}</div><div class="loc">feels like ${Math.round(w.current.apparent_temperature ?? w.current.temperature_2m)}° · ${w.stale ? 'cached' : 'live'}</div></div>
          </div>
          <div class="weather-days">${[1, 2, 3].map(i => `<div class="d"><div class="n">${DOW[new Date(w.daily.time[i] + 'T00:00').getDay()]}</div>${wIcon(w.daily.weather_code[i])}<div class="hi">${Math.round(w.daily.temperature_2m_max[i])}°</div><div class="lo">${Math.round(w.daily.temperature_2m_min[i])}°</div></div>`).join('')}</div>`
        : `<div class="empty">Weather unavailable — offline or location not set. Set it in Settings.</div>`}
      </div>
      <div class="card xcard">
        <h3>${icon('note')} Notes <span class="right r-muted" style="color:inherit;opacity:.7">from your phone</span></h3>
        <div class="notes-list">${state.notes.map(n => `<div class="note c-${n.color} ${selExtra === n.id ? 'sel' : ''}" data-act="open-note" data-id="${n.id}" tabindex="0">${esc(n.text)}</div>`).join('') || '<div class="empty">Notes you add on the remote appear here.</div>'}</div>
      </div>
      <div class="card c-butter xcard">
        <h3>${icon('flame')} Task activity</h3>
        <div class="heat-wrap">
          <div class="heat">${heat.cells.map(c => `<i class="${c.l ? 'l' + c.l : ''}" title="${c.date}: ${c.c} done"></i>`).join('')}</div>
          <div class="heat-stats">
            <span><span class="big">${heat.total}</span> <span class="lbl">done</span></span>
            <span><span class="big">${heat.streak}</span> <span class="lbl">day streak</span></span>
            <span><span class="big">${heat.best}</span> <span class="lbl">best</span></span>
            <span class="heat-legend">less <i style="background:var(--heat0)"></i><i style="background:var(--heat1)"></i><i style="background:var(--heat2)"></i><i style="background:var(--heat3)"></i><i style="background:var(--heat4)"></i> more</span>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

function pageSettings() {
  const s = state.settings;
  return `
  <section class="page on">
    <div class="page-head"><div class="page-title">Settings</div><div class="sub">display, sound & personalisation</div>
      <div class="right"><button class="btn sm ghost" data-act="saver">Preview screensaver</button></div></div>
    <div class="settings-scroll">
      <div class="card set-card">
        <h3>Appearance</h3>
        <div class="set-row"><span class="lbl">Theme</span>
          <div class="seg">
            <button data-act="set-theme" data-v="light" aria-pressed="${s.theme === 'light'}">${icon('sun')} Light</button>
            <button data-act="set-theme" data-v="dark" aria-pressed="${s.theme === 'dark'}">${icon('moon')} Dark</button>
            <button data-act="set-theme" data-v="auto" aria-pressed="${s.theme === 'auto'}" title="Light by day, dark from evening">${icon('sun')} Auto</button>
          </div>
        </div>
        <div class="set-row"><span class="lbl">Sun gradient<small>auto follows daylight · on always · off plain</small></span>
          <div class="seg">
            <button data-act="set-sky" data-v="auto" aria-pressed="${s.skyMode === 'auto'}">Auto</button>
            <button data-act="set-sky" data-v="on" aria-pressed="${s.skyMode === 'on'}">On</button>
            <button data-act="set-sky" data-v="off" aria-pressed="${s.skyMode === 'off'}">Off</button>
          </div>
        </div>
        <div class="set-row"><span class="lbl">Sun path shift<small>move sunrise &amp; sunset · hours</small></span><input type="range" id="set-sunoff" min="-6" max="6" step="0.5" value="${s.sunOffset}" style="flex:1.4"><span class="val" id="sunoff-val">${fmtOff(s.sunOffset)}</span></div>
        <div class="set-row"><span class="lbl">Your name<small>used in the greeting</small></span><input class="input" id="set-name" style="max-width:12rem" value="${esc(s.name)}"></div>
      </div>
      <div class="card set-card">
        <h3>Display & power</h3>
        <div class="set-row"><span class="lbl">Brightness</span><input type="range" id="set-brightness" min="5" max="100" value="${s.brightness}" style="flex:1.4"><span class="val" id="brightness-val">${s.brightness}%</span></div>
        <div class="set-row"><span class="lbl">Screen</span><button class="btn sm" data-act="wake">${icon('monitor')} On</button><button class="btn sm ghost" data-act="sleep">Off</button></div>
        <div class="set-row"><span class="lbl">Auto turn-off after<small>minutes of inactivity · 0 = never</small></span><input class="input" id="set-autooff" type="number" min="0" max="240" style="max-width:6rem" value="${s.autoOffMin}"></div>
      </div>
      <div class="card set-card">
        <h3>Screensaver</h3>
        <div class="set-row"><span class="lbl">Style<small>standby rotates clock → quote → tasks every 2 min</small></span>
          <div class="seg">
            <button data-act="set-saver" data-v="standby" aria-pressed="${s.screensaver.mode === 'standby'}">Standby</button>
            <button data-act="set-saver" data-v="video" aria-pressed="${s.screensaver.mode === 'video'}">Video</button>
            <button data-act="set-saver" data-v="off" aria-pressed="${s.screensaver.mode === 'off'}">Black</button>
          </div>
        </div>
        <div class="set-row"><span class="lbl">Standby content<small>what the rotation shows</small></span>
          <div class="seg">
            <button data-act="set-cycle" data-v="rotate" aria-pressed="${s.saverCycle === 'rotate'}">Rotate</button>
            <button data-act="set-cycle" data-v="clock" aria-pressed="${s.saverCycle === 'clock'}">Clock</button>
            <button data-act="set-cycle" data-v="quote" aria-pressed="${s.saverCycle === 'quote'}">Quote</button>
            <button data-act="set-cycle" data-v="tasks" aria-pressed="${s.saverCycle === 'tasks'}">Tasks</button>
          </div>
        </div>
        <div class="set-row"><span class="lbl">Start after<small>minutes idle</small></span><input class="input" id="set-idle" type="number" min="1" max="120" style="max-width:6rem" value="${s.screensaver.idleMin}"></div>
        <div class="set-row"><span class="lbl">Night tint<small>red clock between 22:00–06:00, iOS Standby style</small></span><button class="switch" id="set-night" role="switch" aria-checked="${s.screensaver.nightRed}"></button></div>
        <div class="field"><label>Custom video (mp4 / webm)</label>
          <div class="set-row"><input class="input" id="set-video-url" placeholder="/media/… or https://…" value="${esc(s.screensaver.video)}"><button class="btn sm" id="set-video-upload">${icon('upload')} Upload</button><input type="file" id="video-file" accept="video/mp4,video/webm,video/quicktime" hidden></div>
        </div>
      </div>
      <div class="card set-card">
        <h3>Sound</h3>
        <div class="set-row"><span class="lbl">Mute all chimes</span><button class="switch" id="set-mute" role="switch" aria-checked="${s.muted}"></button></div>
        <div class="set-row"><span class="lbl">Volume<small>chimes &amp; ringtone loudness</small></span><input type="range" id="set-volume" min="0" max="100" value="${s.volume}" style="flex:1.4"><span class="val" id="volume-val">${s.volume}%</span></div>
        <div class="field"><label>Custom alarm ringtone (mp3 / wav / ogg)</label>
          <div class="set-row"><input class="input" id="set-ring-url" placeholder="/media/… or https://…" value="${esc(s.ringtone || '')}"><button class="btn sm" id="set-ring-upload">${icon('upload')} Upload</button><input type="file" id="ring-file" accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac" hidden></div>
        </div>
        <div class="set-row"><span class="lbl">Test the alarm sound</span><button class="btn sm ghost" data-act="test-chime">${icon('bell')} Test</button></div>
      </div>
      <div class="card set-card">
        <h3>Weather location</h3>
        <div class="set-row"><input class="input" id="geo-q" placeholder="Search city…"><button class="btn sm" id="geo-go">${icon('pin')} Find</button></div>
        <div id="geo-results" style="display:flex;flex-direction:column;gap:.4rem"></div>
        <div class="r-muted">Now: ${esc(s.weather.label || 'detecting…')}</div>
      </div>
      <div class="card set-card">
        <h3>Keyboard</h3>
        <div class="keys">
          <div><kbd>←</kbd><kbd>→</kbd> pages</div><div><kbd>1</kbd>–<kbd>6</kbd> jump to page</div>
          <div><kbd>Tab</kbd><kbd>⇧Tab</kbd> select task / event / note</div><div><kbd>⏎</kbd> open details</div>
          <div><kbd>space</kbd> complete task / pomodoro</div><div><kbd>⌫</kbd> delete task</div>
          <div><kbd>N</kbd> add · <kbd>E</kbd> edit</div><div><kbd>PgUp</kbd><kbd>PgDn</kbd> scroll</div>
          <div><kbd>[</kbd><kbd>]</kbd> brightness</div><div><kbd>O</kbd> screen on/off</div>
          <div><kbd>M</kbd> mute · <kbd>T</kbd> theme</div><div><kbd>S</kbd> screensaver</div>
          <div><kbd>,</kbd><kbd>.</kbd> change day</div><div><kbd>space</kbd> dismiss alarm</div>
        </div>
      </div>
    </div>
  </section>`;
}

/* ---------- settings bindings ---------- */
function bindSettings() {
  const on = (id, ev, fn) => { const el = $('#' + id); if (el) el.addEventListener(ev, fn); };
  on('set-name', 'change', e => api('PATCH', '/api/settings', { name: e.target.value.slice(0, 40) }));
  on('set-volume', 'input', e => {
    const v = Number(e.target.value);
    state.settings.volume = v; $('#volume-val').textContent = v + '%';
    if (ringAudio) ringAudio.volume = state.settings.muted ? 0 : v / 100;
    clearTimeout(bindSettings._vt);
    bindSettings._vt = setTimeout(() => api('PATCH', '/api/settings', { volume: v }), 200);
  });
  on('set-sunoff', 'input', e => {
    const v = Number(e.target.value);
    state.settings.sunOffset = v; $('#sunoff-val').textContent = fmtOff(v); updateSky();
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
      if (j.ok) { toast('Video ready — switch style to Video'); }
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
      if (j.ok) toast('Ringtone ready — alarms will use it');
    } catch { toast('Upload failed'); }
  });
  on('geo-go', 'click', async () => {
    const q = $('#geo-q').value.trim(); if (!q) return;
    try {
      const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=4`);
      const j = await r.json();
      $('#geo-results').innerHTML = (j.results || []).map(g => `<button class="btn sm ghost" data-geo="${g.latitude},${g.longitude},${esc(g.name)}">${esc(g.name)}, ${esc(g.country_code)}</button>`).join('') || '<span class="r-muted">No matches.</span>';
      $$('#geo-results [data-geo]').forEach(b => b.addEventListener('click', () => {
        const [lat, lon, label] = b.dataset.geo.split(',');
        api('PATCH', '/api/settings', { weather: { lat: Number(lat), lon: Number(lon), label } });
        weather = null; fetchWeather();
        $('#geo-results').innerHTML = '';
      }));
    } catch { toast('Geocoding unavailable'); }
  });
}
function syncSettings() {
  const s = state.settings;
  const set = (id, v) => { const el = $('#' + id); if (el && document.activeElement !== el) el.value = v; };
  set('set-name', s.name); set('set-brightness', s.brightness); set('set-autooff', s.autoOffMin);
  set('set-idle', s.screensaver.idleMin); set('set-video-url', s.screensaver.video); set('set-ring-url', s.ringtone || '');
  set('set-sunoff', s.sunOffset); set('set-volume', s.volume);
  const bv = $('#brightness-val'); if (bv) bv.textContent = s.brightness + '%';
  const ov = $('#sunoff-val'); if (ov) ov.textContent = fmtOff(s.sunOffset);
  const vv = $('#volume-val'); if (vv) vv.textContent = s.volume + '%';
  const sw = (id, v) => { const el = $('#' + id); if (el) el.setAttribute('aria-checked', v); };
  sw('set-night', s.screensaver.nightRed); sw('set-mute', s.muted);
  $$('[data-act="set-theme"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === s.theme));
  $$('[data-act="set-sky"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === s.skyMode));
  $$('[data-act="set-saver"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === s.screensaver.mode));
  $$('[data-act="set-cycle"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === s.saverCycle));
}

/* ---------- tick ---------- */
let skyTick = 0;
function tick(force) {
  if (!state) return;
  const now = new Date();
  if (state.settings.theme === 'auto' && document.documentElement.dataset.theme !== effTheme()) { applyTheme(); renderRail(); }
  const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
  const clock = $('#clock');
  if (clock) {
    clock.innerHTML = `${h12(h)}<span class="colon">:</span>${pad(m)}`;
    $('#ampm').textContent = ampm(h);
    $('#clock-sec').textContent = pad(s);
  }
  const tl = $('#tl-now');
  if (tl) {
    const mins = h * 60 + m;
    if (dayOff === 0 && mins >= TL_START && mins <= TL_END) { tl.hidden = false; tl.style.top = ((mins - TL_START) / (TL_END - TL_START) * 100) + '%'; }
    else tl.hidden = true;
  }
  const pt = $('#pomo-time');
  if (pt) {
    const p = state.pomo;
    const rem = p.running ? Math.max(0, p.endsAt - Date.now()) : p.remainingMs;
    pt.textContent = `${pad(Math.floor(rem / 60000))}:${pad(Math.floor(rem / 1000) % 60)}`;
    const fg = $('#pomo-fg');
    if (fg) { const C = 2 * Math.PI * 80; fg.style.strokeDashoffset = C * (rem / (state.settings.pomo[p.phase] * 60000)); }
  }
  if (force || ++skyTick % 40 === 0) updateSky();
  updateStandby();
}
setInterval(tick, 500);

function updateStandby() {
  if (!saverOn || !state) return;
  const now = new Date();
  const t = `${h12(now.getHours())}:${pad(now.getMinutes())}`;
  const ap = ampm(now.getHours());
  $('#sb-time').textContent = t; $('#sb-ampm').textContent = ap;
  $('#sv-time').textContent = t; $('#sv-ampm').textContent = ap;
  $('#sq-time').textContent = t; $('#sq-ampm').textContent = ap;
  $('#st-time').textContent = t; $('#st-ampm').textContent = ap;
  const na = nextAlarm();
  const parts = [esc(`${DOW[now.getDay()]}, ${MON[now.getMonth()]} ${now.getDate()}`)];
  if (weather && !weather.offline) parts.push(esc(`${Math.round(weather.current.temperature_2m)}° ${wLabel(weather.current.weather_code)}`));
  if (na) parts.push(`${icon('bell')} ${esc(`${fmt12(na.a.time)} ${ampm(Number(na.a.time.slice(0, 2)))}`)}`);
  $('#sb-sub').innerHTML = parts.join('<span class="dot"></span>');
  $('#sb-sub').querySelectorAll('svg').forEach(s => { s.style.width = '1.3rem'; s.style.height = '1.3rem'; });
  const night = state.settings.screensaver.nightRed && (now.getHours() >= 22 || now.getHours() < 6);
  $('#standby').classList.toggle('night', night);
}

/* ---------- screensaver / idle ---------- */
function activity() {
  lastAct = Date.now();
  if (saverOn && Date.now() - saverAt > 400) wake();
}
function wake() {
  saverOn = false;
  clearInterval(saverRotate);
  $('#saver').classList.remove('on');
  document.body.classList.remove('saver-dim');
  const v = $('#saver-video'); v.pause(); v.hidden = true;
  powerOn();
  lastAct = Date.now();
}
function powerOn() {
  $('#wipe').classList.remove('on');
  animateWipe(0);
  if (displayOff) { displayOff = false; api('POST', '/api/wake').catch(() => {}); }
}
function sleepDisplay() {
  if (displayOff) return;
  displayOff = true;
  $('#wipe').classList.add('on');
  animateWipe(1);
  setTimeout(() => { if (displayOff) api('POST', '/api/display', { cmd: 'off' }).catch(() => {}); }, 1200);
}
let wipeRaf = 0, wipeS = 0;
const wipeEase = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function wipeFrame(s) {
  wipeS = s;
  const pb = Math.max(0, Math.min(1, s + 0.25 * Math.sin(Math.PI * s)));
  const pos = `${((1 - pb) * 100).toFixed(3)}% ${(pb * 100).toFixed(3)}%`;
  const w = $('#wipe');
  w.style.maskPosition = pos; w.style.webkitMaskPosition = pos;
  const u = 2 * s;
  const bx = Math.min(u, 1) * 100, ey = Math.max(1 - u, 0) * 100;
  const cx = u < 1 ? bx : 100, cy = u < 1 ? 100 : (2 - u) * 100;
  const dx = u < 1 ? 0 : (u - 1) * 100, dy = u < 1 ? ey : 0;
  $('#wipe-blur').style.clipPath = `polygon(0% 100%, ${bx}% 100%, ${cx}% ${cy}%, ${dx}% ${dy}%, 0% ${ey}%)`;
}
function animateWipe(target) {
  cancelAnimationFrame(wipeRaf);
  const from = wipeS;
  if (from === target) { wipeFrame(target); return; }
  const t0 = performance.now();
  const step = now => {
    const t = Math.min(1, (now - t0) / 1150);
    wipeFrame(from + (target - from) * wipeEase(t));
    if (t < 1) wipeRaf = requestAnimationFrame(step);
  };
  wipeRaf = requestAnimationFrame(step);
}
const cycleViews = () => {
  const c = state.settings.saverCycle;
  return c === 'clock' ? [0] : c === 'quote' ? [1] : c === 'tasks' ? [2] : [0, 1, 2];
};
function applyCycle() {
  clearInterval(saverRotate);
  const views = cycleViews();
  setSaverView(views[0]);
  if (views.length > 1) saverRotate = setInterval(() => setSaverView(views[(views.indexOf(saverView) + 1) % views.length]), 120e3);
}
function setSaverView(i) {
  saverView = i;
  ['standby', 'sv-quote', 'sv-tasks'].forEach((id, k) => $('#' + id).classList.toggle('show', k === i));
  if (i === 1) renderQuote();
  if (i === 2) renderSaverTasks();
}
function renderQuote() {
  quoteIdx = (quoteIdx + 1) % QUOTES.length;
  const q = QUOTES[quoteIdx];
  $('#q-text').innerHTML = q[0].split(' ').map((w, i) => `<span class="w" style="animation-delay:${(i * 0.18).toFixed(2)}s">${esc(w)}</span>`).join(' ');
  const a = $('#q-author');
  a.textContent = '— ' + q[1];
  a.style.animation = 'none'; void a.offsetWidth; a.style.animation = '';
}
function renderSaverTasks() {
  const todo = tasksSorted(false);
  $('#st-count').textContent = `${todo.length} to do`;
  $('#st-list').innerHTML = todo.slice(0, 5).map((t, i) => `<div class="st-row" style="animation-delay:${(i * 0.12).toFixed(2)}s"><span class="circle"></span><span style="flex:1">${esc(t.title)}</span>${t.tag ? `<span class="tag">${esc(t.tag)}</span>` : ''}</div>`).join('')
    || '<div class="st-row"><span class="circle"></span>All clear — enjoy the calm.</div>';
}
function startSaver(forceOff) {
  if (!state) return;
  saverOn = true;
  saverAt = Date.now();
  saverMode = forceOff ? 'off' : state.settings.screensaver.mode;
  lastCycle = state.settings.saverCycle;
  if (saverMode === 'off') { sleepDisplay(); return; }
  const saver = $('#saver');
  saver.classList.toggle('light', effTheme() === 'light' && saverMode !== 'off');
  saver.classList.add('on');
  document.body.classList.add('saver-dim');
  const v = $('#saver-video');
  const vc = $('#sb-video-clock');
  clearInterval(saverRotate);
  if (saverMode === 'video' && state.settings.screensaver.video) {
    v.hidden = false; vc.hidden = false; setSaverView(-1);
    if (v.getAttribute('src') !== state.settings.screensaver.video) v.src = state.settings.screensaver.video;
    v.play().catch(() => { v.hidden = true; vc.hidden = true; setSaverView(0); });
  } else {
    v.hidden = true; v.pause(); vc.hidden = true;
    applyCycle();
  }
  updateStandby();
}
setInterval(() => {
  if (!state || saverOn) {
    if (saverOn && state && state.settings.autoOffMin > 0 && !displayOff && Date.now() - lastAct > state.settings.autoOffMin * 60e3) {
      sleepDisplay();
    }
    return;
  }
  const idle = Date.now() - lastAct;
  if (idle > state.settings.screensaver.idleMin * 60e3) startSaver();
  else if (state.settings.autoOffMin > 0 && idle > state.settings.autoOffMin * 60e3) startSaver(true);
}, 5000);
setInterval(() => {
  if (saverOn && saverView === 0) {
    const x = (Math.random() * 6 - 3).toFixed(1), y = (Math.random() * 4 - 2).toFixed(1);
    $('#standby').style.transform = `translate(${x}%, ${y}%)`;
  }
}, 20000);
['pointerdown', 'mousemove', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, activity, { passive: true }));

/* ---------- alarm overlay ---------- */
function showAlarm(a) {
  alarmActive = a; alarmStarted = Date.now();
  $('#alarm-bell').innerHTML = icon('bell');
  $('#alarm-at').textContent = `${a.kind === 'alarm' ? 'Alarm' : 'Reminder'} · ${fmt12(a.time)} ${ampm(Number(a.time.slice(0, 2)))}`;
  $('#alarm-label').textContent = a.label;
  const v = $('#alarm-veil');
  v.classList.remove('bye'); v.hidden = false;
  if (saverOn) wake();
  powerOn();
  startRing();
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
  dismissAlarm();
  toast(auto ? 'No answer — snoozed 5 minutes' : 'Snoozed 5 minutes');
}

/* ---------- hardware alert overlay ---------- */
function showAlert(a) {
  alertActive = a;
  $('#alert-icon').innerHTML = icon(a.kind === 'ethernet' ? 'eth' : a.kind === 'battery' ? 'battery' : a.kind === 'custom' ? 'bell' : 'temp');
  $('#alert-title').textContent = a.title;
  $('#alert-msg').textContent = a.msg;
  const v = $('#alert-veil');
  v.classList.remove('bye'); v.hidden = false;
  if (saverOn) wake();
  powerOn();
  chime('alert');
  clearTimeout(alertTimer);
  alertTimer = setTimeout(dismissAlert, 10000);
}
function dismissAlert() {
  alertActive = null; clearTimeout(alertTimer);
  const v = $('#alert-veil');
  v.classList.add('bye');
  setTimeout(() => { v.hidden = true; v.classList.remove('bye'); }, 460);
}

/* ---------- note & calendar viewers ---------- */
function openNote(id) {
  if (!state.notes.length) return;
  noteIdx = Math.max(0, state.notes.findIndex(n => n.id === id));
  noteOpen = true;
  renderNote();
  $('#note-veil').hidden = false;
}
function renderNote() {
  const n = state.notes[noteIdx];
  if (!n) return closeNote();
  $('#note-full').className = 'note-full c-' + n.color;
  const t = $('#nf-text');
  t.textContent = n.text;
  t.classList.remove('swap'); void t.offsetWidth; t.classList.add('swap');
  $('#nf-idx').textContent = `${noteIdx + 1} / ${state.notes.length}`;
  $('#nf-time').textContent = niceDate(n.createdAt);
}
function closeNote() { noteOpen = false; $('#note-veil').hidden = true; }
function openCal() {
  calOpen = true;
  $('#cal-veil').hidden = false;
  $('#cal-veil [data-act="fcal-prev"]').innerHTML = icon('chevL');
  $('#cal-veil [data-act="fcal-next"]').innerHTML = icon('chevR');
  renderCalFull();
}
function renderCalFull() {
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth() + calOff, 1);
  $('#cf-title').textContent = `${MON[base.getMonth()]} ${base.getFullYear()}`;
  $('#cf-grid').innerHTML = calHTML(base, now);
}
function closeCal() { calOpen = false; $('#cal-veil').hidden = true; }

/* ---------- toast / undo ---------- */
function toast(msg, undo) {
  const t = $('#toast');
  t.innerHTML = esc(msg) + (undo ? ' <button data-act="undo">Undo</button>' : '');
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 4200);
}
async function del(kind, id) {
  const item = state[kind].find(x => x.id === id);
  await api('DELETE', `/api/${kind}/${id}`);
  lastDeleted = { kind, item };
  toast('Deleted', true);
}
async function toggleTask(id) {
  const t = state.tasks.find(x => x.id === id);
  await api('PATCH', `/api/tasks/${id}`, { done: !t.done });
  chime('tick');
}

/* ---------- modals ---------- */
function openModal(html) { $('#modal-veil').innerHTML = `<div class="modal">${html}</div>`; $('#modal-veil').hidden = false; const f = $('#modal-veil input, #modal-veil textarea'); if (f) f.focus(); }
function closeModal() { $('#modal-veil').hidden = true; $('#modal-veil').innerHTML = ''; }
$('#modal-veil').addEventListener('pointerdown', e => { if (e.target === e.currentTarget) closeModal(); });

function taskModal(t) {
  openModal(`
    <h2>${t ? 'Edit task' : 'New task'}<button class="icon-btn x" data-act="close-modal">${icon('x')}</button></h2>
    <form data-form="task" data-id="${t ? t.id : ''}">
      <div class="field"><label>What needs doing?</label><input class="input" name="title" maxlength="200" required value="${t ? esc(t.title) : ''}" placeholder="e.g. Call the bank"></div>
      <div class="field" style="margin-top:.8rem"><label>Description (optional)</label><textarea class="input" name="description" maxlength="1000" placeholder="Details shown when you open the task">${t ? esc(t.description || '') : ''}</textarea></div>
      <div class="field" style="margin-top:.8rem"><label>Tag (optional)</label><input class="input" name="tag" maxlength="24" value="${t ? esc(t.tag) : ''}" placeholder="Work, Home, Health…"></div>
      <div class="actions"><button type="button" class="btn ghost" data-act="close-modal">Cancel</button><button class="btn">${t ? 'Save' : 'Add task'}</button></div>
    </form>`);
}
function taskDetail(t) {
  if (!t) return;
  openModal(`
    <div class="task-detail">
      <h2>${esc(t.title)}<button class="icon-btn x" data-act="close-modal">${icon('x')}</button></h2>
      <div class="meta">
        <span class="chip">${t.done ? 'Completed' : 'To do'}</span>
        ${t.tag ? `<span class="chip">${esc(t.tag)}</span>` : ''}
        <span class="chip dim">added ${niceDate(t.createdAt)}</span>
        ${t.completedAt ? `<span class="chip dim">done ${niceDate(t.completedAt)}</span>` : ''}
      </div>
      <p class="desc">${t.description ? esc(t.description) : 'No description yet — press Edit to add one.'}</p>
      <div class="actions">
        <button type="button" class="btn danger" data-act="detail-del" data-id="${t.id}" aria-label="Delete task">${icon('trash')}</button>
        <button type="button" class="btn ghost" data-act="detail-edit" data-id="${t.id}">${icon('pen')} Edit</button>
        <button type="button" class="btn" data-act="detail-toggle" data-id="${t.id}">${t.done ? 'Reopen' : icon('check') + ' Mark done'}</button>
      </div>
    </div>`);
}
function eventModal(ev, prefill) {
  const d = new Date(); d.setDate(d.getDate() + dayOff);
  const e = ev || { title: '', date: dstr(d), start: prefill || '09:00', end: prefill ? `${pad(Number(prefill.slice(0, 2)) + 1)}:${prefill.slice(3)}` : '10:00', color: 'mint' };
  openModal(`
    <h2>${ev ? 'Edit activity' : 'New activity'}<button class="icon-btn x" data-act="close-modal">${icon('x')}</button></h2>
    <form data-form="event" data-id="${ev ? ev.id : ''}">
      <div class="field"><label>Title</label><input class="input" name="title" required maxlength="200" value="${esc(e.title)}" placeholder="e.g. Yoga"></div>
      <div class="row" style="margin-top:.8rem">
        <div class="field"><label>Date</label><input class="input" type="date" name="date" required value="${e.date}"></div>
        <div class="field"><label>Start</label><input class="input" type="time" name="start" required value="${e.start}"></div>
        <div class="field"><label>End</label><input class="input" type="time" name="end" required value="${e.end}"></div>
      </div>
      <div class="field" style="margin-top:.8rem"><label>Colour</label><div class="swatches">${['mint', 'pink', 'butter', 'lav', 'sky', 'peach'].map(c => `<button type="button" data-sw="${c}" aria-pressed="${e.color === c}" style="background:var(--${c})" aria-label="${c}"></button>`).join('')}</div><input type="hidden" name="color" value="${e.color}"></div>
      <div class="actions">${ev ? `<button type="button" class="btn danger" data-act="del-event" data-id="${ev.id}">Delete</button>` : ''}<button type="button" class="btn ghost" data-act="close-modal">Cancel</button><button class="btn">${ev ? 'Save' : 'Add'}</button></div>
    </form>`);
}
function alarmModal(a) {
  const e = a || { label: '', time: '07:00', days: [0, 1, 2, 3, 4, 5, 6] };
  openModal(`
    <h2>${a ? 'Edit alarm' : 'New alarm'}<button class="icon-btn x" data-act="close-modal">${icon('x')}</button></h2>
    <form data-form="alarm" data-id="${a ? a.id : ''}">
      <div class="row">
        <div class="field"><label>Time</label><input class="input" type="time" name="time" required value="${e.time}"></div>
        <div class="field"><label>Label</label><input class="input" name="label" maxlength="80" value="${esc(e.label)}" placeholder="Wake up"></div>
      </div>
      <div class="field" style="margin-top:.8rem"><label>Days</label><div class="swatches">${DOW1.map((s, i) => `<button type="button" data-day="${i}" aria-pressed="${e.days.includes(i)}" style="background:var(--lav);color:var(--lav-ink);width:2.2rem;height:2.2rem;font-weight:700">${s}</button>`).join('')}</div></div>
      <div class="actions">${a ? `<button type="button" class="btn danger" data-act="del-alarm" data-id="${a.id}">Delete</button>` : ''}<button type="button" class="btn ghost" data-act="close-modal">Cancel</button><button class="btn">${a ? 'Save' : 'Add alarm'}</button></div>
    </form>`);
}
function remModal() {
  const at = new Date(Date.now() + 3600e3);
  openModal(`
    <h2>New reminder<button class="icon-btn x" data-act="close-modal">${icon('x')}</button></h2>
    <form data-form="reminder">
      <div class="field"><label>Remind me to…</label><input class="input" name="label" required maxlength="120" placeholder="Take a break"></div>
      <div class="row" style="margin-top:.8rem">
        <div class="field"><label>Date</label><input class="input" type="date" name="date" required value="${dstr(at)}"></div>
        <div class="field"><label>Time</label><input class="input" type="time" name="time" required value="${pad(at.getHours())}:${pad(at.getMinutes())}"></div>
      </div>
      <div class="actions"><button type="button" class="btn ghost" data-act="close-modal">Cancel</button><button class="btn">Add reminder</button></div>
    </form>`);
}
function noteModal() {
  openModal(`
    <h2>New note<button class="icon-btn x" data-act="close-modal">${icon('x')}</button></h2>
    <form data-form="note">
      <div class="field"><label>Note</label><textarea class="input" name="text" required maxlength="500" placeholder="Shown on the display’s Extras page"></textarea></div>
      <div class="field" style="margin-top:.8rem"><label>Colour</label><div class="swatches">${['mint', 'pink', 'butter', 'lav', 'sky', 'peach'].map((c, i) => `<button type="button" data-sw="${c}" aria-pressed="${i === 2}" style="background:var(--${c})" aria-label="${c}"></button>`).join('')}</div><input type="hidden" name="color" value="butter"></div>
      <div class="actions"><button type="button" class="btn ghost" data-act="close-modal">Cancel</button><button class="btn">Add note</button></div>
    </form>`);
}
function helpModal() {
  openModal(`
    <h2>Keyboard<button class="icon-btn x" data-act="close-modal">${icon('x')}</button></h2>
    <div class="helpgrid">
      <div><kbd>←</kbd><kbd>→</kbd> switch pages</div><div><kbd>1</kbd>–<kbd>6</kbd> jump to page</div>
      <div><kbd>Tab</kbd> / <kbd>⇧Tab</kbd> select tasks, events, notes, calendar</div><div><kbd>↑</kbd><kbd>↓</kbd> same, without wrap</div>
      <div><kbd>⏎</kbd> open task details / event / note / calendar</div><div><kbd>space</kbd> complete task (p1) · pomodoro (p4)</div>
      <div><kbd>N</kbd> add (task / event / alarm / note)</div><div><kbd>⇧N</kbd> reminder</div>
      <div><kbd>E</kbd> edit selected</div><div><kbd>⌫</kbd> delete selected</div>
      <div><kbd>PgUp</kbd><kbd>PgDn</kbd> scroll page</div><div><kbd>,</kbd> <kbd>.</kbd> previous / next day</div>
      <div><kbd>[</kbd> <kbd>]</kbd> brightness</div><div><kbd>O</kbd> screen on / off</div>
      <div><kbd>M</kbd> mute</div><div><kbd>T</kbd> light / dark</div>
      <div><kbd>S</kbd> screensaver now</div><div><kbd>Esc</kbd> wake / close / go back</div>
      <div><kbd>space</kbd> dismiss alarm · <kbd>Z</kbd> snooze</div><div><kbd>←</kbd><kbd>→</kbd> in note / calendar viewer</div>
    </div>
    <div class="r-muted">Remote control: open <b>/remote</b> on any device in this Wi-Fi network.</div>`);
}

document.addEventListener('submit', async e => {
  const f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault();
  const fd = new FormData(f); const v = k => fd.get(k);
  const kind = f.dataset.form, id = f.dataset.id;
  try {
    if (kind === 'task') {
      const body = { title: v('title'), tag: v('tag'), description: v('description') };
      if (id) await api('PATCH', `/api/tasks/${id}`, body);
      else await api('POST', '/api/tasks', body);
    }
    if (kind === 'event') {
      const body = { title: v('title'), date: v('date'), start: v('start'), end: v('end'), color: v('color') };
      if (id) await api('PATCH', `/api/events/${id}`, body); else await api('POST', '/api/events', body);
    }
    if (kind === 'alarm') {
      const days = $$('#modal-veil [data-day]').filter(b => b.getAttribute('aria-pressed') === 'true').map(b => Number(b.dataset.day));
      const body = { time: v('time'), label: v('label'), days };
      if (id) await api('PATCH', `/api/alarms/${id}`, body); else await api('POST', '/api/alarms', body);
      const at = alarmNextAt({ time: body.time, days: days.length ? days : [0, 1, 2, 3, 4, 5, 6] });
      closeModal();
      toast(`Alarm set — rings ${untilStr(at)}`);
      return;
    }
    if (kind === 'reminder') {
      const at = `${v('date')}T${v('time')}`;
      await api('POST', '/api/reminders', { label: v('label'), at });
      closeModal();
      toast(`Reminder set — rings ${untilStr(new Date(at))}`);
      return;
    }
    if (kind === 'note') await api('POST', '/api/notes', { text: v('text'), color: v('color') });
    closeModal();
    toast('Saved');
  } catch (err) { toast(err.message); }
});

/* ---------- clicks ---------- */
document.addEventListener('click', async e => {
  const sw = e.target.closest('[data-sw]');
  if (sw) {
    sw.closest('.swatches').querySelectorAll('[data-sw]').forEach(b => b.setAttribute('aria-pressed', b === sw));
    const hid = sw.closest('.field').querySelector('input[name=color]'); if (hid) hid.value = sw.dataset.sw;
    return;
  }
  const dy = e.target.closest('[data-day]');
  if (dy) { dy.setAttribute('aria-pressed', dy.getAttribute('aria-pressed') !== 'true'); return; }
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, id = b.dataset.id;
  try {
    if (act === 'nav') setPage(Number(b.dataset.page));
    if (act === 'theme') api('PATCH', '/api/settings', { theme: state.settings.theme === 'dark' ? 'light' : 'dark' });
    if (act === 'set-theme') api('PATCH', '/api/settings', { theme: b.dataset.v });
    if (act === 'set-sky') { state.settings.skyMode = b.dataset.v; updateSky(); api('PATCH', '/api/settings', { skyMode: b.dataset.v }); }
    if (act === 'set-saver') api('PATCH', '/api/settings', { screensaver: { mode: b.dataset.v } });
    if (act === 'set-cycle') api('PATCH', '/api/settings', { saverCycle: b.dataset.v });
    if (act === 'mute') api('POST', '/api/display', { cmd: 'mute', value: !state.settings.muted });
    if (act === 'help') helpModal();
    if (act === 'close-modal') closeModal();
    if (act === 'sel') { selTask = id; render(); }
    if (act === 'toggle') await toggleTask(id);
    if (act === 'del-task') { await del('tasks', id); if (selTask === id) selTask = null; }
    if (act === 'undo' && lastDeleted) { await api('POST', `/api/${lastDeleted.kind}`, lastDeleted.item); lastDeleted = null; $('#toast').classList.remove('on'); }
    if (act === 'add') { if (page === 1) taskModal(); if (page === 2) eventModal(); if (page === 3) alarmModal(); if (page === 5) noteModal(); }
    if (act === 'add-rem') remModal();
    if (act === 'edit-event') { selEvent = id; eventModal(state.events.find(x => x.id === id)); }
    if (act === 'del-event') { await del('events', id); closeModal(); }
    if (act === 'toggle-alarm') { const a = state.alarms.find(x => x.id === id); await api('PATCH', `/api/alarms/${id}`, { enabled: !a.enabled }); }
    if (act === 'del-alarm') { await del('alarms', id); closeModal(); }
    if (act === 'del-rem') del('reminders', id);
    if (act === 'day-prev') { dayOff--; render(); }
    if (act === 'day-next') { dayOff++; render(); }
    if (act === 'day-today') { dayOff = 0; render(); }
    if (act === 'cal-prev') { calOff--; render(); if (calOpen) renderCalFull(); }
    if (act === 'cal-next') { calOff++; render(); if (calOpen) renderCalFull(); }
    if (act === 'open-cal') { selExtra = 'cal'; openCal(); }
    if (act === 'open-note') { selExtra = id; openNote(id); }
    if (act === 'fcal-prev') { calOff--; renderCalFull(); render(); }
    if (act === 'fcal-next') { calOff++; renderCalFull(); render(); }
    if (act === 'pomo') api('POST', '/api/pomo', { action: b.dataset.cmd });
    if (act === 'pomo-phase') api('POST', '/api/pomo', { phase: b.dataset.phase });
    if (act === 'dur') { const k = b.dataset.k; const nv = Math.max(5, Math.min(90, state.settings.pomo[k] + Number(b.dataset.d))); api('PATCH', '/api/settings', { pomo: { [k]: nv } }); }
    if (act === 'saver') startSaver();
    if (act === 'wake') { wake(); api('POST', '/api/wake'); }
    if (act === 'sleep') { startSaver(true); }
    if (act === 'test-chime') {
      if (state.settings.ringtone && !state.settings.muted && vol() > 0) {
        stopRing();
        ringAudio = new Audio(state.settings.ringtone);
        ringAudio.volume = vol();
        ringAudio.play().catch(() => {});
        setTimeout(stopRing, 4000);
      } else chime('alarm');
    }
    if (act === 'dismiss') dismissAlarm();
    if (act === 'snooze') snoozeAlarm(false);
    if (act === 'alert-dismiss') dismissAlert();
    if (act === 'detail-toggle') { await toggleTask(id); closeModal(); }
    if (act === 'detail-edit') { closeModal(); taskModal(state.tasks.find(x => x.id === id)); }
    if (act === 'detail-del') { await del('tasks', id); if (selTask === id) selTask = null; closeModal(); }
  } catch (err) { toast(err.message); }
});

document.addEventListener('click', e => {
  const grid = e.target.closest('#tl-grid');
  if (grid && !e.target.closest('.tl-event')) {
    const r = grid.getBoundingClientRect();
    const mins = TL_START + ((e.clientY - r.top) / r.height) * (TL_END - TL_START);
    const h = Math.floor(mins / 60), m = Math.floor((mins % 60) / 30) * 30;
    eventModal(null, `${pad(h)}:${pad(m)}`);
  }
});
document.addEventListener('dblclick', e => {
  const t = e.target.closest('.task'); if (t) taskDetail(state.tasks.find(x => x.id === t.dataset.id));
});

/* ---------- selection & keyboard ---------- */
function selList() {
  if (page === 1) return tasksAll().map(t => t.id);
  if (page === 2) return dayEvents().map(e => e.id);
  if (page === 5) return ['cal', ...state.notes.map(n => n.id)];
  return [];
}
function curSel() { return page === 1 ? selTask : page === 2 ? selEvent : page === 5 ? selExtra : null; }
function setSel(id) { if (page === 1) selTask = id; else if (page === 2) selEvent = id; else if (page === 5) selExtra = id; }
function moveSel(d, wrap) {
  const list = selList();
  if (!list.length) return;
  const i = list.indexOf(curSel());
  let n;
  if (i === -1) n = d > 0 ? 0 : list.length - 1;
  else {
    n = i + d;
    if (wrap) n = (n + list.length) % list.length;
    else n = Math.max(0, Math.min(list.length - 1, n));
  }
  setSel(list[n]);
  render();
}
function scrollPage(d) {
  const el = $('#pages .tasklist, #pages .daylist, #pages .alarm-list, #pages .notes-list, #pages .settings-scroll, #pages .rem-list, #pages .focus-side');
  if (el) el.scrollBy({ top: d * el.clientHeight * 0.8, behavior: 'smooth' });
}

document.addEventListener('keydown', e => {
  if (e.target.matches('input, textarea, select')) { if (e.key === 'Escape') e.target.blur(); return; }
  if (alertActive) {
    if (e.key === ' ' || e.key === 'Escape' || e.key === 'Enter') dismissAlert();
    e.preventDefault(); return;
  }
  if (alarmActive) {
    if (e.key === ' ' || e.key === 'Escape') dismissAlarm();
    else if (e.key.toLowerCase() === 'z') snoozeAlarm(false);
    e.preventDefault(); return;
  }
  if (noteOpen) {
    if (e.key === 'ArrowRight') { noteIdx = (noteIdx + 1) % state.notes.length; renderNote(); }
    else if (e.key === 'ArrowLeft') { noteIdx = (noteIdx - 1 + state.notes.length) % state.notes.length; renderNote(); }
    else if (e.key === 'Escape') closeNote();
    e.preventDefault(); return;
  }
  if (calOpen) {
    if (e.key === 'ArrowRight') { calOff++; renderCalFull(); render(); }
    else if (e.key === 'ArrowLeft') { calOff--; renderCalFull(); render(); }
    else if (e.key === 'Escape') closeCal();
    e.preventDefault(); return;
  }
  if (!$('#modal-veil').hidden) { if (e.key === 'Escape') closeModal(); return; }
  if (saverOn) { wake(); e.preventDefault(); return; }
  const k = e.key;
  let handled = true;
  if (k === 'Tab') moveSel(e.shiftKey ? -1 : 1, true);
  else if (k === 'ArrowRight') setPage(page % 6 + 1);
  else if (k === 'ArrowLeft') setPage((page + 4) % 6 + 1);
  else if (/^[1-6]$/.test(k)) setPage(Number(k));
  else if (k === 'ArrowDown' && [1, 2, 5].includes(page)) moveSel(1, false);
  else if (k === 'ArrowUp' && [1, 2, 5].includes(page)) moveSel(-1, false);
  else if (k === 'Enter') {
    if (page === 1 && selTask) taskDetail(state.tasks.find(x => x.id === selTask));
    else if (page === 2 && selEvent) eventModal(state.events.find(x => x.id === selEvent));
    else if (page === 5 && selExtra === 'cal') openCal();
    else if (page === 5 && selExtra) openNote(selExtra);
  }
  else if (k === ' ' && page === 1 && selTask) toggleTask(selTask);
  else if ((k === 'Delete' || k === 'Backspace') && page === 1 && selTask) { del('tasks', selTask); selTask = null; }
  else if (k.toLowerCase() === 'n' && !e.shiftKey) { if (page === 1) taskModal(); if (page === 2) eventModal(); if (page === 3) alarmModal(); if (page === 5) noteModal(); }
  else if (k.toLowerCase() === 'n' && e.shiftKey) remModal();
  else if (k.toLowerCase() === 'e' && page === 1 && selTask) taskModal(state.tasks.find(x => x.id === selTask));
  else if (k === '[') api('POST', '/api/display', { cmd: 'brightness', value: Math.max(5, state.settings.brightness - 5) });
  else if (k === ']') api('POST', '/api/display', { cmd: 'brightness', value: Math.min(100, state.settings.brightness + 5) });
  else if (k.toLowerCase() === 'o') { if (displayOff) wake(); else startSaver(true); }
  else if (k.toLowerCase() === 'm') api('POST', '/api/display', { cmd: 'mute', value: !state.settings.muted });
  else if (k.toLowerCase() === 't') api('PATCH', '/api/settings', { theme: state.settings.theme === 'dark' ? 'light' : 'dark' });
  else if (k.toLowerCase() === 's') startSaver();
  else if (k === ' ' && page === 4) api('POST', '/api/pomo', { action: state.pomo.running ? 'pause' : 'start' });
  else if (k === ',' && page === 2) { dayOff--; render(); }
  else if (k === '.' && page === 2) { dayOff++; render(); }
  else if (k === 'PageDown') scrollPage(1);
  else if (k === 'PageUp') scrollPage(-1);
  else if (k === '?' || k.toLowerCase() === 'h') helpModal();
  else if (k === 'Escape') { closeModal(); }
  else handled = false;
  if (handled) e.preventDefault();
});

load();