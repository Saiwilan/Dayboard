import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 1366, height: 768 });
await p.goto('http://localhost:4000/', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 2000));
await p.keyboard.press('6');
await new Promise(r => setTimeout(r, 700));
const info = await p.evaluate(() => {
  const sc = document.querySelector('.settings-scroll');
  const cards = [...sc.children].map(c => ({ h: c.querySelector('h3')?.textContent, w: Math.round(c.getBoundingClientRect().width), right: Math.round(c.getBoundingClientRect().right) }));
  const wide = [];
  sc.querySelectorAll('*').forEach(el => { if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) wide.push({ cls: el.className.toString().slice(0, 40), sw: el.scrollWidth, cw: el.clientWidth }); });
  return { scw: sc.scrollWidth, scc: sc.clientWidth, cards, wide: wide.slice(0, 12) };
});
console.log(JSON.stringify(info, null, 1));
await b.close();