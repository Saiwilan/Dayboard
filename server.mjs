import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const DATA = path.join(ROOT, 'data');
const VIDEOS = path.join(DATA, 'videos');
const RINGTONES = path.join(DATA, 'ringtones');
const STATE_FILE = path.join(DATA, 'state.json');
const PORT = Number(process.env.PORT || 4000);
const BUILD = Date.now();
const HOST = process.env.HOST || '0.0.0.0';
const AGENT_URL = process.env.DISPLAY_AGENT_URL || '';
const AGENT_TOKEN = process.env.DISPLAY_AGENT_TOKEN || '';

fs.mkdirSync(VIDEOS, { recursive: true });
fs.mkdirSync(RINGTONES, { recursive: true });

const uid = () => crypto.randomUUID().slice(0, 8);
const pad = n => String(n).padStart(2, '0');
const dstr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => dstr(new Date());
const hhmm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function mulberry(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seed() {
  const now = new Date();
  const t = today();
  const rnd = mulberry(7);
  const history = [];
  for (let i = 140; i >= 1; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const wd = d.getDay();
    const base = wd === 0 || wd === 6 ? 0.35 : 0.8;
    const r = rnd();
    const count = r < 1 - base ? 0 : Math.floor(rnd() * 4) + 1;
    if (count) history.push({ date: dstr(d), count });
  }
  const mk = (title, done, tag, description) => ({
    id: uid(), title, done, tag: tag || '', description: description || '', order: 0,
    createdAt: now.toISOString(),
    completedAt: done ? now.toISOString() : null,
  });
  const tasks = [
    mk('Morning walk — 20 minutes', true, 'Health', 'Loop around the reservoir before it gets hot. Water bottle first.'),
    mk('Review open pull requests', true, 'Work', 'Two PRs waiting: the SSE reconnect fix and the heatmap colours.'),
    mk('Design review with the team', false, 'Work', 'Walk through the new dashboard mocks — pastel cards, standby mode, the quote screensaver. Collect feedback, not opinions.'),
    mk('Pay electricity bill', false, 'Home', 'Due before the 15th. Autopay is set up; just confirm the amount.'),
    mk('Read 10 pages', false, 'Personal', 'The Design of Everyday Things, chapter 4 — knowledge in the head vs. the world.'),
    mk('Prep tomorrow’s standup notes', false, 'Work', 'Three bullets: shipped, blocked, next. Keep it under two minutes.'),
  ];
  tasks.forEach((x, i) => { x.order = i; });
  const ev = (title, date, start, end, color) => ({ id: uid(), title, date, start, end, color });
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  const events = [
    ev('Standup', t, '09:00', '09:30', 'lav'),
    ev('Deep work — personal dashboard', t, '11:00', '12:30', 'mint'),
    ev('Design review', t, '14:00', '15:00', 'pink'),
    ev('Gym', t, '18:30', '19:15', 'butter'),
    ev('Reading wind-down', t, '21:00', '21:30', 'sky'),
    ev('Dentist appointment', dstr(tomorrow), '10:00', '11:00', 'peach'),
  ];
  const alarms = [
    { id: uid(), label: 'Wake up', time: '07:00', days: [1, 2, 3, 4, 5], enabled: true, lastFired: '' },
    { id: uid(), label: 'Wind down, screens off', time: '22:30', days: [0, 1, 2, 3, 4, 5, 6], enabled: true, lastFired: '' },
  ];
  const later = new Date(now.getTime() + 2 * 3600e3);
  const reminders = [
    { id: uid(), label: 'Stretch + water break', at: `${dstr(later)}T${hhmm(later)}`, fired: false },
  ];
  const notes = [
    { id: uid(), text: 'Book to read next: The Design of Everyday Things', color: 'pink', createdAt: now.toISOString() },
    { id: uid(), text: 'Weekend idea: trail ride at the reservoir', color: 'mint', createdAt: now.toISOString() },
    { id: uid(), text: 'Router admin page lives at the gateway address', color: 'butter', createdAt: now.toISOString() },
  ];
  return {
    tasks, events, alarms, reminders, notes, history,
    settings: {
      name: 'Alex',
      theme: 'light',
      brightness: 80,
      muted: false,
      volume: 80,
      ringtone: '',
      skyMode: 'auto',
      sunOffset: 0,
      saverCycle: 'rotate',
      screensaver: { mode: 'standby', idleMin: 5, video: '', nightRed: true },
      autoOffMin: 20,
      pomo: { focus: 25, short: 5, long: 15, every: 4, autoNext: false },
      weather: { lat: null, lon: null, label: '' },
    },
    pomo: { phase: 'focus', running: false, endsAt: 0, remainingMs: 25 * 60000, cycles: 0, log: [] },
  };
}

let state;
try {
  state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
} catch {
  state = seed();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}
mergeSettings(state.settings, {});

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const tmp = STATE_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(state));
    fs.renameSync(tmp, STATE_FILE);
  }, 200);
}

const sseClients = new Set();
let currentPage = 1;
function broadcast(type, payload) {
  const msg = `data: ${JSON.stringify({ type, ...payload })}\n\n`;
  for (const res of sseClients) res.write(msg);
}
function pushState() { broadcast('state', { state }); }
function mutate(fn) { fn(state); save(); pushState(); }

function bumpHistory(date, delta) {
  const e = state.history.find(h => h.date === date);
  if (e) { e.count = Math.max(0, e.count + delta); if (!e.count) state.history = state.history.filter(h => h !== e); }
  else if (delta > 0) state.history.push({ date, count: delta });
}

/* ---------- weather ---------- */
let weatherCache = { at: 0, data: null };
async function getWeather() {
  if (weatherCache.data && Date.now() - weatherCache.at < 15 * 60e3) return weatherCache.data;
  let { lat, lon, label } = state.settings.weather;
  if (lat == null || lon == null) {
    try {
      const r = await fetch('http://ip-api.com/json/?fields=status,lat,lon,city', { signal: AbortSignal.timeout(4000) });
      const j = await r.json();
      if (j.status === 'success') {
        lat = j.lat; lon = j.lon; label = j.city;
        state.settings.weather = { lat, lon, label }; save(); pushState();
      }
    } catch { /* offline */ }
  }
  if (lat == null) return { offline: true };
  try {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=4`;
    const r = await fetch(u, { signal: AbortSignal.timeout(6000) });
    const j = await r.json();
    weatherCache = { at: Date.now(), data: { offline: false, label, current: j.current, daily: j.daily } };
    return weatherCache.data;
  } catch {
    return weatherCache.data ? { ...weatherCache.data, stale: true } : { offline: true };
  }
}

/* ---------- display agent ---------- */
async function displayCmd(body) {
  if (!AGENT_URL) return { ok: false, offline: true };
  try {
    const r = await fetch(AGENT_URL + '/cmd', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-dayboard-token': AGENT_TOKEN },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(2500),
    });
    return await r.json();
  } catch {
    return { ok: false, offline: true };
  }
}

/* ---------- hardware alerts ---------- */
let hwPrev = null, lastTempAlert = 0;
async function pollHardware() {
  if (!AGENT_URL) return;
  try {
    const r = await fetch(AGENT_URL + '/', { headers: { 'x-dayboard-token': AGENT_TOKEN }, signal: AbortSignal.timeout(2500) });
    const hw = await r.json();
    if (!hw.ok) return;
    const alerts = [];
    if (hwPrev) {
      if (hwPrev.ethernet?.up && hw.ethernet && !hw.ethernet.up) {
        alerts.push({ kind: 'ethernet', title: 'Ethernet unplugged', msg: `${hw.ethernet.iface} lost link — the remote may not reach this display until the cable is back.` });
      }
      if (hwPrev.battery?.status === 'Charging' && hw.battery && !['Charging', 'Full'].includes(hw.battery.status)) {
        alerts.push({ kind: 'battery', title: 'Battery stopped charging', msg: `Adapter disconnected or charging paused — ${hw.battery.status}${hw.battery.capacity != null ? `, ${hw.battery.capacity}% remaining` : ''}.` });
      }
    }
    if (hw.tempC != null && hw.tempC > 100 && (hwPrev?.tempC == null || hwPrev.tempC <= 100 || Date.now() - lastTempAlert > 300e3)) {
      alerts.push({ kind: 'temp', title: 'High temperature', msg: `${Math.round(hw.tempC)}°C — above the 100°C threshold. Check airflow and cooling.` });
      lastTempAlert = Date.now();
    }
    hwPrev = hw;
    for (const a of alerts) broadcast('alert', { ...a, at: Date.now() });
  } catch { /* agent offline */ }
}
setInterval(pollHardware, 5000);
pollHardware();

/* ---------- timers ---------- */
let tickCount = 0;
setInterval(() => {
  const now = new Date();
  tickCount++;
  const p = state.pomo;
  if (p.running && now.getTime() >= p.endsAt) {
    const dur = m => m * 60000;
    if (p.phase === 'focus') {
      p.cycles++;
      p.log.push({ date: today(), minutes: state.settings.pomo.focus });
      p.phase = p.cycles % state.settings.pomo.every === 0 ? 'long' : 'short';
    } else {
      p.phase = 'focus';
    }
    p.remainingMs = dur(state.settings.pomo[p.phase]);
    p.running = state.settings.pomo.autoNext;
    p.endsAt = now.getTime() + p.remainingMs;
    save(); pushState();
    broadcast('pomo-done', { phase: p.phase });
  }
  if (tickCount % 5 === 0) {
    const t = today(); const hm = hhmm(now); const wd = now.getDay();
    let fired = null;
    for (const a of state.alarms) {
      if (a.enabled && a.time === hm && a.days.includes(wd) && a.lastFired !== t) {
        a.lastFired = t; fired = { kind: 'alarm', id: a.id, label: a.label, time: a.time };
      }
    }
    for (const r of state.reminders) {
      if (!r.fired && r.at <= `${t}T${hm}`) {
        r.fired = true; fired = { kind: 'reminder', id: r.id, label: r.label, time: r.at.slice(11, 16) };
      }
    }
    if (fired) { save(); pushState(); broadcast('alarm', fired); }
  }
}, 1000);

setInterval(() => { for (const res of sseClients) res.write(': ping\n\n'); }, 25000);

/* ---------- http helpers ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.mov': 'video/quicktime', '.m4v': 'video/x-m4v', '.json': 'application/json',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.aac': 'audio/aac',
  '.ico': 'image/x-icon',
};
function send(res, code, body, headers = {}) {
  res.writeHead(code, headers);
  res.end(body);
}
function json(res, code, obj) {
  send(res, code, JSON.stringify(obj), { 'content-type': 'application/json', 'cache-control': 'no-store' });
}
function readBody(req, limit = 1e6) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}
function serveFile(res, file, range) {
  fs.stat(file, (err, st) => {
    if (err) return send(res, 404, 'not found');
    const ext = path.extname(file).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const headers = { 'content-type': type, 'accept-ranges': 'bytes', 'cache-control': ['.html', '.js', '.css'].includes(ext) ? 'no-store' : 'public, max-age=3600' };
    if (range && /^bytes=\d*-\d*$/.test(range)) {
      let [s, e] = range.replace('bytes=', '').split('-');
      let start = s === '' ? st.size - Number(e) : Number(s);
      let end = s === '' ? st.size - 1 : (e === '' ? st.size - 1 : Math.min(Number(e), st.size - 1));
      if (isNaN(start) || start < 0 || start > end) { res.writeHead(416, { 'content-range': `bytes */${st.size}` }); return res.end(); }
      res.writeHead(206, { ...headers, 'content-range': `bytes ${start}-${end}/${st.size}`, 'content-length': end - start + 1 });
      fs.createReadStream(file, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { ...headers, 'content-length': st.size });
      fs.createReadStream(file).pipe(res);
    }
  });
}

const COLORS = ['mint', 'pink', 'butter', 'lav', 'sky', 'peach'];
const clean = (s, max = 200) => String(s ?? '').slice(0, max);
const isTime = s => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s);

function mergeSettings(dst, src) {
  if (!('ringtone' in dst)) dst.ringtone = '';
  if (!('volume' in dst)) dst.volume = 80;
  if (!('skyMode' in dst)) dst.skyMode = dst.sky === false ? 'off' : 'auto';
  delete dst.sky;
  if (!('sunOffset' in dst)) dst.sunOffset = 0;
  if (!('saverCycle' in dst)) dst.saverCycle = 'rotate';
  for (const [k, v] of Object.entries(src || {})) {
    if (k === 'screensaver' || k === 'pomo' || k === 'weather') dst[k] = { ...dst[k], ...(v || {}) };
    else if (k === 'sky') dst.skyMode = v === false ? 'off' : v === true ? 'auto' : v;
    else if (k in dst) dst[k] = v;
  }
  dst.brightness = Math.max(5, Math.min(100, Number(dst.brightness) || 80));
  dst.volume = Math.max(0, Math.min(100, Number(dst.volume) || 0));
  dst.sunOffset = Math.max(-6, Math.min(6, Number(dst.sunOffset) || 0));
  if (!['auto', 'on', 'off'].includes(dst.skyMode)) dst.skyMode = 'auto';
  if (!['rotate', 'clock', 'quote', 'tasks'].includes(dst.saverCycle)) dst.saverCycle = 'rotate';
  dst.screensaver.idleMin = Math.max(1, Math.min(120, Number(dst.screensaver.idleMin) || 5));
  dst.autoOffMin = Math.max(0, Math.min(240, Number(dst.autoOffMin) || 0));
  if (!['standby', 'video', 'off'].includes(dst.screensaver.mode)) dst.screensaver.mode = 'standby';
  if (!['light', 'dark', 'auto'].includes(dst.theme)) dst.theme = 'light';
}

/* ---------- router ---------- */
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const p = u.pathname;
  const m = req.method;
  try {
    if (p === '/api/events' && m === 'GET') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
      res.write(`data: ${JSON.stringify({ type: 'state', state })}\n\n`);
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return;
    }
    if (p === '/api/state' && m === 'GET') return json(res, 200, { state, now: Date.now(), page: currentPage });
    if (p === '/api/page' && m === 'POST') {
      const b = await readBody(req);
      const n = Number(b.page);
      if (n >= 1 && n <= 6) { currentPage = n; broadcast('page', { page: n }); }
      return json(res, 200, { ok: true });
    }
    if (p === '/api/weather' && m === 'GET') return json(res, 200, await getWeather());

    if (p === '/api/display' && m === 'POST') {
      const b = await readBody(req);
      if (b.cmd === 'brightness') state.settings.brightness = Math.max(5, Math.min(100, Number(b.value) || 80));
      if (b.cmd === 'mute') state.settings.muted = !!b.value;
      save(); pushState();
      return json(res, 200, await displayCmd(b));
    }
    if (p === '/api/wake' && m === 'POST') { broadcast('wake', {}); return json(res, 200, await displayCmd({ cmd: 'on' })); }
    if (p === '/api/sleep' && m === 'POST') { broadcast('sleep', {}); return json(res, 200, { ok: true }); }
    if (p === '/api/saver' && m === 'POST') { broadcast('saver', {}); return json(res, 200, { ok: true }); }
    if (p === '/api/chime' && m === 'POST') { broadcast('chime', { kind: 'alarm' }); return json(res, 200, { ok: true }); }
    if (p === '/api/alert' && m === 'POST') {
      const b = await readBody(req);
      const kind = ['ethernet', 'battery', 'temp', 'custom'].includes(b.kind) ? b.kind : 'custom';
      const def = {
        ethernet: ['Ethernet unplugged', 'Network cable disconnected — the remote may not reach this display until the cable is back.'],
        battery: ['Battery stopped charging', 'Adapter disconnected or charging paused.'],
        temp: ['High temperature', 'Above the 100°C threshold — check airflow and cooling.'],
        custom: ['Alert', ''],
      }[kind];
      const title = clean(b.title, 80).trim() || def[0];
      const msg = clean(b.msg, 200).trim() || def[1];
      broadcast('alert', { kind, title, msg, at: Date.now() });
      return json(res, 200, { ok: true });
    }

    if (p === '/api/settings' && m === 'PATCH') {
      const b = await readBody(req);
      mutate(s => mergeSettings(s.settings, b));
      if (b.screensaver?.video !== undefined || b.theme) weatherCache.at = 0;
      return json(res, 200, { ok: true });
    }

    const coll = (name) => {
      const base = `/api/${name}`;
      if (p === base && m === 'POST') return true;
      if (p.startsWith(base + '/') && (m === 'PATCH' || m === 'DELETE')) return true;
      return false;
    };

    if (coll('tasks')) {
      const id = p.split('/')[3];
      if (m === 'POST') {
        const b = await readBody(req);
        if (!clean(b.title).trim()) return json(res, 400, { error: 'title required' });
        mutate(s => {
          s.tasks.push({ id: b.id || uid(), title: clean(b.title), done: !!b.done, tag: clean(b.tag, 24), description: clean(b.description, 1000), order: b.order ?? s.tasks.length, createdAt: b.createdAt || new Date().toISOString(), completedAt: b.done ? (b.completedAt || new Date().toISOString()) : null });
          if (b.done) bumpHistory(dstr(new Date(b.completedAt || Date.now())), 1);
        });
      } else if (m === 'PATCH') {
        const b = await readBody(req);
        mutate(s => {
          const t = s.tasks.find(x => x.id === id); if (!t) return;
          if (b.title !== undefined) t.title = clean(b.title);
          if (b.tag !== undefined) t.tag = clean(b.tag, 24);
          if (b.description !== undefined) t.description = clean(b.description, 1000);
          if (b.done !== undefined && b.done !== t.done) {
            t.done = !!b.done;
            t.completedAt = t.done ? new Date().toISOString() : null;
            bumpHistory(today(), t.done ? 1 : -1);
          }
        });
      } else {
        mutate(s => { s.tasks = s.tasks.filter(x => x.id !== id); });
      }
      return json(res, 200, { ok: true });
    }
    if (p === '/api/tasks/reorder' && m === 'POST') {
      const b = await readBody(req);
      mutate(s => { (b.ids || []).forEach((id, i) => { const t = s.tasks.find(x => x.id === id); if (t) t.order = i; }); });
      return json(res, 200, { ok: true });
    }

    if (coll('events')) {
      const id = p.split('/')[3];
      if (m === 'POST') {
        const b = await readBody(req);
        if (!clean(b.title).trim() || !isDate(b.date) || !isTime(b.start) || !isTime(b.end)) return json(res, 400, { error: 'invalid event' });
        mutate(s => s.events.push({ id: b.id || uid(), title: clean(b.title), date: b.date, start: b.start, end: b.end, color: COLORS.includes(b.color) ? b.color : 'mint' }));
      } else if (m === 'PATCH') {
        const b = await readBody(req);
        mutate(s => {
          const e = s.events.find(x => x.id === id); if (!e) return;
          if (b.title !== undefined) e.title = clean(b.title);
          if (isDate(b.date)) e.date = b.date;
          if (isTime(b.start)) e.start = b.start;
          if (isTime(b.end)) e.end = b.end;
          if (COLORS.includes(b.color)) e.color = b.color;
        });
      } else mutate(s => { s.events = s.events.filter(x => x.id !== id); });
      return json(res, 200, { ok: true });
    }

    if (coll('alarms')) {
      const id = p.split('/')[3];
      if (m === 'POST') {
        const b = await readBody(req);
        if (!isTime(b.time)) return json(res, 400, { error: 'invalid time' });
        mutate(s => s.alarms.push({ id: b.id || uid(), label: clean(b.label, 80) || 'Alarm', time: b.time, days: Array.isArray(b.days) ? b.days.filter(d => d >= 0 && d <= 6) : [0, 1, 2, 3, 4, 5, 6], enabled: b.enabled !== false, lastFired: '' }));
      } else if (m === 'PATCH') {
        const b = await readBody(req);
        mutate(s => {
          const a = s.alarms.find(x => x.id === id); if (!a) return;
          if (b.label !== undefined) a.label = clean(b.label, 80);
          if (isTime(b.time)) { a.time = b.time; a.lastFired = ''; }
          if (Array.isArray(b.days)) a.days = b.days.filter(d => d >= 0 && d <= 6);
          if (b.enabled !== undefined) a.enabled = !!b.enabled;
        });
      } else mutate(s => { s.alarms = s.alarms.filter(x => x.id !== id); });
      return json(res, 200, { ok: true });
    }

    if (coll('reminders')) {
      const id = p.split('/')[3];
      if (m === 'POST') {
        const b = await readBody(req);
        if (!/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(b.at || '')) return json(res, 400, { error: 'invalid datetime' });
        mutate(s => s.reminders.push({ id: b.id || uid(), label: clean(b.label, 120) || 'Reminder', at: b.at, fired: false }));
      } else if (m === 'PATCH') {
        const b = await readBody(req);
        mutate(s => {
          const r = s.reminders.find(x => x.id === id); if (!r) return;
          if (b.label !== undefined) r.label = clean(b.label, 120);
          if (b.at) { r.at = b.at; r.fired = false; }
          if (b.fired !== undefined) r.fired = !!b.fired;
        });
      } else mutate(s => { s.reminders = s.reminders.filter(x => x.id !== id); });
      return json(res, 200, { ok: true });
    }

    if (coll('notes')) {
      const id = p.split('/')[3];
      if (m === 'POST') {
        const b = await readBody(req);
        if (!clean(b.text, 500).trim()) return json(res, 400, { error: 'text required' });
        mutate(s => s.notes.unshift({ id: b.id || uid(), text: clean(b.text, 500), color: COLORS.includes(b.color) ? b.color : 'butter', createdAt: b.createdAt || new Date().toISOString() }));
      } else if (m === 'PATCH') {
        const b = await readBody(req);
        mutate(s => {
          const n = s.notes.find(x => x.id === id); if (!n) return;
          if (b.text !== undefined) n.text = clean(b.text, 500);
          if (COLORS.includes(b.color)) n.color = b.color;
        });
      } else mutate(s => { s.notes = s.notes.filter(x => x.id !== id); });
      return json(res, 200, { ok: true });
    }

    if (p === '/api/pomo' && m === 'POST') {
      const b = await readBody(req);
      mutate(s => {
        const po = s.pomo; const dur = m2 => m2 * 60000;
        if (b.action === 'start') { po.running = true; po.endsAt = Date.now() + po.remainingMs; }
        if (b.action === 'pause') { po.running = false; po.remainingMs = Math.max(0, po.endsAt - Date.now()); }
        if (b.action === 'reset') { po.running = false; po.remainingMs = dur(s.settings.pomo[po.phase]); po.endsAt = 0; }
        if (b.action === 'skip') {
          po.running = false;
          po.phase = po.phase === 'focus' ? 'short' : 'focus';
          po.remainingMs = dur(s.settings.pomo[po.phase]); po.endsAt = 0;
        }
        if (b.phase && ['focus', 'short', 'long'].includes(b.phase)) {
          po.phase = b.phase; po.running = false; po.remainingMs = dur(s.settings.pomo[b.phase]); po.endsAt = 0;
        }
      });
      return json(res, 200, { ok: true });
    }

    if (p === '/api/video' && m === 'PUT') {
      const name = (u.searchParams.get('name') || 'video.mp4').replace(/[^a-zA-Z0-9._-]/g, '_');
      if (!/\.(mp4|webm|mov|m4v)$/i.test(name)) return json(res, 400, { error: 'unsupported format' });
      const file = path.join(VIDEOS, `${Date.now()}-${name}`);
      const ws = fs.createWriteStream(file);
      let size = 0;
      req.on('data', c => { size += c.length; if (size > 300e6) { req.destroy(); ws.destroy(); fs.unlink(file, () => {}); } });
      req.pipe(ws);
      ws.on('finish', () => {
        const url = '/media/' + path.basename(file);
        mutate(s => { s.settings.screensaver.video = url; });
        json(res, 200, { ok: true, url });
      });
      ws.on('error', () => json(res, 500, { error: 'write failed' }));
      return;
    }
    if (p === '/api/ringtone' && m === 'PUT') {
      const name = (u.searchParams.get('name') || 'ringtone.mp3').replace(/[^a-zA-Z0-9._-]/g, '_');
      if (!/\.(mp3|wav|ogg|m4a|aac)$/i.test(name)) return json(res, 400, { error: 'unsupported format' });
      const file = path.join(RINGTONES, `${Date.now()}-${name}`);
      const ws = fs.createWriteStream(file);
      let size = 0;
      req.on('data', c => { size += c.length; if (size > 20e6) { req.destroy(); ws.destroy(); fs.unlink(file, () => {}); } });
      req.pipe(ws);
      ws.on('finish', () => {
        const url = '/media/' + path.basename(file);
        mutate(s => { s.settings.ringtone = url; });
        json(res, 200, { ok: true, url });
      });
      ws.on('error', () => json(res, 500, { error: 'write failed' }));
      return;
    }
    if (p.startsWith('/media/') && m === 'GET') {
      const base = path.basename(p);
      let file = path.join(VIDEOS, base);
      if (!fs.existsSync(file)) file = path.join(RINGTONES, base);
      return serveFile(res, file, req.headers.range);
    }

    if (m === 'GET') {
      let file = p === '/' ? '/index.html' : p === '/remote' ? '/remote.html' : p;
      file = path.normalize(file).replace(/^([/\\])+/, '');
      const full = path.join(PUBLIC, file);
      if (!full.startsWith(PUBLIC)) return send(res, 403, 'forbidden');
      if (full.endsWith('.html')) {
        return fs.readFile(full, 'utf8', (err, txt) => {
          if (err) return send(res, 404, 'not found');
          txt = txt.replace(/(href|src)="\/(style\.css|app\.js|remote\.js)"/g, `$1="/$2?v=${BUILD}"`);
          send(res, 200, txt, { 'content-type': MIME['.html'], 'cache-control': 'no-store' });
        });
      }
      return serveFile(res, full, req.headers.range);
    }
    send(res, 405, 'method not allowed');
  } catch (e) {
    json(res, 400, { error: String(e.message || e) });
  }
});

server.listen(PORT, HOST, () => console.log(`dayboard listening on ${HOST}:${PORT}`));