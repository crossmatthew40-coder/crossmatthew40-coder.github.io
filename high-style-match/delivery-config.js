// High Style Match Deliver — standalone backend configuration.
// This file intentionally contains no private keys. The delivery API is a Cloudflare Worker.
window.HSM_DELIVERY = {
  provider: 'cloudflare-r2',
  apiBase: ''
};
(function(){
  if(!document.querySelector('script[data-hsm-delivery-guard]')){
    const s=document.createElement('script');s.src='/high-style-match/delivery-ui-guard.js?v=20260908-1';s.defer=true;s.dataset.hsmDeliveryGuard='true';document.head.appendChild(s)
  }
  if(!document.querySelector('script[data-hsm-compliance]')){
    const c=document.createElement('script');c.src='/high-style-match/site-compliance.js?v=20260908-1';c.defer=true;c.dataset.hsmCompliance='true';document.head.appendChild(c)
  }
})();
