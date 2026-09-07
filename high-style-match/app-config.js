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
  function apply(){
    const logoUrl = window.HSM_APP.logoUrl;

    document.querySelectorAll('.brandmark').forEach((mark) => {
      mark.innerHTML = '';
      mark.style.background = '#000';
      mark.style.boxShadow = 'none';
      mark.style.borderRadius = '12px';
      mark.style.overflow = 'hidden';
      mark.style.padding = '7px';

      const img = document.createElement('img');
      img.src = logoUrl;
      img.alt = 'High Style';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.display = 'block';
      img.style.objectFit = 'contain';
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  } else {
    apply();
  }
})();
