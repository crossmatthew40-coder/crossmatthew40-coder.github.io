// High Style Match authentication configuration.
// Browser-safe values only. Never place a Supabase service-role key here.
window.HSM_AUTH = {
  provider: 'supabase',
  url: 'https://wmuuvcrrmzftayyynhki.supabase.co',
  anonKey: 'sb_publishable_fZGXwGrbYXEDHIj1PAxkfg_7Bh3Xkiv',
  afterSignIn: '/high-style-match/'
};

(function(){
  const path=location.pathname;
  if(path.includes('/high-style-match/customer/')||path.includes('/high-style-match/admin/')){
    if(!document.querySelector('script[data-hsm-role-guard]')){
      const s=document.createElement('script');
      s.src='/high-style-match/role-guard.js?v=20260908-1';
      s.defer=true;
      s.dataset.hsmRoleGuard='true';
      document.head.appendChild(s);
    }
  }
})();
