(function(){
  'use strict';
  if(!location.pathname.includes('/high-style-match/transfer/')) return;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const load=(src,key)=>new Promise((resolve,reject)=>{
    if(document.querySelector(`script[data-${key}]`)) return resolve();
    const s=document.createElement('script');s.src=src;s.defer=true;s.dataset[key]='true';s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
  });
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function boot(){
    try{
      await load('/high-style-match/auth-config.js','hsmFinalAuth');
      await load('/high-style-match/cloud.js','hsmFinalCloud');
      for(let i=0;i<30&&!window.HSMCloud;i++) await sleep(100);
      if(!window.HSMCloud) return;
      injectStyle();
      const message=document.getElementById('message');
      if(!message) return;
      const projectField=document.createElement('div');projectField.className='field hsm-final-field';projectField.innerHTML='<label>Project</label><select id="hsmFinalProject"><option>Loading projects…</option></select>';
      const emailField=document.createElement('div');emailField.className='field hsm-final-field';emailField.innerHTML='<label>Client email</label><input id="hsmFinalEmail" type="email" autocomplete="email" placeholder="marketing@client.com"><small>They receive a new secure link and six-digit verification code.</small>';
      message.closest('.field').before(projectField);message.closest('.field').before(emailField);
      const projectSelect=document.getElementById('hsmFinalProject'),emailInput=document.getElementById('hsmFinalEmail');
      const queryProject=new URLSearchParams(location.search).get('project')||'';
      try{
        const session=await HSMCloud.getSession();
        if(!session){projectSelect.innerHTML='<option>Sign in to High Style Match first</option>';projectSelect.disabled=true;return}
        const profile=await HSMCloud.getProfile();
        if(!['photographer','admin'].includes(profile.role)) throw new Error('Photographer access required.');
        const projects=await HSMCloud.listProjects();
        projectSelect.innerHTML=projects.map(p=>`<option value="${p.id}">${esc(p.client_name||'Client')} — ${esc(p.name)}</option>`).join('')||'<option>No projects available</option>';
        if(queryProject&&projects.some(p=>p.id===queryProject)) projectSelect.value=queryProject;
      }catch(e){projectSelect.innerHTML=`<option>${esc(e.message||String(e))}</option>`;projectSelect.disabled=true}

      const result=document.getElementById('result'),resultLink=document.getElementById('resultLink');
      let secureUrl='';
      function prepareSecureActions(){
        if(!result.classList.contains('on')) return;
        const actions=result.querySelector('.actions');if(!actions)return;
        [...actions.children].forEach(el=>el.style.display='none');
        let sendBtn=document.getElementById('hsmSendFinal');
        if(!sendBtn){
          sendBtn=document.createElement('button');sendBtn.id='hsmSendFinal';sendBtn.className='btn primary';sendBtn.textContent='Send Final Delivery →';sendBtn.style.display='inline-flex';actions.appendChild(sendBtn);
          const copy=document.createElement('button');copy.id='hsmCopySecure';copy.className='btn secondary';copy.textContent='Copy Secure Link';copy.style.display='none';actions.appendChild(copy);
          const open=document.createElement('button');open.id='hsmOpenSecure';open.className='btn secondary';open.textContent='Open Client View';open.style.display='none';actions.appendChild(open);
          sendBtn.onclick=async()=>{
            const email=emailInput.value.trim(),projectId=projectSelect.value,raw=(resultLink.textContent||'').trim(),status=document.getElementById('status');
            if(!email){status.textContent='Enter the client email before sending final delivery.';emailInput.focus();return}
            if(!projectId||projectSelect.disabled){status.textContent='Choose the project for this delivery.';return}
            if(!raw){status.textContent='Create the delivery link first.';return}
            sendBtn.disabled=true;sendBtn.textContent='Sending secure delivery…';
            try{
              const data=await HSMCloud.invokeFunction('send-final-delivery',{projectId,email,deliveryUrl:raw});
              secureUrl=data.portalUrl;resultLink.textContent=secureUrl;status.innerHTML='<span class="ready">Final delivery sent. The client must verify the new six-digit email code before viewing files.</span>';sendBtn.textContent='Final Delivery Sent ✓';copy.style.display='inline-flex';open.style.display='inline-flex';
            }catch(e){status.textContent=e.message||String(e);sendBtn.disabled=false;sendBtn.textContent='Send Final Delivery →'}
          };
          copy.onclick=async()=>{if(secureUrl){await navigator.clipboard.writeText(secureUrl);document.getElementById('status').textContent='Secure final-delivery link copied.'}};
          open.onclick=()=>{if(secureUrl)window.open(secureUrl,'_blank','noopener')};
        }else sendBtn.style.display='inline-flex';
      }
      new MutationObserver(prepareSecureActions).observe(result,{attributes:true,attributeFilter:['class']});
      prepareSecureActions();
    }catch(e){console.warn('High Style final delivery upgrade',e)}
  }
  function injectStyle(){const s=document.createElement('style');s.textContent=`:root{--hsm-gold:#dfc78f}.hsm-final-field small{display:block;color:#68635a;font-size:9px;line-height:1.5}.hsm-final-field select,.hsm-final-field input{border-color:rgba(223,199,143,.18)!important}.hsm-final-field select:focus,.hsm-final-field input:focus{border-color:var(--hsm-gold)!important;box-shadow:0 0 0 1px rgba(223,199,143,.18)!important}#hsmSendFinal{background:var(--hsm-gold)!important;border-color:var(--hsm-gold)!important;color:#11100c!important}#result{border-color:rgba(223,199,143,.24)!important}`;document.head.appendChild(s)}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
