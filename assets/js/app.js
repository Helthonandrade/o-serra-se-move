
dash.calc('totais', {
  inputs: ['investimento'],
  title: 'Total por ação e cenário',
  description: 'Soma dos itens de cada ação em cada cenário, separando o que sai em nota da BAITA e o que é pago direto.',
  fn: (investimento) => {
    const m = new Map();
    for (const r of investimento) {
      const k = r.acao + '|' + r.cenario;
      const o = m.get(k) || {chave: k, ordem: Number(r.ordem), acao: r.acao, cenario: r.cenario, baita: 0, direto: 0, total: 0};
      o.baita += Number(r.valor_baita); o.direto += Number(r.valor_direto); o.total += Number(r.valor_total);
      m.set(k, o);
    }
    return [...m.values()].map((o) => ({...o, baita: Math.round(o.baita * 100) / 100, direto: Math.round(o.direto * 100) / 100, total: Math.round(o.total * 100) / 100}));
  }
});
dash.calc('mercado_mult', {
  inputs: ['indicadores'],
  title: 'Crescimento das academias',
  description: 'Academias no Brasil em 2025 divididas pelas de 2015.',
  fn: (indicadores) => {
    const v = (id) => Number((indicadores.find((r) => r.id === id) || {}).valor);
    return [{mult: Math.round((v('academias_2025') / v('academias_2015')) * 10) / 10}];
  }
});

window.PS = {inc: {1: true, 2: false, 3: false, 4: false, 5: false}, cen: {4: 'Na academia', 5: 'Piloto 1.000'}, sim: {visitas: 400, agenda: 4, comparece: 70, matricula: 40, mens: 130, perm: 12, treinos: 0}, q: ''};
const PS = window.PS;
const brl0 = new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL', maximumFractionDigits: 0});
const brl2 = new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'});
const int = new Intl.NumberFormat('pt-BR');
const dec1 = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 1});
const pct = new Intl.NumberFormat('pt-BR', {style: 'percent', maximumFractionDigits: 1});
const ACCENT = '#E1194A'; const ORANGE = '#F6900D'; const GREEN = '#85B83B';
const RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const muted = () => getComputedStyle(document.documentElement).getPropertyValue('--cds-chart-muted').trim() || '#bbb';
const CH = {1: 1, 2: 2, 3: 3, 5: 4, 4: 5};
const pickScenario = (r) => (Number(r.ordem) === 4 ? r.cenario === PS.cen[4] : Number(r.ordem) === 5 ? r.cenario === PS.cen[5] : true);
const scenarioRows = () => { const t = dash.data('totais'); return t.status === 'ok' ? t.data.filter(pickScenario).sort((a, b) => CH[a.ordem] - CH[b.ordem]) : null; };
const chosen = () => { const s = scenarioRows(); return s ? s.filter((r) => PS.inc[r.ordem]) : null; };
const sum = (rows, f) => rows.reduce((a, r) => a + r[f], 0);
const invest = () => { const c = chosen(); return c ? sum(c, 'total') : null; };
const seen = (el) => RM || el.classList.contains('ps-seen');

/* animated numbers: tween from last shown value; first time waits until visible */
const LAST = new WeakMap(); const RAF = new WeakMap();
function tween(el, value, fmt) {
  if (value == null || !Number.isFinite(value)) { el.textContent = '—'; LAST.delete(el); return; }
  if (!seen(el)) { el.textContent = fmt(0); return; }
  const from = LAST.has(el) ? LAST.get(el) : 0; LAST.set(el, value);
  if (RM || from === value) { el.textContent = fmt(value); return; }
  cancelAnimationFrame(RAF.get(el)); const t0 = performance.now(); const dur = LAST.size === 0 ? 1200 : (from === 0 ? 1400 : 500);
  const step = (now) => { const k = Math.min(1, (now - t0) / dur); const e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (value - from) * e); if (k < 1) RAF.set(el, requestAnimationFrame(step)); };
  RAF.set(el, requestAnimationFrame(step));
}
const FMT = {
  int: (v) => int.format(Math.round(v)),
  pct: (v) => pct.format(v),
  nota: (v) => v.toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1}),
  per100: (v) => int.format(Math.round(v * 100)),
  mult: (v) => '×' + dec1.format(v),
  brl: (v) => brl2.format(v)
};
const indRow = (el) => { const d = dash.data('indicadores'); const id = (el.dataset.where || '').split('=')[1]; return d.status === 'ok' ? d.data.find((x) => x.id === id) : null; };
dash.draw('count', (el) => {
  const src = el.dataset.source; const f = el.dataset.fmt;
  if (src === 'indicadores') {
    const r = indRow(el); if (!r) { tween(el, null); return; }
    const v = Number(r.valor);
    if (f === 'per100') return tween(el, v, FMT.per100);
    if (r.unidade === 'pct') return tween(el, v, (x) => (v > 1 ? '+' : '') + pct.format(x));
    return tween(el, v, FMT.int);
  }
  if (src === 'concorrencia') {
    const d = dash.data('concorrencia'); const r = d.status === 'ok' ? d.data.find((x) => x.marca === 'Power Shape CT') : null;
    return tween(el, r ? Number(r[el.dataset.field]) : null, FMT[f] || FMT.int);
  }
  if (src === 'mercado_mult') { const d = dash.data('mercado_mult'); return tween(el, d.status === 'ok' && d.data[0] ? Number(d.data[0].mult) : null, FMT.mult); }
});

function tip(box) {
  let t = box.querySelector(':scope > .ps-tip');
  if (!t) { t = document.createElement('div'); t.className = 'ps-tip'; t.hidden = true; box.appendChild(t); }
  return {
    show(ev, head, line) {
      t.replaceChildren(Object.assign(document.createElement('div'), {className: 'ps-tip-h', textContent: head}), Object.assign(document.createElement('div'), {textContent: line}));
      t.hidden = false;
      const b = box.getBoundingClientRect(); const w = t.offsetWidth; const h = t.offsetHeight;
      let x = ev.clientX - b.left + 12; let y = ev.clientY - b.top - h - 8;
      if (x + w > b.width) x = b.width - w - 4; if (x < 0) x = 4; if (y < 0) y = ev.clientY - b.top + 14;
      t.style.left = x + 'px'; t.style.top = y + 'px';
    },
    hide() { t.hidden = true; }
  };
}
const fresh = (el) => { el.querySelectorAll(':scope > svg').forEach((s) => s.remove()); };
const DUR = (el) => (RM ? 0 : (el.dataset.animated ? 450 : 1100));
const markAnimated = (el) => { if (seen(el)) el.dataset.animated = '1'; };

/* hero stars */
dash.draw('stars', (el) => {
  const d = dash.data('concorrencia'); const r = d.status === 'ok' ? d.data.find((x) => x.marca === 'Power Shape CT') : null;
  el.replaceChildren(); if (!r) { el.textContent = '—'; return; }
  const nota = Number(r.nota);
  const num = document.createElement('span'); num.className = 'ps-mega'; if (seen(el)) num.classList.add('ps-seen'); el.appendChild(num); tween(num, nota, FMT.nota);
  const ns = 'http://www.w3.org/2000/svg'; const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 150 30'); el.appendChild(svg);
  const star = 'M15 2l3.9 8.3 9.1 1-6.8 6.2 1.9 9-8.1-4.6-8.1 4.6 1.9-9L1.9 11.3l9.1-1z';
  const id = 'psclip' + Math.random().toString(36).slice(2, 7);
  const defs = document.createElementNS(ns, 'defs'); const cp = document.createElementNS(ns, 'clipPath'); cp.setAttribute('id', id);
  const rect = document.createElementNS(ns, 'rect'); rect.setAttribute('x', 0); rect.setAttribute('y', 0); rect.setAttribute('height', 30); rect.setAttribute('width', 0); cp.appendChild(rect); defs.appendChild(cp); svg.appendChild(defs);
  for (const fill of ['rgba(255,255,255,.25)', '#FCD003']) {
    const g = document.createElementNS(ns, 'g'); if (fill === '#FCD003') g.setAttribute('clip-path', `url(#${id})`);
    for (let i = 0; i < 5; i++) { const p = document.createElementNS(ns, 'path'); p.setAttribute('d', star); p.setAttribute('fill', fill); p.setAttribute('transform', `translate(${i * 30},0)`); g.appendChild(p); }
    svg.appendChild(g);
  }
  const target = (nota / 5) * 150;
  if (!seen(el)) return;
  d3.select(rect).transition().duration(RM ? 0 : 1600).ease(d3.easeCubicOut).attr('width', target);
});

/* waffle: 100 people */
dash.draw('waffle', (el) => {
  fresh(el); const r = indRow(el); if (!r) return;
  const n = Math.round(Number(r.valor) * 100); const S = 320; const c = S / 10;
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${S} ${S}`).attr('width', '100%');
  const cells = d3.range(100).map((i) => ({i, on: i < n}));
  const dots = svg.selectAll('circle').data(cells).join('circle').attr('cx', (d) => (d.i % 10) * c + c / 2).attr('cy', (d) => Math.floor(d.i / 10) * c + c / 2).attr('r', c * 0.36).attr('fill', muted()).attr('opacity', 0.55);
  const go = (sel) => sel.attr('fill', (d) => (d.on ? ACCENT : muted())).attr('opacity', (d) => (d.on ? 1 : 0.45));
  if (!seen(el)) return;
  if (RM || el.dataset.animated) go(dots); else go(dots.transition().delay((d) => d.i * 10).duration(300));
  markAnimated(el);
});

/* totals */
dash.draw('nucleo', (el) => { const t = dash.data('totais'); const r = t.status === 'ok' ? t.data.find((x) => Number(x.ordem) === 1) : null; tween(el, r ? r.total : null, FMT.brl); });
dash.draw('tot', (el) => tween(el, invest(), FMT.brl));
dash.draw('baita', (el) => { const c = chosen(); tween(el, c ? sum(c, 'baita') : null, FMT.brl); });
dash.draw('direto', (el) => { const c = chosen(); tween(el, c ? sum(c, 'direto') : null, FMT.brl); });
dash.draw('count-cap', (el) => { const c = chosen(); tween(el, c ? c.length : null, FMT.int); });
dash.draw('preco', (el) => { const s = scenarioRows(); const o = Number(el.dataset.acao); const r = s ? s.find((x) => x.ordem === o) : null; tween(el, r ? r.total : null, FMT.brl); });
dash.draw('dock-dots', (el) => {
  el.replaceChildren(); const s = scenarioRows(); if (!s) return;
  for (const r of s) { const i = document.createElement('i'); i.textContent = String(CH[r.ordem]); i.className = PS.inc[r.ordem] ? 'ps-on' : ''; i.title = r.acao; el.appendChild(i); }
});

dash.draw('chart-acoes', (el) => {
  fresh(el); const rows = scenarioRows(); if (!rows) return;
  const W = el.clientWidth || 600; const bh = 30; const gap = 14; const H = rows.length * (bh + gap) + 10;
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`);
  const labels = rows.map((r) => `${CH[r.ordem]}. ${r.acao}`);
  const meas = svg.append('g'); let lw = 0;
  labels.forEach((l) => { const t = meas.append('text').text(l); lw = Math.max(lw, t.node().getComputedTextLength()); });
  meas.remove();
  const x = d3.scaleLinear([0, d3.max(rows, (r) => r.total)], [0, Math.max(40, W - lw - 130)]);
  const tt = tip(el);
  const g = svg.selectAll('g.r').data(rows).join('g').attr('class', 'r').attr('transform', (d, i) => `translate(0,${i * (bh + gap) + 4})`);
  g.append('text').attr('x', 0).attr('y', bh / 2 + 4).attr('class', (d) => (PS.inc[d.ordem] ? 'ps-strong' : null)).text((d) => `${CH[d.ordem]}. ${d.acao}`);
  const bars = g.append('rect').attr('x', lw + 10).attr('y', 0).attr('height', bh).attr('rx', 6).attr('width', 0)
    .attr('fill', (d) => (PS.inc[d.ordem] ? (d.ordem === 1 ? ACCENT : ORANGE) : muted()))
    .on('mousemove', (ev, d) => tt.show(ev, `${d.acao}${d.cenario !== 'Padrão' ? ' · ' + d.cenario : ''}`, brl2.format(d.total))).on('mouseleave', () => tt.hide());
  const lab = g.append('text').attr('x', lw + 16).attr('y', bh / 2 + 4).attr('class', (d) => (PS.inc[d.ordem] ? 'ps-strong' : null)).text((d) => brl2.format(d.total)).attr('opacity', 0);
  if (!seen(el)) return;
  bars.transition().duration(DUR(el)).delay((d, i) => (el.dataset.animated ? 0 : i * 90)).attr('width', (d) => x(d.total));
  lab.transition().duration(DUR(el)).delay((d, i) => (el.dataset.animated ? 0 : i * 90)).attr('x', (d) => lw + 16 + x(d.total)).attr('opacity', 1);
  markAnimated(el);
});

dash.draw('itens', (tb) => {
  tb.replaceChildren();
  const inv = dash.data('investimento'); if (inv.status !== 'ok') return;
  const rows = inv.data.filter((r) => PS.inc[Number(r.ordem)] && pickScenario(r)).sort((a, b) => CH[Number(a.ordem)] - CH[Number(b.ordem)]);
  let last = null;
  for (const r of rows) {
    if (r.acao !== last) {
      last = r.acao;
      const h = document.createElement('tr'); const c = document.createElement('td'); c.colSpan = 4; c.style.fontWeight = '600'; c.style.color = 'var(--color-fg)';
      c.textContent = `${CH[Number(r.ordem)]}. ${r.acao}${r.cenario !== 'Padrão' ? ' · ' + r.cenario : ''}`; h.appendChild(c); tb.appendChild(h);
    }
    const tr = document.createElement('tr'); tr.dataset.key = r.id;
    const a = document.createElement('td'); a.textContent = r.item;
    const b = document.createElement('td'); b.textContent = r.descricao;
    const fmtv = (x) => (Number(x) > 0 ? brl2.format(Number(x)) : '—');
    const v = document.createElement('td'); v.className = 'ps-num'; v.textContent = fmtv(r.valor_baita);
    const w = document.createElement('td'); w.className = 'ps-num'; w.textContent = fmtv(r.valor_direto);
    tr.append(a, b, v, w); tb.appendChild(tr);
  }
});

/* simulator */
dash.draw('rv', (el) => {
  const k = el.dataset.k; const v = PS.sim[k];
  el.textContent = k === 'mens' ? brl0.format(v) : ['agenda', 'comparece', 'matricula'].includes(k) ? dec1.format(v) + '%' : k === 'perm' ? `${v} ${v === 1 ? 'mês' : 'meses'}` : k === 'treinos' ? `${v} ${v === 1 ? 'treino' : 'treinos'}` : int.format(v);
});
const funnel = () => { const s = PS.sim; const v = s.visitas; const a = v * s.agenda / 100; const c = a * s.comparece / 100; const m = c * s.matricula / 100; return [{k: 'Visitas ao site', v}, {k: 'Agendamentos', v: a}, {k: 'Visitas à academia', v: c}, {k: 'Matrículas', v: m}]; };
function roi() {
  const inv = invest(); if (inv == null) return null;
  const {mens, perm} = PS.sim; const novas = funnel()[3].v;
  const anual = mens * Math.min(perm, 12); const need = anual > 0 ? Math.ceil(inv / anual) : null;
  let cum = 0; let pay = null; const serie = [{m: 0, v: 0}];
  for (let m = 1; m <= 36; m++) { cum += mens * novas * Math.min(m, perm); serie.push({m, v: cum}); if (pay == null && cum >= inv) pay = m; }
  return {inv, need, pay, rec12: serie[12].v, serie, novas};
}
dash.draw('roi-novas', (el) => { const r = roi(); tween(el, r ? r.novas : null, (v) => dec1.format(v)); });
dash.draw('roi-matr', (el) => { const r = roi(); tween(el, r ? r.need : null, (v) => `${int.format(Math.round(v))} matrículas`); });
dash.draw('roi-mes', (el) => { const r = roi(); if (!r) { tween(el, null); return; } if (!r.pay) { LAST.delete(el); el.textContent = 'acima de 36 meses'; return; } tween(el, r.pay, (v) => { const n = Math.round(v); return `${n} ${n === 1 ? 'mês' : 'meses'}`; }); });
dash.draw('roi-rec', (el) => { const r = roi(); tween(el, r ? r.rec12 : null, FMT.brl); });
dash.draw('funnel', (el) => {
  fresh(el); if (dash.data('totais').status !== 'ok') return;
  const f = funnel(); const W = el.clientWidth || 400; const rowH = 52; const H = f.length * rowH;
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`);
  const x = d3.scaleSqrt([0, f[0].v || 1], [8, W]);
  const cols = ['#ED4625', ORANGE, '#FCD003', ACCENT];
  const g = svg.selectAll('g').data(f).join('g').attr('transform', (d, i) => `translate(0,${i * rowH})`);
  g.append('text').attr('x', 0).attr('y', 15).attr('class', 'ps-strong').style('font-size', '13px').text((d) => `${d.k}: ${d.v >= 100 ? int.format(Math.round(d.v)) : dec1.format(d.v)}`);
  g.append('rect').attr('x', 0).attr('y', 22).attr('height', 20).attr('rx', 6).attr('fill', (d, i) => cols[i]).attr('width', (d) => x(d.v));
});

dash.draw('roi-chart', (el) => {
  fresh(el); const r = roi(); if (!r) return;
  const W = el.clientWidth || 600; const H = 280; const m = {t: 24, r: 16, b: 28, l: 74};
  const s = r.serie.slice(0, 25); const maxV = Math.max(r.inv * 1.15, d3.max(s, (d) => d.v));
  const x = d3.scaleLinear([0, 24], [m.l, W - m.r]); const y = d3.scaleLinear([0, maxV], [H - m.b, m.t]).nice();
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`);
  const gid = 'psg' + Math.random().toString(36).slice(2, 7);
  const lg = svg.append('defs').append('linearGradient').attr('id', gid).attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', 1);
  [[0, .35], [.5, .12], [1, 0]].forEach(([o, a]) => lg.append('stop').attr('offset', o).style('stop-color', GREEN).style('stop-opacity', a));
  svg.append('g').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(Math.min(8, W / 80)).tickFormat((d) => `${d}m`)).attr('font-size', null).attr('font-family', null).call((g) => g.selectAll('line,path').attr('stroke', 'var(--cds-chart-axis)'));
  svg.append('g').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickSize(-(W - m.l - m.r)).tickFormat((d) => brl0.format(d))).attr('font-size', null).attr('font-family', null).call((g) => g.select('.domain').remove()).call((g) => g.selectAll('line').attr('stroke', 'var(--cds-chart-grid)'));
  svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(r.inv)).attr('y2', y(r.inv)).attr('stroke', ACCENT).attr('stroke-width', 2).attr('stroke-dasharray', '6 4');
  svg.append('text').attr('x', W < 560 ? m.l + 4 : W - m.r).attr('y', W < 560 ? m.t + 28 : y(r.inv) - 8).attr('text-anchor', W < 560 ? 'start' : 'end').attr('class', 'ps-strong').text(`Investimento ${brl2.format(r.inv)}`);
  const area = svg.append('path').datum(s).attr('fill', `url(#${gid})`).attr('d', d3.area().x((d) => x(d.m)).y0(H - m.b).y1((d) => y(d.v)));
  const line = svg.append('path').datum(s).attr('fill', 'none').attr('stroke', GREEN).attr('stroke-width', 3).attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round').attr('d', d3.line().x((d) => x(d.m)).y((d) => y(d.v)));
  if (seen(el) && !el.dataset.animated && !RM) {
    const L = line.node().getTotalLength(); line.attr('stroke-dasharray', `${L} ${L}`).attr('stroke-dashoffset', L).transition().duration(1600).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0);
    area.attr('opacity', 0).transition().delay(600).duration(900).attr('opacity', 1);
  }
  if (r.pay && r.pay <= 24) {
    const px = x(r.pay); const py = y(s[r.pay].v);
    svg.append('circle').attr('cx', px).attr('cy', py).attr('r', 7).attr('fill', GREEN).attr('stroke', 'var(--color-panel)').attr('stroke-width', 3);
    svg.append('text').attr('x', W < 560 ? m.l + 4 : px).attr('y', W < 560 ? m.t + 48 : py - 14).attr('text-anchor', W < 560 ? 'start' : (px > W - 160 ? 'end' : 'middle')).attr('class', 'ps-strong').text(`Equilíbrio estimado no mês ${r.pay}`);
  }
  const tt = tip(el); const dot = svg.append('circle').attr('r', 5).attr('fill', GREEN).attr('opacity', 0);
  svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b).attr('fill', 'transparent')
    .on('mousemove', function (ev) { const [px] = d3.pointer(ev, this); const mm = Math.max(0, Math.min(24, Math.round(x.invert(px)))); const d = s[mm]; dot.attr('cx', x(d.m)).attr('cy', y(d.v)).attr('opacity', 1); tt.show(ev, `Mês ${d.m}`, `Receita bruta potencial acumulada ${brl0.format(d.v)}`); })
    .on('mouseleave', () => { dot.attr('opacity', 0); tt.hide(); });
  markAnimated(el);
});

/* market & decision */
dash.draw('mercado-chart', (el) => {
  fresh(el); const d = dash.data('indicadores'); if (d.status !== 'ok') return;
  const rows = ['academias_2015', 'academias_2025'].map((id) => d.data.find((r) => r.id === id)).filter(Boolean).map((r) => ({ano: r.id.slice(-4), v: Number(r.valor)}));
  const W = el.clientWidth || 400; const H = 180; const m = {t: 26, b: 26};
  const x = d3.scaleBand(rows.map((r) => r.ano), [20, W - 20]).padding(0.4); const y = d3.scaleLinear([0, d3.max(rows, (r) => r.v)], [H - m.b, m.t]);
  const bw = Math.min(x.bandwidth(), 130);
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`);
  const tt = tip(el);
  const bars = svg.selectAll('rect').data(rows).join('rect').attr('x', (r) => x(r.ano) + (x.bandwidth() - bw) / 2).attr('width', bw).attr('y', H - m.b).attr('height', 0).attr('rx', 6).attr('fill', (r, i) => (i ? ACCENT : muted()))
    .on('mousemove', (ev, r) => tt.show(ev, r.ano, `${int.format(r.v)} academias`)).on('mouseleave', () => tt.hide());
  const vals = svg.selectAll('text.v').data(rows).join('text').attr('class', 'ps-strong').attr('x', (r) => x(r.ano) + x.bandwidth() / 2).attr('y', (r) => y(r.v) - 8).attr('text-anchor', 'middle').text((r) => int.format(r.v)).attr('opacity', 0);
  svg.selectAll('text.a').data(rows).join('text').attr('x', (r) => x(r.ano) + x.bandwidth() / 2).attr('y', H - 6).attr('text-anchor', 'middle').text((r) => r.ano);
  if (!seen(el)) return;
  bars.transition().duration(DUR(el)).delay((r, i) => i * 250).attr('y', (r) => y(r.v)).attr('height', (r) => H - m.b - y(r.v));
  vals.transition().delay((r, i) => i * 250 + 500).duration(400).attr('opacity', 1);
  markAnimated(el);
});
dash.draw('decisao-chart', (el) => {
  fresh(el); const d = dash.data('indicadores'); if (d.status !== 'ok') return;
  const rows = d.data.filter((r) => r.grupo === 'decisao').map((r) => ({rot: r.rotulo, v: Number(r.valor)})).sort((a, b) => b.v - a.v);
  const W = el.clientWidth || 600; const narrow = W < 520;
  const bh = narrow ? 16 : 24; const rowH = narrow ? 44 : 36; const H = rows.length * rowH + 4;
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`);
  const lw = narrow ? 0 : Math.min(300, W * 0.42); const top = narrow ? 18 : 4;
  const x = d3.scaleLinear([0, 1], [0, W - lw - 60]);
  const tt = tip(el);
  const g = svg.selectAll('g').data(rows).join('g').attr('transform', (r, i) => `translate(0,${i * rowH})`);
  g.append('text').attr('x', 0).attr('y', narrow ? 12 : top + bh / 2 + 4).text((r) => r.rot);
  g.append('rect').attr('x', lw).attr('y', top).attr('height', bh).attr('rx', 4).attr('width', W - lw - 60).attr('fill', 'var(--cds-chart-grid)');
  const bars = g.append('rect').attr('x', lw).attr('y', top).attr('height', bh).attr('rx', 4).attr('width', 0).attr('fill', (r, i) => (i < 2 ? ACCENT : ORANGE))
    .on('mousemove', (ev, r) => tt.show(ev, r.rot, pct.format(r.v))).on('mouseleave', () => tt.hide());
  g.append('text').attr('x', W - 54).attr('y', top + bh / 2 + 4).attr('class', 'ps-strong').text((r) => pct.format(r.v));
  if (!seen(el)) return;
  bars.transition().duration(DUR(el)).delay((r, i) => (el.dataset.animated ? 0 : i * 120)).attr('width', (r) => x(r.v));
  markAnimated(el);
});

/* competition */
dash.draw('conc-chart', (el) => {
  fresh(el); const d = dash.data('concorrencia'); if (d.status !== 'ok') return;
  const rows = d.data.map((r) => ({...r, nota: Number(r.nota), avaliacoes: Number(r.avaliacoes)}));
  const W = el.clientWidth || 600; const H = 290; const m = {t: 20, r: 20, b: 34, l: 40};
  const x = d3.scaleLog([10, 1500], [m.l, W - m.r]); const y = d3.scaleLinear([4.0, 5.0], [H - m.b, m.t]);
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`);
  svg.append('rect').attr('x', x(200)).attr('y', m.t).attr('width', W - m.r - x(200)).attr('height', y(4.6) - m.t).attr('fill', ACCENT).attr('opacity', 0.06).attr('rx', 8);
  svg.append('text').attr('x', W - m.r - 6).attr('y', m.t + 14).attr('text-anchor', 'end').style('fill', ACCENT).style('font-size', '11px').text('zona de confiança');
  svg.append('g').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues([10, 30, 100, 300, 1000]).tickFormat(int.format)).attr('font-size', null).attr('font-family', null).call((g) => g.selectAll('line,path').attr('stroke', 'var(--cds-chart-axis)'));
  svg.append('g').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickSize(-(W - m.l - m.r)).tickFormat((v) => v.toLocaleString('pt-BR', {minimumFractionDigits: 1}))).attr('font-size', null).attr('font-family', null).call((g) => g.select('.domain').remove()).call((g) => g.selectAll('line').attr('stroke', 'var(--cds-chart-grid)'));
  svg.append('text').attr('x', W - m.r).attr('y', H - 4).attr('text-anchor', 'end').text('avaliações (escala log)');
  const ps = (r) => r.marca === 'Power Shape CT';
  const tt = tip(el);
  const dots = svg.selectAll('circle.d').data(rows).join('circle').attr('class', 'd').attr('cx', (r) => x(Math.max(10, r.avaliacoes))).attr('cy', (r) => y(Math.max(4, r.nota))).attr('r', 0).attr('fill', (r) => (ps(r) ? ACCENT : muted())).attr('stroke', 'var(--color-panel)').attr('stroke-width', 2).style('cursor', 'pointer')
    .on('mousemove', (ev, r) => tt.show(ev, r.marca, `${r.nota.toLocaleString('pt-BR', {minimumFractionDigits: 1})} estrelas · ${int.format(r.avaliacoes)} avaliações`)).on('mouseleave', () => tt.hide());
  const pr = rows.find(ps);
  let pulse = null;
  if (pr) pulse = svg.insert('circle', 'circle.d').attr('cx', x(pr.avaliacoes)).attr('cy', y(pr.nota)).attr('r', 10).attr('fill', 'none').attr('stroke', ACCENT).attr('stroke-width', 2).attr('opacity', 0);
  svg.selectAll('text.l').data(rows.filter((r) => ps(r) || r.avaliacoes > 500)).join('text').attr('class', (r) => (ps(r) ? 'ps-strong' : null)).attr('x', (r) => x(r.avaliacoes) + (r.avaliacoes > 800 ? -14 : 14)).attr('y', (r) => y(r.nota) - 12).attr('text-anchor', (r) => (r.avaliacoes > 800 ? 'end' : 'start')).text((r) => (ps(r) ? 'Power Shape' : 'Smart Fit'));
  const rad = (r) => (ps(r) ? 10 : 6);
  if (!seen(el)) return;
  if (RM || el.dataset.animated) dots.attr('r', rad); else dots.transition().delay((r, i) => (ps(r) ? 900 : i * 80)).duration(500).ease(d3.easeBackOut).attr('r', rad);
  if (pulse && !RM) { const loop = () => pulse.attr('r', 10).attr('opacity', 0.8).transition().duration(1600).attr('r', 26).attr('opacity', 0).on('end', loop); setTimeout(loop, 1200); }
  markAnimated(el);
});
dash.draw('conc-rows', (tb) => {
  tb.replaceChildren(); const d = dash.data('concorrencia'); if (d.status !== 'ok') return;
  for (const r of [...d.data].sort((a, b) => Number(b.avaliacoes) * Number(b.nota) - Number(a.avaliacoes) * Number(a.nota))) {
    const tr = document.createElement('tr'); if (r.marca === 'Power Shape CT') tr.className = 'ps-me';
    const a = document.createElement('td'); a.textContent = r.marca;
    const b = document.createElement('td'); b.className = 'ps-num'; b.textContent = Number(r.nota).toLocaleString('pt-BR', {minimumFractionDigits: 1});
    const c = document.createElement('td'); const p = document.createElement('span'); p.className = 'ps-pill' + (r.agenda_online === 'Sim' ? ' ps-yes' : r.agenda_online === 'Não' ? '' : ' ps-prop'); p.textContent = r.agenda_online; c.appendChild(p);
    const e = document.createElement('td'); e.textContent = r.lacuna;
    tr.append(a, b, c, e); tb.appendChild(tr);
  }
});

/* scratch card */
dash.draw('scratch', {
  mount(el) {
    const cv = document.createElement('canvas'); el.appendChild(cv);
    const paint = () => {
      const r = el.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1; cv.width = r.width * dpr; cv.height = r.height * dpr;
      const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
      const g = ctx.createLinearGradient(0, 0, r.width, r.height); g.addColorStop(0, '#b8b8b8'); g.addColorStop(.5, '#e4e4e4'); g.addColorStop(1, '#a9a9a9');
      ctx.fillStyle = g; ctx.fillRect(0, 0, r.width, r.height);
      ctx.fillStyle = '#E1194A'; ctx.font = '600 18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('RASPE AQUI', r.width / 2, r.height / 2 + 6);
      ctx.globalCompositeOperation = 'destination-out';
    };
    paint();
    let down = false;
    const scratch = (ev) => { if (!down) return; const r = cv.getBoundingClientRect(); const ctx = cv.getContext('2d'); ctx.beginPath(); ctx.arc(ev.clientX - r.left, ev.clientY - r.top, 22, 0, Math.PI * 2); ctx.fill(); };
    const on = (ev) => { down = true; cv.setPointerCapture && cv.setPointerCapture(ev.pointerId); scratch(ev); };
    const off = () => { down = false; };
    cv.addEventListener('pointerdown', on); cv.addEventListener('pointermove', scratch); cv.addEventListener('pointerup', off); cv.addEventListener('pointerleave', off);
    return {cv, paint};
  },
  update() {},
  unmount(el, made) { made && made.cv && made.cv.remove(); }
});

/* FAQ */
dash.draw('faq', (el) => {
  el.replaceChildren(); const d = dash.data('faq'); if (d.status !== 'ok') { el.textContent = '—'; return; }
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const q = norm(PS.q || '');
  const rows = d.data.filter((r) => !q || norm(r.pergunta + ' ' + r.resposta).includes(q));
  for (const r of rows) { const det = document.createElement('details'); if (q) det.open = true; const s = document.createElement('summary'); s.textContent = r.pergunta; const p = document.createElement('p'); p.textContent = r.resposta; det.append(s, p); el.appendChild(det); }
  if (!rows.length) { const p = document.createElement('p'); p.className = 'ps-note'; p.textContent = 'Nenhuma resposta com essa palavra. Anote a dúvida para responder depois.'; el.appendChild(p); }
});

dash.draw('res-chart', (el) => {
  fresh(el); const d = dash.data('resultados'); if (d.status !== 'ok' || !d.data.length) { el.style.minHeight = '0'; return; }
  el.style.minHeight = '';
  const rows = d.data.map((r) => ({mes: String(r.mes), contatos: Number(r.contatos) || 0, agendamentos: Number(r.agendamentos) || 0, matriculas: Number(r.matriculas) || 0}));
  const keys = ['contatos', 'agendamentos', 'matriculas']; const names = {contatos: 'Contatos', agendamentos: 'Agendamentos', matriculas: 'Matrículas'}; const cols = [ORANGE, '#FCD003', ACCENT];
  const W = el.clientWidth || 600; const H = 260; const m = {t: 16, r: 16, b: 28, l: 40};
  const x0 = d3.scaleBand(rows.map((r) => r.mes), [m.l, W - m.r]).padding(0.25); const x1 = d3.scaleBand(keys, [0, x0.bandwidth()]).padding(0.1);
  const y = d3.scaleLinear([0, d3.max(rows, (r) => d3.max(keys, (k) => r[k])) || 1], [H - m.b, m.t]).nice();
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`);
  svg.append('g').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x0)).attr('font-size', null).attr('font-family', null);
  svg.append('g').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickSize(-(W - m.l - m.r))).attr('font-size', null).attr('font-family', null).call((g) => g.select('.domain').remove()).call((g) => g.selectAll('line').attr('stroke', 'var(--cds-chart-grid)'));
  const tt = tip(el);
  svg.append('g').selectAll('g').data(rows).join('g').attr('transform', (r) => `translate(${x0(r.mes)},0)`).selectAll('rect').data((r) => keys.map((k, i) => ({k, i, v: r[k], mes: r.mes}))).join('rect')
    .attr('x', (d) => x1(d.k)).attr('width', Math.min(32, x1.bandwidth())).attr('y', (d) => y(d.v)).attr('height', (d) => H - m.b - y(d.v)).attr('rx', 3).attr('fill', (d) => cols[d.i])
    .on('mousemove', (ev, d) => tt.show(ev, d.mes, `${names[d.k]}: ${int.format(d.v)}`)).on('mouseleave', () => tt.hide());
});

dash.onData(() => {
  const d = dash.data('resultados');
  document.querySelectorAll('[data-res-empty]').forEach((p) => { p.hidden = d.status === 'ok' && d.data.length > 0; });
});

/* ---------- listeners ---------- */
document.querySelectorAll('.ps').forEach((r) => r.classList.add('ps-js'));
const INVEST_DRAWS = ['preco', 'tot', 'baita', 'direto', 'count-cap', 'dock-dots', 'chart-acoes', 'itens', 'roi-novas', 'roi-matr', 'roi-mes', 'roi-rec', 'roi-chart', 'funnel'];
const redraw = (names) => names.forEach((n) => dash.draw(n));
document.querySelectorAll('input[data-acao]').forEach((cb) => cb.addEventListener('change', () => {
  PS.inc[cb.dataset.acao] = cb.checked;
  document.querySelectorAll(`input[data-acao="${cb.dataset.acao}"]`).forEach((o) => { o.checked = cb.checked; });
  redraw(INVEST_DRAWS);
}));
document.querySelectorAll('select[data-cenario]').forEach((s) => s.addEventListener('change', () => {
  PS.cen[s.dataset.cenario] = s.value;
  document.querySelectorAll(`select[data-cenario="${s.dataset.cenario}"]`).forEach((o) => { o.value = s.value; });
  redraw(INVEST_DRAWS);
}));
const syncStamps = () => {
  const t = PS.sim.treinos;
  document.querySelectorAll('[data-stamp]').forEach((s) => s.classList.toggle('ps-on', t >= Number(s.dataset.stamp)));
  document.querySelectorAll('[data-stamp-bar]').forEach((b) => { b.style.width = (t / 36 * 100) + '%'; });
};
document.querySelectorAll('input[data-sim]').forEach((inp) => inp.addEventListener('input', () => {
  const v = Number(inp.value); PS.sim[inp.dataset.sim] = Number.isFinite(v) ? v : 0;
  dash.draw('rv');
  if (inp.dataset.sim === 'treinos') { syncStamps(); return; }
  redraw(['funnel', 'roi-novas', 'roi-matr', 'roi-mes', 'roi-rec', 'roi-chart']);
}));
document.querySelectorAll('[data-faq-search]').forEach((inp) => inp.addEventListener('input', () => { PS.q = inp.value; dash.draw('faq'); }));
const scrollerOf = (el) => { let p = el.parentElement; while (p && p !== document.body) { const s = getComputedStyle(p); if (/(auto|scroll)/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 4) return p; p = p.parentElement; } return document.scrollingElement || document.documentElement; };
const navH = () => { const n = document.querySelector('.ps-nav'); return n ? n.getBoundingClientRect().height : 0; };
const setNavVar = () => document.querySelectorAll('.ps').forEach((r) => r.style.setProperty('--ps-navh', navH() + 'px'));
setNavVar(); window.addEventListener('resize', setNavVar);
const goTo = (id) => {
  const el = document.getElementById(id); if (!el) return;
  const sc = scrollerOf(el); const isDoc = sc === document.scrollingElement || sc === document.documentElement;
  const top = el.getBoundingClientRect().top - (isDoc ? 0 : sc.getBoundingClientRect().top) + sc.scrollTop - navH() - 12;
  sc.scrollTo({top: Math.max(0, top), behavior: RM ? 'auto' : 'smooth'});
  setActive(id); dash.setLink(id);
  [700, 1300, 2000].forEach((ms) => setTimeout(() => {
    const want = navH() + 12; const now = el.getBoundingClientRect().top - (isDoc ? 0 : sc.getBoundingClientRect().top);
    if (Math.abs(now - want) > 2) sc.scrollTo({top: Math.max(0, sc.scrollTop + now - want), behavior: 'auto'});
  }, ms));
};
const NAV_IDS = [...document.querySelectorAll('.ps-nav [data-target]')].map((b) => b.dataset.target);
let lockActive = 0;
function setActive(id) {
  lockActive = Date.now();
  document.querySelectorAll('.ps-nav [data-target]').forEach((b) => {
    const on = b.dataset.target === id; b.classList.toggle('ps-active', on); b.setAttribute('aria-current', on ? 'true' : 'false');
    if (on) { const n = b.parentElement; n.scrollTo({left: b.offsetLeft - n.clientWidth / 2 + b.offsetWidth / 2, behavior: RM ? 'auto' : 'smooth'}); }
  });
}
const activeIo = new IntersectionObserver((ents) => {
  if (Date.now() - lockActive < 900) return;
  const vis = ents.filter((e) => e.isIntersecting).map((e) => e.target.id);
  if (vis.length) setActive(vis[0]), lockActive = 0;
}, {rootMargin: '-35% 0px -60% 0px', threshold: 0});
NAV_IDS.forEach((id) => { const s = document.getElementById(id); if (s) activeIo.observe(s); });
document.querySelectorAll('[data-target]').forEach((b) => b.addEventListener('click', () => goTo(b.dataset.target)));

/* reveal + first animations when visible */
const io = new IntersectionObserver((ents) => {
  for (const e of ents) {
    if (!e.isIntersecting) continue;
    const el = e.target; io.unobserve(el);
    el.classList.add('ps-in', 'ps-seen');
    el.querySelectorAll('[data-draw]').forEach((c) => c.classList.add('ps-seen'));
    const names = new Set([...el.querySelectorAll('[data-draw]')].map((c) => c.dataset.draw));
    if (el.dataset.draw) names.add(el.dataset.draw);
    names.forEach((n) => dash.draw(n));
  }
}, {threshold: 0.15});
document.querySelectorAll('.ps-reveal, .ps-hero-full, .ps-card, .ps-tiles').forEach((el) => io.observe(el));
/* dock appears after chapter 1 starts */
const dockIo = new IntersectionObserver((ents) => {
  for (const e of ents) { const past = e.boundingClientRect.top < 0 || e.isIntersecting; document.querySelectorAll('[data-dock]').forEach((d) => d.classList.toggle('ps-dock-on', past)); }
}, {threshold: 0});
document.querySelectorAll('#site').forEach((el) => dockIo.observe(el));
const named = location.hash.slice(1); if (named && document.getElementById(named)) setTimeout(() => goTo(named), 300);

/* capítulo 1 detalhado por item */
dash.draw('nucleo-itens', (el) => {
  el.replaceChildren(); const d = dash.data('investimento'); if (d.status !== 'ok') return;
  for (const r of d.data.filter((x) => Number(x.ordem) === 1)) {
    const li = document.createElement('li'); const dir = Number(r.valor_direto) > 0; if (dir) li.className = 'ps-nuc-dir';
    const n = document.createElement('span'); n.textContent = r.item;
    const v = document.createElement('b'); v.textContent = brl2.format(Number(r.valor_total));
    const s = document.createElement('small'); s.textContent = r.descricao;
    li.append(n, v, s);
    if (dir) { const e = document.createElement('em'); e.textContent = 'pago direto'; li.appendChild(e); }
    el.appendChild(li);
  }
});
