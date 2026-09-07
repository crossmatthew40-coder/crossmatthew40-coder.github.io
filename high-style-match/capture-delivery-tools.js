(function(){
  let scheduled=false;
  function run(){
    scheduled=false;
    if(document.querySelector('.hsm-c1-tools'))return;
    const host=document.querySelector('.content');if(!host)return;
    const box=document.createElement('section');box.className='hsm-c1-tools';
    box.style.cssText='margin:0 0 18px;padding:12px 14px;border:1px solid #2A2E39;background:#0D0F15;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap';
    box.innerHTML='<div><strong style="display:block;font-size:13px">Shoot to client delivery</strong><span style="display:block;color:#8F95A1;font-size:11px;margin-top:3px">Capture workflow · resumable large-file uploads · private client links · view and download tracking.</span></div><div style="display:flex;gap:8px;flex-wrap:wrap"><a href="./capture-one/" style="text-decoration:none;background:#171A22;color:#fff;border:1px solid #303542;padding:9px 11px;font-weight:800;font-size:11px">Capture workflow</a><a href="./transfer/" style="text-decoration:none;background:#fff;color:#000;border:1px solid #fff;padding:9px 11px;font-weight:800;font-size:11px">Deliver files</a></div>';
    host.prepend(box)
  }
  function schedule(){if(scheduled)return;scheduled=true;setTimeout(run,350)}
  function boot(){run();const host=document.querySelector('.content');if(host)new MutationObserver(schedule).observe(host,{childList:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot()
})();
