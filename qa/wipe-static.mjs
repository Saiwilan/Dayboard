import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new', args: ['--no-sandbox'],
});
const p = await b.newPage();
await p.setViewport({ width: 1366, height: 768 });
await p.goto('http://localhost:4000/', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 1500));
await p.evaluate(() => {
  document.querySelector('#wipe').classList.add('on');
  wipeFrame(0.5);
});
await new Promise(r => setTimeout(r, 400));
await p.screenshot({ path: 'qa/shots/r3-4d-wipe-static.png' });
const info = await p.evaluate(() => {
  const w = document.querySelector('#wipe');
  const cs = getComputedStyle(w);
  return { pos: cs.maskPosition || cs.webkitMaskPosition, size: cs.maskSize, bf: cs.backdropFilter || cs.webkitBackdropFilter };
});
console.log(JSON.stringify(info));
await b.close();