// Îlot nav — raison : barre réduite au défilement (jamais masquée), hauteur réelle exposée en --nav-h pour la pile collante,
// menu mobile plein écran avec accordéon « À propos », fermeture à l'échappement. Aucune dépendance.
const nav = document.querySelector<HTMLElement>('[data-nav]');
if (nav) {
  const doc = document.documentElement;
  const SEUIL = 40;
  let etat = false;
  const majHauteur = () => doc.style.setProperty('--nav-h', `${nav.getBoundingClientRect().height}px`);
  const surScroll = () => {
    const reduit = window.scrollY > SEUIL;
    if (reduit !== etat) {
      etat = reduit;
      if (reduit) nav.setAttribute('data-reduit', '1');
      else nav.removeAttribute('data-reduit');
      setTimeout(majHauteur, 360);
    }
  };
  window.addEventListener('scroll', surScroll, { passive: true });
  window.addEventListener('resize', majHauteur);
  surScroll();
  majHauteur();
  nav.addEventListener('transitionend', majHauteur);

  const burger = document.querySelector<HTMLButtonElement>('[data-burger]');
  const menu = document.querySelector<HTMLElement>('[data-menu-mobile]');
  const fermerBtn = menu?.querySelector<HTMLButtonElement>('[data-menu-fermer]');
  const ouvrir = (on: boolean) => {
    if (!menu || !burger) return;
    menu.hidden = !on;
    burger.setAttribute('aria-expanded', String(on));
    if (on) { document.body.setAttribute('data-menu-ouvert', '1'); fermerBtn?.focus(); }
    else { document.body.removeAttribute('data-menu-ouvert'); burger.focus(); }
  };
  burger?.addEventListener('click', () => ouvrir(true));
  fermerBtn?.addEventListener('click', () => ouvrir(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu && !menu.hidden) ouvrir(false); });

  const accordeon = menu?.querySelector<HTMLButtonElement>('[data-accordeon]');
  const sous = menu?.querySelector<HTMLElement>('#menu-mobile-sous');
  accordeon?.addEventListener('click', () => {
    const on = accordeon.getAttribute('aria-expanded') !== 'true';
    accordeon.setAttribute('aria-expanded', String(on));
    if (sous) sous.hidden = !on;
    accordeon.closest('.menu-mobile-apropos')?.toggleAttribute('data-ouvert', on);
  });
}
