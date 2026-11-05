/* Versão publicada: complementos fora do runtime do dashboard */
(() => {
  const root = document.querySelector('.ps'); if (!root) return;
  const RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* barra de progresso da leitura */
  const bar = document.querySelector('.ps-readbar > span');
  let tick = false;
  const upd = () => {
    tick = false; const se = document.scrollingElement || document.documentElement;
    const max = se.scrollHeight - se.clientHeight; if (bar) bar.style.setProperty('--p', max > 0 ? String(Math.min(1, se.scrollTop / max)) : '0');
  };
  window.addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, {passive: true});
  window.addEventListener('resize', upd, {passive: true}); upd();

  /* imagens carregam perto da tela (a capa carrega de imediato) */
  const photos = [...document.querySelectorAll('.ps-photo')];
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('ps-ld'); io.unobserve(e.target); } }), {rootMargin: '900px 0px'});
    photos.forEach((p) => io.observe(p));
  } else photos.forEach((p) => p.classList.add('ps-ld'));

  /* preenchimento dos controles deslizantes */
  const fill = (i) => { const min = Number(i.min) || 0; const max = Number(i.max) || 100; i.style.setProperty('--fill', ((Number(i.value) - min) / (max - min) * 100).toFixed(1) + '%'); };
  document.querySelectorAll('input[type=range]').forEach((i) => { fill(i); i.addEventListener('input', () => fill(i)); });

  /* links externos: abrem em nova aba sem tirar a pessoa da proposta */
  document.querySelectorAll('a[target=_blank]').forEach((a) => { a.rel = 'noopener'; });

  /* fluxo de mensuração entra em sequência */
  const flow = document.querySelector('.ps-flow');
  if (flow && !RM && 'IntersectionObserver' in window) {
    flow.classList.add('ps-flow-js');
    const o = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { flow.classList.add('ps-flow-in'); o.disconnect(); } }), {threshold: .25});
    o.observe(flow);
  }
})();

/* cenários visíveis: botões com preço no lugar das listas suspensas */
(() => {
  const money = new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'});
  const price = (ordem, cen) => { try { const t = dash.data('totais'); const r = t.status === 'ok' ? t.data.find((x) => Number(x.ordem) === Number(ordem) && x.cenario === cen) : null; return r ? money.format(r.total) : ''; } catch (e) { return ''; } };
  const segs = [];
  document.querySelectorAll('select[data-cenario]').forEach((sel) => {
    const seg = document.createElement('div'); seg.className = 'ps-seg'; seg.setAttribute('role', 'radiogroup'); seg.setAttribute('aria-label', sel.getAttribute('aria-label') || 'Cenário');
    [...sel.options].forEach((o) => {
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.v = o.value;
      const n = document.createElement('span'); n.textContent = o.value; const p = document.createElement('small'); p.textContent = price(sel.dataset.cenario, o.value);
      b.append(n, p);
      b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); if (sel.value === o.value) return; sel.value = o.value; sel.dispatchEvent(new Event('change', {bubbles: true})); });
      seg.appendChild(b);
    });
    sel.classList.add('ps-seg-src'); sel.after(seg); segs.push([sel, seg]);
  });
  const sync = () => segs.forEach(([sel, seg]) => seg.querySelectorAll('button').forEach((b) => { const on = b.dataset.v === sel.value; b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; }));
  segs.forEach(([, seg]) => seg.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return; e.preventDefault();
    const bs = [...seg.querySelectorAll('button')]; const i = bs.findIndex((b) => b.getAttribute('aria-checked') === 'true');
    const n = bs[(i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? bs.length - 1 : 1)) % bs.length]; n.click(); n.focus();
  }));
  document.addEventListener('change', (e) => { if (e.target.matches && e.target.matches('select[data-cenario]')) sync(); });
  sync();
})();
