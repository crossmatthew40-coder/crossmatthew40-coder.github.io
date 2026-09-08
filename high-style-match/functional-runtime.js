(function(){
  'use strict';
  const authReady=!!(window.HSM_AUTH&&window.HSM_AUTH.url&&window.HSM_AUTH.anonKey);
  const deliveryReady=!!(window.HSM_DELIVERY&&window.HSM_DELIVERY.apiBase);
  const billingReady=!!(window.HSM_APP&&window.HSM_APP.features&&window.HSM_APP.features.billing);

  if(window.HSM_APP&&window.HSM_APP.features){
    if(!authReady){
      window.HSM_APP.features.customerReview=false;
      window.HSM_APP.features.customerInvites=false;
      window.HSM_APP.features.cloudProjects=false;
      window.HSM_APP.features.adminConsole=false;
    }
    if(!deliveryReady) window.HSM_APP.features.largeFileDelivery=false;
  }

  const replacements=[
    [/WeTransfer deliveries/gi,'High Style Match deliveries'],
    [/WeTransfer delivery/gi,'High Style Match delivery'],
    [/Open WeTransfer/gi,'Open Deliver'],
    [/Configured as the default delivery provider/gi,'High Style Match Deliver'],
    [/WeTransfer/gi,'High Style Match Deliver']
  ];

  function replaceText(root){
    const walker=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT);
    const nodes=[];let n;while((n=walker.nextNode()))nodes.push(n);
    nodes.forEach(node=>{
      if(!node.nodeValue||!node.nodeValue.trim())return;
      let next=node.nodeValue;
      replacements.forEach(([re,to])=>next=next.replace(re,to));
      if(next!==node.nodeValue)node.nodeValue=next;
    });
  }

  function rerouteLegacyDelivery(root){
    (root||document).querySelectorAll('a[href]').forEach(a=>{
      const href=a.getAttribute('href')||'';
      if(/wetransfer\.com/i.test(href)){
        a.setAttribute('href','./transfer/');
        a.removeAttribute('target');
      }
    });
    (root||document).querySelectorAll('button,a').forEach(el=>{
      if(/open deliver|deliver files/i.test((el.textContent||'').trim()) && !el.dataset.hsmDeliverBound){
        el.dataset.hsmDeliverBound='1';
        if(el.tagName==='A') return;
        el.addEventListener('click',e=>{
          if((el.textContent||'').toLowerCase().includes('deliver')){
            const inProject=location.pathname.endsWith('/high-style-match/')||location.pathname.endsWith('/high-style-match/index.html');
            if(!inProject)return;
          }
        });
      }
    });
  }

  function addReadinessCard(){
    if(document.getElementById('hsmRuntimeReadiness'))return;
    const settings=[...document.querySelectorAll('h1,h2')].find(x=>/settings|performance, storage/i.test(x.textContent||''));
    if(!settings)return;
    const host=document.querySelector('.settings-grid')||settings.parentElement?.parentElement;
    if(!host)return;
    const card=document.createElement('section');
    card.id='hsmRuntimeReadiness';
    card.style.cssText='border:1px solid #292929;background:#0b0b0b;padding:16px;color:#fff;grid-column:1/-1';
    const item=(name,ready,copy)=>`<div style="display:grid;grid-template-columns:110px 78px 1fr;gap:10px;padding:8px 0;border-bottom:1px solid #222;font-size:11px"><b>${name}</b><span style="font-weight:800">${ready?'READY':'LOCAL'}</span><span style="color:#999">${copy}</span></div>`;
    card.innerHTML=`<div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#999;margin-bottom:4px">System readiness</div><h2 style="margin:0 0 8px;font-size:18px">What is active on this build</h2>${item('Workflow',true,'Projects, shot lists, Smart Cull, matching, review and rename work locally on this device.')}${item('Desktop tether',true,'Chrome/Edge folder watching is available; native desktop packaging still requires device build testing.')}${item('Mobile Live',true,'Manual mobile import is active. Native iPad background folder monitoring requires the installed iOS build.')}${item('Cloud accounts',authReady,authReady?'Connected.':'Disabled until the public Supabase project settings are added.')}${item('Delivery',deliveryReady,deliveryReady?'Cloud delivery API connected.':'Local workflow remains available; cloud sending activates after the Cloudflare Worker URL is deployed.')}${item('Billing',billingReady,billingReady?'Stripe billing enabled.':'Billing is intentionally disabled; no customer can be charged from this build.')}`;
    host.prepend(card);
  }

  function markUnavailableCloudLinks(){
    if(authReady)return;
    document.querySelectorAll('a[href*="/customer/"],a[href*="/invite/"],a[href*="/admin/"]').forEach(a=>{
      a.setAttribute('title','Cloud accounts are not connected on this build');
      a.dataset.hsmCloudUnavailable='1';
    });
  }

  function addBetaBadge(){
    if(document.getElementById('hsmLocalBadge'))return;
    const top=document.querySelector('.top-actions,.topbar,.brand');if(!top)return;
    const badge=document.createElement('span');badge.id='hsmLocalBadge';badge.textContent=authReady&&deliveryReady?'CONNECTED':'LOCAL WORKFLOW';
    badge.style.cssText='display:inline-flex;align-items:center;border:1px solid #333;background:#111;color:#aaa;padding:5px 7px;font-size:9px;font-weight:800;letter-spacing:.09em;border-radius:3px';
    top.appendChild(badge);
  }

  let scheduled=false;
  function run(){scheduled=false;replaceText(document.body);rerouteLegacyDelivery(document);markUnavailableCloudLinks();addReadinessCard();addBetaBadge()}
  function schedule(){if(scheduled)return;scheduled=true;setTimeout(run,120)}
  function boot(){run();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
