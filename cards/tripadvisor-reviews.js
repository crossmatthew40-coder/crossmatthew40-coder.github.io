(() => {
  const brands = window.HIGH_STYLE_BRANDS || {};
  const params = new URLSearchParams(window.location.search);
  const slug = (params.get('brand') || 'high-style').toLowerCase();
  const brand = brands[slug];
  if (!brand || !brand.tripadvisorUrl) return;

  const url = String(brand.tripadvisorUrl || '').trim();
  if (!url) return;
  let safe = '';
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase().replace(/^www\./,'');
    if (!/^tripadvisor\./.test(host)) return;
    safe = u.href;
  } catch(e) { return; }

  const style = document.createElement('style');
  style.textContent = `
    .tripadvisor-reviews .review-link{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:15px 16px;border:1px solid var(--border);border-radius:18px;background:var(--surface);color:var(--text);text-decoration:none;font-weight:850}
    .tripadvisor-reviews .review-link small{display:block;margin-top:4px;color:var(--muted);font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase}
    .tripadvisor-reviews .review-arrow{font-size:23px;flex:0 0 auto}
  `;
  document.head.appendChild(style);

  const section = document.createElement('section');
  section.className = 'section tripadvisor-reviews';
  section.id = 'tripadvisorReviewsSection';
  section.innerHTML = `
    <h2 class="section-title">Reviews</h2>
    <a class="review-link" target="_blank" rel="noopener">
      <span><strong>Read our reviews on Tripadvisor</strong><small>Tripadvisor</small></span>
      <span class="review-arrow">→</span>
    </a>`;
  section.querySelector('a').href = safe;

  const reviewSection = document.getElementById('reviewSection');
  const gallerySection = document.getElementById('gallerySection');
  const footer = document.getElementById('footer');
  const anchor = reviewSection || gallerySection || footer;
  anchor.parentNode.insertBefore(section, anchor);
})();