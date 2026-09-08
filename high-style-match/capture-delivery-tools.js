(function(){
  function loadRuntime(){
    if(document.querySelector('script[data-hsm-functional-runtime]'))return;
    const s=document.createElement('script');
    s.src='./functional-runtime.js?v=20260908-1';
    s.defer=true;
    s.dataset.hsmFunctionalRuntime='true';
    document.head.appendChild(s);
  }
  let scheduled=false;
  function run(){
    scheduled=false;
    const host=document.querySelector('.content');if(!host)return;
    if(document.querySelector('.hsm-c1-tools'))return;
    const box=document.createElement('section');box.className='hsm-c1-tools';
    box.style.cssText='margin:0 0 18px;padding:12px 14px;border:1px solid #2A2E39;background:#0D0F15;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap';
    box.innerHTML='<div><strong style="display:block;font-size:13px">Shoot to client delivery</strong><span style="display:block;color:#8F95A1;font-size:11px;margin-top:3px">Desktop tether · iPad Mobile Live · Smart Cull · resumable delivery · view and download tracking.</span></div><div style="display:flex;gap:8px;flex-wrap:wrap"><a href="./capture-one/" style="text-decoration:none;background:#171A22;color:#fff;border:1px solid #303542;padding:9px 11px;font-weight:800;font-size:11px">Desktop capture</a><a href="./mobile-live/" style="text-decoration:none;background:#171A22;color:#fff;border:1px solid #303542;padding:9px 11px;font-weight:800;font-size:11px">Mobile Live</a><a href="./transfer/" style="text-decoration:none;background:#fff;color:#000;border:1px solid #fff;padding:9px 11px;font-weight:800;font-size:11px">Deliver files</a></div>';
    host.prepend(box)
  }
  function schedule(){if(scheduled)return;scheduled=true;setTimeout(run,350)}
  function boot(){loadRuntime();run();const host=document.querySelector('.content');if(host)new MutationObserver(schedule).observe(host,{childList:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot()
})();
