// Genius Creative — local image curation overlay.
// Injected only by tools/curate_server.py; never shipped to the live site.
(function () {
  var style = document.createElement('style');
  style.textContent =
    '.curate-host { position: relative !important; }' +
    '.curate-del {' +
    '  position: absolute; top: 8px; right: 8px; z-index: 50;' +
    '  width: 30px; height: 30px; border-radius: 50%;' +
    '  background: rgba(20,0,0,0.78); color: #fff; border: 1px solid rgba(255,255,255,0.45);' +
    '  font-size: 16px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center;' +
    '  font-family: sans-serif;' +
    '}' +
    '.curate-del:hover { background: #c0392b; }' +
    '.curate-badge {' +
    '  position: fixed; bottom: 16px; right: 16px; z-index: 999;' +
    '  background: #c9a24b; color: #0b0a10; font: 600 12px/1 sans-serif;' +
    '  padding: 8px 14px; border-radius: 3px; letter-spacing: 0.05em; text-transform: uppercase;' +
    '}';
  document.head.appendChild(style);

  var badge = document.createElement('div');
  badge.className = 'curate-badge';
  badge.textContent = 'Curation mode — local only';
  document.body.appendChild(badge);

  function extractSlug(href) {
    if (!href) return null;
    if (/gregory-photography\.html(?:[#?]|$)/.test(href)) return null;
    var m = href.split('?')[0].split('#')[0].match(/([^/]+)\.html$/);
    return m ? m[1] : null;
  }
  function extractPhotoId(src) {
    var m = src && src.match(/photo-(\d+)-/);
    return m ? m[1] : null;
  }

  function doDelete(type, id, btn) {
    var label = type === 'photo' ? 'this photo' : 'this painting (and its page)';
    if (!window.confirm('Permanently delete ' + label + '? This removes the file(s) and every reference to it on the site. Cannot be undone.')) {
      return;
    }
    btn.disabled = true;
    btn.textContent = '…';
    fetch('/__curate/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: type, id: id })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.ok) {
          window.alert('Delete failed: ' + (data.error || 'unknown error'));
          btn.disabled = false;
          btn.textContent = '×';
          return;
        }
        if (type === 'painting' && btn.dataset.ownDetailPage === '1') {
          window.location.href = '/gallery.html';
          return;
        }
        var host = btn.closest('.curate-host');
        if (host) host.remove();
      })
      .catch(function (err) {
        window.alert('Delete failed: ' + err.message);
        btn.disabled = false;
        btn.textContent = '×';
      });
  }

  function addButton(host, type, id, ownDetailPage) {
    if (!host || host.querySelector('.curate-del')) return;
    host.classList.add('curate-host');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'curate-del';
    btn.title = 'Delete';
    btn.textContent = '×';
    if (ownDetailPage) btn.dataset.ownDetailPage = '1';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      doDelete(type, id, btn);
    });
    host.appendChild(btn);
  }

  // photography frames — bare .artwork blocks not wrapped in a painting link
  document.querySelectorAll('.artwork').forEach(function (art) {
    if (art.closest('a.piece')) return;
    if (art.closest('.painting-detail')) return; // handled separately below
    var img = art.querySelector('img');
    var id = img && extractPhotoId(img.getAttribute('src') || '');
    if (id) addButton(art, 'photo', id, false);
  });

  // paintings — any card linking to a painting's own detail page
  document.querySelectorAll('a.piece').forEach(function (a) {
    var slug = extractSlug(a.getAttribute('href'));
    if (slug) addButton(a, 'painting', slug, false);
  });

  // a painting's own detail page — the big hero image itself
  var detailArt = document.querySelector('.painting-detail .artwork, .painting-detail .canvas');
  if (detailArt) {
    var slugMatch = window.location.pathname.match(/([^/]+)\.html$/);
    if (slugMatch) addButton(detailArt, 'painting', slugMatch[1], true);
  }
})();
