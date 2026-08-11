// Genius Creative — shared behavior: mobile nav + gallery filters

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', links.classList.contains('open'));
    });
  }

  // mobile dropdown (Artists) toggle
  document.querySelectorAll('.has-dropdown > a').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      if (window.innerWidth <= 860) {
        e.preventDefault();
        trigger.parentElement.classList.toggle('open');
      }
    });
  });

  // gallery filters — artist (buttons) combined with medium (dropdown)
  const filterBtns = document.querySelectorAll('.filter-btn');
  const mediumSelect = document.querySelector('.filter-select');
  const filterItems = document.querySelectorAll('[data-artist]');
  if (filterItems.length) {
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
    if (mediumSelect) {
      mediumSelect.addEventListener('change', applyFilters);
    }

    const params = new URLSearchParams(window.location.search);
    const requestedArtist = params.get('artist');
    const requestedMedium = params.get('medium');
    const artistMatch = requestedArtist && Array.from(filterBtns).some((b) => b.dataset.filter === requestedArtist);
    if (artistMatch) {
      filterBtns.forEach((b) => b.classList.toggle('active', b.dataset.filter === requestedArtist));
    }
    if (mediumSelect && requestedMedium) {
      mediumSelect.value = requestedMedium;
    }
    if (artistMatch || (mediumSelect && requestedMedium)) applyFilters();
  }

  // artwork lightbox — click a photography frame or a painting-detail hero image to view it at native resolution
  // (excludes painting thumbnails, which link to their own detail page instead of zooming)
  const artworkImgs = Array.from(
    document.querySelectorAll('.photo-columns .artwork img, .painting-detail .artwork img')
  ).filter((img) => !img.closest('a.piece'));
  if (artworkImgs.length) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = '<button class="lightbox-close" aria-label="Close">&times;</button><img alt="" />';
    document.body.appendChild(lightbox);

    const lightboxImg = lightbox.querySelector('img');
    const closeBtn = lightbox.querySelector('.lightbox-close');

    const openLightbox = (img) => {
      lightboxImg.src = img.getAttribute('src');
      lightboxImg.alt = img.alt;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    const closeLightbox = () => {
      lightbox.classList.remove('open');
      lightboxImg.src = '';
      document.body.style.overflow = '';
    };

    artworkImgs.forEach((img) => {
      img.addEventListener('click', () => openLightbox(img));
    });
    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });
  }
});
