// Enforces account type on protected High Style Match web workspaces.
(async function(){
  'use strict';
  const path=location.pathname;
  const expected=path.includes('/customer/')?'customer':path.includes('/admin/')?'admin':null;
  if(!expected) return;
  if(!(window.HSM_AUTH?.url&&window.HSM_AUTH?.anonKey)) return; // deployment not connected yet
  try{
    if(!window.HSMAuthRouter){
      await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/high-style-match/auth-router.js?v=20260908-1';s.onload=resolve;s.onerror=()=>reject(new Error('Account router failed to load'));document.head.appendChild(s)});
    }
    const ctx=await HSMAuthRouter.context();
    if(!ctx){location.replace('/high-style-match/sign-in/?role='+(expected==='customer'?'customer':'photographer')+'&returnTo='+encodeURIComponent(path+location.search));return}
    const role=ctx.profile?.role||'customer';
    if(expected==='customer'&&role!=='customer'){location.replace(HSMAuthRouter.homeForRole(role));return}
    if(expected==='admin'&&role!=='admin'){location.replace(HSMAuthRouter.homeForRole(role));return}
  }catch(e){console.warn('HSM role guard',e)}
})();
