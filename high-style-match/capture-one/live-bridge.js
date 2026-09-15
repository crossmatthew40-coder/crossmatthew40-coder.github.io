(function(){
'use strict';

const LOCAL_BASE='http://127.0.0.1:4177';
const STORAGE_KEY='hsm-live-bridge-v1';
const MAX_SHOTS=80;

const $=s=>document.querySelector(s);
const state={
  mode:'idle',
  connected:false,
  source:null,
  captureFolder:'',
  outputFolder:'',
  photosDetected:0,
  exportsDetected:0,
  shots:[],
  latest:null,
  lastError:''
};

function emit(name,detail){try{window.dispatchEvent(new CustomEvent(name,{detail}));}catch{}}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function prettyBytes(n){n=Number(n)||0;if(n<1024)return n+' B';if(n<1048576)return(n/1024).toFixed(1)+' KB';if(n<1073741824)return(n/1048576).toFixed(1)+' MB';return(n/1073741824).toFixed(1)+' GB';}
function when(v){try{return new Date(v).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'});}catch{return'—';}}
function baseName(p){return String(p||'').replace(/[\\/]+$/,'').split(/[\\/]/).pop()||'';}

function persist(){
  try{
    localStorage.setItem(STORAGE_KEY,JSON.stringify({
      connected:state.connected,
      source:state.source,
      photosDetected:state.photosDetected,
      exportsDetected:state.exportsDetected,
      latest:state.latest,
      shots:state.shots.slice(0,30),
      updatedAt:Date.now()
    }));
  }catch{}
  emit('hsm:live-bridge',{...state});
}

function setConnection(on,title,sub){
  state.connected=!!on;
  const dot=$('#dot'),status=$('#bridgeStatus'),detail=$('#bridgeDetail');
  if(dot)dot.classList.toggle('live',!!on);
  if(status)status.textContent=title||(on?'Connected':'Not connected');
  if(detail)detail.textContent=sub||'';
  const badge=$('#connectionBadge');
  if(badge){badge.textContent=on?'LIVE':'OFFLINE';badge.classList.toggle('on',!!on);}
  const liveDot=$('#connDot');if(liveDot)liveDot.classList.toggle('on',!!on);
  const liveTitle=$('#connTitle');if(liveTitle)liveTitle.textContent=title||(on?'Capture One connected':'Capture One not connected');
  const liveSub=$('#connSub');if(liveSub)liveSub.textContent=sub||'';
  emit('hsm:bridge-status',{connected:!!on,title:title||'',detail:sub||'',source:state.source});
  persist();
}

function setFolders(data){
  if(data.captureFolder){state.captureFolder=data.captureFolder;const el=$('#capturePath');if(el)el.value=data.captureFolder;}
  if(data.outputFolder){state.outputFolder=data.outputFolder;const el=$('#outputPath');if(el)el.value=data.outputFolder;}
}

function thumbUrl(shot){
  if(!shot?.previewUrl)return'';
  if(/^https?:/i.test(shot.previewUrl))return shot.previewUrl;
  return LOCAL_BASE+shot.previewUrl;
}

function renderShot(shot,prepend=true){
  const incoming=$('#incoming');
  if(!incoming||!shot)return;
  const empty=incoming.querySelector('[data-empty]');if(empty)empty.remove();
  const el=document.createElement('article');
  el.className='thumb';
  el.dataset.id=shot.id||shot.name||Date.now();
  const src=thumbUrl(shot);
  el.innerHTML=`${src?`<img src="${esc(src)}" alt="${esc(shot.name||'Incoming capture')}">`:'<div class="rawmark">RAW</div>'}<div class="thumbmeta"><b>${esc(shot.name||'New capture')}</b><span>${esc(shot.orientation||'')} ${shot.bytes?`· ${esc(prettyBytes(shot.bytes))}`:''}</span></div>`;
  if(prepend)incoming.prepend(el);else incoming.append(el);
  while(incoming.children.length>20)incoming.lastElementChild?.remove();
}

function renderAnalysis(shot){
  const a=shot?.analysis||{};
  const title=$('#hugoTitle'),copy=$('#hugoCopy'),score=$('#hugoScore'),notes=$('#hugoNotes');
  if(title)title.textContent=a.status||'Image received';
  if(copy)copy.textContent=a.summary||'Hugo has received the latest frame and queued it for analysis.';
  if(score)score.textContent=Number.isFinite(a.score)?String(a.score):'—';
  if(notes){
    const list=Array.isArray(a.notes)?a.notes:[];
    notes.innerHTML=list.length?list.map(x=>`<span>${esc(x)}</span>`).join(''):'<span>Waiting for deeper AI analysis</span>';
  }
}

function receiveCapture(shot){
  if(!shot)return;
  state.latest=shot;
  state.photosDetected=(Number(state.photosDetected)||0)+1;
  state.shots=[shot,...state.shots.filter(x=>String(x.id)!==String(shot.id))].slice(0,MAX_SHOTS);
  const count=$('#count');if(count)count.textContent=state.photosDetected;
  const latest=$('#latestCapture');if(latest)latest.textContent=shot.name||'New capture';
  const latestTime=$('#latestTime');if(latestTime)latestTime.textContent=when(shot.receivedAt||shot.capturedAt||Date.now());
  renderShot(shot,true);
  renderAnalysis(shot);
  emit('hsm:capture',shot);
  persist();
}

function receiveAnalysis(shot){
  if(!shot)return;
  state.shots=state.shots.map(x=>String(x.id)===String(shot.id)?shot:x);
  if(state.latest&&String(state.latest.id)===String(shot.id))state.latest=shot;
  renderAnalysis(shot);
  emit('hsm:analysis',shot);
  persist();
}

function receiveExport(item){
  state.exportsDetected=(Number(state.exportsDetected)||0)+1;
  const el=$('#exports');if(el)el.textContent=state.exportsDetected;
  const last=$('#latestExport');if(last)last.textContent=item?.name||'Export detected';
  emit('hsm:export',item||{});
  persist();
}

function applyState(data){
  if(!data)return;
  setFolders(data);
  state.photosDetected=Number(data.photosDetected??state.photosDetected)||0;
  state.exportsDetected=Number(data.exportsDetected??state.exportsDetected)||0;
  const c=$('#count');if(c)c.textContent=state.photosDetected;
  const e=$('#exports');if(e)e.textContent=state.exportsDetected;
  const incoming=$('#incoming');
  if(Array.isArray(data.latest)){
    state.shots=data.latest.slice(0,MAX_SHOTS);
    state.latest=data.latest[0]||state.latest;
    if(incoming){
      incoming.innerHTML='';
      data.latest.slice(0,20).reverse().forEach(x=>renderShot(x,true));
      if(!data.latest.length)incoming.innerHTML='<div class="empty" data-empty>Take a photograph in Capture One. New frames will appear here automatically.</div>';
    }
    if(data.latest[0])renderAnalysis(data.latest[0]);
  }
  persist();
}

async function probeCompanion(){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),1800);
  try{
    const r=await fetch(LOCAL_BASE+'/api/state',{cache:'no-store',mode:'cors',signal:controller.signal});
    if(!r.ok)throw new Error('Companion returned '+r.status);
    const data=await r.json();
    clearTimeout(timer);
    state.mode='companion';state.source='Capture One Companion';state.lastError='';
    applyState(data);
    setConnection(true,'Capture One connected',`${baseName(data.captureFolder)||'Capture folder'} · Companion running locally`);
    return data;
  }catch(err){
    clearTimeout(timer);
    state.lastError=err?.message||String(err);
    return null;
  }
}

function listenCompanion(){
  try{state.eventSource?.close?.();}catch{}
  const es=new EventSource(LOCAL_BASE+'/api/events');
  state.eventSource=es;
  es.addEventListener('state',e=>{try{const d=JSON.parse(e.data);applyState(d);setFolders(d);setConnection(true,'Capture One connected',`${baseName(d.captureFolder)||'Capture folder'} · live bridge active`);}catch{}});
  es.addEventListener('capture',e=>{try{receiveCapture(JSON.parse(e.data));}catch{}});
  es.addEventListener('analysis',e=>{try{receiveAnalysis(JSON.parse(e.data));}catch{}});
  es.addEventListener('export',e=>{try{receiveExport(JSON.parse(e.data));}catch{receiveExport({});}});
  es.onopen=()=>setConnection(true,'Capture One connected','Companion is watching the session in real time');
  es.onerror=()=>setConnection(false,'Companion connection interrupted','Keep High Style Match Companion open, then reconnect.');
}

async function connectCompanion(){
  setConnection(false,'Looking for Companion…','Checking the local High Style Match bridge on this Mac.');
  const data=await probeCompanion();
  if(!data){
    setConnection(false,'High Style Match Companion not found','Open the Companion on your Mac, choose the Capture One Capture folder, then press Connect again.');
    return false;
  }
  listenCompanion();
  return true;
}

function tauriInvoke(){return window.__TAURI__?.core?.invoke||window.__TAURI__?.tauri?.invoke||null;}
async function connectTauri(){
  const invoke=tauriInvoke();
  if(!invoke)return false;
  const capturePath=$('#capturePath')?.value?.trim()||'';
  const outputPath=$('#outputPath')?.value?.trim()||'';
  if(!capturePath){setConnection(false,'Choose a Capture folder first','Paste or choose the Capture folder used by the current Capture One Session.');return false;}
  try{
    await invoke('watch_capture_one',{capturePath,outputPath});
    state.mode='tauri';state.source='High Style Match Desktop';
    setConnection(true,'Capture One connected','Desktop bridge is watching the session folders.');
    return true;
  }catch(err){setConnection(false,'Could not start folder watch',String(err));return false;}
}

function bindTauriEvents(){
  const listen=window.__TAURI__?.event?.listen;
  if(!listen)return;
  listen('hsm://capture-file',e=>receiveCapture({...(e.payload||{}),id:e.payload?.path||e.payload?.name,receivedAt:new Date().toISOString(),analysis:{status:'Received',summary:'Frame received from the High Style Match desktop bridge.',notes:['Queued for Hugo analysis']}}));
  listen('hsm://export-file',e=>receiveExport(e.payload||{}));
}

async function connect(){
  if(tauriInvoke())return connectTauri();
  return connectCompanion();
}

function restore(){
  try{
    const old=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(!old)return;
    state.photosDetected=Number(old.photosDetected)||0;
    state.exportsDetected=Number(old.exportsDetected)||0;
    state.shots=Array.isArray(old.shots)?old.shots:[];
    state.latest=old.latest||state.shots[0]||null;
    const c=$('#count');if(c)c.textContent=state.photosDetected;
    const e=$('#exports');if(e)e.textContent=state.exportsDetected;
  }catch{}
}

function init(){
  restore();
  bindTauriEvents();
  $('#connect')?.addEventListener('click',connect);
  $('#reconnect')?.addEventListener('click',connect);
  $('#openCompanion')?.addEventListener('click',()=>window.open(LOCAL_BASE,'_blank','noopener'));
  $('#clearFeed')?.addEventListener('click',()=>{state.shots=[];state.latest=null;state.photosDetected=0;const incoming=$('#incoming');if(incoming)incoming.innerHTML='<div class="empty" data-empty>Live feed cleared. The next Capture One frame will appear here.</div>';const c=$('#count');if(c)c.textContent='0';persist();});
  $('#next')?.addEventListener('click',()=>emit('hsm:next-shot',{}));
  if(tauriInvoke()){
    state.mode='tauri';state.source='High Style Match Desktop';
    setConnection(false,'Desktop bridge ready','Choose your Capture One Session folders, then start watching.');
  }else{
    probeCompanion().then(data=>{if(data)listenCompanion();else setConnection(false,'Waiting for High Style Match Companion','Open the Mac Companion to connect Capture One in real time.');});
  }
}

document.addEventListener('DOMContentLoaded',init,{once:true});
window.HSMLiveBridge={connect,probe:probeCompanion,getState:()=>({...state}),receiveCapture,thumbUrl};
})();
