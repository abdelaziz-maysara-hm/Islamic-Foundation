// ============ Dark mode toggle (injected via JS — no need to edit all HTML files) ============
(function() {
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'theme-toggle';
  toggleBtn.setAttribute('aria-label', 'تبديل الوضع الليلي');

  function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    toggleBtn.textContent = dark ? '☀️' : '🌙';
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch(e){}
  }

  let saved = '';
  try { saved = localStorage.getItem('theme'); } catch(e){}
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved ? saved === 'dark' : prefersDark);

  toggleBtn.addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') !== 'dark');
  });

  // Insert into header once DOM is ready
  function injectToggle() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    const menuBtn = nav.querySelector('.menu-btn');
    if (menuBtn) nav.insertBefore(toggleBtn, menuBtn);
    else nav.appendChild(toggleBtn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectToggle);
  } else {
    injectToggle();
  }
})();

// ============ Main init after DOM ready ============
document.addEventListener('DOMContentLoaded', () => {

  // ---- Mobile menu ----
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      menuBtn.textContent = mobileMenu.classList.contains('open') ? '✕' : '☰';
    });
  }

  // ---- Site-wide search ----
  const ROOT = window.SITE_ROOT || "";

  function findBestTopic(q) {
    const list = window.TOPIC_INDEX || [];
    let best = null, bestScore = 0;
    list.forEach(t => {
      let score = 0;
      if (t.title.includes(q)) score += 3;
      if (t.keywords && t.keywords.some(k => k.includes(q) || q.includes(k))) score += 2;
      if (score > bestScore) { bestScore = score; best = t; }
    });
    return bestScore > 0 ? best : null;
  }

  function renderTopicCard(topic) {
    const booksHtml = topic.books.slice(0, 3).map(b =>
      `<a href="${b.url}" target="_blank" style="display:block; padding:6px 0; font-size:12.5px;">
        ⬇ ${b.name} <span style="color:var(--muted);">— ${b.author}</span> ${b.verified ? '✅' : ''}
      </a>`
    ).join('');
    return `
      <div style="padding:16px; border-bottom:2px solid var(--teal-soft);">
        <span class="sr-tag">📝 إجابة سريعة: ${topic.title}</span>
        <p style="font-size:13px; color:var(--text); line-height:1.8; margin:8px 0 10px;">${topic.summary}</p>
        ${booksHtml ? `<div style="margin-bottom:8px;"><strong style="font-size:12px;">أفضل الكتب المتاحة:</strong>${booksHtml}</div>` : ''}
        <a href="${ROOT}${topic.url}" style="font-size:12.5px; font-weight:800; color:var(--teal);">عرض التفاصيل الكاملة ←</a>
      </div>`;
  }

  const inputs = document.querySelectorAll('[data-search-input]');
  inputs.forEach(input => {
    const resultsBox = input.closest('.search-box').querySelector('.search-results');
    input.addEventListener('input', () => {
      const q = input.value.trim();
      if (!q) { resultsBox.classList.remove('show'); resultsBox.innerHTML = ''; return; }

      const topic = findBestTopic(q);
      const matches = (window.SITE_INDEX || []).filter(item =>
        item.title.includes(q) || (item.tags && item.tags.some(t => t.includes(q)))
      ).slice(0, 6);

      let html = '';
      if (topic) html += renderTopicCard(topic);

      if (matches.length === 0 && !topic) {
        html = '<div class="search-empty">لا توجد نتائج مطابقة</div>';
      } else if (matches.length > 0) {
        html += matches.map(m =>
          `<a href="${ROOT}${m.url}"><span class="sr-tag">${m.type}</span>${m.title}</a>`
        ).join('');
      }
      resultsBox.innerHTML = html;
      resultsBox.classList.add('show');
    });
    document.addEventListener('click', (e) => {
      if (!input.closest('.search-box').contains(e.target)) resultsBox.classList.remove('show');
    });
  });

  // ---- Fatwa accordion ----
  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      // Close siblings
      item.closest('.fatwa-cat') && item.closest('.fatwa-cat').querySelectorAll('.faq-item.open').forEach(open => {
        if (open !== item) open.classList.remove('open');
      });
      item.classList.toggle('open');
    });
  });

  // ---- TOC sidebar (auto-generated from page headings) ----
  (function buildTOC() {
    const headings = document.querySelectorAll('section h2[id], section h3[id], section h2:not([id]), section h3:not([id])');
    const eligible = Array.from(headings).filter(h => {
      const text = h.textContent.trim();
      return text.length > 2 && text.length < 60;
    });
    if (eligible.length < 3) return; // only show TOC when enough sections exist

    eligible.forEach((h, i) => {
      if (!h.id) h.id = 'toc-' + i;
    });

    const toc = document.createElement('div');
    toc.className = 'toc-sidebar';
    toc.innerHTML = '<h4>📋 محتويات الصفحة</h4>';

    eligible.forEach(h => {
      const a = document.createElement('a');
      a.href = '#' + h.id;
      // Strip leading emoji
      a.textContent = h.textContent.replace(/^[\u{1F300}-\u{1FFFF}\u{2600}-\u{27FF}🕌🌙🕋💰🏛️🍽️👗⚖️🚫🤝📚🎬📝💡📿🔔💬📖]/gu, '').trim();
      if (h.tagName === 'H3') a.classList.add('toc-h3');
      toc.appendChild(a);
    });

    document.body.appendChild(toc);
    toc.style.display = 'block';

    // Highlight active on scroll
    const tocLinks = toc.querySelectorAll('a');
    function highlightActive() {
      let current = eligible[0] && eligible[0].id;
      eligible.forEach(h => {
        if (window.scrollY + 140 >= h.offsetTop) current = h.id;
      });
      tocLinks.forEach(a => {
        a.classList.toggle('toc-active', a.getAttribute('href') === '#' + current);
      });
    }
    window.addEventListener('scroll', highlightActive, { passive: true });
    highlightActive();
  })();

});
