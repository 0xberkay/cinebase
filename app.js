// Scroll reveal
const els = document.querySelectorAll('.hero-copy, .hero-phone, .feature-text, .feature-shot, .step, .cta > *, .flow > h2, .flow > .eyebrow');
els.forEach(el => el.classList.add('reveal'));
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
els.forEach(el => io.observe(el));

// Before / after comparison slider
(function () {
  const ba = document.getElementById('ba');
  if (!ba) return;
  const wrap = ba.querySelector('.ba-before-wrap');
  const divider = document.getElementById('ba-divider');
  const handle = document.getElementById('ba-handle');
  let dragging = false;

  function setPos(pct) {
    pct = Math.max(0, Math.min(100, pct));
    wrap.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    divider.style.left = pct + '%';
    handle.style.left = pct + '%';
  }
  function fromEvent(e) {
    const r = ba.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    setPos((x / r.width) * 100);
  }
  const start = (e) => { dragging = true; fromEvent(e); };
  const move = (e) => { if (dragging) { fromEvent(e); e.preventDefault(); } };
  const end = () => { dragging = false; };

  ba.addEventListener('pointerdown', start);
  addEventListener('pointermove', move, { passive: false });
  addEventListener('pointerup', end);

  // keyboard support
  handle.addEventListener('keydown', (e) => {
    const cur = parseFloat(divider.style.left) || 50;
    if (e.key === 'ArrowLeft') setPos(cur - 4);
    if (e.key === 'ArrowRight') setPos(cur + 4);
  });

  // gentle auto-demo nudge when it first scrolls into view
  const demo = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      demo.disconnect();
      let t = 0;
      const id = setInterval(() => {
        t += 0.06;
        setPos(50 + Math.sin(t) * 30);
        if (t > Math.PI) { clearInterval(id); setPos(50); }
      }, 16);
    });
  }, { threshold: 0.5 });
  demo.observe(ba);
})();

// Register service worker for PWA/offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
