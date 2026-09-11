// Genius Creative — site shell: configuration + navigation.
// Loaded first on every page. Feature behaviors live in their own files
// (js/gallery.js, js/lightbox.js, js/contact.js) and each no-ops on pages
// without their markup.

// Client-editable settings. FORM_ENDPOINT powers the contact forms
// (js/contact.js); leave it empty to fall back to a mailto link.
const FORM_ENDPOINT = 'https://formspree.io/f/xeaqjbzr';
const MAILTO_FALLBACK = 'studio@geniuscreative.com';

/* ---------- Mobile nav + artists dropdown ---------- */

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  document.querySelectorAll('.has-dropdown > a').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      if (window.innerWidth <= 860) {
        e.preventDefault();
        trigger.parentElement.classList.toggle('open');
      }
    });
  });
});
