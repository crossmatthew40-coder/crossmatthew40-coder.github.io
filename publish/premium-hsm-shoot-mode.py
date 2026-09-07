from pathlib import Path
import re

TETHER=Path('high-style-match/tether/index.html')
MAIN=Path('high-style-match/index.html')

html=TETHER.read_text()
if 'HSM PREMIUM SHOOT MODE 0.10' in html:
    print('Premium shoot mode already applied')
    raise SystemExit(0)

css=r'''
/* HSM PREMIUM SHOOT MODE 0.10 */
body{letter-spacing:-.005em}.wrap{max-width:1440px;padding:18px 22px 28px}.top{height:58px;border-bottom:1px solid #202020}.brand small{letter-spacing:.08em;text-transform:uppercase;font-size:9px}.hero{padding:10px 0 4px;margin-bottom:10px}.hero h1{font-size:30px;margin:3px 0 5px}.hero p{font-size:11px;max-width:700px}.hero-tools{justify-content:flex-end}.btn{border-radius:8px;min-height:38px;padding:9px 12px}.project-select{border-radius:8px;min-height:38px}.statusbar{border:1px solid #222!important;background:#070707!important;border-radius:10px;padding:11px 12px;margin-bottom:10px}.conn small{color:#737373!important}.dot{width:8px;height:8px;box-shadow:0 0 0 4px rgba(255,255,255,.06)!important}.dot.on{box-shadow:0 0 0 4px rgba(255,255,255,.10)!important}
.premium-rail{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid #222;border-radius:10px;overflow:hidden;margin-bottom:10px;background:#080808}.rail-node{display:flex;align-items:center;gap:10px;padding:11px 13px;border-left:1px solid #222;min-width:0}.rail-node:first-child{border-left:0}.rail-icon{width:28px;height:28px;border-radius:50%;border:1px solid #3a3a3a;display:grid;place-items:center;color:#fff;flex:0 0 auto;font-size:12px}.rail-node b{display:block;font-size:10px;font-weight:760;letter-spacing:.02em}.rail-node span{display:block;font-size:9px;color:#777;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rail-node.live .rail-icon{background:#fff;color:#000;border-color:#fff}.premium-hud{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(250px,.7fr);gap:10px;margin-bottom:10px}.hud-main,.hud-next{border:1px solid #252525;background:#0a0a0a;border-radius:10px;padding:15px 16px}.hud-label{font-size:8px;letter-spacing:.16em;text-transform:uppercase;color:#727272;font-weight:820}.hud-current{font-size:29px;letter-spacing:-.045em;margin:5px 0 4px;font-weight:790;line-height:1}.hud-variant{font-size:12px;color:#a1a1a1}.coverage-chips{display:flex;gap:7px;flex-wrap:wrap;margin-top:13px}.coverage-chip{border:1px solid #343434;background:#101010;border-radius:999px;padding:6px 9px;font-size:9px;color:#9b9b9b}.coverage-chip.covered{background:#fff;color:#000;border-color:#fff}.coverage-chip.now{border-color:#fff;color:#fff}.hud-next{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}.hud-next strong{font-size:16px;display:block;margin-top:5px}.hud-next small{font-size:10px;color:#858585;display:block;margin-top:3px}.hud-arrow{width:36px;height:36px;border:1px solid #333;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:16px}.session-bar{margin-top:10px;border-top:1px solid #232323;padding:9px 2px 0;display:flex;gap:18px;align-items:center;flex-wrap:wrap;color:#777;font-size:9px}.session-bar b{color:#fff;font-weight:650}.shortcut-help{margin-left:auto;color:#686868}.grid{grid-template-columns:minmax(0,1.42fr) minmax(330px,.58fr);gap:10px}.card{border-radius:10px!important}.viewer-head{padding:11px 13px}.viewer-head .eyebrow{font-size:8px}.viewer-head h2{font-size:12px;margin-top:2px}.viewer-stage{height:min(60vh,620px);background:#020202!important}.viewer-stage img{max-width:96%;max-height:96%;border-radius:4px;box-shadow:none!important;animation:premiumFrameIn .18s ease-out}.viewer-foot{grid-template-columns:repeat(5,1fr);background:#222!important}.vstat{padding:9px 10px}.vstat label{font-size:7px}.vstat b{font-size:9px}.thumbs{padding:8px;gap:6px}.thumb{width:82px;flex-basis:82px;padding:3px;border-radius:6px}.thumb img,.thumb .rawmini{width:74px;height:50px;border-radius:4px}.current{padding:16px}.current .eyebrow{font-size:8px}.current h2{font-size:25px;margin:5px 0 3px}.variant{font-size:11px}.brief{margin-top:11px;padding:9px 10px;border-radius:7px!important;font-size:10px}.counts{margin-top:10px;gap:6px}.counts div{border-radius:7px!important;padding:9px}.counts span{font-size:7px}.counts b{font-size:16px}.current-actions{gap:6px;margin-top:10px}.board{padding:12px}.board-head{margin-bottom:7px}.board-head h3{font-size:13px}.queue{gap:5px;max-height:310px}.q{padding:8px;border-radius:7px!important}.q strong{font-size:10px}.q small{font-size:8px}.qmeta button{width:24px;height:24px;border-radius:6px!important}.state{font-size:7px;padding:4px 6px}.bottomline{gap:10px;margin-top:10px}.mini{padding:12px}.mini h3{font-size:12px}.mini p{font-size:9px}.focus-mode .hero{display:none}.focus-mode .board,.focus-mode .bottomline{display:none}.focus-mode .grid{grid-template-columns:minmax(0,1fr) 330px}.focus-mode .viewer-stage{height:calc(100vh - 315px);min-height:380px}.focus-mode .statusbar{padding:8px 10px}.focus-mode .statusbar .conn small{display:none}.focus-mode .premium-hud{position:sticky;top:58px;z-index:20;background:#000;padding-top:8px}.focus-mode .wrap{padding-top:10px}.focus-toggle.on{background:#fff!important;color:#000!important;border-color:#fff!important}@keyframes premiumFrameIn{from{opacity:.25;transform:scale(.996)}to{opacity:1;transform:scale(1)}}
@media(max-width:1050px){.premium-rail{grid-template-columns:1fr 1fr}.rail-node:nth-child(3){border-left:0;border-top:1px solid #222}.rail-node:nth-child(4){border-top:1px solid #222}.premium-hud{grid-template-columns:1fr}.grid,.focus-mode .grid{grid-template-columns:1fr}.focus-mode .viewer-stage{height:55vh}.shortcut-help{display:none}}
@media(max-width:680px){.wrap{padding:10px}.hero-tools{justify-content:flex-start}.premium-rail{grid-template-columns:1fr}.rail-node{border-left:0;border-top:1px solid #222}.rail-node:first-child{border-top:0}.hud-current{font-size:24px}.viewer-stage{height:44vh}.session-bar{gap:10px}.focus-mode .premium-hud{top:58px}.current-actions{grid-template-columns:1fr 1fr}}
/* END HSM PREMIUM SHOOT MODE 0.10 */
'''
html=html.replace('</style>',css+'\n</style>',1)
html=html.replace('Tether Mode · standard feature','Shoot Mode · Live Capture',1)
html=html.replace('<button class="btn light" id="notifyBtn">Enable notifications</button>','<button class="btn light" id="notifyBtn">Enable notifications</button><button class="btn dark focus-toggle" id="focusToggle" type="button">Focus mode</button>',1)

rail='''<section class="premium-rail" id="premiumRail"><div class="rail-node"><div class="rail-icon">◉</div><div><b>CAMERA</b><span>Controlled by Capture One</span></div></div><div class="rail-node" id="railCapture"><div class="rail-icon">C1</div><div><b>CAPTURE ONE</b><span id="railCaptureText">Choose Capture folder</span></div></div><div class="rail-node" id="railMatch"><div class="rail-icon">M</div><div><b>HIGH STYLE MATCH</b><span id="railMatchText">Ready</span></div></div><div class="rail-node" id="railHealth"><div class="rail-icon">●</div><div><b>SHOOT HEALTH</b><span id="railHealthText">Queue 0 · waiting</span></div></div></section>'''
html=html.replace('<section class="statusbar">',rail+'\n<section class="statusbar">',1)

hud='''<section class="premium-hud" id="premiumHud"><div class="hud-main"><div class="hud-label">Current shot</div><div class="hud-current" id="hudCurrent">No requirement</div><div class="hud-variant" id="hudVariant">Choose a project and shot list</div><div class="coverage-chips" id="coverageChips"></div><div class="session-bar"><span><b id="hudCaptured">0</b> captured</span><span><b id="hudCovered">0 / 0</b> requirements</span><span>Queue <b id="hudQueue">0</b></span><span>Latest <b id="hudLatency">—</b></span><span id="hudWatcher">Watcher idle</span><span class="shortcut-help">→ next · R reshoot · P pick · C check · F focus</span></div></div><div class="hud-next"><div><div class="hud-label">Next</div><strong id="hudNext">—</strong><small id="hudNextVariant">No next requirement</small></div><div class="hud-arrow">→</div></div></section>'''
html=html.replace('<div class="grid">',hud+'\n<div class="grid">',1)

# Render the premium HUD whenever the normal Tether UI renders.
old='renderQueue();renderThumbs();updateButtons()}'
new='renderQueue();renderThumbs();updateButtons();updatePremiumHud()}'
if old not in html:
    raise SystemExit('renderAll marker not found')
html=html.replace(old,new,1)

# Make folder scans cheaper with hundreds of images: once a filename is settled, do not reopen it every pass.
old_scan="async function scan(){if(!dir||!watching)return;try{for await(const e of dir.values()){if(e.kind!=='file'||!ALLOWED.test(e.name))continue;const f=await e.getFile(),sig=`${f.size}:${f.lastModified}`;if(seen.get(e.name)===sig)continue;const p=pending.get(e.name);if(!p||p.sig!==sig){pending.set(e.name,{sig,count:1});continue}p.count++;if(p.count<2)continue;pending.delete(e.name);seen.set(e.name,sig);await importCapture(f)}}catch{showAlert('Match temporarily lost access to the Capture folder. Choose it again if new images stop appearing.')}}"
new_scan="async function scan(){if(!dir||!watching||scan.busy)return;scan.busy=true;try{for await(const e of dir.values()){if(e.kind!=='file'||!ALLOWED.test(e.name)||seen.has(e.name))continue;const f=await e.getFile(),sig=`${f.size}:${f.lastModified}`;const p=pending.get(e.name);if(!p||p.sig!==sig){pending.set(e.name,{sig,count:1});continue}p.count++;if(p.count<2)continue;pending.delete(e.name);seen.set(e.name,sig);await importCapture(f)}}catch{showAlert('Match temporarily lost access to the Capture folder. Choose it again if new images stop appearing.')}finally{scan.busy=false}}"
if old_scan not in html:
    raise SystemExit('scan marker not found')
html=html.replace(old_scan,new_scan,1)
html=html.replace('timer=setInterval(scan,1200)','timer=setInterval(scan,500)',1)

premium_js=r'''
function updatePremiumHud(){
  if(!$('premiumHud'))return;
  const shots=orderedShots(),cur=current();
  $('hudCurrent').textContent=cur?.subject||'No requirement';
  $('hudVariant').textContent=cur?.variant||'Choose a project and shot list';
  const same=cur?shots.filter(s=>String(s.subject||'').trim().toLowerCase()===String(cur.subject||'').trim().toLowerCase()):[];
  $('coverageChips').innerHTML=same.length?same.map(s=>{const st=stateFor(s),now=String(s.id)===String(cur?.id);return `<span class="coverage-chip ${st.label==='Covered'?'covered':''} ${now?'now':''}">${esc(s.variant||'Shot')} ${st.label==='Covered'?'✓':now?'•':'○'}</span>`}).join(''):'';
  const covered=shots.filter(s=>stateFor(s).label==='Covered').length;
  const tethered=(shoot?.photos||[]).filter(p=>p.tetherAt).sort((a,b)=>(b.tetherAt||0)-(a.tetherAt||0));
  $('hudCaptured').textContent=tethered.length;
  $('hudCovered').textContent=`${covered} / ${shots.length}`;
  $('hudQueue').textContent=String(pending?.size||0);
  const last=tethered[0];let latency='—';
  if(last&&last.captureAt&&last.tetherAt){const ms=Math.max(0,Number(last.tetherAt)-Number(last.captureAt));latency=ms<60000?`${(ms/1000).toFixed(ms<1000?1:0)}s`:'—'}
  $('hudLatency').textContent=latency;
  $('hudWatcher').textContent=watching?'Watching Capture One':'Watcher idle';
  const idx=Math.max(0,shots.findIndex(s=>String(s.id)===String(cur?.id)));let next=null;
  for(let k=1;k<=shots.length;k++){const n=shots[(idx+k)%shots.length];if(n&&stateFor(n).label!=='Covered'){next=n;break}}
  $('hudNext').textContent=next?.subject||'All covered';$('hudNextVariant').textContent=next?.variant||'Check before leaving';
  const capture=$('railCapture'),match=$('railMatch'),health=$('railHealth');
  $('railCaptureText').textContent=dir?dir.name:'Choose Capture folder';
  $('railMatchText').textContent=watching?'Watching for new frames':dir?'Ready to start':'Ready';
  $('railHealthText').textContent=`Queue ${pending?.size||0}${last?' · last '+new Date(last.tetherAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}):' · waiting'}`;
  capture?.classList.toggle('live',!!dir);match?.classList.toggle('live',!!watching);health?.classList.toggle('live',!!watching&&!(pending?.size));
}
function setFocusMode(on){document.body.classList.toggle('focus-mode',on);const b=$('focusToggle');if(b){b.classList.toggle('on',on);b.textContent=on?'Exit focus':'Focus mode'}try{localStorage.setItem('hsmShootFocus',on?'1':'0')}catch{}}
$('focusToggle').onclick=()=>setFocusMode(!document.body.classList.contains('focus-mode'));
try{setFocusMode(localStorage.getItem('hsmShootFocus')==='1')}catch{}
document.addEventListener('keydown',e=>{const tag=(e.target?.tagName||'').toLowerCase();if(['input','textarea','select'].includes(tag)||e.metaKey||e.ctrlKey||e.altKey)return;if(e.key==='ArrowRight'){e.preventDefault();nextShot()}else if(e.key.toLowerCase()==='r'){e.preventDefault();toggleReshoot()}else if(e.key.toLowerCase()==='p'){e.preventDefault();togglePick()}else if(e.key.toLowerCase()==='c'){e.preventDefault();checkCoverage(false)}else if(e.key.toLowerCase()==='f'){e.preventDefault();setFocusMode(!document.body.classList.contains('focus-mode'))}});
setInterval(updatePremiumHud,1000);
'''
marker='setInterval(checkMissingTimer,15000);populateProjects();'
if marker not in html:
    raise SystemExit('JS init marker not found')
html=html.replace(marker,premium_js+'\n'+marker,1)

TETHER.write_text(html)

# Version the main app for cache busting where the constant exists.
main=MAIN.read_text()
main=re.sub(r"APP_VERSION='[^']+'","APP_VERSION='0.10.0'",main,count=1)
MAIN.write_text(main)
print('Applied premium shoot mode 0.10')
