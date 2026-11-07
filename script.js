/* =========================================================
   Scarlett He: site interactions (vanilla JS, no build step)
   ========================================================= */
(() => {
  'use strict';
  window.__siteReady = true;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const el = (tag, cls = '', text = '') => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isPhoneLayout = () => window.matchMedia('(max-width: 768px)').matches;
  const isTyping = (t) => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  const anyDialogOpen = () => !!document.querySelector('dialog[open]');

  const EMAIL = 'hjqscarlett@gmail.com';
  const LINKS = {
    resume: 'assets/Jiaqi_Scarlett_He_Resume.pdf',
    linkedin: 'https://www.linkedin.com/in/jiaqihe-stats',
    github: 'https://github.com/scarletthejiaqi',
    leaderboard: 'https://www.agenthon.net/#leaderboard',
  };

  const track = (name, params = {}) => {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
  };

  /* ---------- Vanta halo background (same settings as the original site) ---------- */
  function initVanta() {
    if (reduceMotion || !window.VANTA || !window.THREE) return; // CSS halo fallback stays visible
    try {
      window.__vanta = window.VANTA.HALO({
        el: '#vanta-bg',
        amplitudeFactor: 3,
        backgroundAlpha: 1,
        backgroundColor: 0xFFC0CB,
        baseColor: 0x1a59,
        color2: 0xF2EAD5,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        mouseControls: false,
        ringFactor: 1,
        rotationFactor: 1,
        scale: 1,
        scaleMobile: 1,
        size: 3,
        speed: 1,
        touchControls: false,
        xOffset: -0.01,
        yOffset: 0,
      });
    } catch (err) {
      /* WebGL unavailable: keep the CSS halo */
    }
  }

  /* ---------- Toast ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2600);
  }

  /* ---------- Copy email ---------- */
  async function copyEmail(btn) {
    let ok = false;
    try {
      await navigator.clipboard.writeText(EMAIL);
      ok = true;
    } catch (err) {
      const ta = el('textarea');
      ta.value = EMAIL;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.select();
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
    }
    if (!ok) {
      window.location.href = 'mailto:' + EMAIL;
      return;
    }
    toast('✓ Email copied: ' + EMAIL);
    if (btn && btn.classList.contains('copy-btn')) {
      const label = $('span', btn);
      btn.classList.add('is-done');
      label.textContent = 'Copied';
      setTimeout(() => {
        btn.classList.remove('is-done');
        label.textContent = 'Copy';
      }, 1800);
    }
  }
  $$('[data-copy-email]').forEach((b) => b.addEventListener('click', () => copyEmail(b)));

  /* ---------- Dialog helpers ---------- */
  function openDialog(d) {
    if (!d || d.open) return;
    if (typeof d.showModal === 'function') d.showModal();
    else d.setAttribute('open', '');
  }
  $$('dialog').forEach((d) => {
    d.addEventListener('click', (e) => {
      if (e.target !== d) return;
      if (d.classList.contains('lightbox')) { d.close(); return; }
      const r = d.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) d.close();
    });
    $$('[data-close]', d).forEach((b) => b.addEventListener('click', () => d.close()));
  });

  function openCase(id) {
    const d = document.getElementById(id);
    if (!d) return;
    openDialog(d);
    d.scrollTop = 0;
    track('case_study_open', { case_id: id });
  }
  $$('[data-case]').forEach((b) => b.addEventListener('click', () => openCase(b.dataset.case)));

  /* ---------- Header: scrolled state + progress bar ---------- */
  const header = $('.site-header');
  const progressBar = $('.scroll-progress span');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 8);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Scroll spy ---------- */
  const navLinks = $$('.nav-links a, .mobile-menu a');
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const hash = '#' + en.target.id;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === hash));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['top', 'experience', 'projects', 'skills', 'about', 'contact']
      .map((id) => document.getElementById(id))
      .forEach((s) => s && spy.observe(s));
  }

  /* ---------- Mobile menu ---------- */
  const burger = $('.hamburger');
  const menu = $('#mobile-menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
  }
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', (e) => {
    if (menu.classList.contains('is-open') && !header.contains(e.target)) setMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      setMenu(false);
      burger.focus();
    }
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    revealEls.forEach((n) => io.observe(n));
  } else {
    revealEls.forEach((n) => n.classList.add('is-in'));
  }

  /* ---------- Portrait tilt + card spotlight (mouse only) ---------- */
  const tilt = $('[data-tilt]');
  const hero = $('.hero');
  if (tilt && finePointer && !reduceMotion) {
    hero.addEventListener('pointermove', (e) => {
      const r = tilt.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      const y = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
      tilt.style.transform = `perspective(1000px) rotateY(${(x * 9).toFixed(2)}deg) rotateX(${(-y * 4).toFixed(2)}deg)`;
    });
    hero.addEventListener('pointerleave', () => { tilt.style.transform = ''; });
  }
  if (finePointer) {
    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest && e.target.closest('.spot');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    }, { passive: true });
  }

  /* ---------- Experience timeline (tabs) ---------- */
  let selectRole = () => {};
  const tl = $('[data-timeline]');
  if (tl) {
    const tabs = $$('[role="tab"]', tl);
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    const nodes = $('.tl-nodes', tl);
    const trackEl = $('.tl-track', tl);
    const current = $('[data-tl-current]', tl);
    let active = Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'));

    const select = (i, focus = false) => {
      const n = tabs.length;
      const idx = ((i % n) + n) % n;
      tabs.forEach((t, k) => {
        const on = k === idx;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[k].classList.toggle('is-active', on);
      });
      trackEl.style.setProperty('--progress', (idx / (n - 1)).toFixed(4));
      if (current) current.textContent = String(idx + 1);
      if (focus) tabs[idx].focus();
      active = idx;
    };
    selectRole = (panelId) => {
      const i = panels.findIndex((p) => p.id === panelId);
      if (i >= 0) select(i);
    };

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); select(active + 1, true); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); select(active - 1, true); }
        else if (e.key === 'Home') { e.preventDefault(); select(0, true); }
        else if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
      });
      if (finePointer) {
        let timer;
        t.addEventListener('pointerenter', () => { timer = setTimeout(() => select(i), 140); });
        t.addEventListener('pointerleave', () => clearTimeout(timer));
      }
    });
    $('[data-tl-prev]', tl).addEventListener('click', () => select(active - 1));
    $('[data-tl-next]', tl).addEventListener('click', () => select(active + 1));

    // Arrow keys work whenever the timeline is on screen (desktop layout)
    let tlVisible = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { tlVisible = en.isIntersecting; }, { threshold: 0.35 }).observe(tl);
    }
    document.addEventListener('keydown', (e) => {
      if (!tlVisible || anyDialogOpen() || isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest && e.target.closest('[role="tab"]')) return;
      if (getComputedStyle(nodes).display === 'none') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); select(active + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); select(active - 1); }
    });
    select(active);
  }

  /* ---------- Forecast fan chart (Agenthon illustration) ---------- */
  function initFan(root) {
    const canvas = $('canvas', root);
    const wrap = canvas.parentElement;
    const tip = $('.fan-tooltip', root);
    const eventToggle = $('[data-fan-event]', root);
    const resampleBtn = $('[data-fan-resample]', root);
    const tbody = $('[data-fan-table] tbody', root);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const HIST = 40;        // history points shown
    const H = 26;           // forecast horizon (steps)
    const N = 600;          // simulated joint draws
    const EVENT_STEP = 8;   // "FOMC decision day"
    const SHOWN = 16;       // sample paths drawn
    const ACCENT = '#8a2be2';
    const INK = '#3a3a3a';
    const MUTED = '#5f5f5f';
    const pad = { l: 40, r: 14, t: 20, b: 26 };
    const totalSteps = HIST - 1 + H;

    const rngFrom = (s) => () => {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const gauss = (r) => {
      let u = 0;
      while (u === 0) u = r();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
    };

    // Synthetic history from a GARCH(1,1)-style process with occasional jumps
    const omega = 0.04;
    const alpha = 0.1;
    const beta = 0.86;
    const scale = 0.32;
    const hr = rngFrom(11);
    const history = [];
    const resid = [];
    let s2 = 1;
    let level = 100;
    for (let t = 0; t < 420; t++) {
      let z = gauss(hr);
      if (hr() < 0.04) z *= 2.2;
      const eps = Math.sqrt(s2) * z;
      level += eps * scale;
      resid.push(z);
      if (t >= 420 - HIST) history.push(level);
      s2 = omega + alpha * eps * eps + beta * s2;
    }
    const lastS2 = s2;

    let seed = 20261026;
    let data = null;
    let progress = 0;
    let raf = 0;
    let hoverIdx = -1;
    let W = 0;
    let Ht = 0;
    let yMin = 0;
    let yMax = 1;

    function simulate() {
      const r = rngFrom(seed);
      const withEvent = eventToggle.checked;
      const paths = new Array(N);
      for (let n = 0; n < N; n++) {
        const regime = Math.exp(0.25 * gauss(r) - 0.03); // one vol-regime multiplier per draw
        let v = lastS2;
        let x = history[HIST - 1];
        const p = new Float64Array(H + 1);
        p[0] = x;
        for (let h = 1; h <= H; h++) {
          const z = resid[Math.floor(r() * resid.length)]; // bootstrap standardized residuals
          let sd = Math.sqrt(v) * regime;
          if (withEvent && h === EVENT_STEP) sd *= 1.5;    // event-day variance bump
          const eps = sd * z;
          x += eps * scale;
          p[h] = x;
          v = omega + alpha * eps * eps + beta * v;
        }
        paths[n] = p;
      }
      const qs = [0.05, 0.25, 0.5, 0.75, 0.95];
      const Q = qs.map(() => new Float64Array(H + 1));
      const col = new Float64Array(N);
      for (let h = 0; h <= H; h++) {
        for (let n = 0; n < N; n++) col[n] = paths[n][h];
        col.sort();
        qs.forEach((q, k) => { Q[k][h] = col[Math.round(q * (N - 1))]; });
      }
      data = { paths: paths.slice(0, SHOWN), Q, withEvent };

      let lo = Infinity;
      let hi = -Infinity;
      history.forEach((v) => { lo = Math.min(lo, v); hi = Math.max(hi, v); });
      for (let h = 0; h <= H; h++) { lo = Math.min(lo, Q[0][h]); hi = Math.max(hi, Q[4][h]); }
      const m = (hi - lo) * 0.08;
      yMin = lo - m;
      yMax = hi + m;

      if (tbody) {
        tbody.textContent = '';
        [1, 4, 8, 13, 20, 26].forEach((h) => {
          const tr = el('tr');
          const th = el('th', '', `+${h} steps`);
          th.scope = 'row';
          tr.appendChild(th);
          [Q[0][h], Q[2][h], Q[4][h]].forEach((v) => tr.appendChild(el('td', '', v.toFixed(2))));
          tbody.appendChild(tr);
        });
      }
    }

    const xAt = (i) => pad.l + (i / totalSteps) * (W - pad.l - pad.r);
    const yAt = (v) => pad.t + (1 - (v - yMin) / (yMax - yMin)) * (Ht - pad.t - pad.b);

    function niceTicks(lo, hi, count) {
      const raw = (hi - lo) / count;
      const mag = Math.pow(10, Math.floor(Math.log10(raw)));
      const err = raw / mag;
      const step = (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1) * mag;
      const out = [];
      for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(v);
      return { ticks: out, step };
    }

    function pathFor(arr, offset) {
      ctx.beginPath();
      for (let h = 0; h < arr.length; h++) {
        const x = xAt(offset + h);
        const y = yAt(arr[h]);
        if (h === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    }

    function band(lo, hi, fill) {
      ctx.beginPath();
      for (let h = 0; h <= H; h++) ctx.lineTo(xAt(HIST - 1 + h), yAt(hi[h]));
      for (let h = H; h >= 0; h--) ctx.lineTo(xAt(HIST - 1 + h), yAt(lo[h]));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }

    function dot(x, y, color) {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    function draw() {
      if (!data || !W) return;
      ctx.clearRect(0, 0, W, Ht);
      const x0 = xAt(HIST - 1);
      const plotBottom = Ht - pad.b;

      // Forecast region wash
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(x0, pad.t, W - pad.r - x0, plotBottom - pad.t);

      // Gridlines + y ticks (hairline, solid, recessive)
      const { ticks, step } = niceTicks(yMin, yMax, 4);
      ctx.font = '500 10.5px Poppins, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ticks.forEach((v) => {
        const y = Math.round(yAt(v)) + 0.5;
        ctx.strokeStyle = 'rgba(53,53,53,0.09)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(W - pad.r, y);
        ctx.stroke();
        ctx.fillStyle = MUTED;
        ctx.fillText(v.toFixed(step < 1 ? 1 : 0), pad.l - 8, y);
      });

      // As-of rule + x labels
      ctx.strokeStyle = 'rgba(53,53,53,0.32)';
      ctx.beginPath();
      ctx.moveTo(Math.round(x0) + 0.5, pad.t);
      ctx.lineTo(Math.round(x0) + 0.5, plotBottom);
      ctx.stroke();
      ctx.fillStyle = MUTED;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText('History', pad.l, plotBottom + 8);
      ctx.textAlign = 'center';
      ctx.fillText('As-of', x0, plotBottom + 8);
      ctx.textAlign = 'right';
      ctx.fillText(`+${H} days`, W - pad.r, plotBottom + 8);

      // Forecast (revealed left to right)
      const xEnd = x0 + (W - pad.r - x0) * progress;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, pad.t, xEnd + 1, plotBottom - pad.t);
      ctx.clip();

      if (data.withEvent) {
        const xe = xAt(HIST - 1 + EVENT_STEP);
        ctx.fillStyle = 'rgba(138,43,226,0.07)';
        ctx.fillRect(xe - 6, pad.t, 12, plotBottom - pad.t);
      }

      band(data.Q[0], data.Q[4], 'rgba(138,43,226,0.13)');
      band(data.Q[1], data.Q[3], 'rgba(138,43,226,0.2)');

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(138,43,226,0.15)';
      data.paths.forEach((p) => { pathFor(p, HIST - 1); ctx.stroke(); });

      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = ACCENT;
      pathFor(data.Q[2], HIST - 1);
      ctx.stroke();
      ctx.restore();

      if (data.withEvent && progress > EVENT_STEP / H) {
        ctx.fillStyle = MUTED;
        ctx.font = '600 10px Poppins, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('FOMC', xAt(HIST - 1 + EVENT_STEP), pad.t - 4);
      }

      // History line
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = INK;
      pathFor(history, 0);
      ctx.stroke();
      dot(x0, yAt(history[HIST - 1]), INK);

      // Crosshair
      if (hoverIdx >= 0) {
        const x = Math.round(xAt(hoverIdx)) + 0.5;
        ctx.strokeStyle = 'rgba(53,53,53,0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, pad.t);
        ctx.lineTo(x, plotBottom);
        ctx.stroke();
        if (hoverIdx <= HIST - 1) {
          dot(xAt(hoverIdx), yAt(history[hoverIdx]), INK);
        } else if (progress >= 1) {
          const h = hoverIdx - (HIST - 1);
          dot(xAt(hoverIdx), yAt(data.Q[2][h]), ACCENT);
        }
      }
    }

    function hideTip() {
      hoverIdx = -1;
      tip.hidden = true;
      draw();
    }

    function tipRow(kind, value, label) {
      const row = el('div', 'tip-row');
      row.append(el('span', `tip-key ${kind}`), el('strong', '', value.toFixed(2)), el('span', '', label));
      return row;
    }

    function onMove(e) {
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const i = Math.round(((mx - pad.l) / (W - pad.l - pad.r)) * totalSteps);
      if (i < 0 || i > totalSteps) { hideTip(); return; }
      hoverIdx = i;
      draw();

      tip.textContent = '';
      let anchorY;
      if (i <= HIST - 1) {
        tip.append(el('div', 'tip-head', i === HIST - 1 ? 'As-of' : `${HIST - 1 - i} days before as-of`));
        tip.append(tipRow('ink', history[i], 'observed'));
        anchorY = yAt(history[i]);
      } else {
        if (progress < 1) { tip.hidden = true; return; }
        const h = i - (HIST - 1);
        const head = `+${h} day${h > 1 ? 's' : ''}${data.withEvent && h === EVENT_STEP ? ' · FOMC day' : ''}`;
        tip.append(el('div', 'tip-head', head));
        tip.append(tipRow('band', data.Q[4][h], '95th percentile'));
        tip.append(tipRow('', data.Q[2][h], 'median'));
        tip.append(tipRow('band', data.Q[0][h], '5th percentile'));
        anchorY = yAt(data.Q[4][h]);
      }
      tip.hidden = false;
      const tw = tip.offsetWidth;
      const th = tip.offsetHeight;
      const x = xAt(i);
      let left = x + 14;
      if (left + tw > W) left = x - tw - 14;
      let top = anchorY - th - 10;
      if (top < 0) top = Math.min(Ht - th, anchorY + 14);
      tip.style.left = `${Math.max(0, left)}px`;
      tip.style.top = `${Math.max(0, top)}px`;
    }

    function animateIn() {
      cancelAnimationFrame(raf);
      if (reduceMotion) { progress = 1; draw(); return; }
      const t0 = performance.now();
      const dur = 950;
      const step = (now) => {
        const t = Math.min(1, (now - t0) / dur);
        progress = 1 - Math.pow(1 - t, 3);
        draw();
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }

    function resize() {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width;
      Ht = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(Ht * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    resampleBtn.addEventListener('click', () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      simulate();
      tip.hidden = true;
      animateIn();
      track('fan_resample');
    });
    eventToggle.addEventListener('change', () => {
      simulate();
      tip.hidden = true;
      animateIn();
      track('fan_event_toggle', { on: eventToggle.checked });
    });
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', hideTip);

    simulate();
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(wrap);
    else window.addEventListener('resize', resize);
    resize();
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([en]) => {
        if (en.isIntersecting) { animateIn(); io.disconnect(); }
      }, { threshold: 0.35 });
      io.observe(root);
    } else {
      progress = 1;
      draw();
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  }
  $$('[data-fan]').forEach(initFan);

  /* ---------- Fraud metrics chart (ENGINEERING_LOG.md: honest chronological split; ghost = leaky random split) ---------- */
  function initMetrics(root) {
    const DATA = {
      xgb: {
        name: 'XGBoost',
        v: { AUC: 0.9095, 'PR-AUC': 0.5241, F1: 0.5033, Precision: 0.5681, Recall: 0.4518 },
        before: { AUC: 0.9611, 'PR-AUC': 0.7621, F1: 0.7135, Precision: 0.8283, Recall: 0.6267 },
      },
      lgbm: {
        name: 'LightGBM',
        v: { AUC: 0.9083, 'PR-AUC': 0.5176, F1: 0.5043, Precision: 0.6319, Recall: 0.4195 },
        before: { AUC: 0.9689, 'PR-AUC': 0.8118, F1: 0.7697, Precision: 0.8484, Recall: 0.7043 },
      },
      ens: {
        name: 'Ensemble',
        v: { AUC: 0.9119, 'PR-AUC': 0.5258, F1: 0.5028, Precision: 0.6778, Recall: 0.3996 },
        before: { AUC: 0.9667, 'PR-AUC': 0.7957, F1: 0.7502, Precision: 0.8403, Recall: 0.6775 },
      },
    };
    const METRICS = ['AUC', 'PR-AUC', 'F1', 'Precision', 'Recall'];
    const f3 = (v) => (Math.round(v * 1000 + 1e-9) / 1000).toFixed(3); // half-up, avoids 0.6775 -> 0.677
    const rowsEl = $('.metric-rows', root);
    const tip = $('.metrics-tooltip', root);
    const buttons = $$('[data-model]', root);
    let currentKey = 'ens';

    const rows = METRICS.map((m) => {
      const row = el('div', 'metric-row');
      const trackEl = el('div', 'metric-track');
      trackEl.tabIndex = 0;
      trackEl.setAttribute('role', 'img');
      const bar = el('span', 'metric-bar');
      const ghost = el('span', 'metric-ghost');
      trackEl.append(bar, ghost);
      const val = el('span', 'metric-value');
      row.append(el('span', 'metric-name', m), trackEl, val);
      rowsEl.appendChild(row);
      return { m, trackEl, bar, ghost, val };
    });

    const axis = el('div', 'metric-axis');
    const scaleEl = el('div', 'axis-scale');
    ['0', '0.25', '0.5', '0.75', '1.0'].forEach((t) => scaleEl.appendChild(el('span', '', t)));
    axis.append(el('span'), scaleEl, el('span'));
    rowsEl.after(axis);
    const note = el('p', 'metric-note');
    note.append(el('span', 'ghost-key'), el('span', '', 'Leaky random split I caught and fixed (too good to be true)'));
    axis.after(note);

    function render(key, animate = true) {
      currentKey = key;
      const d = DATA[key];
      buttons.forEach((b) => {
        const on = b.dataset.model === key;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      rows.forEach((r) => {
        const v = d.v[r.m];
        const before = d.before && d.before[r.m];
        if (animate) r.bar.style.setProperty('--v', v.toFixed(4));
        r.val.textContent = f3(v);
        r.ghost.style.opacity = before ? '1' : '0';
        if (before) r.ghost.style.setProperty('--g', before.toFixed(4));
        r.trackEl.setAttribute('aria-label', `${d.name} ${r.m}: ${f3(v)}${before ? `, ${f3(before)} with the leaky split` : ''}`);
      });
      note.style.visibility = d.before ? 'visible' : 'hidden';
    }

    function showTip(r) {
      const d = DATA[currentKey];
      const v = d.v[r.m];
      const before = d.before && d.before[r.m];
      tip.textContent = '';
      tip.append(el('div', 'tip-head', d.name));
      const row = el('div', 'tip-row');
      row.append(el('span', 'tip-key'), el('strong', '', f3(v)), el('span', '', r.m));
      tip.append(row);
      if (before) {
        const row2 = el('div', 'tip-row');
        row2.append(el('span', 'tip-key ink'), el('strong', '', f3(before)), el('span', '', 'leaky split'));
        tip.append(row2);
      }
      tip.hidden = false;
      const rr = r.trackEl.getBoundingClientRect();
      const base = root.getBoundingClientRect();
      const left = Math.min(base.width - tip.offsetWidth, Math.max(0, rr.left - base.left + rr.width * v - tip.offsetWidth / 2));
      tip.style.left = `${left}px`;
      tip.style.top = `${rr.top - base.top - tip.offsetHeight - 8}px`;
    }
    rows.forEach((r) => {
      r.trackEl.addEventListener('pointerenter', () => showTip(r));
      r.trackEl.addEventListener('focus', () => showTip(r));
      r.trackEl.addEventListener('pointerleave', () => { tip.hidden = true; });
      r.trackEl.addEventListener('blur', () => { tip.hidden = true; });
    });
    buttons.forEach((b) => b.addEventListener('click', () => {
      render(b.dataset.model);
      track('fraud_model_toggle', { model: b.dataset.model });
    }));

    // Bars grow in the first time the chart is visible
    render(currentKey, false);
    rows.forEach((r) => r.bar.style.setProperty('--v', 0));
    if ('IntersectionObserver' in window && !reduceMotion) {
      const io = new IntersectionObserver(([en]) => {
        if (en.isIntersecting) { render(currentKey); io.disconnect(); }
      }, { threshold: 0.4 });
      io.observe(root);
    } else {
      render(currentKey);
    }
  }
  $$('[data-metrics]').forEach(initMetrics);

  /* ---------- Project filters ---------- */
  const filterBtns = $$('[data-filter]');
  const projects = $$('.project-grid > .project');
  function applyFilter(f) {
    filterBtns.forEach((x) => {
      const on = x.dataset.filter === f;
      x.classList.toggle('is-active', on);
      x.setAttribute('aria-pressed', String(on));
    });
    projects.forEach((p) => {
      const cats = (p.dataset.cats || '').split(/\s+/);
      const show = f === 'all' || cats.includes(f) || cats.includes('all');
      const wasHidden = p.classList.contains('is-hidden');
      p.classList.toggle('is-hidden', !show);
      if (show && wasHidden && !reduceMotion && p.animate) {
        p.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }],
          { duration: 380, easing: 'cubic-bezier(.2,.7,.2,1)' });
      }
    });
  }
  filterBtns.forEach((b) => b.addEventListener('click', () => applyFilter(b.dataset.filter)));

  /* ---------- Skills → where I used them ---------- */
  const skillBtns = $$('.skill');
  const insight = $('.skill-insight');
  if (insight) {
    const empty = $('.insight-empty', insight);
    const body = $('.insight-body', insight);
    const title = $('.insight-title', insight);
    const list = $('.insight-list', insight);
    const items = $$('[data-skills]').map((n) => ({
      el: n,
      skills: n.dataset.skills.split(/\s+/),
      label: n.dataset.item || '',
      type: n.classList.contains('tl-panel') ? 'Experience' : 'Project',
    }));
    let activeSkill = null;

    const clearMatches = () => $$('.is-match').forEach((n) => n.classList.remove('is-match'));
    const scrollToEl = (n) => n.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });

    function goToItem(it) {
      if (it.type === 'Experience') {
        selectRole(it.el.id);
        scrollToEl(isPhoneLayout() ? it.el : $('#experience .timeline'));
      } else {
        if (it.el.classList.contains('is-hidden')) applyFilter('all');
        scrollToEl(it.el);
      }
    }

    // The panel is never empty: it opens on a default skill, and clicking the
    // active skill again keeps it shown instead of clearing the panel.
    function showSkill(btn, highlight) {
      const key = btn.dataset.skill;
      clearMatches();
      activeSkill = key;
      skillBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      const matches = items.filter((it) => it.skills.includes(key));
      title.textContent = '';
      list.textContent = '';
      title.append(el('strong', '', btn.textContent.trim()));
      if (matches.length) {
        title.append(document.createTextNode(` · used in ${matches.length} place${matches.length > 1 ? 's' : ''}`));
        matches.forEach((it) => {
          const li = el('li');
          const b = el('button', 'insight-link');
          b.type = 'button';
          b.append(el('span', '', it.label), el('span', 'insight-type', it.type));
          b.addEventListener('click', () => goToItem(it));
          li.appendChild(b);
          list.appendChild(li);
          if (!highlight) return;
          if (it.type === 'Project') it.el.classList.add('is-match');
          else {
            const tab = document.querySelector(`[aria-controls="${it.el.id}"]`);
            if (tab) tab.classList.add('is-match');
          }
        });
      }
      if (btn.dataset.note) list.appendChild(el('li', 'insight-note', btn.dataset.note));
      empty.hidden = true;
      body.hidden = false;
    }

    skillBtns.forEach((btn) => btn.addEventListener('click', () => {
      if (activeSkill === btn.dataset.skill) return;
      showSkill(btn, true);
      track('skill_click', { skill: btn.dataset.skill });
    }));
    skillBtns.forEach((b) => b.setAttribute('aria-pressed', 'false'));
    const defaultSkill = $('.skill[data-skill="llm"]') || skillBtns[0];
    if (defaultSkill) showSkill(defaultSkill, false);
  }

  /* ---------- Gallery filter + lightbox ---------- */
  const gBtns = $$('[data-gfilter]');
  const gItems = $$('.gallery li');
  gBtns.forEach((b) => b.addEventListener('click', () => {
    const f = b.dataset.gfilter;
    gBtns.forEach((x) => {
      const on = x === b;
      x.classList.toggle('is-active', on);
      x.setAttribute('aria-pressed', String(on));
    });
    gItems.forEach((li) => {
      const show = f === 'all' || li.dataset.kind === f;
      const wasHidden = li.classList.contains('is-hidden');
      li.classList.toggle('is-hidden', !show);
      if (show && wasHidden && !reduceMotion && li.animate) {
        li.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' });
      }
    });
  }));

  const lb = $('#lightbox');
  if (lb) {
    const lbImg = $('img', lb);
    const lbCap = $('figcaption', lb);
    let lbList = [];
    let lbIdx = 0;
    lbImg.addEventListener('load', () => { lbImg.style.opacity = '1'; });
    const lbShow = (i) => {
      if (!lbList.length) return;
      lbIdx = (i + lbList.length) % lbList.length;
      const btn = lbList[lbIdx];
      const url = new URL(btn.dataset.full, window.location.href).href;
      lbImg.alt = $('img', btn).alt;
      lbCap.textContent = btn.dataset.caption || '';
      if (lbImg.src === url) {
        lbImg.style.opacity = '1';
      } else {
        lbImg.style.opacity = '0';
        lbImg.src = url;
      }
    };
    $$('.photo').forEach((btn) => btn.addEventListener('click', () => {
      lbList = $$('.gallery li:not(.is-hidden) .photo');
      openDialog(lb);
      lbShow(lbList.indexOf(btn));
      track('photo_open');
    }));
    $('[data-lb-prev]', lb).addEventListener('click', () => lbShow(lbIdx - 1));
    $('[data-lb-next]', lb).addEventListener('click', () => lbShow(lbIdx + 1));
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') lbShow(lbIdx - 1);
      if (e.key === 'ArrowRight') lbShow(lbIdx + 1);
    });
  }

  /* ---------- Easter egg: chocolate rain ---------- */
  function chocoRain() {
    if (reduceMotion) { toast('🍫 Consider it rained. (Reduced motion is on.)'); return; }
    // 'cup' = small peanut butter cup drawn in CSS; most of the rain is cups
    const treats = ['cup', 'cup', 'cup', 'cup', 'cup', '🍫', '🍫', '🍰', '🧁'];
    for (let i = 0; i < 40; i++) {
      const t = treats[Math.floor(Math.random() * treats.length)];
      const s = t === 'cup' ? el('span', 'choco choco-cup') : el('span', 'choco', t);
      s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--x', `${(Math.random() * 100).toFixed(1)}vw`);
      s.style.setProperty('--s', `${(1 + Math.random() * 0.7).toFixed(2)}rem`);
      s.style.setProperty('--t', `${(2.4 + Math.random() * 2).toFixed(2)}s`);
      s.style.setProperty('--delay', `${(Math.random() * 0.9).toFixed(2)}s`);
      s.style.setProperty('--r', `${Math.random() > 0.5 ? '' : '-'}${Math.round(180 + Math.random() * 360)}deg`);
      s.addEventListener('animationend', () => s.remove());
      document.body.appendChild(s);
    }
    toast('Forecast: 100% chance of chocolate 🍫 (model error +200%)');
  }
  $$('[data-egg]').forEach((b) => b.addEventListener('click', () => { chocoRain(); track('easter_egg'); }));

  /* ---------- Command palette (⌘K / Ctrl K / "/") ---------- */
  const pal = $('#palette');
  if (pal) {
    const input = $('input', pal);
    const list = $('.palette-list', pal);
    const go = (sel) => {
      const t = $(sel);
      if (t) t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    };
    const openUrl = (url, ev) => {
      window.open(url, '_blank', 'noopener');
      if (ev) track(ev);
    };
    const ACTIONS = [
      { group: 'Navigate', label: 'Experience', hint: 'Timeline of roles', run: () => go('#experience'), kw: 'work jobs internships bank of america ant group pwc marmon dsi' },
      { group: 'Navigate', label: 'Projects', hint: 'Agenthon, fraud detection…', run: () => go('#projects'), kw: 'portfolio work' },
      { group: 'Navigate', label: 'Agenthon: 1st-place forecasting agent', hint: 'Featured', run: () => go('#agenthon-t2'), kw: 'neurips competition winner track 2 quant' },
      { group: 'Navigate', label: 'Skills', hint: 'Tools & methods', run: () => go('#skills'), kw: 'python sql pytorch stack' },
      { group: 'Navigate', label: 'About me', hint: 'Photos & story', run: () => go('#about'), kw: 'bio baking hobbies leadership' },
      { group: 'Navigate', label: 'Contact', hint: 'Say hi', run: () => go('#contact'), kw: 'email hire reach' },
      { group: 'Actions', label: 'Open resume', hint: 'PDF', run: () => openUrl(LINKS.resume, 'resume_palette'), kw: 'cv download pdf' },
      { group: 'Actions', label: 'Copy email address', hint: EMAIL, run: () => copyEmail(), kw: 'mail contact' },
      { group: 'Actions', label: 'Case study: Agenthon Track 2', hint: '1st of 87', run: () => openCase('case-t2'), kw: 'forecasting neurips' },
      { group: 'Actions', label: 'Case study: Agenthon Track 4', hint: '4th of 63', run: () => openCase('case-t4'), kw: 'llm agent explainability' },
      { group: 'Actions', label: 'Case study: Fraud detection', hint: 'XGBoost + LightGBM', run: () => openCase('case-fraud'), kw: 'ml mlops leakage auc' },
      { group: 'Links', label: 'LinkedIn', hint: 'jiaqihe-stats', run: () => openUrl(LINKS.linkedin, 'linkedin_palette'), kw: 'social' },
      { group: 'Links', label: 'GitHub', hint: 'scarletthejiaqi', run: () => openUrl(LINKS.github, 'github_palette'), kw: 'code repos' },
      { group: 'Links', label: 'Agenthon leaderboard', hint: 'agenthon.net', run: () => openUrl(LINKS.leaderboard, 'leaderboard_palette'), kw: 'results rank' },
      { group: 'Fun', label: 'Make it rain chocolate', hint: '🍫', run: () => chocoRain(), kw: 'easter egg reese peanut butter' },
    ];
    let items = [];
    let idx = 0;

    const setIdx = (i) => {
      idx = i;
      $$('.palette-item', list).forEach((li, k) => li.setAttribute('aria-selected', String(k === i)));
      const cur = document.getElementById(`pal-${i}`);
      if (cur) {
        input.setAttribute('aria-activedescendant', cur.id);
        cur.scrollIntoView({ block: 'nearest' });
      }
    };
    const runAction = (i) => {
      const a = items[i];
      if (!a) return;
      pal.close();
      track('palette_action', { action: a.label });
      setTimeout(a.run, 40);
    };
    const render = (q) => {
      const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
      items = ACTIONS.filter((a) => {
        const hay = `${a.label} ${a.kw || ''} ${a.group} ${a.hint}`.toLowerCase();
        return words.every((w) => hay.includes(w));
      });
      list.textContent = '';
      input.removeAttribute('aria-activedescendant');
      if (!items.length) {
        list.appendChild(el('li', 'palette-empty', 'No matches. Try “resume” or “projects”.'));
        return;
      }
      let lastGroup = '';
      items.forEach((a, i) => {
        if (a.group !== lastGroup) {
          const g = el('li', 'palette-group', a.group);
          g.setAttribute('role', 'presentation');
          list.appendChild(g);
          lastGroup = a.group;
        }
        const li = el('li', 'palette-item');
        li.id = `pal-${i}`;
        li.setAttribute('role', 'option');
        li.append(el('span', '', a.label), el('span', 'palette-hint', a.hint));
        li.addEventListener('click', () => runAction(i));
        li.addEventListener('pointermove', () => { if (idx !== i) setIdx(i); });
        list.appendChild(li);
      });
      setIdx(0);
    };
    const openPalette = () => {
      if (pal.open) return;
      input.value = '';
      render('');
      openDialog(pal);
      input.focus();
      track('palette_open');
    };

    input.addEventListener('input', () => render(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (items.length) setIdx(Math.min(items.length - 1, idx + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (items.length) setIdx(Math.max(0, idx - 1)); }
      else if (e.key === 'Enter') { e.preventDefault(); runAction(idx); }
    });
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (pal.open) pal.close(); else if (!anyDialogOpen()) openPalette();
      } else if (e.key === '/' && !isTyping(e.target) && !anyDialogOpen()) {
        e.preventDefault();
        openPalette();
      }
    });
    $$('[data-palette-open]').forEach((b) => b.addEventListener('click', openPalette));

    const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
    if (!isMac) $$('[data-mod-key]').forEach((k) => { k.textContent = 'Ctrl K'; });
  }

  /* ---------- Analytics: clicks on tracked links ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('[data-track]');
    if (t) track(t.dataset.track, { link_url: t.href || '' });
  });

  /* ---------- Deep links to case studies (e.g. /#case-t2) ---------- */
  if (/^#case-[\w-]+$/.test(window.location.hash)) {
    const d = $(window.location.hash);
    if (d && d.tagName === 'DIALOG') openCase(d.id);
  }

  initVanta();
})();
