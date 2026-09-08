(function(){
  'use strict';
  function transferGuard(){
    const send=document.getElementById('send'),apiUrl=document.getElementById('apiUrl'),setup=document.getElementById('setup'),status=document.getElementById('status');
    if(!send||!apiUrl)return;
    function sync(){
      const ready=!!apiUrl.value.trim();
      if(!ready){
        send.disabled=true;
        send.title='Connect the High Style Match delivery server first';
        if(setup)setup.open=true;
        if(status)status.innerHTML='Cloud delivery is not connected on this build. Add the deployed High Style Match delivery server address to enable client links. Your files stay on this device until you do.';
      }else{
        send.disabled=false;
        send.removeAttribute('title');
        if(status&&/not connected on this build/i.test(status.textContent||''))status.textContent='Delivery server entered. Add files, then upload and create the private client link.';
      }
    }
    apiUrl.addEventListener('input',sync);sync();
  }
  function clientGuard(){
    if(!location.pathname.includes('/high-style-match/delivery/'))return;
    const cfg=window.HSM_DELIVERY||{};
    if(cfg.apiBase||localStorage.getItem('hsm_delivery_api'))return;
    const body=document.body;if(!body)return;
    const note=document.createElement('div');
    note.style.cssText='position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9999;width:min(680px,calc(100% - 28px));padding:12px 14px;background:#111;color:#fff;border:1px solid #333;font:11px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    note.textContent='High Style Match Deliver is not connected to its cloud server yet. Client download links become active after the delivery backend is deployed.';
    body.appendChild(note);
  }
  function boot(){transferGuard();clientGuard()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
