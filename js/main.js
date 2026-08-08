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

  // gallery / project filters
  const filterBtns = document.querySelectorAll('.filter-btn');
  const filterItems = document.querySelectorAll('[data-tags]');
  if (filterBtns.length && filterItems.length) {
    const applyFilter = (filter) => {
      filterBtns.forEach((b) => b.classList.toggle('active', b.dataset.filter === filter));
      filterItems.forEach((item) => {
        const tags = item.dataset.tags.split(' ');
        item.classList.toggle('hidden', filter !== 'all' && !tags.includes(filter));
      });
    };

    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
    });

    const requested = new URLSearchParams(window.location.search).get('artist');
    const match = requested && Array.from(filterBtns).some((b) => b.dataset.filter === requested);
    if (match) applyFilter(requested);
  }
});
