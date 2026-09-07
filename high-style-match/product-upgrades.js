(function(){
  const css = `
  .hsm-upgrade-strip{margin:0 0 20px;padding:18px;border:1px solid #25282e;border-radius:18px;background:linear-gradient(135deg,#111317,#171a20);box-shadow:0 18px 50px rgba(0,0,0,.18)}
  .hsm-upgrade-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:14px}.hsm-upgrade-head h3{margin:2px 0 5px;font-size:19px}.hsm-upgrade-head p{margin:0;color:#9a9fa8;font-size:12px}.hsm-stage-row{display:grid;grid-template-columns:repeat(8,minmax(90px,1fr));gap:8px;overflow-x:auto}.hsm-stage{border:1px solid #2b2f36;background:#15181d;color:#c8cbd1;border-radius:12px;padding:11px;text-align:left;min-width:110px}.hsm-stage b{display:block;font-size:11px}.hsm-stage span{display:block;margin-top:4px;font-size:10px;color:#7f858f}.hsm-stage.on{border-color:#eceff3;background:#f4f5f6;color:#111317}.hsm-stage.on span{color:#5f6670}.hsm-attention{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px}.hsm-attention-card{padding:13px;border:1px solid #282c33;border-radius:12px;background:#12151a}.hsm-attention-card label{display:block;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#737985;font-weight:800}.hsm-attention-card b{display:block;margin-top:5px;font-size:18px}.hsm-attention-card small{display:block;margin-top:4px;color:#8f959f}.hsm-byl-btn{border:1px solid #343941;background:#11151a;color:#fff;border-radius:10px;padding:9px 12px;font-weight:800}.hsm-checkback{position:fixed;inset:0;background:rgba(0,0,0,.68);backdrop-filter:blur(8px);z-index:9998;display:grid;place-items:center;padding:20px}.hsm-checkmodal{width:min(720px,100%);background:#0f1115;color:#f5f7fa;border:1px solid #292d34;border-radius:20px;padding:22px;box-shadow:0 30px 100px rgba(0,0,0,.45)}.hsm-checkmodal h2{margin:0 0 6px;font-size:25px}.hsm-checkmodal>p{margin:0 0 18px;color:#949aa4}.hsm-checkgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.hsm-checkitem{display:flex;justify-content:space-between;gap:14px;padding:13px;border:1px solid #272b31;border-radius:12px;background:#15181d}.hsm-checkitem span{color:#9ca2ac;font-size:12px}.hsm-checkitem b{font-size:12px}.hsm-checkactions{display:flex;justify-content:flex-end;gap:9px;margin-top:18px}.hsm-focus-btn{border:1px solid #31363d;background:#171a1f;color:#fff;border-radius:10px;padding:9px 12px;font-weight:800}.hsm-focus-active .sidebar,.hsm-focus-active .topbar{display:none!important}.hsm-focus-active .app{display:block!important}.hsm-focus-active .content{max-width:none!important;padding:18px!important}.hsm-focus-active .live-current h2{font-size:clamp(42px,6vw,78px)!important}.hsm-shortcut-hint{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:1000;padding:8px 12px;border-radius:999px;background:rgba(14,16,20,.92);border:1px solid #292d34;color:#aab0ba;font-size:10px;pointer-events:none;opacity:0;transition:.18s}.hsm-shortcut-hint.show{opacity:1}
  @media(max-width:900px){.hsm-attention{grid-template-columns:1fr 1fr}.hsm-stage-row{grid-template-columns:repeat(8,120px)}}
  @media(max-width:600px){.hsm-attention{grid-template-columns:1fr}.hsm-checkgrid{grid-template-columns:1fr}.hsm-upgrade-head{display:block}}
  `;
  const style=document.createElement('style'); style.textContent=css; document.head.appendChild(style);

  const stageNames=['Shot list','Live shoot','Before you leave','Cull','Match','Rename','Client review','Delivery'];

  function textCount(re){
    const t=document.body.innerText||''; const m=t.match(re); return m?Number(m[1]):0;
  }

  function injectDashboardStrip(){
    const content=document.querySelector('.content');
    if(!content || document.querySelector('.hsm-upgrade-strip')) return;
    const heading=(content.querySelector('h1,h2')?.textContent||'').toLowerCase();
    const body=(content.innerText||'').toLowerCase();
    if(!(heading.includes('dashboard')||body.includes('recent projects')||body.includes('continue shoot'))) return;

    const missing=textCount(/(\d+)\s+(?:shots?|items?)\s+(?:missing|left)/i);
    const cull=textCount(/(\d+)\s+(?:photos?|images?)\s+(?:to cull|waiting to be culled)/i);
    const match=textCount(/(\d+)\s+(?:photos?|images?)\s+(?:to match|need matching)/i);
    const review=/review pending|awaiting review/i.test(document.body.innerText)?'Pending':'Clear';

    const el=document.createElement('section');
    el.className='hsm-upgrade-strip';
    el.innerHTML=`<div class="hsm-upgrade-head"><div><div class="eyebrow">Production workflow</div><h3>What needs attention next</h3><p>High Style Match now keeps the full shoot journey visible from shot list to delivery.</p></div><button class="hsm-byl-btn" type="button">Before You Leave</button></div>
      <div class="hsm-stage-row">${stageNames.map((s,i)=>`<button class="hsm-stage ${i===0?'on':''}" type="button" data-stage="${i}"><b>${i+1}. ${s}</b><span>${i<3?'On shoot':'Post shoot'}</span></button>`).join('')}</div>
      <div class="hsm-attention"><div class="hsm-attention-card"><label>Missing shots</label><b>${missing||'—'}</b><small>Check before leaving location</small></div><div class="hsm-attention-card"><label>Waiting to cull</label><b>${cull||'—'}</b><small>Review strong / weak frames</small></div><div class="hsm-attention-card"><label>Needs matching</label><b>${match||'—'}</b><small>Assign images to the brief</small></div><div class="hsm-attention-card"><label>Client review</label><b>${review}</b><small>Approval and comments</small></div></div>`;
    content.prepend(el);
    el.querySelector('.hsm-byl-btn').addEventListener('click',showBeforeYouLeave);
    el.querySelectorAll('.hsm-stage').forEach(btn=>btn.addEventListener('click',()=>navigateByLabel(stageNames[Number(btn.dataset.stage)])));
  }

  function navigateByLabel(label){
    const target=[...document.querySelectorAll('button,a')].find(x=>(x.textContent||'').trim().toLowerCase().includes(label.toLowerCase()));
    if(target){target.click();return true;} return false;
  }

  function collectShootChecks(){
    const t=document.body.innerText||'';
    const missing=textCount(/(\d+)\s+(?:shots?|items?)\s+(?:missing|left)/i);
    const reshoot=textCount(/(\d+)\s+(?:reshoots?|need another)/i);
    const unmatched=textCount(/(\d+)\s+(?:photos?|images?)\s+(?:unmatched|need matching)/i);
    const captureFolder=/capture folder|capture one/i.test(t)?'Connected / visible':'Check connection';
    return [
      ['Missing required shots', missing?`${missing} still open`:'No count detected'],
      ['Reshoots flagged', reshoot?`${reshoot} flagged`:'None detected'],
      ['Unmatched captures', unmatched?`${unmatched} to review`:'No count detected'],
      ['Capture folder', captureFolder],
      ['Orientation coverage', /portrait/i.test(t)&&/landscape/i.test(t)?'Portrait + landscape present':'Check brief'],
      ['Client notes', /notes?/i.test(t)?'Review notes':'No notes detected']
    ];
  }

  function showBeforeYouLeave(){
    document.querySelector('.hsm-checkback')?.remove();
    const back=document.createElement('div'); back.className='hsm-checkback';
    const checks=collectShootChecks();
    back.innerHTML=`<div class="hsm-checkmodal" role="dialog" aria-modal="true"><div class="eyebrow">Shoot safety check</div><h2>Before You Leave</h2><p>Use this as the final location check before the camera gets packed away.</p><div class="hsm-checkgrid">${checks.map(([a,b])=>`<div class="hsm-checkitem"><span>${a}</span><b>${b}</b></div>`).join('')}</div><div class="hsm-checkactions"><button class="hsm-focus-btn" data-action="close">Keep shooting</button><button class="hsm-byl-btn" data-action="complete">All checked — finish shoot</button></div></div>`;
    document.body.appendChild(back);
    back.addEventListener('click',e=>{if(e.target===back||e.target.dataset.action==='close')back.remove(); if(e.target.dataset.action==='complete'){localStorage.setItem('hsm-last-before-leave',new Date().toISOString());back.remove();}});
  }

  function enhanceLiveShoot(){
    const live=document.querySelector('.live-shell,.live-current');
    if(!live || document.querySelector('.hsm-live-enhance')) return;
    const host=document.querySelector('.live-top')||live;
    const wrap=document.createElement('div'); wrap.className='hsm-live-enhance'; wrap.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;position:relative;z-index:2';
    wrap.innerHTML='<button type="button" class="hsm-focus-btn" data-focus>Focus mode</button><button type="button" class="hsm-byl-btn" data-byl>Before You Leave</button>';
    host.appendChild(wrap);
    wrap.querySelector('[data-byl]').addEventListener('click',showBeforeYouLeave);
    wrap.querySelector('[data-focus]').addEventListener('click',()=>{document.body.classList.toggle('hsm-focus-active');wrap.querySelector('[data-focus]').textContent=document.body.classList.contains('hsm-focus-active')?'Exit focus':'Focus mode';});
  }

  function keyboardShortcuts(){
    if(window.__hsmKeys) return; window.__hsmKeys=true;
    const hint=document.createElement('div');hint.className='hsm-shortcut-hint';document.body.appendChild(hint);
    function flash(s){hint.textContent=s;hint.classList.add('show');clearTimeout(hint._t);hint._t=setTimeout(()=>hint.classList.remove('show'),900)}
    document.addEventListener('keydown',e=>{
      if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) return;
      if(e.key==='Escape'&&document.body.classList.contains('hsm-focus-active')){document.body.classList.remove('hsm-focus-active');flash('Focus mode off');}
      if(e.key==='ArrowRight'){const b=[...document.querySelectorAll('button')].find(x=>/next/i.test(x.textContent||''));if(b){b.click();flash('Next');}}
      if(e.key==='ArrowLeft'){const b=[...document.querySelectorAll('button')].find(x=>/previous|back/i.test(x.textContent||''));if(b){b.click();flash('Previous');}}
      if(e.key.toLowerCase()==='b'){showBeforeYouLeave();flash('Before You Leave');}
    });
  }

  function run(){injectDashboardStrip();enhanceLiveShoot();keyboardShortcuts();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  const mo=new MutationObserver(()=>{clearTimeout(window.__hsmUpT);window.__hsmUpT=setTimeout(run,120)});mo.observe(document.documentElement,{subtree:true,childList:true});
})();
