// High Style Match — Adobe handoff for Smart Cull Best Picks.
(function(){
  'use strict';

  const APP_KEY='hsmPremium1';
  const DB_NAME='hsm-files-v1';
  const DB_STORE='files';
  const URLS={
    lightroom:'https://lightroom.adobe.com/',
    photoshop:'https://photoshop.adobe.com/'
  };
  const LABELS={lightroom:'Lightroom',photoshop:'Photoshop'};
  let busy=false;

  function installStyles(){
    if(document.getElementById('hsmAdobeActionsStyle')) return;
    const style=document.createElement('style');
    style.id='hsmAdobeActionsStyle';
    style.textContent=`
      .hsm-adobe-actions{display:flex;gap:7px;flex-wrap:wrap;width:100%;margin-top:6px}
      .hsm-adobe-btn{appearance:none;border:1px solid #343840;background:#17191e;color:#f7f7f8;border-radius:9px;min-height:34px;padding:7px 11px;font:700 11px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif;display:inline-flex;align-items:center;gap:7px;text-decoration:none;transition:transform .15s ease,background .15s ease,border-color .15s ease;cursor:pointer}
      .hsm-adobe-btn:hover{background:#202329;border-color:#464b55;transform:translateY(-1px)}
      .hsm-adobe-btn:active{transform:translateY(0)}
      .hsm-adobe-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
      .hsm-adobe-icon{width:20px;height:20px;border-radius:6px;display:grid;place-items:center;font-weight:850;font-size:10px;line-height:1;background:#f1f3f5;color:#111318}
      .hsm-adobe-btn[data-adobe-app="photoshop"] .hsm-adobe-icon{background:#e7f4ff;color:#0d2940}
      .hsm-adobe-note{width:100%;font-size:10px;line-height:1.35;color:#777d87;margin-top:1px}
      .hsm-adobe-bulk{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-left:auto}
      .hsm-adobe-bulk .hsm-adobe-btn{min-height:32px;padding:6px 10px}
      .hsm-adobe-status{position:fixed;right:16px;bottom:16px;z-index:100000;max-width:min(440px,calc(100vw - 32px));padding:11px 13px;border:1px solid #343840;border-radius:12px;background:#111318;color:#f4f5f7;box-shadow:0 16px 44px rgba(0,0,0,.34);font:650 12px/1.45 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif}
      @media(max-width:760px){.hsm-adobe-bulk{width:100%;margin-left:0}.hsm-adobe-bulk .hsm-adobe-btn{flex:1}.hsm-adobe-actions .hsm-adobe-btn{flex:1}}
    `;
    document.head.appendChild(style);
  }

  function status(message,ms=4200){
    let el=document.getElementById('hsmAdobeStatus');
    if(!el){el=document.createElement('div');el.id='hsmAdobeStatus';el.className='hsm-adobe-status';document.body.appendChild(el)}
    el.textContent=message;el.hidden=false;
    clearTimeout(status.timer);status.timer=setTimeout(()=>{el.hidden=true},ms);
  }

  function readState(){try{return JSON.parse(localStorage.getItem(APP_KEY)||'{}')}catch{return{}}}

  function findPhoto(id){
    const state=readState();
    for(const shoot of (state.shoots||[])){
      const photo=(shoot.photos||[]).find(p=>String(p.id)===String(id));
      if(photo) return {shoot,photo};
    }
    return null;
  }

  function currentBestIds(){
    const ids=[];
    document.querySelectorAll('.cull-card').forEach(card=>{
      if(!card.querySelector('.cull-badge.pick')) return;
      const trigger=card.querySelector('[data-pick]');
      if(trigger?.dataset.pick) ids.push(trigger.dataset.pick);
    });
    return [...new Set(ids)];
  }

  function openDb(){
    return new Promise((resolve,reject)=>{
      try{
        const req=indexedDB.open(DB_NAME,1);
        req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE)};
        req.onsuccess=()=>resolve(req.result);
        req.onerror=()=>reject(req.error);
      }catch(err){reject(err)}
    });
  }

  async function dbGet(key){
    if(!key) return null;
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(DB_STORE,'readonly');
      const q=tx.objectStore(DB_STORE).get(key);
      q.onsuccess=()=>resolve(q.result||null);
      q.onerror=()=>reject(q.error);
      tx.oncomplete=()=>db.close();tx.onerror=()=>db.close();
    });
  }

  function mimeFor(name,blob){
    if(blob?.type) return blob.type;
    const ext=String(name||'').split('.').pop().toLowerCase();
    return ({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',heic:'image/heic',dng:'image/x-adobe-dng',tif:'image/tiff',tiff:'image/tiff'})[ext]||'application/octet-stream';
  }

  async function filesForIds(ids){
    const files=[];const missing=[];
    for(const id of ids){
      const hit=findPhoto(id);
      if(!hit){missing.push(id);continue}
      const {shoot,photo}=hit;
      const blob=await dbGet(photo.fileKey||`${shoot.id}:${photo.id}`);
      if(!(blob instanceof Blob)){missing.push(photo.name||id);continue}
      try{files.push(new File([blob],photo.name||`${photo.id}.jpg`,{type:mimeFor(photo.name,blob),lastModified:photo.lastModified||Date.now()}))}
      catch{blob.name=photo.name||`${photo.id}.jpg`;files.push(blob)}
    }
    return {files,missing};
  }

  function canNativeShare(files){
    try{return !!(navigator.share&&navigator.canShare&&navigator.canShare({files}))}catch{return false}
  }

  async function shareFiles(files,target){
    if(!canNativeShare(files)) return false;
    await navigator.share({
      files,
      title:`High Style Match — Best Picks for ${LABELS[target]}`,
      text:`Open these ${files.length} Best Pick${files.length===1?'':'s'} in Adobe ${LABELS[target]}.`
    });
    return true;
  }

  function safeFolderName(v){return String(v||'Best Picks').replace(/[\\/:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim().slice(0,80)||'Best Picks'}

  async function saveToFolder(files,target){
    if(!globalThis.showDirectoryPicker) return null;
    const root=await showDirectoryPicker({mode:'readwrite'});
    const folder=await root.getDirectoryHandle(`High Style Match - ${LABELS[target]} Best Picks`,{create:true});
    for(const file of files){
      const handle=await folder.getFileHandle(safeFolderName(file.name),{create:true});
      const writer=await handle.createWritable();
      await writer.write(file);await writer.close();
    }
    return folder;
  }

  async function downloadFallback(files){
    for(let i=0;i<files.length;i++){
      const file=files[i],url=URL.createObjectURL(file),a=document.createElement('a');
      a.href=url;a.download=file.name||`best-pick-${i+1}`;a.style.display='none';document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),30000);
      if(i<files.length-1) await new Promise(r=>setTimeout(r,180));
    }
  }

  async function handoff(ids,target){
    if(busy) return status('A Best Picks handoff is already running.');
    ids=[...new Set((ids||[]).filter(Boolean))];
    if(!ids.length) return status('No Best Picks are available yet. Run Smart Cull or mark your picks first.');
    busy=true;setBusy(true);
    try{
      status(`Preparing ${ids.length} Best Pick${ids.length===1?'':'s'} for ${LABELS[target]}…`,12000);
      const {files,missing}=await filesForIds(ids);
      if(!files.length) throw new Error('The original Best Pick files are not available on this device. Re-import the shoot files first.');

      try{
        if(await shareFiles(files,target)){
          status(`${files.length} Best Pick${files.length===1?'':'s'} sent to the device share sheet. Choose Adobe ${LABELS[target]} to import them.`);
          return;
        }
      }catch(err){if(err?.name==='AbortError') return;}

      try{
        const folder=await saveToFolder(files,target);
        if(folder){
          window.open(URLS[target],'_blank','noopener,noreferrer');
          status(`${files.length} Best Pick${files.length===1?'':'s'} copied into “High Style Match - ${LABELS[target]} Best Picks”. ${target==='lightroom'?'Import that folder in Lightroom; Lightroom Classic can use it as an Auto Import watched folder.':'Open that folder from Photoshop to load the selected files.'}`,9000);
          return;
        }
      }catch(err){if(err?.name==='AbortError') return;}

      await downloadFallback(files);
      window.open(URLS[target],'_blank','noopener,noreferrer');
      status(`${files.length} Best Pick${files.length===1?'':'s'} downloaded for ${LABELS[target]}.${missing.length?` ${missing.length} local file${missing.length===1?' was':'s were'} unavailable.`:''} Import the downloaded files into Adobe.`,8000);
    }catch(err){
      console.warn('Adobe handoff failed',err);
      status(err?.message||'The Adobe handoff could not be completed.',8000);
    }finally{busy=false;setBusy(false)}
  }

  function setBusy(on){document.querySelectorAll('[data-hsm-adobe-send]').forEach(b=>b.disabled=!!on)}

  function addCardButtons(){
    document.querySelectorAll('.cull-card').forEach(card=>{
      const isBest=!!card.querySelector('.cull-badge.pick');
      const actions=card.querySelector('.cull-actions');
      const pick=card.querySelector('[data-pick]')?.dataset.pick;
      if(!isBest||!actions||!pick||actions.querySelector('.hsm-adobe-actions')) return;
      const wrap=document.createElement('div');wrap.className='hsm-adobe-actions';
      wrap.innerHTML=`
        <button type="button" class="hsm-adobe-btn" data-hsm-adobe-send="lightroom" data-photo-id="${pick}"><span class="hsm-adobe-icon">Lr</span>Send to Lightroom</button>
        <button type="button" class="hsm-adobe-btn" data-hsm-adobe-send="photoshop" data-photo-id="${pick}"><span class="hsm-adobe-icon">Ps</span>Send to Photoshop</button>`;
      actions.appendChild(wrap);
    });
  }

  function addBulkButtons(){
    const toolbar=document.querySelector('.cull-toolbar');
    if(!toolbar||toolbar.querySelector('.hsm-adobe-bulk')) return;
    const ids=currentBestIds();
    if(!ids.length) return;
    const wrap=document.createElement('div');wrap.className='hsm-adobe-bulk';
    wrap.innerHTML=`
      <button type="button" class="hsm-adobe-btn" data-hsm-adobe-send="lightroom" data-all-best="1"><span class="hsm-adobe-icon">Lr</span>All Best → Lightroom</button>
      <button type="button" class="hsm-adobe-btn" data-hsm-adobe-send="photoshop" data-all-best="1"><span class="hsm-adobe-icon">Ps</span>All Best → Photoshop</button>`;
    toolbar.appendChild(wrap);
  }

  function addButtons(){addCardButtons();addBulkButtons()}

  function onClick(e){
    const button=e.target.closest('[data-hsm-adobe-send]');
    if(!button) return;
    e.preventDefault();e.stopPropagation();
    const target=button.dataset.hsmAdobeSend;
    const ids=button.dataset.allBest?currentBestIds():[button.dataset.photoId];
    handoff(ids,target);
  }

  function boot(){
    installStyles();addButtons();document.addEventListener('click',onClick,true);
    const observer=new MutationObserver(()=>requestAnimationFrame(addButtons));
    observer.observe(document.body,{childList:true,subtree:true});
    window.HSMAdobeActions={sendBestToLightroom:()=>handoff(currentBestIds(),'lightroom'),sendBestToPhotoshop:()=>handoff(currentBestIds(),'photoshop')};
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
