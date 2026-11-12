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

/* ---------- scrollspy ---------- */
const spyLinks = $$('[data-spy]');
const spy = new IntersectionObserver(entries => {
  for (const en of entries) {
    if (en.isIntersecting) {
      spyLinks.forEach(a => a.classList.toggle('on', a.dataset.spy === en.target.id));
    }
  }
}, { rootMargin: '-35% 0px -55% 0px' });
['features', 'film', 'about'].forEach(id => { const el = document.getElementById(id); if (el) spy.observe(el); });

/* ---------- reveal on scroll ---------- */
const rv = new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); rv.unobserve(en.target); } });
}, { threshold: 0.12 });
$$('.rv').forEach(el => rv.observe(el));

/* ---------- soon-links ---------- */
$$('[data-soon]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  toast(`${a.dataset.soon} link lands here soon — Sai is still wiring it up.`);
}));