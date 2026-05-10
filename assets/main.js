/* ============================================================
   GAME SEED ASSETS — main.js
   ============================================================ */

/* ── 1. SCROLL REVEAL ───────────────────────────────────── */
(function initReveal() {
  // Mark elements so CSS can hide them before observer fires
  document.querySelectorAll('[data-reveal]').forEach(el => {
    const dir = el.dataset.reveal;
    el.classList.add('will-reveal');
    if (dir === 'left')  el.classList.add('from-left');
    if (dir === 'right') el.classList.add('from-right');
    if (dir === 'scale') el.classList.add('from-scale');
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.will-reveal').forEach(el => io.observe(el));
})();

/* ── 2. STAGGER HELPER ──────────────────────────────────── */
document.querySelectorAll('[data-stagger]').forEach(parent => {
  const base = parseFloat(parent.dataset.stagger) || 0.1;
  Array.from(parent.children).forEach((child, i) => {
    child.style.transitionDelay = (i * base) + 's';
  });
});

/* 2b. DOT CURSOR */
(function initDotCursor() {
  const dot = document.querySelector('.cursor-dot');
  if (!dot || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  window.addEventListener('mousemove', (e) => {
    dot.classList.add('is-active');
    dot.style.left = e.clientX + 'px';
    dot.style.top = e.clientY + 'px';
    dot.classList.toggle('is-hovering', Boolean(e.target.closest('a, button, .bcard, .soc-link')));
  });
  window.addEventListener('mousedown', () => dot.classList.add('is-pressed'));
  window.addEventListener('mouseup', () => dot.classList.remove('is-pressed'));
  document.addEventListener('mouseleave', () => dot.classList.remove('is-active'));
})();

/* ── 3. PARTICLE CANVAS ─────────────────────────────────── */
(function initParticles() {
  const cv = document.getElementById('bg-canvas');
  if (!cv) return;
  const cx = cv.getContext('2d');
  let W, H;

  function resize() {
    W = cv.width = window.innerWidth;
    H = cv.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COLS = ['#6ecf35','#4aaa3a','#2d7a4f','#d4b44a','#a8e85a','#3d9e45'];

  class Particle {
    constructor() { this.reset(true); }
    reset(init) {
      this.x  = Math.random() * W;
      this.y  = init ? Math.random() * H : H + 10;
      this.t  = ['seed','leaf','dot','petal'][Math.floor(Math.random() * 4)];
      this.s  = Math.random() * 4 + 1.5;
      this.vy = -(Math.random() * 0.35 + 0.08);
      this.vx = (Math.random() - 0.5) * 0.2;
      this.a  = Math.random() * 0.32 + 0.05;
      this.r  = Math.random() * Math.PI * 2;
      this.rs = (Math.random() - 0.5) * 0.014;
      this.c  = COLS[Math.floor(Math.random() * COLS.length)];
    }
    update() {
      this.y += this.vy; this.x += this.vx; this.r += this.rs;
      if (this.y < -14) this.reset(false);
    }
    draw() {
      cx.save();
      cx.globalAlpha = this.a;
      cx.translate(this.x, this.y);
      cx.rotate(this.r);
      cx.fillStyle = this.c;
      cx.strokeStyle = this.c;
      cx.lineWidth = 0.8;
      const s = this.s;
      switch (this.t) {
        case 'seed':
          cx.beginPath();
          cx.ellipse(0, 0, s * 0.48, s * 1.2, 0, 0, Math.PI * 2);
          cx.fill();
          break;
        case 'leaf':
          cx.beginPath();
          cx.moveTo(0, -s * 1.35);
          cx.bezierCurveTo( s, -s * 0.4,  s,  s * 0.4, 0,  s * 1.35);
          cx.bezierCurveTo(-s,  s * 0.4, -s, -s * 0.4, 0, -s * 1.35);
          cx.fill();
          break;
        case 'petal':
          cx.beginPath();
          cx.ellipse(0, -s * 0.8, s * 0.45, s * 0.9, 0, 0, Math.PI * 2);
          cx.fill();
          break;
        default: // dot
          cx.beginPath();
          cx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
          cx.fill();
      }
      cx.restore();
    }
  }

  const pts = Array.from({ length: 85 }, () => new Particle());
  (function loop() {
    cx.clearRect(0, 0, W, H);
    pts.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  })();
})();

/* ── 4. ORGANIC SVG LAYER ───────────────────────────────── */
(function initOrganicLayer() {
  const layer = document.getElementById('organic-layer');
  if (!layer) return;

  // Draw 3 large blurry organic blobs as background ambience
  layer.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:absolute;inset:0">
      <defs>
        <radialGradient id="blob1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#4aaa3a" stop-opacity="0.10"/>
          <stop offset="100%" stop-color="#1e5c3a" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="blob2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#6ecf35" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="#2d7a4f" stop-opacity="0"/>
        </radialGradient>
        <filter id="blur1"><feGaussianBlur stdDeviation="60"/></filter>
        <filter id="blur2"><feGaussianBlur stdDeviation="80"/></filter>
      </defs>
      <!-- Left ambient blob -->
      <ellipse cx="8%" cy="30%" rx="320" ry="280" fill="url(#blob1)" filter="url(#blur1)">
        <animateTransform attributeName="transform" type="translate"
          values="0,0; 20,-15; 0,0" dur="18s" repeatCount="indefinite"/>
      </ellipse>
      <!-- Right ambient blob -->
      <ellipse cx="92%" cy="65%" rx="380" ry="300" fill="url(#blob2)" filter="url(#blur2)">
        <animateTransform attributeName="transform" type="translate"
          values="0,0; -18,12; 0,0" dur="22s" repeatCount="indefinite"/>
      </ellipse>
      <!-- Center subtle glow -->
      <ellipse cx="50%" cy="10%" rx="500" ry="200" fill="url(#blob1)" filter="url(#blur2)" opacity="0.5"/>
    </svg>
  `;
})();

/* ── 5. ANIMATED ORGANIC VINES (hero section) ───────────── */
(function initVines() {
  const hero = document.getElementById('hero');
  if (!hero) return;

  // Create SVG vine decorations
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1;overflow:visible';

  svg.innerHTML = `
    <defs>
      <linearGradient id="vineGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#1e5c3a" stop-opacity="0.08"/>
        <stop offset="45%" stop-color="#4aaa3a" stop-opacity="0.34"/>
        <stop offset="100%" stop-color="#6ecf35" stop-opacity="0.16"/>
      </linearGradient>
      <filter id="vineSoftGlow">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <g class="hero-vine-left" filter="url(#vineSoftGlow)" opacity="0.74">
      <path d="M 68 735 C 120 645, 72 560, 135 475 C 205 380, 122 300, 205 218 C 245 178, 238 128, 302 86"
        fill="none" stroke="url(#vineGrad)" stroke-width="1.4" stroke-dasharray="10 14" stroke-linecap="round">
        <animate attributeName="stroke-dashoffset" from="0" to="-96" dur="8s" repeatCount="indefinite"/>
      </path>
      <path d="M 137 474 Q 94 426 51 449 M 157 398 Q 219 356 275 386 M 187 286 Q 135 245 89 270 M 232 159 Q 280 128 335 148"
        fill="none" stroke="#6ecf35" stroke-width="1.1" stroke-linecap="round" opacity="0.34"/>
      <path d="M 48 449 C 63 432, 88 426, 105 438 C 82 459, 65 463, 48 449 Z
               M 275 386 C 252 367, 228 361, 210 374 C 230 397, 252 402, 275 386 Z
               M 88 270 C 107 252, 134 248, 153 260 C 130 282, 107 288, 88 270 Z
               M 335 148 C 310 133, 287 132, 270 144 C 289 166, 314 169, 335 148 Z"
        fill="#6ecf35" opacity="0.12"/>
    </g>

    <g class="hero-vine-right" filter="url(#vineSoftGlow)" opacity="0.68">
      <path d="M 950 738 C 870 650, 944 560, 852 475 C 772 402, 876 305, 776 222 C 725 180, 740 112, 672 72"
        fill="none" stroke="url(#vineGrad)" stroke-width="1.4" stroke-dasharray="10 14" stroke-linecap="round">
        <animate attributeName="stroke-dashoffset" from="0" to="-96" dur="9s" repeatCount="indefinite"/>
      </path>
      <path d="M 852 475 Q 900 426 948 454 M 826 390 Q 760 354 706 390 M 789 281 Q 846 242 894 270 M 726 148 Q 679 118 626 139"
        fill="none" stroke="#6ecf35" stroke-width="1.1" stroke-linecap="round" opacity="0.3"/>
      <path d="M 948 454 C 927 433, 904 429, 886 441 C 905 464, 929 470, 948 454 Z
               M 706 390 C 730 369, 754 363, 773 376 C 752 402, 728 406, 706 390 Z
               M 894 270 C 873 253, 848 249, 829 261 C 852 285, 876 289, 894 270 Z
               M 626 139 C 651 124, 674 124, 692 136 C 673 159, 648 162, 626 139 Z"
        fill="#6ecf35" opacity="0.1"/>
    </g>

    <path d="M 380 710 C 450 620, 400 540, 500 482 C 600 540, 550 620, 620 710"
      fill="none" stroke="#6ecf35" stroke-width="1" stroke-dasharray="8 18" stroke-linecap="round" opacity="0.12">
      <animate attributeName="stroke-dashoffset" from="0" to="-104" dur="10s" repeatCount="indefinite"/>
    </path>

    <g opacity="0.22">
      <ellipse cx="15%" cy="28%" rx="4" ry="9" fill="#6ecf35" transform="rotate(24 15% 28%)">
        <animateTransform attributeName="transform" type="translate" values="0,0;3,-5;0,0" dur="5.4s" repeatCount="indefinite" additive="sum"/>
      </ellipse>
      <ellipse cx="84%" cy="31%" rx="4" ry="8" fill="#4aaa3a" transform="rotate(-18 84% 31%)">
        <animateTransform attributeName="transform" type="translate" values="0,0;-3,-4;0,0" dur="5s" repeatCount="indefinite" additive="sum"/>
      </ellipse>
    </g>
  `;

  hero.appendChild(svg);
})();

/* ── 6. TRUST COUNTER ───────────────────────────────────── */
(function initCounter() {
  const el = document.getElementById('trust-count');
  if (!el) return;
  const target = 10000;

  const co = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    co.disconnect();
    let startTime = null;
    const duration = 2200;
    function tick(ts) {
      if (!startTime) startTime = ts;
      const prog = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - prog, 3);
      el.textContent = Math.floor(ease * target).toLocaleString();
      if (prog < 1) requestAnimationFrame(tick);
      else el.textContent = '10,000';
    }
    requestAnimationFrame(tick);
  }, { threshold: 0.5 });

  co.observe(el);
})();

/* ── 7. CONTACT FORM ────────────────────────────────────── */
/* ── 8. NAV ACTIVE HIGHLIGHT ────────────────────────────── */
(function initNavSpy() {
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav-links a');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.style.color = '');
        const active = document.querySelector('.nav-links a[href="#' + e.target.id + '"]');
        if (active) active.style.color = '#6ecf35';
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => io.observe(s));
})();
