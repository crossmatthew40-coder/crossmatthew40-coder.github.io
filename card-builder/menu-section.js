(() => {
  if(window.__highStyleMenuSectionLoaded) return;
  window.__highStyleMenuSectionLoaded=true;
  if(typeof getConfig!=='function'||typeof loadConfig!=='function'||typeof updatePreview!=='function') return;

  let menuUrl='';
  let menuLabel='View Menu';
  const baseGetConfig=getConfig, baseLoadConfig=loadConfig, baseUpdatePreview=updatePreview;

  function normalise(raw){
    let v=String(raw||'').trim();
    if(!v)return '';
    if(!/^https?:\/\//i.test(v))v='https://'+v;
    try{return new URL(v).href}catch(e){return ''}
  }

  getConfig=function(){
    const c=baseGetConfig();
    c.menuUrl=normalise(menuUrl);
    c.menuLabel=(menuLabel||'View Menu').trim();
    return c;
  };

  loadConfig=function(data){
    const d=data?.config||data||{};
    menuUrl=d.menuUrl||'';
    menuLabel=d.menuLabel||'View Menu';
    baseLoadConfig(data);
    syncInputs();
  };

  function renderPreview(c){
    let section=document.getElementById('previewMenuWrap');
    const services=document.getElementById('previewServicesWrap');
    if(!section){
      section=document.createElement('div');
      section.id='previewMenuWrap';section.className='preview-section menu-preview';
      section.innerHTML='<p class="preview-label">Menu</p><a class="menu-preview-link" target="_blank" rel="noopener"><span></span><b>→</b></a>';
      if(services?.parentNode)services.parentNode.insertBefore(section,services);else document.querySelector('.preview-scroll')?.appendChild(section);
    }
    const link=section.querySelector('a');
    if(c.menuUrl){section.style.display='block';link.href=c.menuUrl;link.querySelector('span').textContent=c.menuLabel||'View Menu';}
    else section.style.display='none';
  }

  updatePreview=function(c){baseUpdatePreview(c);renderPreview(c)};

  const style=document.createElement('style');
  style.textContent=`
    .menu-builder-card{margin:16px 0 2px;padding:18px;border:1px solid #292929;border-radius:20px;background:linear-gradient(145deg,#111,#090909);box-shadow:0 14px 36px rgba(0,0,0,.14)}
    .menu-builder-card h3{margin:0;font-size:16px}.menu-builder-card>p{margin:5px 0 14px;color:#747474;font-size:11px;line-height:1.5}.menu-builder-grid{display:grid;grid-template-columns:1.35fr .65fr;gap:10px}.menu-detected{margin-top:9px;color:#7eaa84;font-size:9px;min-height:14px}
    .menu-preview-link{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 13px;border:1px solid color-mix(in srgb,var(--text,#fff) 10%,var(--border,#333));border-radius:14px;background:linear-gradient(145deg,color-mix(in srgb,var(--surface,#111) 90%,var(--accent,#fff) 10%),var(--surface,#111));color:var(--text,#fff);text-decoration:none;font-size:11px;font-weight:800;box-shadow:inset 0 1px 0 color-mix(in srgb,var(--text,#fff) 8%,transparent)}.menu-preview-link b{font-size:17px}
    @media(max-width:640px){.menu-builder-grid{grid-template-columns:1fr}}
  `;document.head.appendChild(style);

  const panel=document.createElement('section');panel.id='menuBuilderPanel';panel.className='menu-builder-card';
  panel.innerHTML=`<h3>Menu</h3><p>Add the customer's food, drinks or main menu to the card. The website scan will try to find it automatically.</p><div class="menu-builder-grid"><label>Menu URL<input id="menuUrlInput" inputmode="url" placeholder="https://restaurant.co.uk/menu or menu.pdf"></label><label>Button text<input id="menuLabelInput" value="View Menu" placeholder="View Menu"></label></div><div class="menu-detected" id="menuDetectedNote"></div>`;
  const contentHead=[...document.querySelectorAll('.section-head')].find(el=>/content/i.test(el.textContent));
  if(contentHead?.parentNode)contentHead.parentNode.insertBefore(panel,contentHead);else document.querySelector('.editor-panel')?.appendChild(panel);

  function syncInputs(){
    const u=document.getElementById('menuUrlInput'),l=document.getElementById('menuLabelInput');
    if(u)u.value=menuUrl;if(l)l.value=menuLabel||'View Menu';
  }
  document.getElementById('menuUrlInput').addEventListener('input',e=>{menuUrl=e.target.value;update()});
  document.getElementById('menuLabelInput').addEventListener('input',e=>{menuLabel=e.target.value||'View Menu';update()});

  function menuLinks(text,base){
    const out=[];const re=/\[([^\]]{1,120})\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/gi;let m;
    while((m=re.exec(text))){try{const url=new URL(m[2],base).href;const hay=(m[1]+' '+url).toLowerCase();let score=0;if(/\bmenus?\b/.test(m[1].toLowerCase()))score+=10;if(/\/menus?\b|menu\.pdf|food-menu|drink-menu|restaurant-menu|bar-menu/.test(hay))score+=8;if(/food|drink|dining/.test(m[1].toLowerCase()))score+=3;if(/privacy|cookie|footer|navigation/.test(hay))score-=10;if(score>0)out.push({url,label:m[1].replace(/[*_`]/g,'').trim(),score});}catch(e){}}
    return out.sort((a,b)=>b.score-a.score);
  }
  async function detectMenu(){
    const raw=document.getElementById('scanUrl')?.value.trim();if(!raw)return;
    let site=raw;if(!/^https?:\/\//i.test(site))site='https://'+site;
    try{
      site=new URL(site).href;
      const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),16000);
      const res=await fetch('https://r.jina.ai/'+site,{headers:{Accept:'text/plain'},signal:controller.signal});clearTimeout(timer);
      if(!res.ok)return;const text=(await res.text()).slice(0,100000);const hit=menuLinks(text,site)[0];
      if(hit){menuUrl=hit.url;menuLabel=/drink/i.test(hit.label)&&!/food/i.test(hit.label)?'View Drinks Menu':'View Menu';syncInputs();update();document.getElementById('menuDetectedNote').textContent='Menu found on the website and added to the card.';if(typeof showStatus==='function')showStatus('Menu found — Menu section added to the card.');}
      else document.getElementById('menuDetectedNote').textContent='No clear menu link found automatically — you can paste one above.';
    }catch(e){}
  }
  const scan=document.getElementById('scanWebsite');if(scan)scan.addEventListener('click',()=>setTimeout(detectMenu,150));
  const scanUrl=document.getElementById('scanUrl');if(scanUrl)scanUrl.addEventListener('keydown',e=>{if(e.key==='Enter')setTimeout(detectMenu,150)});

  window.highStyleMenu={set(url,label='View Menu'){menuUrl=url;menuLabel=label;syncInputs();update()},get(){return{menuUrl:normalise(menuUrl),menuLabel}}};
  syncInputs();update();
})();