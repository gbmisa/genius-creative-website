// Genius Creative — accessible lightbox (full-resolution artwork view).
// Attaches to photography-journal frames and painting-detail hero images.
// Must load after js/gallery.js: DOMContentLoaded handlers run in script
// order, and the photo-grid images have to exist before we bind to them.

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

document.addEventListener('DOMContentLoaded', () => {
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
});
