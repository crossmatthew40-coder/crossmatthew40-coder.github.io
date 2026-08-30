(() => {
  if (window.__highStyleIconCustomizerLoaded) return;
  window.__highStyleIconCustomizerLoaded = true;
  if (typeof getConfig !== 'function' || typeof loadConfig !== 'function') return;

  const ICONS = {
    auto:'',
    calendar:'<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/>',
    phone:'<path d="M7.7 4.5h2.5c.5 0 .9.3 1 .8l.6 3c.1.4 0 .8-.3 1.1l-1.6 1.6a14 14 0 0 0 4.6 4.6l1.6-1.6c.3-.3.7-.4 1.1-.3l3 .6c.5.1.8.5.8 1v2.5c0 .6-.4 1-.9 1.1-.8.1-1.7.2-2.5.2C10.2 20.6 3.4 13.8 3.4 5.9c0-.8.1-1.7.2-2.5.1-.5.5-.9 1.1-.9Z"/>',
    chat:'<path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-5 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="M8 10h8M8 13h5"/>',
    mail:'<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m5 7 7 6 7-6"/>',
    globe:'<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2 2.2 3 4.9 3 8s-1 5.8-3 8c-2-2.2-3-4.9-3-8s1-5.8 3-8Z"/>',
    camera:'<path d="M5 7h3l1.4-2h5.2L16 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="3.5"/>',
    star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
    pin:'<path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/>',
    heart:'<path d="M20 8.5c0 5-8 10-8 10s-8-5-8-10A4.5 4.5 0 0 1 12 5a4.5 4.5 0 0 1 8 3.5Z"/>',
    menu:'<path d="M5 6h14M5 12h14M5 18h14"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    arrow:'<path d="M5 12h14M14 7l5 5-5 5"/>',
    instagram:'<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none"/>',
    linkedin:'<path d="M6.5 9.5V18M6.5 6.5v.01M10.5 18v-5.1c0-2 1.1-3.4 3-3.4 1.8 0 3 1.2 3 3.4V18"/>',
    tiktok:'<path d="M14 5v8.2a3.8 3.8 0 1 1-3.2-3.8M14 5c.8 2 2.1 3.2 4 3.6"/>',
    none:''
  };

  const DEFAULT_BY_TYPE = {booking:'calendar',phone:'phone',whatsapp:'chat',email:'mail',website:'globe',instagram:'instagram',linkedin:'linkedin',tiktok:'tiktok',save:'plus'};
  const ACTIONS = [['booking','Booking / Enquiry'],['phone','Call'],['whatsapp','WhatsApp'],['email','Email'],['website','Website'],['instagram','Instagram'],['linkedin','LinkedIn'],['tiktok','TikTok'],['save','Save Contact']];
  let settings = {enabled:true,shape:'rounded',size:'medium',stroke:'regular',background:'panel',border:true,color:'text',icons:{}};
  const baseGetConfig = getConfig;
  const baseLoadConfig = loadConfig;

  function normalise(s){s=s||{};return {enabled:s.enabled!==false,shape:['square','rounded','soft','circle'].includes(s.shape)?s.shape:'rounded',size:['small','medium','large'].includes(s.size)?s.size:'medium',stroke:['thin','regular','bold'].includes(s.stroke)?s.stroke:'regular',background:['none','panel','accent'].includes(s.background)?s.background:'panel',border:s.border!==false,color:['text','accent','muted'].includes(s.color)?s.color:'text',icons:{...(s.icons||{})}}}
  getConfig=function(){const c=baseGetConfig();c.iconSettings=normalise(settings);return c};
  loadConfig=function(data){const d=data?.config||data||{};settings=normalise(d.iconSettings);baseLoadConfig(data);syncControls();setTimeout(applyPreview,30)};

  const style=document.createElement('style');style.textContent=`
    .icon-custom-card{margin:16px 0 2px;padding:18px;border:1px solid #292929;border-radius:20px;background:linear-gradient(145deg,#111,#090909);box-shadow:0 14px 36px rgba(0,0,0,.14)}.icon-custom-card h3{margin:0;font-size:16px}.icon-custom-card>.desc{margin:5px 0 14px;color:#747474;font-size:11px;line-height:1.5}
    .icon-global-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.icon-global-grid label{margin:0}.icon-global-grid select{width:100%;border:1px solid #2d2d2d;background:#111;color:#fff;border-radius:12px;padding:11px;outline:none}.icon-checks{display:flex;gap:15px;flex-wrap:wrap;margin-top:12px}.icon-check{display:flex;align-items:center;gap:7px;color:#aaa;font-size:10px}.icon-check input{width:auto}
    .icon-per-title{margin:17px 0 8px;padding-top:15px;border-top:1px solid #242424;font-size:12px;font-weight:850}.icon-action-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.icon-action-row{display:grid;grid-template-columns:1fr minmax(120px,.7fr);align-items:center;gap:10px;padding:9px 10px;border:1px solid #272727;border-radius:12px;background:#0d0d0d}.icon-action-row span{font-size:10px;font-weight:800;color:#ddd}.icon-action-row select{min-width:0;border:1px solid #2b2b2b;background:#121212;color:#fff;border-radius:10px;padding:9px;font-size:10px}.icon-preview-note{margin:10px 0 0;color:#666;font-size:9px;line-height:1.45}@media(max-width:720px){.icon-global-grid,.icon-action-list{grid-template-columns:1fr}}`;
  document.head.appendChild(style);

  const panel=document.createElement('section');panel.id='iconCustomizerPanel';panel.className='icon-custom-card';panel.innerHTML=`<h3>Icon Style</h3><p class="desc">Control the icon system for this card, then override individual buttons when a brand needs something different.</p><div class="icon-global-grid"><label>Shape<select id="iconShape"><option value="square">Square</option><option value="rounded">Rounded</option><option value="soft">Soft rounded</option><option value="circle">Circle</option></select></label><label>Size<select id="iconSize"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></label><label>Stroke<select id="iconStroke"><option value="thin">Thin</option><option value="regular">Regular</option><option value="bold">Bold</option></select></label><label>Background<select id="iconBackground"><option value="none">None</option><option value="panel">Premium panel</option><option value="accent">Accent tint</option></select></label><label>Icon colour<select id="iconColor"><option value="text">Main text</option><option value="accent">Brand accent</option><option value="muted">Muted</option></select></label></div><div class="icon-checks"><label class="icon-check"><input id="iconsEnabled" type="checkbox"> Show icons</label><label class="icon-check"><input id="iconBorder" type="checkbox"> Icon border</label></div><div class="icon-per-title">Individual button icons</div><div id="iconActionList" class="icon-action-list"></div><p class="icon-preview-note">Auto keeps the premium recommended graphic. Choose another icon only when you want to override it.</p>`;
  const motion=document.getElementById('animationsButtonsPanel');if(motion?.parentNode)motion.parentNode.insertBefore(panel,motion.nextSibling);else document.querySelector('.editor-panel')?.appendChild(panel);

  const iconOptions=[['auto','Auto · Premium'],['calendar','Calendar'],['phone','Phone'],['chat','Chat'],['mail','Mail'],['globe','Globe'],['camera','Camera'],['star','Star'],['pin','Location'],['heart','Heart'],['menu','Menu'],['plus','Plus'],['arrow','Arrow'],['instagram','Instagram'],['linkedin','LinkedIn'],['tiktok','TikTok'],['none','None']];
  const list=document.getElementById('iconActionList');ACTIONS.forEach(([type,label])=>{const row=document.createElement('label');row.className='icon-action-row';row.innerHTML=`<span>${label}</span><select data-icon-type="${type}"></select>`;const select=row.querySelector('select');iconOptions.forEach(([v,n])=>{const o=document.createElement('option');o.value=v;o.textContent=n;select.appendChild(o)});select.addEventListener('change',()=>{settings.icons[type]=select.value;notify()});list.appendChild(row)});

  function strokeValue(){return settings.stroke==='thin'?'1.3':settings.stroke==='bold'?'2.05':'1.65'}
  function typeFor(a,c){const href=String(a.getAttribute('href')||'');if(/save contact/i.test(a.textContent||''))return'save';if(c.bookingUrl&&href===c.bookingUrl)return'booking';if(href.startsWith('tel:'))return'phone';if(/wa\.me\//i.test(href))return'whatsapp';if(href.startsWith('mailto:'))return'email';if(c.instagram&&href===c.instagram)return'instagram';if(c.linkedin&&href===c.linkedin)return'linkedin';if(c.tiktok&&href===c.tiktok)return'tiktok';if(c.website&&href===c.website)return'website';return'website'}
  function applyOne(a,c){
    const wrap=a.querySelector('.preview-action-icon');if(!wrap)return;
    const type=typeFor(a,c),choice=settings.icons[type]||'auto',iconKey=choice==='auto'?(DEFAULT_BY_TYPE[type]||'globe'):choice,hidden=!settings.enabled||iconKey==='none';
    wrap.style.display=hidden?'none':'grid';const main=a.querySelector('.preview-action-main');if(main)main.style.gap=hidden?'0':'11px';if(hidden)return;
    const svg=wrap.querySelector('svg');
    if(svg&&choice!=='auto'){const signature=iconKey+'|'+strokeValue();if(wrap.dataset.iconRender!==signature){svg.innerHTML=ICONS[iconKey]||ICONS[DEFAULT_BY_TYPE[type]]||ICONS.globe;wrap.dataset.iconRender=signature}}
    if(svg){svg.setAttribute('stroke-width',strokeValue());}
    const px=settings.size==='small'?38:settings.size==='large'?50:44;wrap.style.width=px+'px';wrap.style.height=px+'px';wrap.style.minWidth=px+'px';wrap.style.flexBasis=px+'px';wrap.style.borderRadius=settings.shape==='square'?'8px':settings.shape==='soft'?'18px':settings.shape==='circle'?'50%':'14px';wrap.style.border=settings.border?'1px solid color-mix(in srgb,var(--text,#fff) 14%,var(--border,#333))':'0';wrap.style.background=settings.background==='none'?'transparent':settings.background==='accent'?'radial-gradient(circle at 28% 18%,color-mix(in srgb,var(--accent,#fff) 28%,transparent),transparent 45%),linear-gradient(145deg,color-mix(in srgb,var(--surface,#111) 72%,var(--accent,#fff) 28%),color-mix(in srgb,#050505 70%,var(--surface,#111) 30%))':'radial-gradient(circle at 28% 18%,color-mix(in srgb,var(--text,#fff) 12%,transparent),transparent 42%),linear-gradient(145deg,color-mix(in srgb,var(--surface,#111) 66%,#050505 34%),color-mix(in srgb,#050505 72%,var(--surface,#111) 28%))';wrap.style.boxShadow=settings.background==='none'?'none':'0 7px 17px rgba(0,0,0,.18),inset 0 1px 0 color-mix(in srgb,var(--text,#fff) 13%,transparent),inset 0 -1px 0 rgba(0,0,0,.22)';wrap.style.color=settings.color==='accent'?'var(--accent,#fff)':settings.color==='muted'?'var(--muted,#999)':'var(--text,#fff)';
  }
  function cfg(){try{return getConfig()}catch(e){return{}}}function applyPreview(){const root=document.getElementById('previewButtons');if(!root)return;const c=cfg();root.querySelectorAll('.preview-btn').forEach(a=>applyOne(a,c))}function notify(){if(typeof update==='function')try{update()}catch(e){}setTimeout(applyPreview,40);if(typeof showStatus==='function')showStatus('Icon style updated.')}
  function syncControls(){const map={iconShape:'shape',iconSize:'size',iconStroke:'stroke',iconBackground:'background',iconColor:'color'};Object.entries(map).forEach(([id,k])=>{const el=document.getElementById(id);if(el)el.value=settings[k]});document.getElementById('iconsEnabled').checked=settings.enabled;document.getElementById('iconBorder').checked=settings.border;document.querySelectorAll('[data-icon-type]').forEach(el=>el.value=settings.icons[el.dataset.iconType]||'auto')}
  [['iconShape','shape'],['iconSize','size'],['iconStroke','stroke'],['iconBackground','background'],['iconColor','color']].forEach(([id,key])=>document.getElementById(id).addEventListener('change',e=>{settings[key]=e.target.value;notify()}));document.getElementById('iconsEnabled').addEventListener('change',e=>{settings.enabled=e.target.checked;notify()});document.getElementById('iconBorder').addEventListener('change',e=>{settings.border=e.target.checked;notify()});
  const preview=document.getElementById('previewButtons');if(preview){let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;applyPreview()})}).observe(preview,{childList:true,subtree:true})}
  window.highStyleIconCustomizer={get:()=>normalise(settings),set:s=>{settings=normalise(s);syncControls();notify()},icons:Object.keys(ICONS)};syncControls();setTimeout(applyPreview,180);
})();