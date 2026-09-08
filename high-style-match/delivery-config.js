// High Style Match Deliver — standalone backend configuration.
// This file intentionally contains no private keys. The delivery API is a Cloudflare Worker.
window.HSM_DELIVERY = {
  provider: 'cloudflare-r2',
  apiBase: ''
};
(function(){
  const s=document.createElement('script');
  s.src='../delivery-ui-guard.js?v=20260908-1';
  s.defer=true;
  document.head.appendChild(s);
})();
