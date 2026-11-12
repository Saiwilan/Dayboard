const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ---------- toast ---------- */
let toastTimer = null;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 2600);
}

/* ---------- mobile menu ---------- */
const burger = $('#burger'), panel = $('#mobile-panel');
burger.addEventListener('click', () => {
  const open = panel.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(open));
});
panel.addEventListener('click', e => {
  if (e.target.closest('a')) { panel.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
});

/* ---------- copy buttons ---------- */
async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext !== false) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall through */ }
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  return ok;
}
$$('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
  const pre = document.getElementById(btn.dataset.copy);
  if (!pre) return;
  const ok = await copyText(pre.textContent.replace(/\n$/, ''));
  const label = btn.querySelector('span');
  if (ok) {
    btn.classList.add('done');
    label.textContent = 'Copied';
    toast('Copied to clipboard.');
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { btn.classList.remove('done'); label.textContent = 'Copy'; }, 1800);
  } else {
    toast('Copy blocked by the browser — select the text manually.');
  }
}));

/* ---------- agent tabs ---------- */
const HINTS = {
  qoder: 'Open a Qoder chat in any workspace and paste the prompt as your message. Qoder will run the shell steps itself and ask before anything risky.',
  claude: 'Run <code>claude</code> in your terminal (any directory), paste the prompt as your first message, and approve the shell steps as it goes.',
  codex: 'Run <code>codex</code> in your terminal, paste the prompt as your message, and approve the shell steps as it goes.',
};
const hint = $('#agent-hint');
$$('[data-agent]').forEach(btn => btn.addEventListener('click', () => {
  $$('[data-agent]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  hint.innerHTML = HINTS[btn.dataset.agent];
}));

/* ---------- scrollspy (nav + toc) + hash, scroll-position based ---------- */
const spyLinks = $$('.nav-links [data-spy]');
const tocLinks = $$('.toc a[href^="#"]');
const ids = [...new Set(tocLinks.map(a => a.getAttribute('href').slice(1)))];
const heads = ids.map(id => document.getElementById(id)).filter(Boolean);

function mark(id) {
  spyLinks.forEach(a => a.classList.toggle('on', a.dataset.spy === id));
  tocLinks.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
}
function currentHeading() {
  const line = window.scrollY + 140;
  let cur = heads.length ? heads[0].id : null;
  for (const h of heads) {
    if (h.getBoundingClientRect().top + window.scrollY <= line) cur = h.id;
  }
  return cur;
}
let raf = null;
function sync() {
  raf = null;
  const cur = currentHeading();
  if (!cur) return;
  mark(cur);
  if (location.hash !== '#' + cur) history.replaceState(null, '', '#' + cur);
}
window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(sync); }, { passive: true });
window.addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(sync); });
sync();

/* ---------- toc on mobile ---------- */
const toc = $('#toc');
const mobileMq = window.matchMedia('(max-width: 1024px)');
function syncToc() { if (mobileMq.matches) toc.removeAttribute('open'); else toc.setAttribute('open', ''); }
syncToc();
mobileMq.addEventListener('change', syncToc);
toc.addEventListener('click', e => {
  const a = e.target.closest('a');
  if (a && mobileMq.matches) toc.removeAttribute('open');
});