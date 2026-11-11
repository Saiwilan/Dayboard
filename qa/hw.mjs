import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = 4101, AGENT_PORT = 8099;
let fails = 0, checks = 0;
const ok = (name, cond, extra = '') => { checks++; if (!cond) fails++; console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' (' + extra + ')' : ''}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* stub display agent: phase 0 = all healthy, 1 = ethernet down, 2 = battery discharging too */
let phase = 0, polls = 0, badToken = 0;
const stub = http.createServer((req, res) => {
  if (req.headers['x-dayboard-token'] !== 'hw-test') { badToken++; res.writeHead(401); return res.end('{}'); }
  polls++;
  const hw = {
    ok: true, tempC: 55,
    ethernet: { up: phase < 1, iface: 'eth0' },
    battery: { status: phase < 2 ? 'Charging' : 'Discharging', capacity: 62 },
  };
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify(hw));
});
await new Promise(r => stub.listen(AGENT_PORT, '127.0.0.1', r));
const unauth = await fetch(`http://127.0.0.1:${AGENT_PORT}/`);
ok('agent rejects missing token', unauth.status === 401);

/* isolated server copy so the real data/state.json is untouched */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dayboard-hw-'));
fs.copyFileSync(path.join(ROOT, 'server.mjs'), path.join(tmp, 'server.mjs'));
fs.cpSync(path.join(ROOT, 'public'), path.join(tmp, 'public'), { recursive: true });
const child = spawn(process.execPath, ['server.mjs'], {
  cwd: tmp,
  env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', DISPLAY_AGENT_URL: `http://127.0.0.1:${AGENT_PORT}`, DISPLAY_AGENT_TOKEN: 'hw-test' },
  stdio: 'ignore',
});
const BASE = `http://127.0.0.1:${PORT}`;
let up = false;
for (let i = 0; i < 40 && !up; i++) { await sleep(250); try { up = (await fetch(BASE + '/api/state')).ok; } catch { } }
ok('test server boots with agent configured', up);

/* collect SSE alerts */
const ac = new AbortController();
const alerts = [];
const streamDone = (async () => {
  const r = await fetch(BASE + '/api/events', { signal: ac.signal });
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const chunk = buf.slice(0, i); buf = buf.slice(i + 2);
        const line = chunk.split('\n').find(l => l.startsWith('data:'));
        if (!line) continue;
        try { const m = JSON.parse(line.slice(5)); if (m.type === 'alert') alerts.push(m); } catch { }
      }
    }
  } catch { }
})();

/* wait for first healthy poll, then unplug ethernet */
for (let i = 0; i < 40 && polls < 1; i++) await sleep(250);
ok('first poll seen (no alert yet)', polls >= 1 && alerts.length === 0, `polls=${polls} alerts=${alerts.length}`);
phase = 1;
for (let i = 0; i < 40 && !alerts.some(a => a.kind === 'ethernet'); i++) await sleep(250);
const eth = alerts.find(a => a.kind === 'ethernet');
ok('ethernet unplug fires alert', !!eth, eth ? eth.title : 'timeout');
ok('ethernet alert names interface', !!eth && eth.msg.includes('eth0'));

/* then stop charging */
phase = 2;
for (let i = 0; i < 40 && !alerts.some(a => a.kind === 'battery'); i++) await sleep(250);
const bat = alerts.find(a => a.kind === 'battery');
ok('battery stop-charging fires alert', !!bat, bat ? bat.title : 'timeout');
ok('battery alert reports state', !!bat && bat.msg.includes('Discharging') && bat.msg.includes('62%'));

/* one more poll cycle: steady state must not re-alert */
const before = alerts.length;
await sleep(5600);
ok('no duplicate alerts while state stays down', alerts.length === before, `${before} -> ${alerts.length}`);
ok('agent token was sent on every poll', badToken === 1, `unauthed=${badToken}`);

ac.abort();
await streamDone;
child.kill();
stub.close();
await sleep(300);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(fails ? `\n${fails} FAILURES of ${checks}` : `\nALL PASS (${checks} checks)`);
process.exit(fails ? 1 : 0);