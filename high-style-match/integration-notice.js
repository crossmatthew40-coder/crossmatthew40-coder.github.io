(function(){
  const css=`
  .hsm-integration-card{margin:0 0 20px;padding:18px;border:1px solid #2b2f39;border-radius:16px;background:linear-gradient(135deg,#11131a,#171426);display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center}
  .hsm-integration-card .eyebrow{color:#aa96ff;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
  .hsm-integration-card h3{margin:5px 0 7px;font-size:20px;letter-spacing:-.02em}.hsm-integration-card p{margin:0;color:#a7adba;font-size:12px;line-height:1.55;max-width:760px}
  .hsm-integration-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.hsm-integration-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 13px;border-radius:10px;text-decoration:none;font-size:11px;font-weight:850;color:#fff;border:1px solid #343948;background:#171a22}.hsm-integration-actions a.primary{background:linear-gradient(135deg,#6D4EEE,#8D6CFF);border-color:transparent}
  .hsm-integration-disclaimer{grid-column:1/-1;border-top:1px solid #2a2e39;padding-top:12px;color:#7f8694;font-size:10px;line-height:1.5}.hsm-integration-disclaimer strong{color:#adb3be}
  @media(max-width:760px){.hsm-integration-card{grid-template-columns:1fr}.hsm-integration-actions{justify-content:flex-start}}
  `;
  const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);

  function inject(){
    const content=document.querySelector('.content');
    if(!content||document.querySelector('.hsm-integration-card'))return;
    const text=(content.innerText||'').toLowerCase();
    const heading=(content.querySelector('h1,h2')?.textContent||'').toLowerCase();
    if(!(heading.includes('dashboard')||text.includes('recent projects')||text.includes('continue shoot')))return;

    const card=document.createElement('section');
    card.className='hsm-integration-card';
    card.innerHTML=`
      <div>
        <div class="eyebrow">Capture workflow integration</div>
        <h3>Works with Capture One session and export folders.</h3>
        <p>High Style Match can monitor folders you choose, organise incoming captures, track the active shot list and prepare finished exports for client delivery. It does not replace Capture One or modify its software.</p>
      </div>
      <div class="hsm-integration-actions">
        <a class="primary" href="./capture-one/">Add Capture One workflow</a>
        <a href="./transfer/">Deliver files</a>
      </div>
      <div class="hsm-integration-disclaimer"><strong>Independent product notice:</strong> High Style Match is an independent High Style Group product and is not affiliated with, endorsed by, sponsored by or part of Capture One. “Capture One” is used only to identify compatibility with a photographer’s own Capture One workflow and folders.</div>`;
    const workflow=document.querySelector('.hsm-upgrade-strip');
    if(workflow&&workflow.parentNode===content)workflow.insertAdjacentElement('afterend',card);else content.prepend(card);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject,{once:true});else inject();
  const mo=new MutationObserver(()=>{clearTimeout(window.__hsmIntegrationT);window.__hsmIntegrationT=setTimeout(inject,140)});mo.observe(document.documentElement,{subtree:true,childList:true});
})();
