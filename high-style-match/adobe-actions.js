// High Style Match — Adobe workflow buttons for Smart Cull Best Picks.
(function(){
  'use strict';

  const URLS={
    lightroom:'https://lightroom.adobe.com/',
    photoshop:'https://photoshop.adobe.com/'
  };

  function installStyles(){
    if(document.getElementById('hsmAdobeActionsStyle')) return;
    const style=document.createElement('style');
    style.id='hsmAdobeActionsStyle';
    style.textContent=`
      .hsm-adobe-actions{display:flex;gap:7px;flex-wrap:wrap;width:100%;margin-top:6px}
      .hsm-adobe-btn{appearance:none;border:1px solid #343840;background:#17191e;color:#f7f7f8;border-radius:9px;min-height:34px;padding:7px 11px;font:700 11px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif;display:inline-flex;align-items:center;gap:7px;text-decoration:none;transition:transform .15s ease,background .15s ease,border-color .15s ease}
      .hsm-adobe-btn:hover{background:#202329;border-color:#464b55;transform:translateY(-1px)}
      .hsm-adobe-btn:active{transform:translateY(0)}
      .hsm-adobe-icon{width:20px;height:20px;border-radius:6px;display:grid;place-items:center;font-weight:850;font-size:10px;line-height:1;background:#f1f3f5;color:#111318}
      .hsm-adobe-btn[data-adobe-app="photoshop"] .hsm-adobe-icon{background:#e7f4ff;color:#0d2940}
      .hsm-adobe-note{width:100%;font-size:10px;line-height:1.35;color:#777d87;margin-top:1px}
    `;
    document.head.appendChild(style);
  }

  function addButtons(){
    document.querySelectorAll('.cull-card').forEach(card=>{
      const isBest=!!card.querySelector('.cull-badge.pick');
      const actions=card.querySelector('.cull-actions');
      if(!isBest||!actions||actions.querySelector('.hsm-adobe-actions')) return;

      const wrap=document.createElement('div');
      wrap.className='hsm-adobe-actions';
      wrap.innerHTML=`
        <a class="hsm-adobe-btn" data-adobe-app="lightroom" href="${URLS.lightroom}" target="_blank" rel="noopener noreferrer"><span class="hsm-adobe-icon">Lr</span>Open Lightroom</a>
        <a class="hsm-adobe-btn" data-adobe-app="photoshop" href="${URLS.photoshop}" target="_blank" rel="noopener noreferrer"><span class="hsm-adobe-icon">Ps</span>Open Photoshop</a>
        <div class="hsm-adobe-note">Adobe opens in a new tab so your High Style Match project stays open.</div>`;
      actions.appendChild(wrap);
    });
  }

  function boot(){
    installStyles();
    addButtons();
    const observer=new MutationObserver(addButtons);
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
