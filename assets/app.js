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

  /* ---------- Live numbers from /landing.json ---------- */
  // The markup already holds fallback values; the file only replaces them.

  function millions(n) {
    // Values arrive pre-rounded (views to 5M, subscribers to 1M); ceil keeps "+" honest otherwise.
    const m = Math.ceil(n / 1e6);
    return m.toLocaleString('en-US') + 'M';
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

  function renderChannels(list) {
    const grid = document.getElementById('channels-grid');
    const cards = list.map(c => {
      const href = safeUrl(c.url);
      if (!href || !c.name) return null;
      const a = el('a', 'channel');
      a.href = href; a.target = '_blank'; a.rel = 'noopener';
      const top = el('div', 'row-top');
      top.append(el('span', 'lang-tag', String(c.language || '').toUpperCase()), el('span', 'arrow', '↗'));
      a.append(top, el('div', 'name', c.name));
      if (isNum(c.subscribers)) a.append(el('div', 'subs', subs(c.subscribers) + ' subs'));
      return a;
    }).filter(Boolean);
    if (cards.length) grid.replaceChildren(...cards);
  }

  function renderLanguages(list) {
    const grid = document.getElementById('langs-grid');
    const items = list.filter(l => l && l.code).map(l => {
      const item = el('div', 'lang-item' + (l.has_channel ? '' : ' soon'));
      item.append(
        el('span', 'code', String(l.code).toUpperCase()),
        el('span', 'lname', l.name || String(l.code).toUpperCase()),
        el('span', 'state', l.has_channel ? 'Live' : 'Will be soon')
      );
      return item;
    });
    // Languages with a channel first, the rest keep their order.
    items.sort((a, b) => a.classList.contains('soon') - b.classList.contains('soon'));
    if (items.length) grid.replaceChildren(...items);
  }

  function apply(d) {
    if (isNum(d.titles)) setText('titles', Math.ceil(d.titles).toLocaleString('en-US'));
    if (isNum(d.views)) setText('views', millions(d.views));
    if (isNum(d.subscribers_total)) setText('subscribers_total', millions(d.subscribers_total));
    if (isNum(d.active_channels)) setText('active_channels', String(d.active_channels));
    if (Array.isArray(d.channels)) renderChannels(d.channels);
    if (Array.isArray(d.languages)) renderLanguages(d.languages);
  }

  fetch('/landing.json', { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(apply)
    .catch(() => { /* keep the fallback numbers in the markup */ });
})();
