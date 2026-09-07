// High Style Match production configuration.
// Public, browser-safe values only. Never put private API keys here.
window.HSM_APP = {
  version: '1.0.0-production-foundation',
  canonicalBase: 'https://crossmatthew40-coder.github.io/high-style-match/',
  preferredDomain: 'https://app.highstylegroup.co.uk/',
  supportEmail: 'support@highstylegroup.co.uk',
  notificationsEmail: 'notifications@highstylegroup.co.uk',
  logoUrl: '/high-style-logo.svg',
  sync: {
    enabled: true,
    intervalMs: 60000,
    previewBatchSize: 8,
    maxPreviewBytes: 3000000
  },
  monitoring: {
    enabled: true,
    reportClientErrors: true
  },
  billing: {
    provider: 'stripe',
    checkoutFunction: 'create-checkout-session',
    portalFunction: 'create-billing-portal'
  },
  features: {
    customerReview: true,
    customerInvites: true,
    cloudProjects: true,
    offlineQueue: true,
    deliveryTracking: true,
    adminConsole: true,
    billing: false
  }
};

(function applyHighStyleBranding(){
  function loadTheme(){
    if (document.querySelector('link[data-hsm-pro-theme]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './capture-one-theme.css?v=20260907-1';
    link.dataset.hsmProTheme = 'true';
    document.head.appendChild(link);
  }

  function apply(){
    loadTheme();
    const logoUrl = window.HSM_APP.logoUrl;

    document.querySelectorAll('.brandmark').forEach((mark) => {
      const isOpeningLogo = !!mark.closest('.hsm-opening-logo');

      mark.innerHTML = '';
      mark.style.background = isOpeningLogo ? 'transparent' : '#000';
      mark.style.boxShadow = 'none';
      mark.style.borderRadius = isOpeningLogo ? '0' : '4px';
      mark.style.overflow = 'visible';
      mark.style.padding = isOpeningLogo ? '0' : '7px';

      if (isOpeningLogo) {
        mark.style.width = 'clamp(180px, 24vw, 300px)';
        mark.style.height = 'clamp(58px, 8vw, 96px)';
        mark.style.flex = '0 0 auto';
      }

      const img = document.createElement('img');
      img.src = logoUrl;
      img.alt = 'High Style';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.display = 'block';
      img.style.objectFit = 'contain';
      img.style.objectPosition = 'center';
      mark.appendChild(img);
    });

    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.type = 'image/svg+xml';
    favicon.href = logoUrl;
  }

  function loadProductUpgrades(){
    if (document.querySelector('script[data-hsm-upgrades]')) return;
    const script = document.createElement('script');
    script.src = './product-upgrades.js?v=20260907-1';
    script.defer = true;
    script.dataset.hsmUpgrades = 'true';
    document.head.appendChild(script);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { apply(); loadProductUpgrades(); }, { once: true });
  } else {
    apply();
    loadProductUpgrades();
  }
})();
