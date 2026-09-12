// High Style Match — local AI Vision refinement for Smart Cull.
(function(){
  'use strict';

  const APP_KEY='hsmPremium1';
  const DB_NAME='hsm-files-v1';
  const DB_STORE='files';
  const AI_VERSION=1;
  const MODEL_ID='HuggingFaceTB/SmolVLM-256M-Instruct';
  const scriptBase=new URL('.',document.currentScript?.src||location.href);
  const WORKER_URL=new URL('ai-vision-worker.js',scriptBase).href;

  let worker=null;
  let modelReady=false;
  let modelLoadPromise=null;
  let modelLoadResolve=null;
  let modelLoadReject=null;
  let running=false;
  let cancelled=false;
  let pending=new Map();
  let statusText='Ready for AI Vision';
  let statusDetail='AI Vision reviews the strongest candidates after the fast local Smart Cull.';
  let statusProgress=null;

  function clamp(n,min=0,max=100){n=Number(n);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):null}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function isMobile(){return matchMedia('(pointer:coarse)').matches&&Math.min(innerWidth,innerHeight)<1000}

  function installStyles(){
    if(document.getElementById('hsmAiVisionStyle'))return;
    const style=document.createElement('style');style.id='hsmAiVisionStyle';style.textContent=`
      .hsm-ai-panel{margin:14px 0 18px;padding:16px 17px;border:1px solid #2b2e34;border-radius:14px;background:linear-gradient(180deg,#121419,#0d0f13);color:#f5f6f8;box-shadow:0 12px 32px rgba(0,0,0,.18)}
      .hsm-ai-top{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.hsm-ai-title{display:flex;align-items:center;gap:9px;font-weight:800;font-size:14px}.hsm-ai-orb{width:22px;height:22px;border:1px solid #5d626d;border-radius:50%;display:grid;place-items:center;font-size:9px;background:#f4f5f7;color:#111318}.hsm-ai-copy{color:#9ca2ad;font-size:11px;line-height:1.5;max-width:720px;margin-top:5px}.hsm-ai-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.hsm-ai-btn{border:1px solid #3a3e46;background:#f4f5f7;color:#111318;border-radius:9px;min-height:34px;padding:7px 11px;font:750 11px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif;cursor:pointer}.hsm-ai-btn.secondary{background:#181b20;color:#f5f6f8}.hsm-ai-btn:disabled{opacity:.45;cursor:not-allowed}.hsm-ai-progress{height:5px;background:#24272d;border-radius:999px;overflow:hidden;margin-top:13px}.hsm-ai-progress i{display:block;height:100%;width:0;background:#f4f5f7;border-radius:inherit;transition:width .2s ease}.hsm-ai-status{display:flex;justify-content:space-between;gap:14px;margin-top:8px;color:#8e949e;font-size:10px}.hsm-ai-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 7px;border-radius:999px;border:1px solid #373b43;background:#111318;color:#cfd2d8;font-size:9px;font-weight:750}.hsm-ai-score-row{border-top:1px solid rgba(255,255,255,.06);padding-top:7px;margin-top:6px}.hsm-ai-card-note{font-size:9px;line-height:1.4;color:#8e949e;margin-top:5px}.hsm-ai-card-badge{display:inline-flex;align-items:center;padding:4px 6px;border-radius:999px;background:#eceef1;color:#15171b;font-size:9px;font-weight:800;margin-right:4px}.hsm-ai-card-badge.dim{background:#25282e;color:#c9cdd3}.hsm-ai-card-badge.match{background:#dce9df;color:#173321}.hsm-ai-model-note{margin-top:9px;color:#737984;font-size:9px;line-height:1.45}.hsm-ai-model-note b{color:#b7bbc2}.hsm-ai-cancel{display:none}.hsm-ai-panel[data-running="1"] .hsm-ai-cancel{display:inline-flex}.hsm-ai-panel[data-running="1"] .hsm-ai-run{display:none}
      @media(max-width:760px){.hsm-ai-top{display:block}.hsm-ai-actions{justify-content:stretch;margin-top:12px}.hsm-ai-btn{flex:1}.hsm-ai-status{display:block}.hsm-ai-status span{display:block;margin-top:3px}}
    `;document.head.appendChild(style);
  }

  function setStatus(title,detail='',progress=null){statusText=title;statusDetail=detail;statusProgress=progress;refreshPanel()}

  function getLiveShoot(){
    try{const s=typeof window.getShoot==='function'?window.getShoot():null;if(s)return s}catch{}
    try{
      const state=JSON.parse(localStorage.getItem(APP_KEY)||'{}');
      const visibleIds=[...document.querySelectorAll('.cull-card [data-pick]')].map(x=>x.dataset.pick).filter(Boolean);
      if(visibleIds.length)return(state.shoots||[]).find(s=>(s.photos||[]).some(p=>visibleIds.includes(String(p.id))))||null;
      return[...(state.shoots||[])].filter(s=>s.cullCompleted).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))[0]||null;
    }catch{return null}
  }

  function persistFallback(shoot){
    try{
      if(typeof window.save==='function'){window.save();return}
      const state=JSON.parse(localStorage.getItem(APP_KEY)||'{}');
      const i=(state.shoots||[]).findIndex(s=>String(s.id)===String(shoot.id));
      if(i>=0){state.shoots[i]=shoot;localStorage.setItem(APP_KEY,JSON.stringify(state))}
    }catch{}
  }

  function openDb(){return new Promise((resolve,reject)=>{try{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE)};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)}catch(err){reject(err)}})}
  async function dbGet(key){if(!key)return null;const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readonly'),q=tx.objectStore(DB_STORE).get(key);q.onsuccess=()=>resolve(q.result||null);q.onerror=()=>reject(q.error);tx.oncomplete=()=>db.close();tx.onerror=()=>db.close()})}

  function cullRank(p){if(p.cullExcluded)return 99;if(p.cullManualPick)return-2;return{pick:0,unique:1,alternate:2,review:3,near:4,exact:5,raw:6}[p.cullStatus]??7}
  function orientationWanted(variant){const v=String(variant||'').toLowerCase();if(v.includes('landscape')||v==='wide'||v.includes('interior')||v.includes('exterior'))return'Landscape';if(v.includes('portrait'))return'Portrait';if(v.includes('square'))return'Square';return null}

  function groupsForShoot(shoot){
    const map=new Map();
    for(const p of(shoot.photos||[]).filter(p=>!p.cullExcluded)){
      const key=p.cullGroup||`solo-${p.id}`;
      if(!map.has(key))map.set(key,[]);map.get(key).push(p);
    }
    return[...map.entries()].map(([id,photos])=>{
      photos.sort((a,b)=>cullRank(a)-cullRank(b)||(b.cullScore||0)-(a.cullScore||0));
      const top=photos[0],second=photos[1];
      const gap=second?Math.abs((top.cullScore||0)-(second.cullScore||0)):100;
      return{id,photos,gap,priority:(photos.length>1?200:0)+(100-Math.min(100,gap))+Math.min(30,photos.length)};
    }).sort((a,b)=>b.priority-a.priority);
  }

  function buildPlan(shoot,force=false){
    const budget=isMobile()?24:60;
    const out=[];
    const groups=groupsForShoot(shoot);
    for(const group of groups){
      const manual=group.photos.find(p=>p.cullManualPick);
      let candidates;
      if(manual)candidates=[manual];
      else if(group.photos.length===1)candidates=[group.photos[0]];
      else{
        candidates=group.photos.slice(0,2);
        if(group.photos.length>2&&group.gap<=6)candidates.push(group.photos[2]);
      }
      for(const p of candidates){
        if(!force&&p.aiVision?.version===AI_VERSION&&p.aiVision?.model===MODEL_ID)continue;
        out.push({photo:p,group});
        if(out.length>=budget)return{items:out,totalRemaining:countRemaining(groups,force),budget};
      }
    }
    return{items:out,totalRemaining:out.length,budget};
  }

  function countRemaining(groups,force=false){let n=0;for(const g of groups){const manual=g.photos.find(p=>p.cullManualPick);const arr=manual?[manual]:g.photos.length===1?[g.photos[0]]:g.photos.slice(0,g.gap<=6?3:2);for(const p of arr)if(force||p.aiVision?.version!==AI_VERSION||p.aiVision?.model!==MODEL_ID)n++}return n}

  function relevantBriefs(photo,shoot){
    const active=(shoot.shots||[]).filter(s=>!s.skip);
    const same=active.filter(s=>!orientationWanted(s.variant)||orientationWanted(s.variant)===photo.orientation);
    const rest=active.filter(s=>!same.includes(s));
    return[...same,...rest].slice(0,36);
  }

  function promptFor(photo,shoot){
    const briefs=relevantBriefs(photo,shoot);
    const list=briefs.length?briefs.map(s=>`${s.id} | ${s.subject||'Untitled'} | ${s.variant||'Any'}${s.notes?` | ${String(s.notes).slice(0,80)}`:''}`).join('\n'):'No shot-list items supplied.';
    return `You are the senior picture editor for a premium hospitality photography shoot. Review ONE photograph visually. Judge the actual subject and presentation, not just technical exposure.\n\nScore 0-100 for:\n- appeal: how strong, appetising or commercially attractive the image feels\n- styling: food/drink/scene styling and readiness\n- framing: composition, crop, subject separation and camera angle\n- clean: absence of distracting objects, messy edges, awkward hands, clutter or obvious visual problems\n- expression: only when people are visible; eye openness, natural expression and usable pose. Use null when no people are visible.\n\nAlso identify the subject and photo type: food, drink, interior, exterior, people, detail, or other.\nChoose the best matching shot-list ID only when the visual content genuinely matches. If none clearly match, use an empty string.\n\nShot-list candidates:\n${list}\n\nReturn ONLY one compact JSON object prefixed exactly with HSM_RESULT=. No markdown. Use this exact shape:\nHSM_RESULT={"subject":"short visual subject","type":"food","appeal":0,"styling":0,"framing":0,"clean":0,"people":false,"expression":null,"briefId":"","briefConfidence":0,"issues":["short issue"],"reason":"one short reason"}`;
  }

  function extractJson(text){
    const raw=String(text||'');let start=-1;
    const marker=raw.lastIndexOf('HSM_RESULT=');
    start=raw.indexOf('{',marker>=0?marker:0);if(start<0)return null;
    let depth=0,inString=false,escapeNext=false,end=-1;
    for(let i=start;i<raw.length;i++){
      const ch=raw[i];
      if(escapeNext){escapeNext=false;continue}
      if(ch==='\\'&&inString){escapeNext=true;continue}
      if(ch==='"'){inString=!inString;continue}
      if(inString)continue;
      if(ch==='{')depth++;
      if(ch==='}'&&--depth===0){end=i+1;break}
    }
    if(end<0)return null;
    try{return JSON.parse(raw.slice(start,end))}catch{return null}
  }

  function normalizeResult(raw,photo,shoot){
    const data=raw&&typeof raw==='object'?raw:{};
    const type=['food','drink','interior','exterior','people','detail','other'].includes(String(data.type||'').toLowerCase())?String(data.type).toLowerCase():'other';
    const people=data.people===true||type==='people';
    let briefId=String(data.briefId||'').trim();
    if(!(shoot.shots||[]).some(s=>String(s.id)===briefId))briefId='';
    const result={
      version:AI_VERSION,model:MODEL_ID,at:Date.now(),subject:String(data.subject||'').trim().slice(0,90),type,
      appeal:clamp(data.appeal)??50,styling:clamp(data.styling)??50,framing:clamp(data.framing)??50,clean:clamp(data.clean)??50,
      people,expression:people?(clamp(data.expression)??50):null,briefId,briefConfidence:briefId?(clamp(data.briefConfidence)??0):0,
      issues:Array.isArray(data.issues)?data.issues.map(x=>String(x).trim()).filter(Boolean).slice(0,4):[],reason:String(data.reason||'').trim().slice(0,180)
    };
    const visual=people?.30*result.appeal+.18*result.styling+.18*result.framing+.16*result.clean+.18*result.expression:.34*result.appeal+.26*result.styling+.22*result.framing+.18*result.clean;
    result.score=Math.round(visual);
    result.combined=Math.round(.42*(Number.isFinite(photo.cullScore)?photo.cullScore:50)+.58*result.score);
    return result;
  }

  function ensureWorker(){
    if(worker)return worker;
    worker=new Worker(WORKER_URL,{type:'module'});
    worker.addEventListener('message',event=>{
      const msg=event.data||{};
      if(msg.status==='model-progress'||msg.status==='model-loading'){
        setStatus(msg.message||'Loading AI Vision model…','The first run downloads the local model. Your photographs stay on this device.',Number.isFinite(msg.progress)?msg.progress:null);
      }else if(msg.status==='model-ready'){
        modelReady=true;if(modelLoadResolve)modelLoadResolve();modelLoadPromise=null;modelLoadResolve=modelLoadReject=null;
      }else if(msg.status==='analysis-complete'){
        const item=pending.get(String(msg.id));if(item){pending.delete(String(msg.id));item.resolve(msg.output||'')}
      }else if(msg.status==='error'){
        const item=msg.id?pending.get(String(msg.id)):null;
        if(item){pending.delete(String(msg.id));item.reject(new Error(msg.message||'AI analysis failed'))}
        else if(modelLoadReject){modelLoadReject(new Error(msg.message||'AI model failed to load'));modelLoadPromise=null;modelLoadResolve=modelLoadReject=null}
        else setStatus('AI Vision unavailable',msg.message||'The local AI model could not run on this device.');
      }
    });
    worker.addEventListener('error',event=>{
      const err=new Error(event.message||'AI worker failed');
      for(const item of pending.values())item.reject(err);pending.clear();
      if(modelLoadReject)modelLoadReject(err);modelLoadPromise=null;modelLoadResolve=modelLoadReject=null;
      setStatus('AI Vision unavailable',err.message);
    });
    return worker;
  }

  function loadModel(){
    if(modelReady)return Promise.resolve();if(modelLoadPromise)return modelLoadPromise;
    ensureWorker();modelLoadPromise=new Promise((resolve,reject)=>{modelLoadResolve=resolve;modelLoadReject=reject});
    worker.postMessage({type:'load'});return modelLoadPromise;
  }

  function analyseWithWorker(photo,blob,prompt){
    return new Promise((resolve,reject)=>{
      const id=String(photo.id);pending.set(id,{resolve,reject});
      worker.postMessage({type:'analyse',data:{id,blob,prompt}});
    });
  }

  function applyAiRanking(shoot){
    let changed=0;
    for(const group of groupsForShoot(shoot)){
      const manual=group.photos.find(p=>p.cullManualPick);
      if(manual)continue;
      const analysed=group.photos.filter(p=>p.aiVision?.version===AI_VERSION&&Number.isFinite(p.aiVision.combined));
      if(!analysed.length)continue;
      analysed.sort((a,b)=>b.aiVision.combined-a.aiVision.combined||(b.cullScore||0)-(a.cullScore||0));
      const chosen=analysed[0];
      const old=group.photos.find(p=>p.cullStatus==='pick'||p.cullStatus==='unique');
      if(old&&old!==chosen&&group.photos.length>1)changed++;
      if(group.photos.length===1){chosen.cullStatus='unique';continue}
      for(const p of group.photos){
        if(p===chosen)p.cullStatus='pick';
        else if(p.cullStatus==='pick'||p.cullStatus==='unique')p.cullStatus='alternate';
      }
    }
    shoot.cullSummary=shoot.cullSummary||{};
    shoot.cullSummary.best=(shoot.photos||[]).filter(p=>p.cullManualPick||p.cullStatus==='pick'||p.cullStatus==='unique').length;
    shoot.cullSummary.aiAnalysed=(shoot.photos||[]).filter(p=>p.aiVision?.version===AI_VERSION).length;
    shoot.cullSummary.aiChangedPicks=(shoot.cullSummary.aiChangedPicks||0)+changed;
    shoot.cullSummary.aiAt=Date.now();
    return changed;
  }

  function preassignAiMatches(shoot){
    if(!shoot?.shots?.length)return 0;
    const used=new Set((shoot.photos||[]).map(p=>p.shotId).filter(Boolean).map(String));
    const candidates=(shoot.photos||[]).filter(p=>!p.cullExcluded&&(p.cullManualPick||p.cullStatus==='pick'||p.cullStatus==='unique')&&p.aiVision?.briefId&&p.aiVision.briefConfidence>=72)
      .sort((a,b)=>(b.aiVision.briefConfidence||0)-(a.aiVision.briefConfidence||0));
    let n=0;
    for(const p of candidates){
      const id=String(p.aiVision.briefId);const shot=shoot.shots.find(s=>String(s.id)===id&&!s.skip);if(!shot||used.has(id)||p.shotId)continue;
      p.shotId=shot.id;p.suggestedShotId=shot.id;p.matchConfidence=p.aiVision.briefConfidence;p.matchReason=`AI Vision · ${p.aiVision.subject||p.aiVision.type||'visual match'} · ${p.aiVision.briefConfidence}%`;used.add(id);n++;
    }
    if(n){shoot.reviewApproved=false;shoot.renameOverrides={};persistFallback(shoot)}
    return n;
  }

  function patchBriefMatch(){
    if(window.__hsmAiAutoMatchPatched||typeof window.autoMatch!=='function')return;
    const original=window.autoMatch;window.__hsmAiAutoMatchPatched=true;window.__hsmAiOriginalAutoMatch=original;
    window.autoMatch=function(shoot,reset=false){if(!reset)preassignAiMatches(shoot);return original(shoot,reset)};
  }

  async function runAi(force=false){
    if(running)return;const shoot=getLiveShoot();
    if(!shoot||!shoot.cullCompleted)return setStatus('Run Smart Cull first','AI Vision is a second pass that refines the Smart Cull results.');
    if(!navigator.gpu)return setStatus('AI Vision needs WebGPU','This browser/device cannot run the local vision model. The normal Smart Cull still works.');
    const plan=buildPlan(shoot,force);
    if(!plan.items.length)return setStatus('AI Vision is up to date',`${(shoot.photos||[]).filter(p=>p.aiVision?.version===AI_VERSION).length} candidate photographs have already been reviewed.`);

    running=true;cancelled=false;refreshPanel();
    try{
      setStatus('Preparing AI Vision','Loading the local vision model. Your photographs are not uploaded to an AI service.',null);
      await loadModel();if(cancelled)return;
      let done=0,errors=0;
      for(const item of plan.items){
        if(cancelled)break;const p=item.photo;
        setStatus(`AI reviewing ${done+1} of ${plan.items.length}`,p.name||'Photograph',Math.round(done/plan.items.length*100));
        let blob=null;
        try{blob=await dbGet(p.previewKey||p.fileKey)}catch{}
        if(!(blob instanceof Blob)){errors++;p.aiVisionError='Preview unavailable';continue}
        try{
          const output=await analyseWithWorker(p,blob,promptFor(p,shoot));if(cancelled)break;
          const parsed=extractJson(output);
          if(!parsed)throw new Error('AI returned an unreadable result');
          p.aiVision=normalizeResult(parsed,p,shoot);p.aiVisionError=null;
          if(p.aiVision.briefId){p.suggestedShotId=p.aiVision.briefId;p.aiMatchConfidence=p.aiVision.briefConfidence}
          done++;if(done%3===0)persistFallback(shoot);
        }catch(err){errors++;p.aiVisionError=err?.message||String(err)}
      }
      const changed=applyAiRanking(shoot);
      shoot.aiVision={version:AI_VERSION,model:MODEL_ID,lastRun:Date.now(),analysed:(shoot.photos||[]).filter(p=>p.aiVision?.version===AI_VERSION).length,changedPicks:changed};
      persistFallback(shoot);
      if(typeof window.renderWorkspace==='function')window.renderWorkspace();
      const remaining=buildPlan(shoot,false).items.length;
      const msg=cancelled?'AI Vision stopped.':'AI Vision complete.';
      setStatus(msg,`${done} reviewed in this pass${changed?` · ${changed} Best Pick${changed===1?'':'s'} changed`:''}${errors?` · ${errors} needed review`:''}${remaining?' · run again to continue through more candidates':''}`,100);
    }catch(err){setStatus('AI Vision could not start',err?.message||String(err));}
    finally{running=false;refreshPanel()}
  }

  function cancelAi(){
    if(!running)return;cancelled=true;
    for(const item of pending.values())item.reject(new Error('AI Vision stopped'));pending.clear();
    try{worker?.terminate()}catch{}worker=null;modelReady=false;modelLoadPromise=null;modelLoadResolve=modelLoadReject=null;
    setStatus('Stopping AI Vision','Completed AI reviews have been kept.');
  }

  function panelMarkup(shoot){
    const reviewed=(shoot?.photos||[]).filter(p=>p.aiVision?.version===AI_VERSION).length;
    const matches=(shoot?.photos||[]).filter(p=>p.aiVision?.briefId&&p.aiVision.briefConfidence>=72).length;
    const changed=shoot?.cullSummary?.aiChangedPicks||0;
    return `<div class="hsm-ai-top"><div><div class="hsm-ai-title"><span class="hsm-ai-orb">AI</span><span>AI Vision · Local picture editor</span>${reviewed?`<span class="hsm-ai-chip">${reviewed} reviewed</span>`:''}</div><div class="hsm-ai-copy">Understands the actual frame — subject, food/drink styling, commercial appeal, composition, distractions and people — then combines that judgement with Smart Cull's technical score and shot list.</div></div><div class="hsm-ai-actions"><button type="button" class="hsm-ai-btn hsm-ai-run" data-hsm-ai-run>${reviewed?'Continue AI Vision':'Run AI Vision'}</button><button type="button" class="hsm-ai-btn secondary hsm-ai-cancel" data-hsm-ai-cancel>Stop</button></div></div><div class="hsm-ai-progress"><i style="width:${statusProgress==null?0:Math.max(0,Math.min(100,statusProgress))}%"></i></div><div class="hsm-ai-status"><span><b>${esc(statusText)}</b> · ${esc(statusDetail)}</span><span>${matches?`${matches} brief suggestion${matches===1?'':'s'}`:''}${matches&&changed?' · ':''}${changed?`${changed} AI pick change${changed===1?'':'s'}`:''}</span></div><div class="hsm-ai-model-note"><b>Private by default:</b> the model runs with WebGPU in this browser. The first run downloads model weights; shoot photographs remain local. AI scores are recommendations and manual picks always win.</div>`;
  }

  function refreshPanel(){
    const panel=document.querySelector('.hsm-ai-panel');if(!panel)return;const shoot=getLiveShoot();panel.dataset.running=running?'1':'0';panel.innerHTML=panelMarkup(shoot);wirePanel(panel);
  }
  function wirePanel(panel){panel.querySelector('[data-hsm-ai-run]')?.addEventListener('click',()=>runAi(false));panel.querySelector('[data-hsm-ai-cancel]')?.addEventListener('click',cancelAi)}

  function addPanel(){
    const toolbar=document.querySelector('.cull-toolbar'),hero=document.querySelector('.smart-cull-hero');if(!toolbar||!hero)return;
    if(!document.querySelector('.hsm-ai-panel')){const panel=document.createElement('div');panel.className='hsm-ai-panel';panel.dataset.running=running?'1':'0';panel.innerHTML=panelMarkup(getLiveShoot());hero.insertAdjacentElement('afterend',panel);wirePanel(panel)}
  }

  function decorateCards(){
    const shoot=getLiveShoot();if(!shoot)return;const byId=new Map((shoot.photos||[]).map(p=>[String(p.id),p]));
    document.querySelectorAll('.cull-card').forEach(card=>{
      const id=card.querySelector('[data-pick]')?.dataset.pick;if(!id)return;const p=byId.get(String(id));if(!p?.aiVision)return;
      const badges=card.querySelector('.cull-badges');if(badges&&!badges.querySelector('.hsm-ai-card-badge')){
        const ai=document.createElement('span');ai.className='hsm-ai-card-badge';ai.textContent=`AI ${p.aiVision.score}/100`;badges.appendChild(ai);
        if(p.aiVision.subject){const subject=document.createElement('span');subject.className='hsm-ai-card-badge dim';subject.textContent=p.aiVision.subject;badges.appendChild(subject)}
        if(p.aiVision.briefId&&p.aiVision.briefConfidence>=60){const shot=(shoot.shots||[]).find(s=>String(s.id)===String(p.aiVision.briefId));if(shot){const match=document.createElement('span');match.className='hsm-ai-card-badge match';match.textContent=`${shot.subject} ${p.aiVision.briefConfidence}%`;badges.appendChild(match)}}
      }
      const scores=card.querySelector('.visual-score');if(scores&&!scores.querySelector('.hsm-ai-score-row')){const row=document.createElement('div');row.className='hsm-ai-score-row';row.innerHTML=`<span>AI Vision</span><b>${p.aiVision.combined}/100</b>`;scores.appendChild(row)}
      const body=card.querySelector('.photo-body');if(body&&!body.querySelector('.hsm-ai-card-note')&&(p.aiVision.reason||p.aiVision.issues?.length)){const note=document.createElement('div');note.className='hsm-ai-card-note';note.textContent=[p.aiVision.reason,...(p.aiVision.issues||[])].filter(Boolean).join(' · ');body.appendChild(note)}
    })
  }

  function enhance(){patchBriefMatch();addPanel();decorateCards()}

  function boot(){installStyles();enhance();const observer=new MutationObserver(()=>requestAnimationFrame(enhance));observer.observe(document.body,{childList:true,subtree:true});window.HSMAIVision={run:()=>runAi(false),rerun:()=>runAi(true),stop:cancelAi,preassignAiMatches}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
