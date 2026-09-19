/* ============================================================
   GAME SEED ASSETS — main.js (v5)
   IntersectionObserver everywhere. Videos load on demand.

   ── REVIEWS ───────────────────────────────────────────────
   The first six float around the counter; everything after
   that scrolls in the strip underneath. Add an entry and it
   appears — { asset, title, text, stars, name? }.
   ============================================================ */
var REVIEWS = [
  { asset: 'Stickman Shooter', stars: 5, title: 'Great starter template', text: "Great asset! It's very clean, well organized, and easy to understand. It helped me a lot to get my game started and saved me a lot of development time." },
  { asset: 'Rain Particles', stars: 5, title: 'Brilliant asset — works out of the box', text: 'I was struggling for over three days building a rain particle system with ripples and splashes. This asset just works out of the box in HDRP in Unity 6.4.' },
  { asset: 'Rope Puzzle', stars: 5, title: 'Excellent support and solid template', text: 'I had some technical issues after downloading, but the author responded very quickly and helped me fix everything. Well-structured and easy to work with.' },
  { asset: 'Dark 2D World', stars: 5, title: 'Finally found something like Limbo', text: "I've been searching for that same eerie, atmospheric vibe as Limbo, and this is the closest match I've come across so far — really appreciate it!" },
  { asset: 'Fog Particles', stars: 5, title: 'Amazingly simple', text: 'I literally just dragged the prefab into the scene and everything worked instantly. No tedious tweaking required; the results are immediate.' },
  { asset: 'Low Poly Fire Particles', stars: 5, title: 'Very quick to set up — thanks!', text: 'Perfect for my small low poly world — thanks a bunch!' },

  { asset: 'Stickman Shooter', stars: 5, title: 'Exactly what I was looking for', text: 'Perfect template for me. I built on top of it and got a good project for my portfolio. Thanks a lot to the developer for quick support.' },
  { asset: 'Stickman Shooter', stars: 5, title: 'Addictive physics', text: 'The way things fly and bounce with real physics is the best part for me. Every shot feels powerful and different. This template helps me a lot with my game ideas.' },
  { asset: 'Rain Particles', stars: 5, title: 'Big surprise', text: 'Really good rain effect. Exactly what I wanted for my project.' },
  { asset: 'Rain Particles', stars: 5, title: 'Good!!', text: 'It is really good and nice asset. I use it in my commercial game, and it looks so great :)' },
  { asset: 'Fog Particles', stars: 5, title: 'Great asset, simple and performant', text: 'Looks great, very easy to use, simple prefabs, particle system fog. Highly performant.' },
  { asset: 'Fog Particles', stars: 4, title: 'Works with older versions!', text: "This is really really really good! I'm working with Unity 2021.3 and it still works!" },
  { asset: 'Dark 2D World', stars: 5, title: 'Worth it!', text: 'Really satisfied with this asset — gives a Limbo-like feel!' },
  { asset: 'Dark 2D World', stars: 5, title: 'Nice', text: 'A very beautiful asset stylized for a 2D platformer or other game type. Great for creating a dark, unusual atmosphere in a game.' },
  { asset: 'Rain Particles', stars: 5, title: 'Works and looks good!', text: "It's nice to have a prefab that I can adjust and then throw on a 2D background or outside a window." },
  { asset: 'Stickman Shooter', stars: 5, title: 'Amazing asset', text: 'For my web games website — also very quick support by the publisher!' },
  { asset: 'Fog Particles', stars: 5, title: 'Neat fog asset', text: 'Very useful and flexible fog particles tool. Thank you!' },
  { asset: 'Fog Particles', stars: 5, title: 'Excellent!', text: 'Nicely done, thank you very much!' }
];

(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = (navigator.connection && navigator.connection.saveData) === true;
  var slowNet = navigator.connection && /2g/.test(navigator.connection.effectiveType || '');
  var autoVideoOK = !reduce && !saveData && !slowNet;

  /* ── nav ─────────────────────────────────────────────── */
  var nav = document.getElementById('nav');
  if (nav && 'IntersectionObserver' in window) {
    var sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:70px;pointer-events:none';
    document.body.prepend(sentinel);
    new IntersectionObserver(function (e) {
      nav.classList.toggle('scrolled', !e[0].isIntersecting);
    }).observe(sentinel);
  }

  var burger = document.getElementById('burger');
  var navLinksEl = document.getElementById('nav-links');
  if (burger && navLinksEl) {
    var setMenu = function (open) {
      navLinksEl.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    burger.addEventListener('click', function () { setMenu(!navLinksEl.classList.contains('open')); });
    navLinksEl.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ── reveal on scroll ────────────────────────────────── */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || reduce) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var seen = new Map();
    revealEls.forEach(function (el) {
      var i = seen.get(el.parentElement) || 0;
      el.style.setProperty('--rd', Math.min(i * 90, 360) + 'ms');
      seen.set(el.parentElement, i + 1);
    });
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        rio.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    revealEls.forEach(function (el) { rio.observe(el); });
  }

  /* ── pause looping CSS animation off-screen ──────────── */
  if ('IntersectionObserver' in window) {
    var zio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('paused', !e.isIntersecting); });
    }, { rootMargin: '120px 0px' });
    document.querySelectorAll('[data-anim-zone]').forEach(function (z) { zio.observe(z); });
  }

  /* ── silent loop helper (muted, in-view only) ────────── */
  function makeLoop(host, src) {
    var v = document.createElement('video');
    v.src = src;
    v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.preload = 'auto'; v.tabIndex = -1; v.setAttribute('aria-hidden', 'true');
    host.appendChild(v);
    var p = v.play();
    if (p && p.catch) p.catch(function () { v.remove(); });
    return v;
  }

  function attachLoop(host) {
    if (!autoVideoOK || !host) return;
    var src = host.dataset.loop;
    if (!src) return;
    var video = null;
    var io = new IntersectionObserver(function (e) {
      var vis = e[0].isIntersecting;
      if (vis && !video) video = makeLoop(host, src);
      else if (video) { vis ? video.play().catch(function () {}) : video.pause(); }
    }, { threshold: 0.35 });
    io.observe(host);
    host._stopLoop = function () { if (video) { video.pause(); video.remove(); video = null; } io.unobserve(host); };
  }


  /* ── atmosphere: drifting seeds, leaves and pollen ───────
     Sprites are pre-rendered once, then blitted — no per-frame
     path drawing, capped at 30fps, and paused when the tab is
     hidden or the user prefers reduced motion.                */
  (function atmosphere() {
    var cv = document.getElementById('bg-canvas');
    if (!cv || reduce || saveData) { if (cv) cv.remove(); return; }

    var ctx = cv.getContext('2d', { alpha: true });
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var COLORS = ['#6ecf35', '#4aaa3a', '#2d7a4f', '#d4b44a', '#a8e85a', '#3d9e45'];
    var TYPES = ['seed', 'leaf', 'dot', 'petal'];
    var sprites = {};
    var W = 0, H = 0, pts = [], raf = 0, last = 0;
    var FRAME = 1000 / 30;

    function sprite(type, color) {
      var key = type + color;
      if (sprites[key]) return sprites[key];
      var S = 22;
      var c = document.createElement('canvas');
      c.width = c.height = Math.round(S * dpr);
      var x = c.getContext('2d');
      x.scale(dpr, dpr);
      x.translate(S / 2, S / 2);
      x.fillStyle = color;
      var s = 7;
      x.beginPath();
      if (type === 'seed') {
        x.ellipse(0, 0, s * 0.45, s * 1.05, 0, 0, Math.PI * 2);
      } else if (type === 'leaf') {
        x.moveTo(0, -s * 1.2);
        x.bezierCurveTo(s * 0.9, -s * 0.35, s * 0.9, s * 0.35, 0, s * 1.2);
        x.bezierCurveTo(-s * 0.9, s * 0.35, -s * 0.9, -s * 0.35, 0, -s * 1.2);
      } else if (type === 'petal') {
        x.ellipse(0, -s * 0.5, s * 0.42, s * 0.85, 0, 0, Math.PI * 2);
      } else {
        x.arc(0, 0, s * 0.4, 0, Math.PI * 2);
      }
      x.fill();
      sprites[key] = c;
      return c;
    }

    function make(init) {
      return {
        x: Math.random() * W,
        y: init ? Math.random() * H : H + 20,
        img: sprite(TYPES[(Math.random() * TYPES.length) | 0], COLORS[(Math.random() * COLORS.length) | 0]),
        sz: 10 + Math.random() * 16,
        vy: -(Math.random() * 0.34 + 0.08),
        vx: (Math.random() - 0.5) * 0.2,
        a: Math.random() * 0.3 + 0.06,
        r: Math.random() * Math.PI * 2,
        rs: (Math.random() - 0.5) * 0.012
      };
    }

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      var target = Math.max(14, Math.min(42, Math.round((W * H) / 30000)));
      while (pts.length > target) pts.pop();
      while (pts.length < target) pts.push(make(true));
    }

    function frame(ts) {
      raf = requestAnimationFrame(frame);
      if (ts - last < FRAME) return;
      last = ts;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.y += p.vy; p.x += p.vx; p.r += p.rs;
        if (p.y < -24) { pts[i] = make(false); continue; }
        var c = Math.cos(p.r) * dpr, s = Math.sin(p.r) * dpr;
        ctx.setTransform(c, s, -s, c, p.x * dpr, p.y * dpr);
        ctx.globalAlpha = p.a;
        ctx.drawImage(p.img, -p.sz / 2, -p.sz / 2, p.sz, p.sz);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
    }

    function start() { if (!raf) raf = requestAnimationFrame(frame); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

    resize();
    start();
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 200); });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  })();

  /* ── click-to-load players ───────────────────────────── */
  document.querySelectorAll('.player').forEach(function (player) {
    var btn = player.querySelector('.play');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (player.classList.contains('playing')) return;
      var v = document.createElement('video');
      v.src = player.dataset.src;
      v.controls = true; v.playsInline = true; v.preload = 'auto';
      v.setAttribute('playsinline', '');
      if (player.dataset.poster) v.poster = player.dataset.poster;
      player.appendChild(v);
      player.classList.add('playing');
      var img = player.querySelector('img');
      if (img) img.style.opacity = '0';
      v.play().catch(function () {});
      v.addEventListener('error', function () {
        // codec/network problem — fall back to the poster so nothing looks broken
        v.remove();
        player.classList.remove('playing');
        if (img) img.style.opacity = '';
      });
      // one video at a time
      v.addEventListener('play', function () {
        document.querySelectorAll('.player video').forEach(function (other) { if (other !== v) other.pause(); });
      });
    });
  });


  /* ── "watch demo" inside a carousel slide ────────────── */
  document.querySelectorAll('.slide-media .demo-btn').forEach(function (btn) {
    var host = btn.parentElement;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (host.classList.contains('playing')) return;
      var loop = host.querySelector('video');
      if (loop) { loop.pause(); loop.remove(); }
      var v = document.createElement('video');
      v.src = host.dataset.video;
      v.controls = true; v.playsInline = true; v.preload = 'auto';
      v.setAttribute('playsinline', '');
      host.appendChild(v);
      host.classList.add('playing');
      v.play().catch(function () {});
      v.addEventListener('error', function () { v.remove(); host.classList.remove('playing'); });
    });
  });

  /* ── carousel ────────────────────────────────────────── */
  (function carousel() {
    var box = document.getElementById('carousel');
    var track = document.getElementById('ctrack');
    if (!box || !track) return;
    var slides = Array.prototype.slice.call(track.children);
    var dotsWrap = document.getElementById('cdots');
    var index = 0;
    var loops = [];

    slides.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Asset ' + (i + 1));
      b.addEventListener('click', function () { go(i); });
      dotsWrap.appendChild(b);
      loops.push(null);
    });

    function layout() {
      slides.forEach(function (s, i) {
        var o = i - index;
        var a = Math.abs(o);
        s.style.setProperty('--o', o);
        s.style.setProperty('--a', Math.min(a, 3));
        s.style.setProperty('--s', a === 0 ? 1 : Math.max(0.74, 1 - a * 0.16));
        s.style.setProperty('--op', a === 0 ? 1 : a === 1 ? 0.5 : a === 2 ? 0.18 : 0);
        s.style.setProperty('--b', a === 0 ? 1 : 0.55);
        s.style.setProperty('--bo', a === 0 ? 1 : 0);
        if (a > 0) s.setAttribute('data-side', ''); else s.removeAttribute('data-side');
        s.style.zIndex = String(20 - a);
        if (a > 1) s.setAttribute('data-far', ''); else s.removeAttribute('data-far');
        s.setAttribute('aria-hidden', a === 0 ? 'false' : 'true');
      });
      Array.prototype.forEach.call(dotsWrap.children, function (d, i) {
        d.setAttribute('aria-selected', String(i === index));
      });
      playActive();
    }

    function playActive() {
      slides.forEach(function (s, i) {
        var host = s.querySelector('.slide-media');
        if (!host || !host.dataset.loop || host.classList.contains('playing')) return;
        if (i === index && autoVideoOK && !boxHidden) {
          if (!loops[i]) loops[i] = makeLoop(host, host.dataset.loop);
          else loops[i].play().catch(function () {});
        } else if (loops[i]) {
          loops[i].pause();
        }
      });
    }

    var boxHidden = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        boxHidden = !e[0].isIntersecting;
        if (boxHidden) loops.forEach(function (v) { if (v) v.pause(); });
        else playActive();
      }, { threshold: 0.25 }).observe(box);
    } else { boxHidden = false; }

    function go(i) {
      index = Math.max(0, Math.min(slides.length - 1, i));
      layout();
    }
    document.getElementById('cprev').addEventListener('click', function () { go(index - 1); });
    document.getElementById('cnext').addEventListener('click', function () { go(index + 1); });

    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(index - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { go(index + 1); e.preventDefault(); }
    });

    // click a side slide to bring it forward
    slides.forEach(function (s, i) {
      s.addEventListener('click', function (e) {
        if (i !== index && !e.target.closest('a')) { go(i); e.preventDefault(); }
      });
    });

    // swipe / drag
    var startX = 0, startY = 0, dragging = false;
    track.addEventListener('pointerdown', function (e) {
      if (e.target.closest('a, button')) return;
      dragging = true; startX = e.clientX; startY = e.clientY;
    });
    track.addEventListener('pointerup', function (e) {
      if (!dragging) return;
      dragging = false;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - startY)) go(index + (dx < 0 ? 1 : -1));
    });
    track.addEventListener('pointercancel', function () { dragging = false; });

    layout();
  })();


  /* ── one tactile system: squash + particle burst ─────── */
  var COLORS = ['#6ecf35', '#a8f06a', '#f0c048', '#4aaa3a', '#ffffff'];
  var live = 0;

  function burst(x, y, n) {
    if (reduce || live > 40) return;
    var frag = document.createDocumentFragment();
    var made = [];
    for (var i = 0; i < n; i++) {
      var sp = document.createElement('span');
      var ang = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      var dist = 34 + Math.random() * 62;
      sp.className = 'spark';
      sp.style.setProperty('--x', x + 'px');
      sp.style.setProperty('--y', y + 'px');
      sp.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(1) + 'px');
      sp.style.setProperty('--dy', (Math.sin(ang) * dist - 14).toFixed(1) + 'px');
      sp.style.setProperty('--sz', (4 + Math.random() * 7).toFixed(1) + 'px');
      sp.style.setProperty('--br', Math.random() > 0.5 ? '50%' : '2px');
      sp.style.setProperty('--rot2', Math.round(Math.random() * 540 - 270) + 'deg');
      sp.style.setProperty('--c', COLORS[i % COLORS.length]);
      sp.style.setProperty('--dur', (460 + Math.random() * 300).toFixed(0) + 'ms');
      frag.appendChild(sp);
      made.push(sp);
    }
    document.body.appendChild(frag);
    live += n;
    setTimeout(function () {
      made.forEach(function (sp) { sp.remove(); });
      live -= n;
    }, 820);
  }

  function squash(el, x, y, n) {
    if (!reduce && el) {
      el.classList.remove('squish');
      void el.offsetWidth;                       // restart the animation
      el.classList.add('squish');
      var clear = function () { el.classList.remove('squish'); el.removeEventListener('animationend', clear); };
      el.addEventListener('animationend', clear);
    }
    burst(x, y, n || 12);
  }

  (function tactile() {
    if (reduce) return;
    var SEL = 'a, button, .btn, .cap, .slide-media, .bcard, .brand, .nav-links a, .stores a, .cnav, .cdots button, .link-arrow, .market-row a, .final-stores a, .footer-links a';
    document.addEventListener('pointerdown', function (e) {
      var el = e.target.closest ? e.target.closest(SEL) : null;
      if (el) {
        var big = el.classList.contains('bcard') || el.classList.contains('cap') || el.classList.contains('slide-media');
        squash(el, e.clientX, e.clientY, big ? 16 : 10);
      } else {
        pop(e.clientX, e.clientY);
      }
    }, { passive: true });

    var busy = false;
    function pop(x, y) {
      if (busy) return;
      busy = true;
      var r = document.createElement('span');
      r.className = 'ripple';
      r.style.setProperty('--rx', x + 'px');
      r.style.setProperty('--ry', y + 'px');
      document.body.appendChild(r);
      burst(x, y, 6);
      setTimeout(function () { r.remove(); busy = false; }, 520);
    }
  })();

  /* ── tapping the strip holds it still for a moment ───── */
  (function holdStrip() {
    var m = document.getElementById('more-reviews');
    if (!m) return;
    var t;
    m.addEventListener('pointerdown', function () {
      m.classList.add('hold');
      clearTimeout(t);
      t = setTimeout(function () { m.classList.remove('hold'); }, 2500);
    }, { passive: true });
  })();

  /* ── review wall: 6 float, the rest scroll ───────────── */
  (function reviewWall() {
    var wrap = document.getElementById('bubbles');
    var track = document.getElementById('rtrack');
    var trust = document.getElementById('trust');
    if (!wrap || !REVIEWS.length) return;

    var W = 'clamp(238px, 22vw, 318px)';
    var SLOTS = [
      { left: '0%',  top: '6%',     rot: '-4deg',   delay: '-1s' },
      { right: '0%', top: '4%',     rot: '3.5deg',  delay: '-2.6s' },
      { left: '1%',  bottom: '6%',  rot: '3deg',    delay: '-4.2s' },
      { right: '1%', bottom: '9%',  rot: '-3.5deg', delay: '-3.1s' },
      { left: 'calc(50% - ' + W + ' / 2)', bottom: '-8%', rot: '1.5deg', delay: '-5.4s' },
      { left: 'calc(50% - ' + W + ' / 2)', top: '-9%',     rot: '-2deg',  delay: '-0.4s' }
    ];

    function stars(n) { return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); }

    function card(r, rot) {
      var c = document.createElement('button');
      c.type = 'button';
      c.className = 'bcard';
      c.style.setProperty('--rot', rot || '0deg');
      c.innerHTML = '<span class="bmeta"><span></span><span class="stars"></span></span><h3></h3><p></p><span class="bsrc"></span>';
      c.querySelector('.bmeta span').textContent = r.name || r.asset || '';
      c.querySelector('.stars').textContent = stars(r.stars || 5);
      c.querySelector('h3').textContent = r.title;
      c.querySelector('p').textContent = r.text;
      c.querySelector('.bsrc').textContent = r.asset ? r.asset + ' · Unity Asset Store' : 'Unity Asset Store';
      c.setAttribute('aria-label', 'Review: ' + r.title);
      return c;
    }

    function build() {
      var floating = window.innerWidth >= 960;
      // on phones every review rides the auto-scrolling strip — no tall stack
      var featured = floating ? REVIEWS.slice(0, 6) : [];
      var rest = floating ? REVIEWS.slice(6) : REVIEWS.slice(0);

      wrap.textContent = '';
      wrap.classList.toggle('as-grid', !floating);
      trust.classList.toggle('stacked', !floating);

      featured.forEach(function (r, i) {
        var slot = SLOTS[i % SLOTS.length];
        var b = document.createElement('div');
        b.className = 'bubble';
        if (floating) {
          ['left', 'right', 'top', 'bottom'].forEach(function (k) { if (slot[k]) b.style[k] = slot[k]; });
          b.style.setProperty('--delay', slot.delay);
        }
        b.appendChild(card(r, floating ? slot.rot : '0deg'));
        wrap.appendChild(b);
      });

      if (track) {
        track.textContent = '';
        if (!rest.length) {
          track.parentElement.hidden = true;
        } else {
          track.parentElement.hidden = false;
          // two identical runs so the loop is seamless
          for (var pass = 0; pass < 2; pass++) {
            rest.forEach(function (r) {
              var cell = document.createElement('div');
              cell.className = 'strip-cell';
              if (pass === 1) cell.setAttribute('aria-hidden', 'true');
              cell.appendChild(card(r, '0deg'));
              track.appendChild(cell);
            });
          }
          // ~7s of travel per card keeps the pace calm on any screen
          track.style.setProperty('--dur', Math.max(40, rest.length * 7) + 's');
        }
      }
    }

    build();
    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(build, 200); });
  })();

  /* ── counter: 0 → 15,000 ─────────────────────────────── */
  var counter = document.getElementById('trust-count');
  if (counter && 'IntersectionObserver' in window) {
    var target = 15000;
    if (reduce) {
      counter.textContent = target.toLocaleString('en-US');
    } else {
      counter.textContent = '0';
      var cio = new IntersectionObserver(function (e) {
        if (!e[0].isIntersecting) return;
        cio.disconnect();
        var t0 = 0, dur = 1900;
        (function tick(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          counter.textContent = Math.round((1 - Math.pow(1 - p, 4)) * target).toLocaleString('en-US');
          if (p < 1) requestAnimationFrame(tick);
        })(performance.now());
      }, { threshold: 0.5 });
      cio.observe(counter);
    }
  }

  /* ── squishy clicks everywhere + cursor ripple ───────── */
  (function tactile() {
    if (reduce) return;
    var SEL = 'a, button, .btn, .cap, .slide-media, .bcard, .free-chip, .stores a, .nav-links a, .cnav, .cdots button, .link-arrow, .hero-store-row a, .final-stores a, .footer-links a';

    document.addEventListener('pointerdown', function (e) {
      var el = e.target.closest ? e.target.closest(SEL) : null;
      if (el && !el.classList.contains('bcard')) {   // review cards have their own squash
        el.classList.remove('squish');
        void el.offsetWidth;
        el.classList.add('squish');
        var clear = function () { el.classList.remove('squish'); el.removeEventListener('animationend', clear); };
        el.addEventListener('animationend', clear);
      }
      if (!el) pop(e.clientX, e.clientY);
    }, { passive: true });

    var busy = false;
    function pop(x, y) {
      if (busy) return;              // one ripple at a time keeps this free
      busy = true;
      var r = document.createElement('span');
      r.className = 'ripple';
      r.style.setProperty('--rx', x + 'px');
      r.style.setProperty('--ry', y + 'px');
      document.body.appendChild(r);
      setTimeout(function () { r.remove(); busy = false; }, 520);
    }
  })();

  /* ── active nav link ─────────────────────────────────── */
  var links = document.querySelectorAll('.nav-links a[href^="#"]');
  if (links.length && 'IntersectionObserver' in window) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('active'); });
        if (map[e.target.id]) map[e.target.id].classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) nio.observe(s);
    });
  }

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
