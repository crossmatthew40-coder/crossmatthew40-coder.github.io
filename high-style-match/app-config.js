// High Style Match production configuration.
// Public, browser-safe values only. Never put private API keys here.
window.HSM_APP = {
  version: '1.0.0-production-foundation',
  canonicalBase: 'https://crossmatthew40-coder.github.io/high-style-match/',
  preferredDomain: 'https://app.highstylegroup.co.uk/',
  supportEmail: 'support@highstylegroup.co.uk',
  notificationsEmail: 'notifications@highstylegroup.co.uk',
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
