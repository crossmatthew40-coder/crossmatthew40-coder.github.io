(() => {
  if (window.__highStyleAnimationsButtonsLoaded) return;
  window.__highStyleAnimationsButtonsLoaded = true;
  if (typeof getConfig !== 'function' || typeof loadConfig !== 'function' || typeof updatePreview !== 'function') return;

  const ACTIONS = [
    {type:'booking', name:'Booking / Enquiry'},
    {type:'phone', name:'Call'},
    {type:'whatsapp', name:'WhatsApp'},
    {type:'email', name:'Email'},
    {type:'website', name:'Website'},
    {type:'instagram', name:'Instagram'},
    {type:'linkedin', name:'LinkedIn'},
    {type:'tiktok', name:'TikTok'}
  ];

  let hidden = new Set();
  let forcedOn = new Set();
  let saveContactEnabled = true;
  let animations = {entrance:'fade-up', buttons:'stagger', accent:'soft-pulse'};

  const baseGetConfig = getConfig;
  const baseLoadConfig = loadConfig;
  const baseUpdatePreview = updatePreview;

  function hasValue(type,c){
    if(type==='booking') return !!c.bookingUrl;
    if(type==='phone') return !!c.phone;
    if(type==='whatsapp') return !!c.whatsapp;
    if(type==='email') return !!c.email;
    if(type==='website') return !!c.website;
    if(type==='instagram') return !!c.instagram;
    if(type==='linkedin') return !!c.linkedin;
    if(type==='tiktok') return !!c.tiktok;
    return false;
  }

  function defaultLabel(type,c){
    if(type==='booking') return c.bookingLabel || 'Make an Enquiry';
    if(type==='phone') return 'Call';
    if(type==='whatsapp') return 'WhatsApp';
    if(type==='email') return 'Email';
    if(type==='website') return 'Visit Website';
    if(type==='instagram') return c.instagramLabel || 'Instagram';
    if(type==='linkedin') return 'LinkedIn';
    if(type==='tiktok') return 'TikTok';
    return type;
  }

  function managedActions(c){
    const existing = Array.isArray(c.actions) ? c.actions : [];
    const hasPlan = existing.length > 0;
    const byType = new Map(existing.map(a => [a.type,{...a}]));
    const out = [];

    ACTIONS.forEach(def => {
      if(!hasValue(def.type,c)) return;
      const current = byType.get(def.type);
      const defaultEnabled = hasPlan ? !!current : true;
      const enabled = !hidden.has(def.type) && (forcedOn.has(def.type) || defaultEnabled);
      if(!enabled) return;
      out.push({
        type:def.type,
        label:current?.label || defaultLabel(def.type,c),
        primary:!!current?.primary
      });
    });

    if(out.length && !out.some(a=>a.primary)) out[0].primary = true;
    if(out.filter(a=>a.primary).length > 1){
      let found=false;
      out.forEach(a=>{ if(a.primary && !found) found=true; else a.primary=false; });
    }
    return out;
  }

  getConfig = function(){
    const c = baseGetConfig();
    c.actions = managedActions(c);
    c.buttonSettings = {
      managed:true,
      hidden:[...hidden],
      saveContact:saveContactEnabled
    };
    c.saveContactEnabled = saveContactEnabled;
    c.animations = {...animations};
    return c;
  };

  loadConfig = function(data){
    const d = data?.config || data || {};
    const settings = d.buttonSettings || {};
    hidden = new Set(Array.isArray(settings.hidden) ? settings.hidden : []);
    forcedOn = new Set();
    saveContactEnabled = d.saveContactEnabled !== false && settings.saveContact !== false;
    animations = {
      entrance:d.animations?.entrance || 'fade-up',
      buttons:d.animations?.buttons || 'stagger',
      accent:d.animations?.accent || 'soft-pulse'
    };
    baseLoadConfig(data);
    syncControls();
  };

  updatePreview = function(c){
    baseUpdatePreview(c);
    applyPreviewAnimation(c?.animations || animations,false);
    renderButtonManager(c);
    if(c?.saveContactEnabled === false || c?.buttonSettings?.saveContact === false){
      const buttons = document.getElementById('previewButtons');
      [...(buttons?.querySelectorAll('.preview-btn') || [])].forEach(el=>{
        if(/save contact/i.test(el.textContent || '')) el.remove();
      });
    }
  };

  const style = document.createElement('style');
  style.textContent = `
    .motion-buttons-card{margin:16px 0 2px;padding:18px;border:1px solid #292929;border-radius:20px;background:linear-gradient(145deg,#111,#090909);box-shadow:0 14px 36px rgba(0,0,0,.14)}
    .motion-buttons-card h3{margin:0;font-size:16px}.motion-buttons-card>.desc{margin:5px 0 15px;color:#747474;font-size:11px;line-height:1.5}
    .motion-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.motion-grid label{margin:0}.motion-grid select{width:100%;border:1px solid #2d2d2d;background:#111;color:#fff;border-radius:12px;padding:11px;outline:none}
    .button-manager-head{display:flex;justify-content:space-between;gap:12px;align-items:end;margin-top:18px;padding-top:17px;border-top:1px solid #242424}.button-manager-head h4{margin:0;font-size:14px}.button-manager-head p{margin:4px 0 0;color:#707070;font-size:10px;line-height:1.4}.button-manager-head button{border:1px solid #333;border-radius:10px;background:#161616;color:#ddd;padding:8px 10px;font-size:9px;font-weight:800;cursor:pointer;white-space:nowrap}
    .button-manager-list{display:grid;gap:7px;margin-top:11px}.manage-button-row{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #272727;border-radius:13px;background:#0d0d0d;padding:10px 11px}.manage-button-copy{min-width:0}.manage-button-name{font-size:11px;font-weight:850;color:#eee}.manage-button-value{font-size:9px;color:#656565;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:330px}.manage-button-row.off{opacity:.55}.manage-button-row.unavailable{display:none}
    .switch{position:relative;display:inline-flex;width:42px;height:24px;flex:0 0 auto}.switch input{position:absolute;opacity:0;pointer-events:none}.switch-track{position:absolute;inset:0;border-radius:999px;background:#292929;border:1px solid #393939;transition:.18s}.switch-track:after{content:'';position:absolute;width:18px;height:18px;left:2px;top:2px;border-radius:50%;background:#888;transition:.18s}.switch input:checked+.switch-track{background:#fff;border-color:#fff}.switch input:checked+.switch-track:after{transform:translateX(18px);background:#050505}
    .animation-preview-note{margin-top:10px;color:#666;font-size:9px;line-height:1.45}
    .card-preview.anim-entrance-fade-up.anim-replay .preview-brand{animation:hsFadeUp .55s cubic-bezier(.2,.7,.2,1) both}.card-preview.anim-entrance-slide-up.anim-replay .preview-brand{animation:hsSlideUp .6s cubic-bezier(.2,.7,.2,1) both}.card-preview.anim-entrance-scale-in.anim-replay .preview-brand{animation:hsScaleIn .5s cubic-bezier(.2,.7,.2,1) both}
    .card-preview.anim-buttons-stagger.anim-replay .preview-btn{animation:hsFadeUp .42s ease both}.card-preview.anim-buttons-stagger.anim-replay .preview-btn:nth-child(2){animation-delay:.06s}.card-preview.anim-buttons-stagger.anim-replay .preview-btn:nth-child(3){animation-delay:.12s}.card-preview.anim-buttons-stagger.anim-replay .preview-btn:nth-child(4){animation-delay:.18s}.card-preview.anim-buttons-stagger.anim-replay .preview-btn:nth-child(5){animation-delay:.24s}.card-preview.anim-buttons-stagger.anim-replay .preview-btn:nth-child(6){animation-delay:.30s}
    .card-preview.anim-buttons-float .preview-btn{animation:hsFloat 4.5s ease-in-out infinite}.card-preview.anim-buttons-float .preview-btn:nth-child(even){animation-delay:-2.2s}.card-preview.anim-buttons-glow .preview-btn.primary{animation:hsButtonGlow 2.8s ease-in-out infinite}
    .card-preview.anim-accent-soft-pulse .preview-brand:before{animation:hsAccentPulse 4s ease-in-out infinite}.card-preview.anim-accent-drift .preview-brand:before{animation:hsAccentDrift 6s ease-in-out infinite alternate}
    @keyframes hsFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@keyframes hsSlideUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}@keyframes hsScaleIn{from{opacity:0;transform:scale(.965)}to{opacity:1;transform:scale(1)}}@keyframes hsFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}@keyframes hsButtonGlow{0%,100%{filter:none}50%{filter:brightness(1.08);box-shadow:0 16px 34px color-mix(in srgb,var(--accent,#fff) 28%,transparent)}}@keyframes hsAccentPulse{0%,100%{opacity:.65;transform:scale(.94)}50%{opacity:1;transform:scale(1.08)}}@keyframes hsAccentDrift{from{transform:translate(-12px,6px) scale(.95)}to{transform:translate(14px,-8px) scale(1.08)}}
    @media(max-width:720px){.motion-grid{grid-template-columns:1fr}.button-manager-head{align-items:flex-start}}
    @media(prefers-reduced-motion:reduce){.card-preview [class*='preview-'],.card-preview:before,.card-preview .preview-btn{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(style);

  const panel = document.createElement('section');
  panel.id = 'animationsButtonsPanel';
  panel.className = 'motion-buttons-card';
  panel.innerHTML = `
    <h3>Animations & Buttons</h3>
    <p class="desc">Add subtle premium movement, then keep only the customer actions that are actually useful.</p>
    <div class="motion-grid">
      <label>Card entrance<select id="animationEntrance"><option value="none">None</option><option value="fade-up">Fade up</option><option value="slide-up">Slide up</option><option value="scale-in">Soft scale in</option></select></label>
      <label>Button motion<select id="animationButtons"><option value="none">None</option><option value="stagger">Stagger in</option><option value="float">Soft float</option><option value="glow">Primary glow</option></select></label>
      <label>Accent glow<select id="animationAccent"><option value="none">Static</option><option value="soft-pulse">Soft pulse</option><option value="drift">Slow drift</option></select></label>
    </div>
    <div class="button-manager-head"><div><h4>Card Buttons</h4><p>Switch off anything the customer does not need. Their saved details stay in the card.</p></div><button type="button" id="restoreSuggestedButtons">Restore suggested</button></div>
    <div class="button-manager-list" id="buttonManagerList"></div>
    <p class="animation-preview-note">Animations are kept subtle and automatically disabled for visitors who prefer reduced motion.</p>`;

  const fontPanel = document.getElementById('fontControls');
  if(fontPanel?.parentNode) fontPanel.parentNode.insertBefore(panel,fontPanel.nextSibling);
  else {
    const contactHead = [...document.querySelectorAll('.section-head')].find(el=>/contact/i.test(el.textContent));
    contactHead?.parentNode?.insertBefore(panel,contactHead);
  }

  function actionValue(type,c){
    if(type==='booking') return c.bookingUrl || 'No booking link';
    if(type==='phone') return c.phoneDisplay || c.phone || 'No phone';
    if(type==='whatsapp') return c.whatsapp || 'No WhatsApp';
    if(type==='email') return c.email || 'No email';
    if(type==='website') return c.website || 'No website';
    if(type==='instagram') return c.instagramLabel || c.instagram || 'No Instagram';
    if(type==='linkedin') return c.linkedin || 'No LinkedIn';
    if(type==='tiktok') return c.tiktok || 'No TikTok';
    return '';
  }

  function basePlannedTypes(c){
    return new Set((Array.isArray(c.actions)?c.actions:[]).map(a=>a.type));
  }

  function renderButtonManager(c){
    const list = document.getElementById('buttonManagerList');
    if(!list) return;
    const raw = (()=>{try{return baseGetConfig()}catch(e){return c||{}}})();
    const planned = basePlannedTypes(raw);
    const hasPlan = planned.size > 0;
    list.innerHTML='';

    ACTIONS.forEach(def=>{
      const available = hasValue(def.type,raw);
      const defaultOn = hasPlan ? planned.has(def.type) : available;
      const checked = available && !hidden.has(def.type) && (forcedOn.has(def.type) || defaultOn);
      const row=document.createElement('div');
      row.className='manage-button-row'+(available?'':' unavailable')+(checked?'':' off');
      row.innerHTML=`<div class="manage-button-copy"><div class="manage-button-name"></div><div class="manage-button-value"></div></div><label class="switch"><input type="checkbox"><span class="switch-track"></span></label>`;
      row.querySelector('.manage-button-name').textContent=def.name;
      row.querySelector('.manage-button-value').textContent=actionValue(def.type,raw);
      const input=row.querySelector('input'); input.checked=checked;
      input.addEventListener('change',()=>{
        if(input.checked){hidden.delete(def.type);if(!defaultOn)forcedOn.add(def.type)}
        else{forcedOn.delete(def.type);hidden.add(def.type)}
        row.classList.toggle('off',!input.checked);
        update();
        if(typeof showStatus==='function') showStatus(`${def.name} ${input.checked?'shown':'removed'} from the card.`);
      });
      list.appendChild(row);
    });

    const canSave = !!(raw.phone || raw.email || raw.website);
    const saveRow=document.createElement('div');
    saveRow.className='manage-button-row'+(canSave?'':' unavailable')+(saveContactEnabled?'':' off');
    saveRow.innerHTML=`<div class="manage-button-copy"><div class="manage-button-name">Save Contact</div><div class="manage-button-value">Download customer details to the visitor's phone</div></div><label class="switch"><input type="checkbox"><span class="switch-track"></span></label>`;
    const saveInput=saveRow.querySelector('input'); saveInput.checked=canSave&&saveContactEnabled;
    saveInput.addEventListener('change',()=>{
      saveContactEnabled=saveInput.checked;
      saveRow.classList.toggle('off',!saveInput.checked);
      update();
      if(typeof showStatus==='function') showStatus(`Save Contact ${saveInput.checked?'shown':'removed'} from the card.`);
    });
    list.appendChild(saveRow);
  }

  function className(value,prefix){ return value && value!=='none' ? prefix+value : ''; }
  function applyPreviewAnimation(a,replay=false){
    const card=document.getElementById('cardPreview'); if(!card) return;
    [...card.classList].filter(c=>c.startsWith('anim-')).forEach(c=>card.classList.remove(c));
    [className(a.entrance,'anim-entrance-'),className(a.buttons,'anim-buttons-'),className(a.accent,'anim-accent-')].filter(Boolean).forEach(c=>card.classList.add(c));
    if(replay){card.classList.remove('anim-replay');void card.offsetWidth;card.classList.add('anim-replay');setTimeout(()=>card.classList.remove('anim-replay'),1100);}
  }

  function syncControls(){
    const entrance=document.getElementById('animationEntrance');
    const buttons=document.getElementById('animationButtons');
    const accent=document.getElementById('animationAccent');
    if(entrance) entrance.value=animations.entrance;
    if(buttons) buttons.value=animations.buttons;
    if(accent) accent.value=animations.accent;
    renderButtonManager((()=>{try{return getConfig()}catch(e){return {}}})());
    applyPreviewAnimation(animations,false);
  }

  ['animationEntrance','animationButtons','animationAccent'].forEach(id=>{
    document.getElementById(id)?.addEventListener('change',()=>{
      animations={
        entrance:document.getElementById('animationEntrance').value,
        buttons:document.getElementById('animationButtons').value,
        accent:document.getElementById('animationAccent').value
      };
      update(); applyPreviewAnimation(animations,true);
      if(typeof showStatus==='function') showStatus('Card animation updated.');
    });
  });

  document.getElementById('restoreSuggestedButtons')?.addEventListener('click',()=>{
    hidden.clear(); forcedOn.clear(); saveContactEnabled=true; update();
    if(typeof showStatus==='function') showStatus('Suggested card buttons restored.');
  });

  document.getElementById('scanWebsite')?.addEventListener('click',()=>{
    hidden.clear(); forcedOn.clear(); saveContactEnabled=true;
  });

  window.highStyleAnimationButtonControls={
    animations:()=>({...animations}),
    hidden:()=>[...hidden],
    reset(){hidden.clear();forcedOn.clear();saveContactEnabled=true;update();}
  };

  syncControls();
  try{update();applyPreviewAnimation(animations,true)}catch(e){console.error(e)}
})();