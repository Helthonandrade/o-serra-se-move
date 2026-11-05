(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-target]').forEach((control) => {
    control.addEventListener('click', () => {
      const target = document.getElementById(control.dataset.target);
      target?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  const search = document.querySelector('[data-faq-search]');
  if (search) {
    search.addEventListener('input', () => {
      const term = search.value.trim().toLocaleLowerCase('pt-BR');
      document.querySelectorAll('.ps-faq details').forEach((item) => {
        item.hidden = term.length > 0 && !item.textContent.toLocaleLowerCase('pt-BR').includes(term);
      });
    });
  }

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('ps-seen');
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    document.querySelectorAll('.ps-reveal, section, article').forEach((item) => observer.observe(item));
  } else {
    document.querySelectorAll('.ps-reveal').forEach((item) => item.classList.add('ps-seen'));
  }

  document.querySelectorAll('a[href^="http"], a[href^="mailto:"], a[href^="https://wa.me/"]').forEach((link) => {
    link.addEventListener('click', (event) => event.stopPropagation());
  });

  document.documentElement.classList.add('ps-standalone');
})();
