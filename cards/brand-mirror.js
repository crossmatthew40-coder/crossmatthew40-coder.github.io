(() => {
  const brands = window.HIGH_STYLE_BRANDS || {};
  const params = new URLSearchParams(window.location.search);
  const slug = (params.get('brand') || 'high-style').toLowerCase();
  const brand = brands[slug];
  if (!brand) return;

  const theme = brand.theme || {};
  const tokens = theme.brandTokens || {};
  const root = document.documentElement;

  if (theme.bodyFont) root.style.setProperty('--brand-body-font', theme.bodyFont);
  if (theme.headingFont) root.style.setProperty('--brand-heading-font', theme.headingFont);

  const style = document.createElement('style');
  style.textContent = `
    body{font-family:var(--brand-body-font,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif)}
    .hero h1{font-family:var(--brand-heading-font,var(--brand-body-font,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif))}
    .action,.chip,.social,.quote,.role,.tagline,.location,.person,.footer{font-family:var(--brand-body-font,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif)}
  `;
  document.head.appendChild(style);

  const apply = () => {
    document.querySelectorAll('.action').forEach(el => {
      if (tokens.buttonRadius != null) el.style.borderRadius = `${tokens.buttonRadius}px`;
      if (tokens.borderWidth != null) el.style.borderWidth = `${tokens.borderWidth}px`;
    });

    const mark = document.getElementById('brandMark');
    if (mark && tokens.logoRadius != null) mark.style.borderRadius = tokens.logoRadius >= 999 ? '50%' : `${tokens.logoRadius}px`;

    const title = document.getElementById('name');
    if (title) {
      if (tokens.headingWeight != null) title.style.fontWeight = String(tokens.headingWeight);
      if (tokens.headingTransform) title.style.textTransform = tokens.headingTransform;
      if (tokens.letterSpacing) title.style.letterSpacing = tokens.letterSpacing;
    }

    if (tokens.sectionGap != null) {
      document.querySelectorAll('.section').forEach(el => {
        el.style.marginTop = `${tokens.sectionGap}px`;
      });
    }
  };

  // app.js and smart-actions.js both run before this file, so all buttons are ready here.
  apply();
})();