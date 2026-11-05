(() => {
  const root = document.querySelector('.ps');
  if (!root) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const brl = n => new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'}).format(n);
  const num = (n, d=1) => new Intl.NumberFormat('pt-BR', {minimumFractionDigits:d, maximumFractionDigits:d}).format(n);
  const setText = (selector, value) => root.querySelectorAll(selector).forEach(el => { el.textContent = value; });

  document.documentElement.classList.add('ps-standalone');
  root.classList.add('ps-js', 'ps-cine');

  /* Capa cinematografica. */
  const hero = root.querySelector('.ps-hero-full');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    root.classList.add('ps-cine-go');
    hero?.classList.add('ps-live');
    setTimeout(() => root.classList.add('ps-cine-settled'), reduced ? 0 : 2400);
  }));
  if (hero && !reduced) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX-r.left)/r.width));
      const y = Math.max(0, Math.min(1, (e.clientY-r.top)/r.height));
      hero.style.setProperty('--hx', `${(x-.5)*-20}px`);
      hero.style.setProperty('--hy', `${(y-.5)*-14}px`);
      hero.style.setProperty('--mx', `${x*100}%`);
      hero.style.setProperty('--my', `${y*100}%`);
    });
    hero.addEventListener('pointerleave', () => {
      hero.style.setProperty('--hx','0px'); hero.style.setProperty('--hy','0px');
    });
  }

  /* O snapshot trouxe o visual, mas nao o motor que ativava estas classes. */
  const reveal = el => {
    el.classList.add('ps-in','ps-seen');
    if (el.matches('.ps-mask')) el.classList.add('ps-open');
    el.querySelectorAll?.('.ps-mask').forEach(x => x.classList.add('ps-open'));
    if (el.matches('.ps-part-cine')) el.classList.add('ps-part-in');
    el.querySelectorAll?.('.ps-rise').forEach(x => x.classList.add('ps-up'));
    el.querySelectorAll?.('.ps-img-s14').forEach(x => x.classList.add('ps-live'));
  };
  const revealTargets = root.querySelectorAll('.ps-reveal,.ps-mask,.ps-part-cine,.ps-chapter');
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { reveal(entry.target); io.unobserve(entry.target); }
    }), {threshold:.1, rootMargin:'0px 0px -8% 0px'});
    revealTargets.forEach(el => io.observe(el));
  } else revealTargets.forEach(reveal);

  /* Navegacao e capitulo atual. */
  const nav = root.querySelector('.ps-nav');
  const navButtons = [...root.querySelectorAll('[data-target]')];
  navButtons.forEach(button => button.addEventListener('click', () => {
    document.getElementById(button.dataset.target)?.scrollIntoView({behavior:reduced?'auto':'smooth', block:'start'});
  }));
  if ('IntersectionObserver' in window) {
    const sections = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navButtons.forEach(b => b.classList.toggle('ps-active', b.dataset.target === entry.target.id));
      nav?.querySelector('.ps-active')?.scrollIntoView({behavior:'smooth', block:'nearest', inline:'center'});
    }), {rootMargin:'-18% 0px -70% 0px'});
    navButtons.forEach(b => { const section=document.getElementById(b.dataset.target); if(section) sections.observe(section); });
  }

  /* A jornada acende passo a passo. */
  const steps = [...root.querySelectorAll('.ps-hj li')];
  if (steps.length && 'IntersectionObserver' in window) {
    const stepIO = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const index = steps.indexOf(entry.target);
      entry.target.classList.add('ps-lit','ps-pop');
      root.querySelectorAll('.ps-hj-seg').forEach((seg,i) => seg.classList.toggle('ps-on', i < index));
    }), {threshold:.62});
    steps.forEach(step => stepIO.observe(step));
  }

  /* Personas: profundidade no mouse e foco por toque. */
  const personas = [...root.querySelectorAll('.ps-persona')];
  personas.forEach((card,index) => {
    if (fine && !reduced) {
      card.addEventListener('pointermove', e => {
        const r=card.getBoundingClientRect(), x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
        card.classList.add('ps-tilting');
        card.style.setProperty('--rx',`${(y-.5)*-5}deg`); card.style.setProperty('--ry',`${(x-.5)*6}deg`);
        card.style.setProperty('--gx',`${x*100}%`); card.style.setProperty('--gy',`${y*100}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('ps-tilting'); card.style.setProperty('--rx','0deg'); card.style.setProperty('--ry','0deg');
      });
    }
    card.addEventListener('click', () => {
      const active=!card.classList.contains('ps-focus');
      personas.forEach(p => p.classList.remove('ps-focus','ps-dim'));
      if(active){ card.classList.add('ps-focus'); personas.forEach(p => {if(p!==card)p.classList.add('ps-dim');}); }
      root.querySelectorAll('#personas table tr').forEach(row => [...row.children].forEach((cell,i) => cell.classList.toggle('ps-colon',active&&i===index+1)));
    });
  });

  /* CTA magnetico. */
  if (fine && !reduced) root.querySelectorAll('.ps-cta').forEach(button => {
    button.addEventListener('pointermove', e => {
      const r=button.getBoundingClientRect();
      button.style.setProperty('--cx',`${((e.clientX-r.left)/r.width-.5)*10}px`);
      button.style.setProperty('--cy',`${((e.clientY-r.top)/r.height-.5)*7}px`);
    });
    button.addEventListener('pointerleave', () => {button.style.setProperty('--cx','0px');button.style.setProperty('--cy','0px');});
  });

  /* Comparativo: academia e ponto do grafico ligados. */
  const rows=[...root.querySelectorAll('[data-draw="conc-rows"] tr')], dots=[...root.querySelectorAll('.ps-conc circle.d')];
  rows.forEach((row,index) => {
    const hot=on => {row.classList.toggle('ps-row-hot',on);dots[index]?.classList.toggle('ps-hot',on);root.querySelector('.ps-conc')?.classList.toggle('ps-dim',on);};
    row.addEventListener('pointerenter',()=>hot(true)); row.addEventListener('pointerleave',()=>hot(false));
    row.addEventListener('click',()=>hot(!row.classList.contains('ps-row-hot')));
  });

  /* Passaporte vivo. */
  const training=root.querySelector('[data-sim="treinos"]');
  if(training){
    const update=()=>{
      const value=Number(training.value), label=root.querySelector('[data-draw="rv"][data-k="treinos"]');
      if(label)label.textContent=`${value} ${value===1?'treino':'treinos'}`;
      const bar=root.querySelector('[data-stamp-bar]'); if(bar)bar.style.width=`${value/Number(training.max)*100}%`;
      root.querySelectorAll('[data-stamp]').forEach(stamp=>{
        const was=stamp.classList.contains('ps-on'), on=value>=Number(stamp.dataset.stamp); stamp.classList.toggle('ps-on',on);
        if(on&&!was){stamp.classList.remove('ps-hit');requestAnimationFrame(()=>stamp.classList.add('ps-hit'));}
      });
    };
    training.addEventListener('input',update); update();
  }

  /* Raspadinha com mouse e dedo. */
  const scratch=root.querySelector('.ps-scratch'), canvas=scratch?.querySelector('.ps-scratch-layer canvas');
  if(scratch&&canvas){
    const ctx=canvas.getContext('2d'); let drawing=false;
    const reset=()=>{
      const r=scratch.getBoundingClientRect(), ratio=Math.max(1,Math.min(2,devicePixelRatio||1));
      canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
      ctx.globalCompositeOperation='source-over';const g=ctx.createLinearGradient(0,0,r.width,r.height);g.addColorStop(0,'#333');g.addColorStop(.5,'#aaa');g.addColorStop(1,'#444');ctx.fillStyle=g;ctx.fillRect(0,0,r.width,r.height);
      ctx.fillStyle='#fff';ctx.font='700 18px system-ui';ctx.textAlign='center';ctx.fillText('RASPE AQUI',r.width/2,r.height/2+6);
    };
    const erase=e=>{if(!drawing)return;const r=canvas.getBoundingClientRect();ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(e.clientX-r.left,e.clientY-r.top,Math.max(22,r.width*.055),0,Math.PI*2);ctx.fill();};
    canvas.addEventListener('pointerdown',e=>{drawing=true;scratch.classList.add('ps-scratching');canvas.setPointerCapture(e.pointerId);erase(e);});
    canvas.addEventListener('pointermove',erase);['pointerup','pointercancel'].forEach(name=>canvas.addEventListener(name,()=>{drawing=false;scratch.classList.remove('ps-scratching');}));
    reset();new ResizeObserver(reset).observe(scratch);
  }

  /* Jornada escolhida e investimento. */
  const prices={1:17527,2:2048,3:4160,4:11545.60,5:3520}, selected=new Set([1]);
  const total=()=>[...selected].reduce((sum,id)=>sum+prices[id],0);
  const updateJourney=(animate=true)=>{
    const t=total(), direct=selected.has(1)?725:0;
    setText('[data-draw="tot"]',brl(t));setText('[data-draw="baita"]',brl(t-direct));setText('[data-draw="direto"]',brl(direct));setText('[data-draw="count-cap"]',String(selected.size));
    root.querySelectorAll('input[type="checkbox"][data-acao]').forEach(input=>{const id=Number(input.dataset.acao);input.checked=selected.has(id);input.closest('.ps-toggle,.ps-join')?.classList.toggle('ps-checked',input.checked);});
    root.querySelectorAll('.ps-dock-dots i').forEach((dot,i)=>dot.classList.toggle('ps-on',selected.has(i+1)));
    root.querySelector('.ps-dock-meter')?.style.setProperty('--k',String(selected.size/5));
    if(animate)root.querySelectorAll('[data-draw="tot"],[data-draw="baita"],[data-draw="direto"]').forEach(value=>{const box=value.closest('.ps-tile');box?.classList.remove('ps-bump');requestAnimationFrame(()=>box?.classList.add('ps-bump'));});
    if (animate) updateSimulator();
  };
  root.querySelectorAll('input[type="checkbox"][data-acao]').forEach(input=>input.addEventListener('change',()=>{const id=Number(input.dataset.acao);if(id===1)return updateJourney();input.checked?selected.add(id):selected.delete(id);updateJourney();}));
  root.querySelectorAll('[data-cenario]').forEach(select=>select.addEventListener('change',()=>{root.querySelectorAll(`[data-cenario="${select.dataset.cenario}"]`).forEach(other=>other.value=select.value);const box=select.closest('.ps-toggle,.ps-join');box?.classList.add('ps-pulse');setTimeout(()=>box?.classList.remove('ps-pulse'),650);}));

  /* Simulador recalculado em tempo real. */
  const sim=[...root.querySelectorAll('[data-sim]')].filter(input=>input.dataset.sim!=='treinos');
  function updateSimulator(){
    const values=Object.fromEntries(sim.map(input=>[input.dataset.sim,Number(input.value)]));
    sim.forEach(input=>{const out=root.querySelector(`[data-draw="rv"][data-k="${input.dataset.sim}"]`);if(!out)return;if(input.dataset.sim==='mens')out.textContent=brl(input.value);else if(input.dataset.sim==='perm')out.textContent=`${input.value} ${Number(input.value)===1?'mês':'meses'}`;else if(input.dataset.sim==='visitas')out.textContent=Number(input.value).toLocaleString('pt-BR');else out.textContent=`${num(Number(input.value),Number(input.value)%1?1:0)}%`;});
    const bookings=values.visitas*values.agenda/100, visits=bookings*values.comparece/100, enroll=visits*values.matricula/100, revenue=enroll*values.mens*values.perm;
    const monthly=revenue/Math.max(1,values.perm), be=monthly?Math.max(1,Math.ceil(total()/monthly)):0, eq=values.mens*values.perm?Math.ceil(total()/(values.mens*values.perm)):0;
    setText('[data-draw="roi-novas"]',num(enroll));setText('[data-draw="roi-mes"]',be?`${be} ${be===1?'mês':'meses'}`:'—');setText('[data-draw="roi-matr"]',`${eq} ${eq===1?'matrícula':'matrículas'}`);setText('[data-draw="roi-rec"]',brl(revenue));
    const labels=[`Visitas ao site: ${values.visitas}`,`Agendamentos: ${num(bookings)}`,`Visitas à academia: ${num(visits)}`,`Matrículas: ${num(enroll)}`];root.querySelectorAll('.ps-funnel text.ps-strong').forEach((el,i)=>{if(labels[i])el.textContent=labels[i];});
  }
  sim.forEach(input=>input.addEventListener('input',updateSimulator)); updateJourney(false);

  /* Busca no FAQ. */
  const search=root.querySelector('[data-faq-search]');
  search?.addEventListener('input',()=>{const term=search.value.trim().toLocaleLowerCase('pt-BR');root.querySelectorAll('.ps-faq details').forEach(item=>{item.hidden=term&&!item.textContent.toLocaleLowerCase('pt-BR').includes(term);});});

  /* Paralaxe editorial discreto. */
  if(!reduced){let ticking=false;const paint=()=>{ticking=false;root.querySelectorAll('.ps-part-ghost').forEach((ghost,i)=>ghost.style.setProperty('--gx',`${-80-((scrollY*(.035+i*.006))%260)}px`));const mock=root.querySelector('.ps-mock');if(mock){const r=mock.getBoundingClientRect(),p=Math.max(-1,Math.min(1,(innerHeight/2-(r.top+r.height/2))/innerHeight));mock.style.setProperty('--py',`${p*22}px`);mock.style.setProperty('--rx',`${p*-2.4}deg`);}};addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(paint);}},{passive:true});paint();}
})();
