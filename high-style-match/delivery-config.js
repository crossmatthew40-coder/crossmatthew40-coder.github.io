// High Style Match Deliver — standalone backend configuration.
// This file intentionally contains no private keys. The delivery API is a Cloudflare Worker.
window.HSM_DELIVERY = {
  provider: 'cloudflare-r2',
  apiBase: ''
};
(function(){
  if(document.querySelector('script[data-hsm-delivery-guard]'))return;
  const s=document.createElement('script');
  s.src='/high-style-match/delivery-ui-guard.js?v=20260908-1';
  s.defer=true;
  s.dataset.hsmDeliveryGuard='true';
  document.head.appendChild(s);
})();
