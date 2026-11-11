import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new', args: ['--no-sandbox'],
});
const p = await b.newPage();
await p.setViewport({ width: 1366, height: 768 });
await p.goto('http://localhost:4000/', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 1500));
await p.evaluate(() => startSaver(true));
await new Promise(r => setTimeout(r, 300));
await p.screenshot({ path: 'qa/shots/r3-4b-wipe-early.png' });
await new Promise(r => setTimeout(r, 250));
await p.screenshot({ path: 'qa/shots/r3-4c-wipe-mid.png' });
await new Promise(r => setTimeout(r, 250));
await p.screenshot({ path: 'qa/shots/r3-4e-wipe-late.png' });
await p.evaluate(() => wake());
await b.close();