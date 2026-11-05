
(() => {
  const root = document.querySelector('.ps'); if (!root) return;
  const RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const FINE = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  const HAS_IO = 'IntersectionObserver' in window;
  const NS = 'http://www.w3.org/2000/svg';
  root.classList.add(RM ? 'ps-rm' : 'ps-cine');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const vh = () => window.innerHeight || document.documentElement.clientHeight;
  const once = (els, fn, t = 0.2, m = '0px') => {
    els = els.filter(Boolean); if (!HAS_IO) { els.forEach(fn); return; }
    const o = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { o.unobserve(e.target); fn(e.target); } }, {threshold: t, rootMargin: m});
    els.forEach((el) => o.observe(el));
  };
  const live = (els) => { if (!HAS_IO) return; const o = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('ps-live', e.isIntersecting)), {}); els.filter(Boolean).forEach((el) => o.observe(el)); };
  /* um único laço de rolagem: só roda o que está perto da tela */
  const tasks = new Set(); let ticking = false;
  const run = () => { ticking = false; const h = vh(); tasks.forEach((t) => { if (t.on) t.fn(h); }); };
  const kick = () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } };
  document.addEventListener('scroll', kick, {passive: true, capture: true});
  window.addEventListener('resize', kick, {passive: true});
  const task = (el, fn, margin = '20%') => {
    const t = {on: !HAS_IO, fn}; tasks.add(t);
    if (HAS_IO) new IntersectionObserver((es) => { t.on = es[es.length - 1].isIntersecting; if (t.on) kick(); }, {rootMargin: `${margin} 0px ${margin} 0px`}).observe(el);
    return t;
  };
  const tiltOn = (el, maxX, maxY, glare) => {
    if (!FINE || RM) return;
    let raf = 0, last = null;
    el.addEventListener('pointermove', (e) => {
      last = e; if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0; const r = el.getBoundingClientRect(); const nx = clamp((last.clientX - r.left) / r.width, 0, 1); const ny = clamp((last.clientY - r.top) / r.height, 0, 1);
        el.style.setProperty('--ry', ((nx - 0.5) * 2 * maxY).toFixed(2) + 'deg'); el.style.setProperty('--rx', ((0.5 - ny) * 2 * maxX).toFixed(2) + 'deg');
        if (glare) { el.style.setProperty('--gx', (nx * 100).toFixed(1) + '%'); el.style.setProperty('--gy', (ny * 100).toFixed(1) + '%'); }
        el.classList.add('ps-tilting');
      });
    }, {passive: true});
    el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); el.classList.remove('ps-tilting'); });
  };

  /* ---------- 1. CAPA ---------- */
  const hero = root.querySelector('.ps-hero-full');
  if (hero && hero.querySelector('.ps-hero-media')) {
    const media = hero.querySelector('.ps-hero-media');
    live([hero]);
    if (!RM) {
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('ps-cine-go')));
      setTimeout(() => root.classList.add('ps-cine-settled'), 2700);
      let tx = 0, ty = 0, cx = 0, cy = 0, sy = 0, going = false;
      const step = () => {
        cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
        media.style.setProperty('--hx', (cx * -12).toFixed(2) + 'px'); media.style.setProperty('--hy', (cy * -10 + sy).toFixed(2) + 'px');
        if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) requestAnimationFrame(step); else going = false;
      };
      const go = () => { if (!going) { going = true; requestAnimationFrame(step); } };
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect(); const nx = clamp((e.clientX - r.left) / r.width, 0, 1); const ny = clamp((e.clientY - r.top) / r.height, 0, 1);
        tx = nx * 2 - 1; ty = ny * 2 - 1;
        hero.style.setProperty('--mx', (nx * 100).toFixed(1) + '%'); hero.style.setProperty('--my', (ny * 100).toFixed(1) + '%');
        hero.classList.add('ps-glowing'); go();
      }, {passive: true});
      hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; hero.classList.remove('ps-glowing'); go(); });
      hero.addEventListener('pointercancel', () => { hero.classList.remove('ps-glowing'); });
      task(hero, () => { const r = hero.getBoundingClientRect(); sy = clamp(-r.top * 0.1, 0, 44); media.style.setProperty('--hy', (cy * -10 + sy).toFixed(2) + 'px'); }, '0%');
    }
  }

  /* ---------- 2. JORNADA DO HERÓI ---------- */
  const hj = root.querySelector('.ps-hj');
  if (hj) {
    const sec = hj.closest('section'); const lis = [...hj.children];
    const segs = [...sec.querySelectorAll('.ps-hj-seg')].slice(0, lis.length - 1);
    const layout = () => {
      const sr = sec.getBoundingClientRect(); const pad = parseFloat(getComputedStyle(lis[0]).paddingLeft) || 20;
      segs.forEach((s, i) => {
        const a = lis[i].getBoundingClientRect(); const b = lis[i + 1].getBoundingClientRect();
        if (Math.abs(a.top - b.top) > 4) { s.style.display = 'none'; return; }
        const x1 = a.left - sr.left + pad + 28 + 8; const x2 = b.left - sr.left + pad - 8;
        s.style.display = ''; s.style.left = x1 + 'px'; s.style.width = Math.max(0, x2 - x1) + 'px'; s.style.top = (a.top - sr.top + 27) + 'px';
      });
    };
    layout(); if ('ResizeObserver' in window) new ResizeObserver(layout).observe(hj);
    let lit = RM ? lis.length : 0;
    const paint = () => { hj.style.setProperty('--hjp', String(lit / lis.length)); lis.forEach((l, i) => l.classList.toggle('ps-lit', i < lit)); segs.forEach((s, i) => s.classList.toggle('ps-on', i + 1 < lit)); };
    paint();
    if (!RM) task(hj, (h) => {
      const rows = {}; let n = 0;
      for (let i = 0; i < lis.length; i++) {
        const r = lis[i].getBoundingClientRect(); const k = Math.round(r.top); rows[k] = (rows[k] ?? -1) + 1;
        if (r.top + 30 < h * 0.88 - rows[k] * 55) n = i + 1; else break;
      }
      if (n > lit) { for (let i = lit; i < n; i++) if (!FINE) { const l = lis[i]; l.classList.add('ps-pop'); setTimeout(() => l.classList.remove('ps-pop'), 700); } lit = n; paint(); }
    }, '10%');
  }

  /* ---------- 3. MÁSCARAS, MARCOS E HELENA ---------- */
  const photos = [...root.querySelectorAll('.ps-photo')];
  photos.forEach((p, i) => { p.classList.add('ps-mask'); p.dataset.dir = (p.closest('.ps-persona') || p.closest('.ps-close')) ? 'b' : (i % 2 ? 'l' : 'r'); });
  /* a máscara zera a área visível; por isso observamos o contêiner da foto */
  const revealVia = (els, cls) => {
    const map = new Map(); els.forEach((el) => { const w = el.parentElement; if (!map.has(w)) map.set(w, []); map.get(w).push(el); });
    once([...map.keys()], (w) => map.get(w).forEach((el) => el.classList.add(cls)), 0, '0px 0px -12% 0px');
  };
  revealVia(photos, 'ps-open');

  const personas = [...root.querySelectorAll('#personas .ps-persona')];
  personas.forEach((c) => { c.classList.add('ps-tilt'); tiltOn(c, 2.5, 3.5, true); });
  const tbl = root.querySelector('#personas table');
  if (tbl && personas.length >= 2) {
    let pinned = 0;
    const setF = (col) => {
      tbl.querySelectorAll('th, td').forEach((c) => c.classList.toggle('ps-colon', col > 0 && c.cellIndex === col));
      personas.forEach((p, i) => { p.classList.toggle('ps-focus', col === i + 1); p.classList.toggle('ps-dim', col > 0 && col !== i + 1); });
    };
    tbl.addEventListener('pointerover', (e) => { if (e.pointerType !== 'mouse') return; const c = e.target.closest('td, th'); if (c) setF(c.cellIndex >= 1 ? c.cellIndex : pinned); });
    tbl.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') setF(pinned); });
    tbl.addEventListener('click', (e) => { if (e.pointerType === 'mouse') return; const c = e.target.closest('td, th'); if (!c) return; const col = c.cellIndex >= 1 ? c.cellIndex : 0; pinned = pinned === col ? 0 : col; setF(pinned); });
    tbl.querySelectorAll('thead th').forEach((th, i) => {
      if (!i) return; th.tabIndex = 0;
      th.addEventListener('focus', () => setF(i)); th.addEventListener('blur', () => setF(pinned));
      th.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pinned = pinned === i ? 0 : i; setF(pinned); } });
    });
  }
  /* fio vermelho: Marcos e Helena até a Power Shape */
  const pSec = root.querySelector('#personas'); const pSplit = pSec && pSec.querySelector('.ps-split');
  if (pSec && pSplit && personas.length >= 2 && pSec.querySelector('svg.ps-thread')) {
    const node = pSec.querySelector('.ps-thread-node'); const dot = pSec.querySelector('.ps-thread-dot'); const svg = pSec.querySelector('svg.ps-thread');
    const tracks = [...svg.querySelectorAll('.ps-th-track')]; const lines = [...svg.querySelectorAll('.ps-th-line')];
    let prog = RM ? 1 : 0; let L = [0, 0];
    const apply = () => { lines.forEach((p, i) => { p.style.strokeDasharray = `${L[i]} ${L[i]}`; p.style.strokeDashoffset = String(L[i] * (1 - prog)); }); node.classList.toggle('ps-on', prog >= 0.98); };
    const draw = () => {
      const sr = pSec.getBoundingClientRect(); svg.setAttribute('width', sr.width); svg.setAttribute('height', sr.height); svg.setAttribute('viewBox', `0 0 ${sr.width} ${sr.height}`);
      const [a, b] = personas.map((p) => p.getBoundingClientRect()); const d = dot.getBoundingClientRect();
      const X = (v) => v - sr.left; const Y = (v) => v - sr.top; const cx = X(d.left + d.width / 2); const cy = Y(d.top + d.height / 2); const rr = d.width / 2 + 2;
      let p1, p2;
      if (Math.abs(a.top - b.top) < 10) {
        const ax = X(a.left + a.width / 2), ay = Y(a.bottom), bx = X(b.left + b.width / 2), by = Y(b.bottom);
        p1 = `M${ax},${ay} C${ax},${cy} ${ax + (cx - ax) * 0.45},${cy} ${cx - rr},${cy}`;
        p2 = `M${bx},${by} C${bx},${cy} ${bx + (cx - bx) * 0.45},${cy} ${cx + rr},${cy}`;
      } else {
        const ax = X(a.left + a.width / 2);
        p1 = `M${ax},${Y(a.bottom)} L${ax},${Y(b.top)}`;
        p2 = `M${ax},${Y(b.bottom)} L${cx},${cy - rr}`;
      }
      [p1, p2].forEach((dd, i) => { tracks[i].setAttribute('d', dd); lines[i].setAttribute('d', dd); L[i] = lines[i].getTotalLength(); });
      apply();
    };
    draw(); if ('ResizeObserver' in window) new ResizeObserver(draw).observe(pSec);
    if (!RM) task(node, (h) => { const r = node.getBoundingClientRect(); const p = clamp((h * 0.95 - r.top) / (h * 0.42), 0, 1); if (p > prog) { prog = p; apply(); } }, '30%');
  }

  /* ---------- 4. DADOS: reputação e concorrência ---------- */
  const conc = root.querySelector('#chart-conc');
  const rowsBody = root.querySelector('tbody[data-draw="conc-rows"]');
  let concFocus = () => {};
  const markRow = (marca) => { if (!rowsBody) return; rowsBody.querySelectorAll('tr').forEach((tr) => tr.classList.toggle('ps-row-hot', !!marca && tr.cells[0] && tr.cells[0].textContent === marca)); };
  if (conc) {
    const enhance = () => {
      const svg = conc.querySelector(':scope > svg'); if (!svg || svg.__psCine) return; svg.__psCine = 1;
      svg.classList.add('ps-conc');
      const dots = [...svg.querySelectorAll('circle.d')]; if (!dots.length) return;
      const focus = (c) => {
        dots.forEach((x) => x.classList.toggle('ps-hot', x === c)); svg.classList.toggle('ps-dim', !!c);
        markRow(c && c.__data__ ? c.__data__.marca : null);
      };
      dots.forEach((c) => {
        const r = c.__data__ || {};
        c.setAttribute('tabindex', '0'); c.setAttribute('role', 'img');
        if (r.marca) c.setAttribute('aria-label', `${r.marca}: nota ${Number(r.nota).toLocaleString('pt-BR', {minimumFractionDigits: 1})}, ${Number(r.avaliacoes).toLocaleString('pt-BR')} avaliações`);
        c.addEventListener('pointerenter', () => focus(c)); c.addEventListener('pointerdown', () => focus(c));
        c.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') focus(null); });
        c.addEventListener('focus', () => focus(c)); c.addEventListener('blur', () => focus(null));
      });
      concFocus = (marca) => focus(dots.find((c) => c.__data__ && c.__data__.marca === marca) || null);
    };
    new MutationObserver(enhance).observe(conc, {childList: true}); enhance();
  }
  if (rowsBody) {
    let pinned = null;
    rowsBody.addEventListener('pointerover', (e) => { if (e.pointerType !== 'mouse') return; const tr = e.target.closest('tr'); if (tr && tr.cells[0]) concFocus(tr.cells[0].textContent); });
    rowsBody.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') concFocus(pinned); });
    rowsBody.addEventListener('click', (e) => { if (e.pointerType === 'mouse') return; const tr = e.target.closest('tr'); if (!tr || !tr.cells[0]) return; const m = tr.cells[0].textContent; pinned = pinned === m ? null : m; concFocus(pinned); });
  }

  /* ---------- 5. PASSAGEM DE CAPÍTULO ---------- */
  const parts = [...root.querySelectorAll('.ps-part')];
  parts.forEach((p) => {
    const g = p.querySelector('.ps-part-ghost'); if (!g) return;
    p.classList.add('ps-part-cine');
    if (!RM) task(p, (h) => { const r = p.getBoundingClientRect(); const k = clamp((h - r.top) / (h + r.height), 0, 1); g.style.setProperty('--gx', ((0.35 - k) * 520).toFixed(1) + 'px'); }, '10%');
  });
  once(parts, (p) => p.classList.add('ps-part-in'), 0.4);
  kick();

  /* números de capítulo */
  const nums = [...root.querySelectorAll('.ps-chapter-n, .ps-band-n')];
  nums.forEach((n) => n.classList.add('ps-rise'));
  revealVia(nums, 'ps-up');

  /* ---------- 6. CAPÍTULO DO SITE ---------- */
  const mock = root.querySelector('.ps-img-s10');
  if (mock) {
    mock.classList.add('ps-mock'); tiltOn(mock, 3, 4.5, false);
    if (!RM) task(mock, (h) => { const r = mock.getBoundingClientRect(); const k = clamp((r.top + r.height / 2 - h / 2) / h, -1, 1); mock.style.setProperty('--py', (k * -18).toFixed(1) + 'px'); });
  }
  const cta = root.querySelector('#site .ps-cta');
  if (cta && FINE && !RM) {
    const zone = cta.parentElement;
    const reset = () => { cta.style.setProperty('--cx', '0px'); cta.style.setProperty('--cy', '0px'); };
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = cta.getBoundingClientRect(); const dx = e.clientX - (r.left + r.width / 2); const dy = e.clientY - (r.top + r.height / 2); const d = Math.hypot(dx, dy); const R = 150;
      if (d < R) { const f = 1 - d / R; cta.style.setProperty('--cx', (dx * 0.2 * f).toFixed(1) + 'px'); cta.style.setProperty('--cy', (dy * 0.28 * f).toFixed(1) + 'px'); } else reset();
    }, {passive: true});
    zone.addEventListener('pointerleave', reset);
  }
  if (cta && !FINE && !RM) once([cta], (c) => setTimeout(() => c.classList.add('ps-sheen-go'), 400), 0.8);
  const vs = root.querySelector('#site > .ps-split');
  if (vs) {
    const cards = vs.querySelectorAll(':scope > .ps-card');
    if (cards.length >= 2) {
      const [hoje, com] = cards; vs.classList.add('ps-vs'); hoje.classList.add('ps-hoje'); com.classList.add('ps-com');
      let pinned = null;
      const set = (w) => { vs.classList.toggle('ps-f-hoje', w === 'hoje'); vs.classList.toggle('ps-f-com', w === 'com'); };
      [[hoje, 'hoje'], [com, 'com']].forEach(([c, w]) => {
        c.tabIndex = 0;
        c.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') set(w); });
        c.addEventListener('click', (e) => { if (e.pointerType === 'mouse') return; pinned = pinned === w ? null : w; set(pinned); });
        c.addEventListener('focus', () => set(w)); c.addEventListener('blur', () => set(pinned));
      });
      vs.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') set(pinned); });
      if (!FINE && !RM) once([vs], () => { set('hoje'); setTimeout(() => set('com'), 1400); setTimeout(() => { if (!pinned) set(null); }, 3400); }, 0.6);
    }
  }

  /* ---------- 7. CAPÍTULOS 2 A 5 ---------- */
  /* passaporte */
  if (!RM && 'MutationObserver' in window) {
    const was = new WeakMap();
    root.querySelectorAll('.ps-stamp').forEach((s) => {
      was.set(s, s.classList.contains('ps-on'));
      new MutationObserver(() => {
        const on = s.classList.contains('ps-on'); if (on && !was.get(s)) {
          s.classList.remove('ps-hit'); void s.offsetWidth; s.classList.add('ps-hit');
          const box = s.closest('.ps-stamps'); if (box) { box.classList.remove('ps-thud'); void box.offsetWidth; box.classList.add('ps-thud'); }
        }
        was.set(s, on);
      }).observe(s, {attributes: true, attributeFilter: ['class']});
    });
  }
  /* Power 50 */
  const bottle = root.querySelector('.ps-img-s16');
  if (bottle) { if (!FINE && !RM) once([bottle], (b) => setTimeout(() => b.classList.add('ps-sheen-go'), 900), 0.6); }
  /* raspadinha: partículas leves, mecânica intacta */
  const scr = root.querySelector('.ps-scratch');
  if (scr && !RM && scr.querySelector('canvas.ps-particles')) {
    const pc = scr.querySelector('canvas.ps-particles');
    const ctx = pc.getContext('2d'); const parts2 = []; let raf = 0; let down = false; let lastT = 0;
    const size = () => { const r = scr.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1); pc.width = r.width * dpr; pc.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); window.addEventListener('resize', size, {passive: true});
    const COLS = ['#d9d9d9', '#bdbdbd', '#efefef', '#cfcfcf', '#F6900D'];
    const loop = () => {
      const r = scr.getBoundingClientRect(); ctx.clearRect(0, 0, r.width, r.height);
      for (let i = parts2.length - 1; i >= 0; i--) {
        const p = parts2[i]; p.vy += 0.32; p.x += p.vx; p.y += p.vy; p.life -= 1; p.rot += p.vr;
        if (p.life <= 0 || p.y > r.height + 10) { parts2.splice(i, 1); continue; }
        ctx.save(); ctx.globalAlpha = Math.min(1, p.life / 22); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); ctx.restore();
      }
      raf = parts2.length ? requestAnimationFrame(loop) : 0;
    };
    const emit = (e, n) => {
      const r = scr.getBoundingClientRect(); const x = e.clientX - r.left; const y = e.clientY - r.top;
      for (let i = 0; i < n && parts2.length < 70; i++) parts2.push({x, y, vx: (Math.random() - 0.5) * 3.2, vy: -Math.random() * 2.6 - 0.4, s: 2 + Math.random() * 3.2, c: COLS[(Math.random() * COLS.length) | 0], life: 26 + Math.random() * 18, rot: Math.random() * 3, vr: (Math.random() - 0.5) * 0.4});
      if (!raf) raf = requestAnimationFrame(loop);
    };
    scr.addEventListener('pointerdown', (e) => { down = true; scr.classList.add('ps-scratching'); emit(e, 8); });
    scr.addEventListener('pointermove', (e) => { if (!down) return; const t = performance.now(); if (t - lastT < 24) return; lastT = t; emit(e, 3); }, {passive: true});
    const up = () => { down = false; scr.classList.remove('ps-scratching'); };
    scr.addEventListener('pointerup', up); scr.addEventListener('pointerleave', up); scr.addEventListener('pointercancel', up);
  }
  /* sound healing: sol e bandeiras ao vento */
  const sh = root.querySelector('.ps-img-s14');
  if (sh && sh.querySelector('.ps-sun')) {
    const IW = 500, IH = 281; /* coordenadas medidas na imagem (escala 500 × 281) */
    const sun = sh.querySelector('.ps-sun');
    const FLAGS = [{poly: [[452, 26], [494, 22], [494, 172], [452, 172]], o: [472, 174]}, {poly: [[295, 74], [324, 74], [324, 171], [295, 171]], o: [309, 173]}, {poly: [[4, 56], [43, 56], [43, 185], [4, 185]], o: [22, 187]}];
    const flags = RM ? [] : [...sh.querySelectorAll('.ps-flag')];
    const fit = () => {
      const w = sh.clientWidth, h = sh.clientHeight; if (!w || !h) return;
      const s = Math.max(w / IW, h / IH); const ox = (w - IW * s) / 2; const oy = (h - IH * s) / 2; const P = ([x, y]) => [ox + x * s, oy + y * s];
      const [sx, sy] = P([386, 103]); sun.style.setProperty('--sx', sx + 'px'); sun.style.setProperty('--sy', sy + 'px');
      flags.forEach((f, i) => { const F = FLAGS[i]; f.style.clipPath = `polygon(${F.poly.map((p) => P(p).map((v) => v.toFixed(1) + 'px').join(' ')).join(', ')})`; const [a, b] = P(F.o); f.style.transformOrigin = `${a.toFixed(1)}px ${b.toFixed(1)}px`; });
    };
    fit(); if ('ResizeObserver' in window) new ResizeObserver(fit).observe(sh);
    live([sh]);
  }

  /* ---------- 8. INVESTIMENTO ---------- */
  const dock = root.querySelector('[data-dock]');
  const meter = dock ? dock.querySelector('.ps-dock-meter') : null;
  const syncBoxes = (pulse) => {
    root.querySelectorAll('input[data-acao]').forEach((i) => {
      const b = i.closest('.ps-toggle, .ps-join'); if (!b) return;
      const was = b.classList.contains('ps-checked'); b.classList.toggle('ps-checked', i.checked);
      if (pulse && was !== i.checked && !RM) { b.classList.remove('ps-pulse'); void b.offsetWidth; b.classList.add('ps-pulse'); }
    });
    if (meter && window.PS) { const n = Object.values(window.PS.inc).filter(Boolean).length; meter.style.setProperty('--k', String(n / 5)); }
  };
  const bump = () => {
    if (RM) return;
    [...((root.querySelector('#investimento > .ps-tiles') || {}).children || [])].filter((x) => x.classList.contains('ps-tile')).forEach((t, i) => { t.classList.remove('ps-bump'); void t.offsetWidth; t.style.animationDelay = (i * 60) + 'ms'; t.classList.add('ps-bump'); });
  };
  syncBoxes(false);
  root.addEventListener('change', (e) => {
    if (e.target.closest('input[data-acao]')) { syncBoxes(true); bump(); }
    else if (e.target.closest('select[data-cenario]')) bump();
  });

  /* ---------- 9. FECHAMENTO ---------- */
  const close = root.querySelector('#fechamento');
  if (close) {
    [...close.children].forEach((c, i) => c.style.setProperty('--i', String(i)));
    if (!RM) close.classList.add('ps-layered');
    once([close], (c) => {
      c.classList.add('ps-landed');
      const call = c.querySelector('.ps-callout'); if (call && !RM) setTimeout(() => call.classList.add('ps-glow2'), 1300);
    }, 0.25);
  }
  /* a barra aparece a partir do capítulo 1 também quando se pula pelo menu */
  const siteSec = root.querySelector('#site');
  if (dock && siteSec) { tasks.add({on: true, fn: (h) => dock.classList.toggle('ps-dock-on', siteSec.getBoundingClientRect().top < h)}); kick(); }
  /* a barra Sua jornada sai de cena no fechamento */
  if (close && dock && HAS_IO) new IntersectionObserver((es) => { const e = es[es.length - 1]; dock.classList.toggle('ps-dock-away', e.isIntersecting); }, {rootMargin: '0px 0px -35% 0px'}).observe(close);
  const foot = root.querySelector('.ps-foot'); once([foot], (f) => f.classList.add('ps-foot-in'), 0.5);
})();
