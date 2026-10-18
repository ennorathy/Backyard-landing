(function () {
  'use strict';

  /* ---------- Section nav: dots, prev/next, header links ---------- */
  const slides = Array.from(document.querySelectorAll('.slide'));
  const dotsEl = document.getElementById('dots');
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  const links = Array.from(document.querySelectorAll('.chrome .right a'));
  let idx = 0;

  slides.forEach((s, i) => {
    const d = document.createElement('span');
    d.className = 'nav-dot' + (i === 0 ? ' active' : '');
    d.addEventListener('click', () => go(i));
    dotsEl.appendChild(d);
  });

  function go(i) {
    if (i < 0 || i >= slides.length) return;
    slides[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setCurrent(i) {
    idx = i;
    Array.from(dotsEl.children).forEach((d, j) => d.classList.toggle('active', j === i));
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + slides[i].id));
    prev.disabled = i === 0;
    next.disabled = i === slides.length - 1;
  }

  prev.addEventListener('click', () => go(idx - 1));
  next.addEventListener('click', () => go(idx + 1));

  // Current section = the one crossing the middle of the viewport.
  const current = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) setCurrent(slides.indexOf(e.target)); });
  }, { rootMargin: '-50% 0px -50% 0px' });

  // Entrance animation plays once, when a section first scrolls into view.
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('active'); reveal.unobserve(e.target); }
    });
  }, { threshold: 0.15 });

  slides.forEach(s => { current.observe(s); reveal.observe(s); });
  setCurrent(0);

  /* ---------- Partner logos ---------- */
  // A logo that is not on the server yet falls back to the company name as text.
  document.querySelectorAll('.partner img[data-fallback]').forEach(img => {
    const toText = () => {
      const name = document.createElement('div');
      name.className = 'pname';
      name.textContent = img.dataset.fallback;
      img.replaceWith(name);
    };
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) toText();
    else img.addEventListener('error', toText, { once: true });
  });

  /* ---------- Live numbers from /landing.json ---------- */
  // The markup already holds fallback values; the file only replaces them.

  // Values arrive rounded DOWN by the worker (views to 5M, subscribers to 100K, titles to 100),
  // so the "+" after them is true; flooring here keeps it true for any other value too.
  function millions(n) {
    // 35000000 -> 35M, 3500000 -> 3.5M
    return trim(Math.floor(n / 1e5) / 10, 1) + 'M';
  }

  function thousands(n) {
    // 1700 -> 1.7K, 2000 -> 2K
    return n >= 1e3 ? trim(Math.floor(n / 100) / 10, 1) + 'K' : String(Math.floor(n));
  }

  function trim(x, digits) {
    return String(Number(x.toFixed(digits)));
  }

  function subs(n) {
    if (n >= 1e6) return trim(n / 1e6, 2) + 'M';
    if (n >= 1e3) return trim(n / 1e3, n >= 1e5 ? 0 : 1) + 'K';
    return String(n);
  }

  function isNum(v) { return typeof v === 'number' && isFinite(v) && v >= 0; }

  function safeUrl(u) {
    try {
      const url = new URL(u);
      return url.protocol === 'https:' && /(^|\.)youtube\.com$/.test(url.hostname) ? url.href : null;
    } catch (_) { return null; }
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function setText(key, value) {
    document.querySelectorAll('[data-bind="' + key + '"]').forEach(n => { n.textContent = value; });
  }

  const MAX_CHANNELS = 9;   // the 10th cell is "And others"

  function safeAvatar(u) {
    try {
      const url = new URL(u);
      return url.protocol === 'https:' && /(^|\.)(ggpht|ytimg|googleusercontent)\.com$/.test(url.hostname) ? url.href : null;
    } catch (_) { return null; }
  }

  function avatar(c) {
    const box = el('span', 'avatar', String(c.name).trim().charAt(0));
    const src = safeAvatar(c.avatar_url);
    if (src) {
      const img = document.createElement('img');
      img.alt = ''; img.referrerPolicy = 'no-referrer'; img.src = src;
      img.addEventListener('load', () => { box.textContent = ''; box.append(img); });
    }
    return box;
  }

  function moreCell() {
    const m = el('div', 'channel more');
    const top = el('div', 'row-top');
    top.append(el('span', 'lang-tag', '+'));
    m.append(top, el('div', 'name', 'And others'));
    return m;
  }

  function renderChannels(list) {
    const grid = document.getElementById('channels-grid');
    // The worker sends channels already ranked by last month's views.
    const cards = list.map(c => {
      const href = safeUrl(c.url);
      if (!href || !c.name) return null;
      const a = el('a', 'channel');
      a.href = href; a.target = '_blank'; a.rel = 'noopener';
      const top = el('div', 'row-top');
      const id = el('span', 'ch-id');
      id.append(avatar(c), el('span', 'lang-tag', String(c.language || '').toUpperCase()));
      top.append(id, el('span', 'arrow', '↗'));
      a.append(top, el('div', 'name', c.name));
      if (isNum(c.subscribers)) a.append(el('div', 'subs', subs(c.subscribers) + ' subs'));
      return a;
    }).filter(Boolean).slice(0, MAX_CHANNELS);
    if (cards.length) grid.replaceChildren(...cards, moreCell());
  }

  function apply(d) {
    // Titles are rounded UP to the next 500: 1700 -> 2K, 2100 -> 2.5K.
    if (isNum(d.titles)) setText('titles', thousands(Math.ceil(d.titles / 500) * 500));
    if (isNum(d.views)) setText('views', millions(d.views));
    if (isNum(d.subscribers_total)) setText('subscribers_total', millions(d.subscribers_total));
    if (isNum(d.active_channels)) setText('active_channels', String(d.active_channels));
    if (Array.isArray(d.channels)) renderChannels(d.channels);
  }

  /* ---------- Site links heat up while hovered ----------
     --heat goes 0 -> 1 the longer the cursor stays on the link and back to 0 after it leaves.
     CSS turns it into the glow; fluid.js reads el._heat and lets smoke rise from the letters. */
  const HEAT_UP = 3.0;   // seconds of hovering to reach full heat
  const COOL_DOWN = 1.0; // seconds to cool from full heat
  const hotLinks = Array.from(document.querySelectorAll('[data-smoke]'));
  let heatFrame = 0, heatLast = 0;
  function heatTick(t) {
    const dt = heatLast ? Math.min((t - heatLast) / 1000, 0.1) : 0;
    heatLast = t;
    let busy = false;
    hotLinks.forEach(el => {
      const h = el._heat || 0;
      const next = el._hover ? Math.min(1, h + dt / HEAT_UP) : Math.max(0, h - dt / COOL_DOWN);
      el._heat = next;
      // ease-out: the glow comes on quickly, then keeps brightening more slowly
      el.style.setProperty('--heat', (1 - (1 - next) * (1 - next)).toFixed(3));
      if (el._hover || next > 0) busy = true;
    });
    heatFrame = busy ? requestAnimationFrame(heatTick) : 0;
    if (!busy) heatLast = 0;
  }
  // Mouse only: a tap on a phone would leave the link glowing until the next tap elsewhere.
  hotLinks.forEach(el => {
    el.addEventListener('pointerenter', e => {
      if (e.pointerType !== 'mouse') return;
      el._hover = true;
      if (!heatFrame) heatFrame = requestAnimationFrame(heatTick);
    });
    el.addEventListener('pointerleave', () => { el._hover = false; });
  });

  fetch('/landing.json', { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(apply)
    .catch(() => { /* keep the fallback numbers in the markup */ });
})();
