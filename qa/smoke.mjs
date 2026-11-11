import puppeteer from 'puppeteer-core';

const BASE = process.env.QA_BASE || 'http://localhost:4000';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1366, height: 768 });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 2500));
await page.screenshot({ path: 'qa/shots/deploy-1-today.png' });
for (const [key, name] of [['ArrowRight', 'deploy-2-schedule'], ['ArrowRight', 'deploy-3-alarms'], ['ArrowRight', 'deploy-4-focus'], ['ArrowRight', 'deploy-5-extras']]) {
  await page.keyboard.press(key);
  await new Promise(r => setTimeout(r, 900));
  await page.screenshot({ path: `qa/shots/${name}.png` });
}

const remote = await browser.newPage();
await remote.setViewport({ width: 390, height: 844 });
await remote.goto(BASE + '/remote', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 1800));
await remote.screenshot({ path: 'qa/shots/deploy-6-remote.png' });

console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
await browser.close();