// High Style Match customer authentication configuration.
// This file intentionally contains no private server secret.
// When Supabase is connected, set the public project URL and public anon key here.
// Protect customer data with Supabase Row Level Security policies before enabling real accounts.
window.HSM_AUTH = {
  provider: 'supabase',
  url: '',
  anonKey: '',
  afterSignIn: '/high-style-match/customer/'
};
