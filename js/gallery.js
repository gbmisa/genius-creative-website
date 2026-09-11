// Genius Creative — gallery grid: photo-grid rendering + artist/medium filters.
// Runs on any page with a [data-photo-grid] container or [data-artist] items;
// no-ops everywhere else.

/* ---------- Photo grids (gallery + photography journal) ---------- */

function pad2(n) {
  return String(n).padStart(2, '0');
}

function renderPhotoGrids() {
  document.querySelectorAll('[data-photo-grid]').forEach((container) => {
    const count = parseInt(container.dataset.photoCount || '30', 10);
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

/* ---------- Artist / medium filters ---------- */

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

  // Deep links: gallery.html?artist=…&medium=… — ignore values that don't
  // match a real button/option so a bad param can't hide the whole grid.
  const params = new URLSearchParams(window.location.search);
  const requestedArtist = params.get('artist');
  const requestedMedium = params.get('medium');
  const artistMatch =
    requestedArtist && Array.from(filterBtns).some((b) => b.dataset.filter === requestedArtist);
  const mediumMatch =
    requestedMedium &&
    mediumSelect &&
    Array.from(mediumSelect.options).some((o) => o.value === requestedMedium);
  if (artistMatch) {
    filterBtns.forEach((b) => b.classList.toggle('active', b.dataset.filter === requestedArtist));
  }
  if (mediumMatch) mediumSelect.value = requestedMedium;
  if (artistMatch || mediumMatch) applyFilters();
}

document.addEventListener('DOMContentLoaded', () => {
  renderPhotoGrids();
  initGalleryFilters();
});
