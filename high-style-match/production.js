// High Style Match production runtime: offline status, metadata sync, preview sync and client-side monitoring.
(function(){
  'use strict';
  const APP_KEY='hsmPremium1';
  const DB_NAME='hsm-files-v1';
  const DB_STORE='files';
  let syncing=false;

  function cfg(){return window.HSM_APP||{sync:{intervalMs:60000,previewBatchSize:8,maxPreviewBytes:3000000},monitoring:{enabled:true}}}
  function cloudReady(){return !!window.HSMCloud?.configured?.()}
  function getState(){try{return JSON.parse(localStorage.getItem(APP_KEY)||'{}')}catch{return{}}}
  function stableHash(value){
    const str=JSON.stringify(value||{});let h=2166136261;
    for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}
    return (h>>>0).toString(36);
  }

  function addNetworkBadge(){
    if(document.getElementById('hsmNetworkBadge')) return;
    const el=document.createElement('div');el.id='hsmNetworkBadge';
    el.style.cssText='position:fixed;right:14px;bottom:14px;z-index:99999;padding:7px 10px;border:1px solid #333;border-radius:999px;background:#0b0b0b;color:#fff;font:700 11px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;display:none;box-shadow:0 8px 24px rgba(0,0,0,.3)';
    document.body.appendChild(el);
    const update=()=>{el.textContent=navigator.onLine?'Online':'Offline — changes stay on this device';el.style.display=navigator.onLine?'none':'block'};
    addEventListener('online',()=>{update();window.HSMCloud?.flushQueue?.().catch(()=>{});syncAll().catch(()=>{})});
    addEventListener('offline',update);update();
  }

  function openFileDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME);
      req.onerror=()=>reject(req.error);
      req.onsuccess=()=>resolve(req.result);
    });
  }
  async function dbGet(key){
    if(!key) return null;
    const db=await openFileDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(DB_STORE,'readonly');
      const req=tx.objectStore(DB_STORE).get(key);
      req.onerror=()=>reject(req.error);req.onsuccess=()=>resolve(req.result||null);
      tx.oncomplete=()=>db.close();tx.onerror=()=>db.close();
    });
  }

  async function syncPreviews(shoot,remoteProjectId){
    const maxCount=cfg().sync?.previewBatchSize||8;
    const maxBytes=cfg().sync?.maxPreviewBytes||3000000;
    const hashes=window.HSMCloud.getHashes();
    let count=0;
    for(const p of (shoot.photos||[])){
      if(count>=maxCount) break;
      if(!p.previewKey||!p.id) continue;
      const k=`preview:${shoot.id}:${p.id}`;
      const signature=`${p.lastModified||0}:${p.size||0}`;
      if(hashes[k]===signature) continue;
      try{
        const blob=await dbGet(p.previewKey);
        if(!(blob instanceof Blob)||blob.size>maxBytes) continue;
        await window.HSMCloud.uploadPreview(remoteProjectId,p.id,blob,p.name||'preview.jpg');
        hashes[k]=signature;count++;
      }catch(e){console.warn('HSM preview sync skipped',e)}
    }
    window.HSMCloud.setHashes(hashes);
    return count;
  }

  async function syncShoot(shoot){
    if(!cloudReady()) return null;
    const hashes=window.HSMCloud.getHashes();
    const syncShape={
      id:shoot.id,name:shoot.name,client:shoot.client,date:shoot.date,location:shoot.location,
      reviewApproved:shoot.reviewApproved,delivery:shoot.delivery,
      shots:(shoot.shots||[]).map(s=>({id:s.id,subject:s.subject,variant:s.variant,notes:s.notes,skip:s.skip,state:s.state})),
      photos:(shoot.photos||[]).map(p=>({id:p.id,name:p.name,shotId:p.shotId,orientation:p.orientation,width:p.width,height:p.height,size:p.size,lastModified:p.lastModified,captureAt:p.captureAt,cullExcluded:p.cullExcluded,cullManualPick:p.cullManualPick,needsReconnect:p.needsReconnect}))
    };
    const signature=stableHash(syncShape);
    const key=`shoot:${shoot.id}`;
    let remote=null;
    if(hashes[key]!==signature){
      if(!navigator.onLine){window.HSMCloud.enqueue({type:'sync_project',payload:shoot});return null}
      remote=await window.HSMCloud.syncLocalShoot(shoot);
      hashes[key]=signature;window.HSMCloud.setHashes(hashes);
    }else{
      try{
        const projects=await window.HSMCloud.listProjects();
        remote=projects.find(p=>String(p.local_project_id)===String(shoot.id))||null;
      }catch{}
    }
    if(remote) await syncPreviews(shoot,remote.id);
    return remote;
  }

  async function syncAll(){
    if(syncing||!navigator.onLine||!cloudReady()) return;
    syncing=true;
    try{
      const session=await window.HSMCloud.getSession();if(!session) return;
      await window.HSMCloud.flushQueue();
      const state=getState();
      for(const shoot of (state.shoots||[])) await syncShoot(shoot);
    }catch(e){console.warn('HSM cloud sync failed',e)}finally{syncing=false}
  }

  function installMonitoring(){
    if(!cfg().monitoring?.enabled) return;
    addEventListener('error',event=>{
      const err=event.error||{};
      window.HSMCloud?.logClientError?.(event.message||err.message||'Unhandled error',{stack:err.stack||null,source:event.filename||null,line:event.lineno||null,column:event.colno||null}).catch(()=>{});
    });
    addEventListener('unhandledrejection',event=>{
      const r=event.reason;
      window.HSMCloud?.logClientError?.(r?.message||String(r||'Unhandled promise rejection'),{stack:r?.stack||null,type:'unhandledrejection'}).catch(()=>{});
    });
  }

  async function registerServiceWorker(){
    if(!('serviceWorker' in navigator)) return;
    try{
      await navigator.serviceWorker.register('/high-style-match/sw.js',{
        scope:'/high-style-match/',
        updateViaCache:'none'
      });
    }catch(e){console.warn('HSM service worker registration failed',e)}
  }

  function boot(){
    addNetworkBadge();installMonitoring();
    const delay=Math.max(15000,cfg().sync?.intervalMs||60000);
    setTimeout(()=>syncAll(),2500);
    setInterval(()=>syncAll(),delay);
  }

  window.HSMProduction={syncAll,syncShoot,syncPreviews,registerServiceWorker};

  // Start the fast shell cache immediately instead of waiting for DOMContentLoaded.
  registerServiceWorker();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
