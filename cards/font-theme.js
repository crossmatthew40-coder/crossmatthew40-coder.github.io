(() => {
  const brands = window.HIGH_STYLE_BRANDS || {};
  const params = new URLSearchParams(window.location.search);
  const slug = (params.get('brand') || 'high-style').toLowerCase();
  const brand = brands[slug];
  if (!brand) return;

  const theme = brand.theme || {};
  const bodyFont = theme.bodyFont || '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
  const headingFont = theme.headingFont || bodyFont;

  document.body.style.fontFamily = bodyFont;
  const heading = document.getElementById('name');
  if (heading) heading.style.fontFamily = headingFont;

  document.querySelectorAll('.action,.social,.chip,.role,.tagline,.location,.person,.footer,.section-title,.eyebrow').forEach(el => {
    el.style.fontFamily = bodyFont;
  });
})();