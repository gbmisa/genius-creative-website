// Genius Creative — shared behavior: nav, gallery filters, photo grids, lightbox, contact

// Set to a Formspree / Getform / FormSubmit endpoint when ready (e.g. "https://formspree.io/f/xxxx").
// Until then, submit uses a mailto: fallback so inquiries still leave the browser.
const FORM_ENDPOINT = '';
const MAILTO_FALLBACK = 'studio@geniuscreative.com';

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  renderPhotoGrids();
  initGalleryFilters();
  initLightbox();
  initContactForms();
});

/* ---------- Mobile nav + artists dropdown ---------- */

function initNav() {
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
}

/* ---------- Photo grids (gallery + photography journal) ---------- */

function pad2(n) {
  return String(n).padStart(2, '0');
}

function largestSrcsetUrl(img) {
  const srcset = img.getAttribute('srcset');
  if (!srcset) return img.currentSrc || img.getAttribute('src') || '';
  let bestUrl = '';
  let bestW = -1;
  srcset.split(',').forEach((part) => {
    const bits = part.trim().split(/\s+/);
    const url = bits[0];
    const w = bits[1] && bits[1].endsWith('w') ? parseInt(bits[1], 10) : 0;
    if (url && w >= bestW) {
      bestW = w;
      bestUrl = url;
    }
  });
  return bestUrl || img.currentSrc || img.getAttribute('src') || '';
}

function renderPhotoGrids() {
  document.querySelectorAll('[data-photo-grid]').forEach((container) => {
    const count = parseInt(container.dataset.photoCount || '81', 10);
    const base = (container.dataset.photoBase || 'assets/gregory-photography').replace(/\/$/, '');
    const filterable = container.dataset.photoFilterable === 'true';
    const sizes = container.dataset.photoSizes || '(max-width: 620px) 100vw, (max-width: 900px) 50vw, 33vw';
    const frag = document.createDocumentFragment();

    for (let i = 1; i <= count; i++) {
      const n = pad2(i);
      const src900 = `${base}/photo-${n}-900.jpg`;
      const src2200 = `${base}/photo-${n}-2200.jpg`;
      const wrap = document.createElement('div');
      wrap.className = 'artwork';
      if (filterable) {
        wrap.dataset.artist = 'gregory';
        wrap.dataset.medium = 'photography';
      }
      const img = document.createElement('img');
      img.src = src900;
      img.srcset = `${src900} 900w, ${src2200} 2200w`;
      img.sizes = sizes;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.alt = `Outside — Arizona desert photography by Gregory Milligan, frame ${n}`;
      wrap.appendChild(img);
      frag.appendChild(wrap);
    }
    container.appendChild(frag);
  });
}

/* ---------- Gallery filters ---------- */

function initGalleryFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const mediumSelect = document.querySelector('.filter-select');
  const filterItems = document.querySelectorAll('[data-artist]');
  if (!filterItems.length) return;

  const applyFilters = () => {
    const artist = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    const medium = mediumSelect ? mediumSelect.value : 'all';
    filterItems.forEach((item) => {
      const artistMatch = artist === 'all' || item.dataset.artist === artist;
      const mediumMatch = medium === 'all' || item.dataset.medium === medium;
      item.classList.toggle('hidden', !(artistMatch && mediumMatch));
    });
  };

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.toggle('active', b === btn));
      applyFilters();
    });
  });
  if (mediumSelect) mediumSelect.addEventListener('change', applyFilters);

  const params = new URLSearchParams(window.location.search);
  const requestedArtist = params.get('artist');
  const requestedMedium = params.get('medium');
  const artistMatch =
    requestedArtist && Array.from(filterBtns).some((b) => b.dataset.filter === requestedArtist);
  if (artistMatch) {
    filterBtns.forEach((b) => b.classList.toggle('active', b.dataset.filter === requestedArtist));
  }
  if (mediumSelect && requestedMedium) mediumSelect.value = requestedMedium;
  if (artistMatch || (mediumSelect && requestedMedium)) applyFilters();
}

/* ---------- Accessible lightbox (full-resolution) ---------- */

function initLightbox() {
  const artworkImgs = Array.from(
    document.querySelectorAll('.photo-columns .artwork img, .painting-detail .artwork img')
  ).filter((img) => !img.closest('a.piece'));
  if (!artworkImgs.length) return;

  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Artwork full resolution view');
  lightbox.innerHTML =
    '<button type="button" class="lightbox-close" aria-label="Close full resolution view">&times;</button><img alt="" />';
  document.body.appendChild(lightbox);

  const lightboxImg = lightbox.querySelector('img');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  let lastFocus = null;
  let open = false;
  let currentImg = null;

  const getFocusable = () =>
    Array.from(lightbox.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(
      (el) => !el.hasAttribute('disabled')
    );

  // Only images actually on screen — excludes items hidden by the gallery filters.
  const visibleImgs = () => artworkImgs.filter((img) => img.offsetParent !== null);

  const showImage = (img) => {
    currentImg = img;
    lightboxImg.src = largestSrcsetUrl(img);
    lightboxImg.alt = img.alt || 'Artwork at full resolution';
  };

  const showByOffset = (offset) => {
    const list = visibleImgs();
    if (!list.length) return;
    let idx = list.indexOf(currentImg);
    if (idx === -1) idx = 0;
    idx = (idx + offset + list.length) % list.length;
    showImage(list[idx]);
  };

  const openLightbox = (img) => {
    lastFocus = document.activeElement;
    showImage(img);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    open = true;
    closeBtn.focus();
  };

  const closeLightbox = () => {
    if (!open) return;
    lightbox.classList.remove('open');
    lightboxImg.removeAttribute('src');
    lightboxImg.alt = '';
    document.body.style.overflow = '';
    open = false;
    currentImg = null;
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    lastFocus = null;
  };

  artworkImgs.forEach((img) => {
    // Make zoomable images keyboard-activatable without wrapping structure
    if (!img.hasAttribute('tabindex')) img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', (img.alt ? img.alt + ' — ' : '') + 'View full resolution');
    img.addEventListener('click', () => openLightbox(img));
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(img);
      }
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeLightbox();
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      showByOffset(1);
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      showByOffset(-1);
      return;
    }
    if (e.key === 'Tab') {
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

/* ---------- Contact forms: intent prefill + submit ---------- */

function initContactForms() {
  const params = new URLSearchParams(window.location.search);
  const intent = (params.get('intent') || '').toLowerCase();
  const piece = params.get('piece') || '';
  const artist = (params.get('artist') || '').toLowerCase();

  const artPanel = document.getElementById('panel-art');
  const remodelPanel = document.getElementById('panel-remodel');
  const artForm = document.getElementById('form-art');
  const remodelForm = document.getElementById('form-remodel');

  if (artPanel || remodelPanel) {
    if (intent === 'remodel' || intent === 'project') {
      remodelPanel?.classList.add('panel-highlight');
      artPanel?.classList.remove('panel-highlight');
      remodelPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      remodelForm?.querySelector('input, select, textarea')?.focus({ preventScroll: true });
    } else if (intent === 'art' || piece || artist) {
      artPanel?.classList.add('panel-highlight');
      remodelPanel?.classList.remove('panel-highlight');
      artPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  if (artForm) {
    const artistSelect = artForm.querySelector('[name="artist"]');
    const pieceInput = artForm.querySelector('[name="piece"]');
    const message = artForm.querySelector('[name="message"]');
    if (artistSelect && artist) {
      const opt = Array.from(artistSelect.options).find((o) => o.value === artist);
      if (opt) artistSelect.value = artist;
    }
    if (pieceInput && piece) pieceInput.value = piece;
    if (message && piece && !message.value) {
      message.placeholder = `I'm inquiring about “${piece}”…`;
      if (!message.value) {
        message.value = `I'm interested in “${piece}”.`;
      }
    }
  }

  document.querySelectorAll('form.gc-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = form.querySelector('.form-status');
      const submitBtn = form.querySelector('[type="submit"]');
      const data = new FormData(form);
      const intentLabel = form.dataset.intent || 'inquiry';
      data.set('_subject', `Genius Creative — ${intentLabel}`);
      data.set('intent', intentLabel);

      if (submitBtn) submitBtn.disabled = true;
      if (status) {
        status.hidden = false;
        status.className = 'form-status';
        status.textContent = 'Sending…';
      }

      try {
        if (FORM_ENDPOINT) {
          const res = await fetch(FORM_ENDPOINT, {
            method: 'POST',
            body: data,
            headers: { Accept: 'application/json' },
          });
          if (!res.ok) throw new Error('Submit failed');
          form.reset();
          if (status) {
            status.className = 'form-status ok';
            status.textContent = 'Thank you — we received your message and will be in touch soon.';
          }
        } else {
          // Working fallback until a form backend is configured
          const lines = [];
          data.forEach((value, key) => {
            if (String(key).startsWith('_')) return;
            lines.push(`${key}: ${value}`);
          });
          const subject = encodeURIComponent(`Genius Creative — ${intentLabel}`);
          const body = encodeURIComponent(lines.join('\n'));
          window.location.href = `mailto:${MAILTO_FALLBACK}?subject=${subject}&body=${body}`;
          if (status) {
            status.className = 'form-status ok';
            status.textContent =
              'Your email app should open with this inquiry filled in. If it does not, email ' +
              MAILTO_FALLBACK +
              ' directly.';
          }
        }
      } catch (err) {
        if (status) {
          status.className = 'form-status err';
          status.textContent = 'Something went wrong. Please email ' + MAILTO_FALLBACK + ' directly.';
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });
}
