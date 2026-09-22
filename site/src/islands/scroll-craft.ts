// Îlot scroll-craft — raison : entrées de section (3 recettes, une fois, IntersectionObserver) et refrain révélé ligne par ligne au défilement.
// Rien sous prefers-reduced-motion (tout est statique et complet). Pas de Lenis en v1 (voir README). Aucune dépendance.
const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const reveals = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (reduit) {
  reveals.forEach((el) => el.setAttribute('data-shown', '1'));
} else if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.setAttribute('data-shown', '1'); io.unobserve(e.target); }
    }
  }, { threshold: 0.18 });
  reveals.forEach((el) => {
    // déjà à l'écran au chargement (hero, haut de page) : pas d'attente
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.9 && r.bottom > 0) el.setAttribute('data-shown', '1');
    else io.observe(el);
  });
} else {
  reveals.forEach((el) => el.setAttribute('data-shown', '1'));
}

// Refrain : la lumière descend ligne par ligne au rythme du défilement (seul texte animé de la page)
const refrain = document.querySelector<HTMLElement>('[data-refrain]');
if (refrain) {
  const lignes = refrain.querySelectorAll<HTMLElement>('[data-ligne]');
  if (reduit) {
    lignes.forEach((l) => l.setAttribute('data-on', '1'));
  } else {
    let tick = false;
    const maj = () => {
      tick = false;
      const r = refrain.getBoundingClientRect();
      const p = (window.innerHeight * 0.78 - r.top) / (r.height * 1.1);
      lignes.forEach((l, i) => l.toggleAttribute('data-on', p > (i + 1) / lignes.length));
    };
    window.addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(maj); } }, { passive: true });
    maj();
  }
}
