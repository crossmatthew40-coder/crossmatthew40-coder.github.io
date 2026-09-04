from pathlib import Path
import re, sys
p=Path('high-style-match/index.html') if Path('high-style-match/index.html').exists() else Path('/mnt/data/high-style-match-premium.html')
s=p.read_text()

def one(old,new,label):
    global s
    n=s.count(old)
    if n<1:
        raise SystemExit(f'missing patch target: {label}')
    s=s.replace(old,new,1)

css='''\n.shot-hub-hero{background:linear-gradient(135deg,#101018 0%,#1a1823 72%,#221d31 100%);color:#fff;border-radius:22px;padding:28px;box-shadow:0 22px 60px rgba(20,14,30,.16);position:relative;overflow:hidden}.shot-hub-hero:after{content:"";position:absolute;width:340px;height:340px;border-radius:50%;right:-120px;top:-170px;background:radial-gradient(circle,rgba(141,108,255,.5),rgba(141,108,255,0) 68%)}.shot-hub-hero .eyebrow{color:#c7bcff}.shot-hub-hero h1{margin:4px 0 9px;font-size:36px;letter-spacing:-.045em;max-width:700px}.shot-hub-hero p{margin:0;color:#c3c0cb;max-width:700px;line-height:1.55;font-size:14px}.core-badge{display:inline-flex;align-items:center;gap:7px;margin-top:18px;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.09);font-size:11px;font-weight:750;color:#e9e5f4;position:relative;z-index:2}.shot-hub-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(320px,.85fr);gap:18px}.shot-preview-table{max-height:440px;overflow:auto;border:1px solid var(--line);border-radius:14px}.shot-preview-table .table{padding:8px}.shot-create-card{position:sticky;top:90px;align-self:start}.shot-count{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:12px;background:#f5f1ff;border:1px solid #e5dcff;margin-top:12px}.shot-count b{font-size:13px;color:#5f45c8}.shot-count span{font-size:11px;color:#7c6ea8}.shot-empty-note{padding:16px;border-radius:13px;background:#faf9fb;border:1px dashed #d8d2df;color:var(--muted);font-size:12px;line-height:1.5}.shot-source{font-size:11px;color:var(--muted);margin-top:6px}.shot-hub-actions{display:flex;gap:9px;flex-wrap:wrap}.shot-hub-actions .btn{flex:0 0 auto}\n'''
if '.shot-hub-hero{' not in s:
    one('@media(max-width:980px)',css+'@media(max-width:980px)','hub CSS')
    one('@media(max-width:980px){','@media(max-width:980px){.shot-hub-grid{grid-template-columns:1fr}.shot-create-card{position:static}','desktop responsive')
    one('@media(max-width:720px){','@media(max-width:720px){.shot-hub-hero{padding:22px}.shot-hub-hero h1{font-size:30px}','mobile responsive')

one("let D=loadData(),screen='home'","let D=loadData(),screen='shotlist'",'default screen')
one("function setNav(){NAV.innerHTML=[['home','home','Home'],['shoots','shoots','Shoots'],['new','plus','New Shoot'],['templates','template','Templates']]","function setNav(){NAV.innerHTML=[['shotlist','upload','Shot List'],['shoots','shoots','Shoots'],['home','home','Dashboard'],['templates','template','Templates']]",'nav')
one("function render(){setNav();if(screen==='home')renderHome();else if(screen==='shoots')renderShoots();else if(screen==='new')renderWizard();else if(screen==='templates')renderTemplates();else if(screen==='workspace')renderWorkspace();else renderHome()}","function render(){setNav();if(screen==='shotlist')renderShotListHub();else if(screen==='home')renderHome();else if(screen==='shoots')renderShoots();else if(screen==='new')renderWizard();else if(screen==='templates')renderTemplates();else if(screen==='workspace')renderWorkspace();else renderShotListHub()}",'render router')

hub=r'''function renderShotListHub(){
 setTop('<b>Shot List</b>','<button class="btn secondary small" id="hubShoots">'+icon('folder')+'View Shoots</button>');
 const rows=draft.shots;
 C.innerHTML=`<div class="shot-hub-hero"><div class="eyebrow">The core of High Style Match</div><h1>Start with the shot list.</h1><p>Upload the client’s existing shot list first. High Style Match turns it into structured requirements, then uses those requirements to organise, match and rename the photographs.</p><div class="core-badge">${icon('spark')} Shot list → photos → matched filenames</div></div>
 <div class="shot-hub-grid section">
   <div class="grid" style="gap:18px">
     <div class="panel panel-pad"><div class="panel-head"><div><h2>1. Upload the shot list</h2><p>Every job starts here.</p></div>${draft.shots.length?'<span class="pill success">'+draft.shots.length+' requirements</span>':''}</div>
       <div class="upload-zone" id="hubShotDrop"><div class="upload-icon">${icon('upload')}</div><b>Drop your shot list here</b><p>TXT, CSV, TSV or Markdown · or choose a file</p><div class="shot-hub-actions" style="justify-content:center"><button class="btn primary" id="hubChooseShot">${icon('folder')}Choose Shot List</button>${draft.shots.length?'<button class="btn secondary" id="hubClearShot">'+icon('trash')+'Clear</button>':''}</div></div>
       ${draft.shotSourceName?`<div class="shot-count"><div><b>${esc(draft.shotSourceName)}</b><div class="shot-source">Loaded and ready to review</div></div><span>${draft.shots.length} requirements detected</span></div>`:''}
       <div class="field section"><label>Or paste / edit the shot list</label><textarea id="hubShotText" placeholder="Burger — Landscape\nBurger — Portrait\nCarbonara — Overhead x2">${esc(draft.shotText)}</textarea><div class="field-hint" id="hubParseHint">${draft.shots.length?`${draft.shots.length} requirements detected`:'Add a shot list to begin.'}</div></div>
     </div>
     <div class="panel panel-pad"><div class="panel-head"><div><h2>2. Review the requirements</h2><p>These are the names High Style Match will use when matching and renaming.</p></div></div>
       ${rows.length?`<div class="shot-preview-table"><div class="table"><div class="table-row header"><span>Requirement</span><span>Variant</span><span>Status</span><span>#</span></div>${rows.map((x,i)=>`<div class="table-row"><div><strong>${esc(x.subject)}</strong></div><div class="muted">${esc(x.variant)}</div><div><span class="pill purple">Ready</span></div><div>${i+1}</div></div>`).join('')}</div></div>`:`<div class="shot-empty-note">Upload or paste a shot list above. As soon as High Style Match recognises the items, they will appear here as structured shoot requirements.</div>`}
     </div>
   </div>
   <div class="panel panel-pad shot-create-card"><div class="panel-head"><div><h2>3. Create the shoot</h2><p>Attach these requirements to a client job, then move straight to the photographs.</p></div></div>
     <div class="form-grid" style="grid-template-columns:1fr"><div class="field"><label>Client</label><input id="hubClient" value="${esc(draft.client)}" placeholder="Cancello Restaurant"></div><div class="field"><label>Shoot name</label><input id="hubName" value="${esc(draft.name)}" placeholder="Autumn Menu Shoot"></div><div class="field"><label>Date</label><input id="hubDate" type="date" value="${esc(draft.date)}"></div><div class="field"><label>Location</label><input id="hubLocation" value="${esc(draft.location)}" placeholder="Manchester"></div></div>
     <div class="notice info section">${icon('info')}The shot list stays attached to this shoot and drives matching and filename generation.</div>
     <button class="btn primary section" style="width:100%" id="hubCreate" ${draft.shots.length?'':'disabled'}>${icon('arrow')}Create Shoot & Add Photos</button>
   </div>
 </div>`;
 document.getElementById('hubShoots').onclick=()=>navigate('shoots');
 const sync=()=>{draft.client=document.getElementById('hubClient').value.trim();draft.name=document.getElementById('hubName').value.trim();draft.date=document.getElementById('hubDate').value;draft.location=document.getElementById('hubLocation').value.trim()};
 ['hubClient','hubName','hubDate','hubLocation'].forEach(id=>document.getElementById(id).oninput=sync);
 const ta=document.getElementById('hubShotText');ta.oninput=()=>{draft.shotText=ta.value;draft.shots=parseShotList(draft.shotText);draft.shotSourceName=draft.shotText.trim()?'Pasted / edited in High Style Match':'';renderShotListHub()};
 document.getElementById('hubChooseShot').onclick=()=>{shotInputTarget='hub';SHOT.click()};
 const clear=document.getElementById('hubClearShot');if(clear)clear.onclick=()=>{draft.shotText='';draft.shots=[];draft.shotSourceName='';renderShotListHub()};
 const drop=document.getElementById('hubShotDrop');['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag')}));['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag')}));drop.addEventListener('drop',e=>{const f=e.dataTransfer.files[0];if(f)readShotFile(f,'hub')});
 document.getElementById('hubCreate').onclick=()=>{sync();if(!draft.shots.length)return toast('Upload a shot list first.');if(!draft.client||!draft.name)return toast('Add a client and shoot name.');const s={id:uid('shoot'),client:draft.client,name:draft.name,date:draft.date,location:draft.location,createdAt:Date.now(),shotText:draft.shotText,shotSourceName:draft.shotSourceName||'Shot list',shots:draft.shots,photos:[],templateId:D.settings.defaultTemplate||'t1',renameOverrides:{}};D.shoots.unshift(s);save();draft=freshDraft();shootId=String(s.id);screen='workspace';tab='photos';photoFilter='all';renameDraft=[];render();toast('Shoot created — add the photographs next')};
}

'''
if 'function renderShotListHub()' not in s:
    one('function renderHome(){',hub+'function renderHome(){','hub function')

s=s.replace("'New Shoot</button>'","'Upload Shot List</button>'",2)
s=s.replace("document.getElementById('topNew').onclick=()=>navigate('new')","document.getElementById('topNew').onclick=()=>navigate('shotlist')",2)
s=s.replace("if(e)e.onclick=()=>navigate('new')","if(e)e.onclick=()=>navigate('shotlist')",1)
s=s.replace('Create First Shoot</button>','Upload First Shot List</button>',1)
s=s.replace("[['1','Create shoot','Client, date and location'],['2','Shot list','Upload TXT, CSV or TSV'],['3','Photographs','Import JPG, HEIC or RAW'],['4','Auto match','Orientation + shoot order'],['5','Rename','Review and download ZIP']]","[['1','Shot list','Upload TXT, CSV or TSV'],['2','Create shoot','Attach it to the client job'],['3','Photographs','Import JPG, HEIC or RAW'],['4','Auto match','Orientation + shoot order'],['5','Rename','Review and download ZIP']]",1)

old="async function readShotFile(file,target){try{const text=await file.text(),shots=parseShotList(text);if(!shots.length)return toast('No shot-list items were detected in that file.');if(target==='wizard'){draft.shotText=text;draft.shots=shots;draft.shotSourceName=file.name;renderWizard()}else{const s=getShoot();if(!s)return;s.shotText=text;s.shots=shots;s.shotSourceName=file.name;s.photos.forEach(p=>p.shotId=null);s.renameOverrides={};save();tab='shotlist';renderWorkspace();toast(`${shots.length} requirements loaded from ${file.name}`)}}catch{toast('That shot-list file could not be read.')}}"
new="async function readShotFile(file,target){try{const text=await file.text(),shots=parseShotList(text);if(!shots.length)return toast('No shot-list items were detected in that file.');if(target==='hub'){draft.shotText=text;draft.shots=shots;draft.shotSourceName=file.name;renderShotListHub();toast(`${shots.length} requirements loaded from ${file.name}`)}else if(target==='wizard'){draft.shotText=text;draft.shots=shots;draft.shotSourceName=file.name;renderWizard()}else{const s=getShoot();if(!s)return;s.shotText=text;s.shots=shots;s.shotSourceName=file.name;s.photos.forEach(p=>p.shotId=null);s.renameOverrides={};save();tab='shotlist';renderWorkspace();toast(`${shots.length} requirements loaded from ${file.name}`)}}catch{toast('That shot-list file could not be read.')}}"
one(old,new,'shot file handler')

for needle in ["screen='shotlist'","['shotlist','upload','Shot List']",'function renderShotListHub()',"target==='hub'",'Create Shoot & Add Photos','function autoMatch','function downloadZip']:
    assert needle in s, needle
m=re.search(r'<script>(.*)</script>',s,re.S)
assert m
out=p
out.write_text(s)
Path('/tmp/high-style-match-shotlist-first.js').write_text(m.group(1))
print(f'patched {out} -> {len(s.encode())} bytes')
