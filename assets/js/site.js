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
