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

  // Compliance/accessibility/privacy runtime for every High Style Match web page
  // that loads the shared auth configuration.
  if(!document.querySelector('script[data-hsm-compliance]')){
    const c=document.createElement('script');
    c.src='/high-style-match/site-compliance.js?v=20260909-2';
    c.defer=true;
    c.dataset.hsmCompliance='true';
    document.head.appendChild(c);
  }

  // Photographer dashboard bridge for the new Client Review → Approved for Edit → Final Delivery workflow.
  if((path==='/high-style-match/'||path==='/high-style-match/index.html')&&!document.querySelector('script[data-hsm-client-workflow]')){
    const w=document.createElement('script');
    w.src='/high-style-match/client-workflow-integration.js?v=20260916-1';
    w.defer=true;
    w.dataset.hsmClientWorkflow='true';
    document.head.appendChild(w);
  }

  if(path.includes('/high-style-match/customer/')||path.includes('/high-style-match/customer-v2/')||path.includes('/high-style-match/admin/')){
    if(!document.querySelector('script[data-hsm-role-guard]')){
      const s=document.createElement('script');
      s.src='/high-style-match/role-guard.js?v=20260908-1';
      s.defer=true;
      s.dataset.hsmRoleGuard='true';
      document.head.appendChild(s);
    }
  }
})();