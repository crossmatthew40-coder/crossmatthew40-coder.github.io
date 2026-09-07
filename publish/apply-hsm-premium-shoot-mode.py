from pathlib import Path
import re

path = Path('high-style-match/tether/index.html')
html = path.read_text(encoding='utf-8')

STYLE_START = '/* HSM PREMIUM SHOOT MODE 1.1 */'
STYLE_END = '/* END HSM PREMIUM SHOOT MODE 1.1 */'
SCRIPT_START = '<!-- HSM PREMIUM SHOOT MODE 1.1 -->'
SCRIPT_END = '<!-- END HSM PREMIUM SHOOT MODE 1.1 -->'

html = re.sub(re.escape(STYLE_START) + r'.*?' + re.escape(STYLE_END) + r'\n?', '', html, flags=re.S)
html = re.sub(re.escape(SCRIPT_START) + r'.*?' + re.escape(SCRIPT_END) + r'\n?', '', html, flags=re.S)

css = r'''/* HSM PREMIUM SHOOT MODE 1.1 */
:root{--premium-black:#000;--premium-panel:#080808;--premium-raised:#101010;--premium-line:#242424;--premium-text:#fff;--premium-muted:#8d8d8d}
body{padding-bottom:72px!important}
.card,.current,.board,.mini{border-radius:10px!important}
.top{border-bottom:1px solid #1c1c1c!important;backdrop-filter:blur(28px)!important}
.hero h1{font-size:30px!important;letter-spacing:-.045em!important;font-weight:720!important}
.hero p{max-width:720px!important}
.viewer-stage{transition:box-shadow .18s ease,border-color .18s ease!important}
.viewer-stage.hsm-frame-arrived{box-shadow:inset 0 0 0 1px rgba(255,255,255,.9),0 0 0 1px rgba(255,255,255,.12)!important}
.q,.thumb,.counts div{transition:background .14s ease,border-color .14s ease,transform .14s ease!important}
.q.on{border-color:#fff!important;background:#111!important}
.btn{letter-spacing:-.01em!important}
.btn.primary{font-weight:820!important}

.hsm-premium-tools{display:flex;gap:7px;align-items:center;flex-wrap:wrap}
.hsm-premium-btn{height:38px;padding:0 12px;border-radius:8px;border:1px solid #303030;background:#0e0e0e;color:#fff;font:inherit;font-size:11px;font-weight:780;display:inline-flex;align-items:center;gap:7px;cursor:pointer}
.hsm-premium-btn:hover{background:#171717;border-color:#464646}.hsm-premium-btn.on{background:#fff;color:#000;border-color:#fff}
.hsm-premium-btn .kbd{font-size:9px;border:1px solid currentColor;border-radius:4px;padding:1px 4px;opacity:.65}

#hsmShootHUD{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:90;width:min(1120px,calc(100vw - 26px));min-height:48px;background:rgba(5,5,5,.94);backdrop-filter:blur(24px);border:1px solid #272727;border-radius:12px;display:grid;grid-template-columns:minmax(220px,1.2fr) repeat(4,minmax(100px,.5fr)) auto;align-items:center;gap:0;box-shadow:0 18px 50px rgba(0,0,0,.38);overflow:hidden}
.hsm-hud-main,.hsm-hud-cell{padding:9px 13px;border-right:1px solid #202020;min-width:0}.hsm-hud-cell:last-of-type{border-right:0}
.hsm-hud-label{display:block;color:#707070;font-size:8px;letter-spacing:.11em;text-transform:uppercase;font-weight:850;margin-bottom:3px}.hsm-hud-value{display:block;color:#fff;font-size:11px;font-weight:760;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hsm-live{display:inline-flex;align-items:center;gap:7px}.hsm-live-dot{width:7px;height:7px;border-radius:50%;background:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.08)}
.hsm-hud-shortcuts{padding:0 12px;color:#666;font-size:9px;white-space:nowrap}.hsm-hud-shortcuts b{color:#aaa;font-weight:700}

body.hsm-focus .hero,body.hsm-focus .bottomline{display:none!important}
body.hsm-focus .wrap{max-width:1600px!important;padding-top:12px!important}
body.hsm-focus .grid{grid-template-columns:minmax(0,1.55fr) minmax(330px,.45fr)!important;gap:10px!important}
body.hsm-focus .viewer-stage{height:calc(100vh - 235px)!important;min-height:520px!important}
body.hsm-focus .card{border-color:#202020!important}
body.hsm-focus .statusbar{margin-bottom:10px!important}
body.hsm-focus .current h2{font-size:30px!important}
body.hsm-focus .queue{max-height:calc(100vh - 520px)!important}

.hsm-premium-caption{display:none;margin:0 0 10px;padding:0 2px;color:#666;font-size:10px;letter-spacing:.09em;text-transform:uppercase;font-weight:800}
body.hsm-focus .hsm-premium-caption{display:block}

@media(max-width:900px){#hsmShootHUD{grid-template-columns:1fr repeat(2,minmax(90px,.45fr))}.hsm-hide-tablet,.hsm-hud-shortcuts{display:none}.hsm-hud-main,.hsm-hud-cell{padding:9px 10px}body.hsm-focus .grid{grid-template-columns:1fr!important}body.hsm-focus .viewer-stage{height:52vh!important;min-height:320px!important}}
@media(max-width:620px){body{padding-bottom:66px!important}#hsmShootHUD{bottom:8px;width:calc(100vw - 16px);grid-template-columns:minmax(0,1fr) 90px 88px}.hsm-hide-mobile{display:none}.hsm-hud-label{font-size:7px}.hsm-hud-value{font-size:10px}.hsm-premium-btn .kbd{display:none}}
/* END HSM PREMIUM SHOOT MODE 1.1 */'''

js = r'''<!-- HSM PREMIUM SHOOT MODE 1.1 -->
<script>
(()=>{
  'use strict';
  if(window.__hsmPremiumShootMode) return;
  window.__hsmPremiumShootMode=true;

  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const text=(el,fallback='—')=>el&&el.textContent&&el.textContent.trim()?el.textContent.trim():fallback;
  const isTyping=()=>/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'');

  function findButton(patterns){
    return qsa('button').find(b=>patterns.some(p=>p.test((b.textContent||'').trim())));
  }

  function addPremiumTools(){
    const host=qs('.hero-tools')||qs('.actions');
    if(!host||qs('#hsmFocusToggle')) return;
    const wrap=document.createElement('div');
    wrap.className='hsm-premium-tools';
    wrap.innerHTML=`<button id="hsmFocusToggle" class="hsm-premium-btn" type="button">Focus Mode <span class="kbd">F</span></button><button id="hsmShortcutHelp" class="hsm-premium-btn" type="button">Shortcuts <span class="kbd">?</span></button>`;
    host.appendChild(wrap);
    qs('#hsmFocusToggle')?.addEventListener('click',toggleFocus);
    qs('#hsmShortcutHelp')?.addEventListener('click',()=>alert('High Style Match shortcuts\n\nF  Focus Mode\n← / →  Previous / next shot\nP  Quick Pick\nR  Needs Reshoot\nC  Mark Covered\nEsc  Exit Focus Mode'));
  }

  function addCaption(){
    const grid=qs('.grid');
    if(!grid||qs('.hsm-premium-caption')) return;
    const cap=document.createElement('div');
    cap.className='hsm-premium-caption';
    cap.textContent='Live Shoot · latest frame and current requirement';
    grid.parentNode.insertBefore(cap,grid);
  }

  function addHUD(){
    if(qs('#hsmShootHUD')) return;
    const hud=document.createElement('div');
    hud.id='hsmShootHUD';
    hud.setAttribute('role','status');
    hud.innerHTML=`
      <div class="hsm-hud-main"><span class="hsm-hud-label">Current shot</span><span class="hsm-hud-value" id="hsmHudShot">—</span></div>
      <div class="hsm-hud-cell"><span class="hsm-hud-label">Capture One</span><span class="hsm-hud-value hsm-live"><i class="hsm-live-dot"></i><span id="hsmHudConnection">Checking</span></span></div>
      <div class="hsm-hud-cell"><span class="hsm-hud-label">Frames</span><span class="hsm-hud-value" id="hsmHudFrames">0</span></div>
      <div class="hsm-hud-cell hsm-hide-mobile"><span class="hsm-hud-label">Coverage</span><span class="hsm-hud-value" id="hsmHudCoverage">0 / 0</span></div>
      <div class="hsm-hud-cell hsm-hide-tablet"><span class="hsm-hud-label">Last frame</span><span class="hsm-hud-value" id="hsmHudLast">Waiting</span></div>
      <div class="hsm-hud-shortcuts"><b>F</b> Focus · <b>←/→</b> Shot · <b>P</b> Pick · <b>R</b> Reshoot</div>`;
    document.body.appendChild(hud);
  }

  let lastFrameAt=0;
  function refreshHUD(){
    const current=text(qs('.current h2'),'No active shot');
    const variant=text(qs('.current .variant'),'');
    const connected=!!qs('.dot.on');
    const frames=qsa('.thumb').length;
    const items=qsa('.queue .q');
    const covered=items.filter(q=>q.querySelector('.state.good')||/covered|done|captured/i.test(q.textContent||'')).length;
    const shot=qs('#hsmHudShot'), conn=qs('#hsmHudConnection'), fr=qs('#hsmHudFrames'), cov=qs('#hsmHudCoverage'), last=qs('#hsmHudLast');
    if(shot) shot.textContent=variant?`${current} · ${variant}`:current;
    if(conn) conn.textContent=connected?'Watching':'Ready';
    if(fr) fr.textContent=String(frames);
    if(cov) cov.textContent=`${covered} / ${items.length}`;
    if(last){
      if(!lastFrameAt) last.textContent=frames?'Received':'Waiting';
      else{
        const secs=Math.max(0,Math.round((Date.now()-lastFrameAt)/1000));
        last.textContent=secs<2?'Now':secs<60?`${secs}s ago`:`${Math.floor(secs/60)}m ago`;
      }
    }
  }

  function watchLatestFrame(){
    const stage=qs('.viewer-stage');
    const img=stage?.querySelector('img');
    if(!stage||!img) return;
    const obs=new MutationObserver(muts=>{
      if(!muts.some(m=>m.type==='attributes'&&(m.attributeName==='src'||m.attributeName==='style'||m.attributeName==='class'))) return;
      if(img.getAttribute('src')){
        lastFrameAt=Date.now();
        stage.classList.remove('hsm-frame-arrived');
        requestAnimationFrame(()=>stage.classList.add('hsm-frame-arrived'));
        setTimeout(()=>stage.classList.remove('hsm-frame-arrived'),520);
        refreshHUD();
      }
    });
    obs.observe(img,{attributes:true});
  }

  function toggleFocus(force){
    const on=typeof force==='boolean'?force:!document.body.classList.contains('hsm-focus');
    document.body.classList.toggle('hsm-focus',on);
    qs('#hsmFocusToggle')?.classList.toggle('on',on);
    if(qs('#hsmFocusToggle')) qs('#hsmFocusToggle').firstChild.nodeValue=on?'Exit Focus ': 'Focus Mode ';
    try{localStorage.setItem('hsmFocusMode',on?'1':'0')}catch(e){}
  }

  function moveQueue(dir){
    const items=qsa('.queue .q'); if(!items.length) return;
    let i=items.findIndex(x=>x.classList.contains('on'));
    if(i<0) i=0; else i=Math.max(0,Math.min(items.length-1,i+dir));
    items[i]?.click(); items[i]?.scrollIntoView({block:'nearest',behavior:'smooth'});
  }

  document.addEventListener('keydown',e=>{
    if(isTyping()) return;
    if(e.key==='f'||e.key==='F'){e.preventDefault();toggleFocus();return;}
    if(e.key==='Escape'&&document.body.classList.contains('hsm-focus')){toggleFocus(false);return;}
    if(e.key==='ArrowRight'){e.preventDefault();moveQueue(1);return;}
    if(e.key==='ArrowLeft'){e.preventDefault();moveQueue(-1);return;}
    if(e.key==='p'||e.key==='P'){findButton([/quick pick/i,/\bpick\b/i])?.click();return;}
    if(e.key==='r'||e.key==='R'){findButton([/needs reshoot/i,/reshoot/i])?.click();return;}
    if(e.key==='c'||e.key==='C'){findButton([/mark.*covered/i,/covered/i])?.click();return;}
    if(e.key==='?'){qs('#hsmShortcutHelp')?.click();}
  });

  function init(){
    addPremiumTools(); addCaption(); addHUD(); watchLatestFrame();
    try{if(localStorage.getItem('hsmFocusMode')==='1') toggleFocus(true)}catch(e){}
    refreshHUD();
    setInterval(refreshHUD,1000);
    const observer=new MutationObserver(()=>{addPremiumTools();addCaption();refreshHUD();});
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
</script>
<!-- END HSM PREMIUM SHOOT MODE 1.1 -->'''

if '</style>' not in html or '</body>' not in html:
    raise SystemExit('Expected HTML markers not found')
html = html.replace('</style>', css + '\n</style>', 1)
html = html.replace('</body>', js + '\n</body>', 1)
path.write_text(html, encoding='utf-8')
print('Applied premium shoot mode to', path)
