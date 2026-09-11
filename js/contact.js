// Genius Creative — contact page: intent deep-links, prefill, and submission.
// Uses FORM_ENDPOINT / MAILTO_FALLBACK from js/main.js (loaded first).
// No-ops on pages without the contact panels or a form.gc-form.

document.addEventListener('DOMContentLoaded', () => {
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
      message.value = `I'm interested in “${piece}”.`;
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
});
