(() => {
  const scanButton = document.getElementById('scanWebsite');
  const scanResults = document.getElementById('scanResults');
  const scanCard = document.getElementById('websiteScanner');
  if (!scanButton || !scanResults || !scanCard) return;

  let smartActions = [];
  let smartDesignStyle = 'clean';
  let lastHandledScan = '';

  const baseGetConfig = getConfig;
  const baseLoadConfig = loadConfig;
  const baseUpdatePreview = updatePreview;

  const style = document.createElement('style');
  style.textContent = `
    .smart-build-summary{display:none;margin-top:14px;padding:14px;border:1px solid #282828;border-radius:15px;background:#0a0a0a}.smart-build-summary.show{display:block}
    .smart-build-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.smart-build-top h3{margin:2px 0 4px;font-size:15px}.smart-build-top p{margin:0;color:#777;font-size:11px;line-height:1.45}.smart-type{font-size:9px;letter-spacing:.12em;text-transform:uppercase;border:1px solid #333;border-radius:999px;padding:6px 8px;color:#bbb;white-space:nowrap}
    .smart-button-list{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.smart-button-pill{padding:7px 9px;border:1px solid #303030;border-radius:999px;background:#151515;color:#ddd;font-size:10px;font-weight:750}.smart-button-pill.primary{background:#fff;color:#050505;border-color:#fff}
    .smart-design-line{margin-top:10px;color:#707070;font-size:10px}.smart-design-line strong{color:#bbb}
    .card-preview.smart-style-luxury .preview-brand h3{font-family:Georgia,"Times New Roman",serif;font-weight:600;letter-spacing:-.035em}.card-preview.smart-style-luxury .preview-btn{border-radius:10px}.card-preview.smart-style-luxury .preview-logo{border-radius:50%}
    .card-preview.smart-style-bold .preview-brand h3{font-weight:950;letter-spacing:-.065em;text-transform:uppercase}.card-preview.smart-style-bold .preview-btn{border-radius:10px;border-width:2px}.card-preview.smart-style-bold .preview-logo{border-radius:12px}
    .card-preview.smart-style-soft .preview-btn{border-radius:25px}.card-preview.smart-style-soft .preview-logo{border-radius:50%}.card-preview.smart-style-soft .chip{border-radius:18px}
    .card-preview.smart-style-clean .preview-btn{border-radius:15px}
  `;
  document.head.appendChild(style);

  const summary = document.createElement('div');
  summary.className = 'smart-build-summary';
  summary.id = 'smartBuildSummary';
  summary.innerHTML = `
    <div class="smart-build-top">
      <div>
        <div class="scan-rec-title" style="margin:0 0 3px">Automatic card setup</div>
        <h3>Buttons chosen for this business</h3>
        <p>The scanner ranks the actions a customer is most likely to need and keeps the card focused.</p>
      </div>
      <span class="smart-type" id="smartBusinessType">Business</span>
    </div>
    <div class="smart-button-list" id="smartButtonList"></div>
    <div class="smart-design-line">Design treatment: <strong id="smartDesignStyle">Clean</strong></div>`;
  scanCard.appendChild(summary);

  function actionLabel(action, c){
    if (action.label) return action.label;
    const labels = {
      booking: c.bookingLabel || 'Make an Enquiry',
      phone: 'Call', whatsapp: 'WhatsApp', email: 'Email', website: 'Website',
      instagram: c.instagramLabel || 'Instagram', linkedin: 'LinkedIn', tiktok: 'TikTok'
    };
    return labels[action.type] || action.type;
  }

  getConfig = function(){
    const c = baseGetConfig();
    c.actions = smartActions.map(a => ({type:a.type,label:a.label,primary:!!a.primary}));
    c.designStyle = smartDesignStyle;
    return c;
  };

  loadConfig = function(data){
    const d = data.config || data || {};
    smartActions = Array.isArray(d.actions) ? d.actions.map(a=>({...a})) : [];
    smartDesignStyle = d.designStyle || 'clean';
    baseLoadConfig(data);
  };

  updatePreview = function(c){
    baseUpdatePreview(c);
    const card = document.getElementById('cardPreview');
    card.classList.remove('smart-style-luxury','smart-style-bold','smart-style-soft','smart-style-clean');
    card.classList.add('smart-style-' + (c.designStyle || smartDesignStyle || 'clean'));
    if (!Array.isArray(c.actions) || !c.actions.length) return;
    const buttons = document.getElementById('previewButtons');
    buttons.innerHTML = '';
    c.actions.forEach(a => addPreviewButton(buttons, actionLabel(a,c), !!a.primary));
    if (c.phone || c.email || c.website) addPreviewButton(buttons,'Save Contact');
  };

  window.setSmartActionPlan = function(plan, businessType){
    smartActions = Array.isArray(plan) ? plan.map(a=>({...a})) : [];
    renderSummary(businessType || 'Business');
    update();
  };

  function has(id){ return !!(document.getElementById(id) && document.getElementById(id).value.trim()); }
  function val(id){ return document.getElementById(id) ? document.getElementById(id).value.trim() : ''; }

  function inferBusiness(){
    const hay = [val('businessName'),val('role'),val('tagline'),val('services'),val('website')].join(' ').toLowerCase();
    const test=(re)=>re.test(hay);
    if(test(/hotel|accommodation|bedroom|rooms|resort|inn|guest house|stay\b/)) return {type:'Hotel / accommodation', key:'hotel', booking:'Book a Stay'};
    if(test(/restaurant|bistro|brasserie|cafe|coffee|bar\b|pub\b|dining|food|pizza|grill/)) return {type:'Restaurant / hospitality', key:'restaurant', booking:'Book a Table'};
    if(test(/photograph|creative|content|videograph|studio|production|marketing agency/)) return {type:'Creative / photography', key:'creative', booking:test(/photograph/) ? 'Book a Shoot' : 'Start a Project'};
    if(test(/salon|spa\b|beauty|hair|barber|clinic|dentist|therapy|treatment|wellness/)) return {type:'Appointments / wellness', key:'appointment', booking:'Book an Appointment'};
    if(test(/plumb|electric|roofer|roofing|builder|construction|landscap|joiner|carpenter|decorator|trade\b|repair/)) return {type:'Trade / local service', key:'trade', booking:'Get a Quote'};
    if(test(/shop\b|store\b|retail|ecommerce|e-commerce|products|collection|buy online/)) return {type:'Retail / ecommerce', key:'retail', booking:'Shop Online'};
    if(test(/gym\b|fitness|personal train|coach|pilates|yoga/)) return {type:'Fitness / coaching', key:'fitness', booking:'Book a Session'};
    if(test(/estate agent|property|letting|mortgage|financial|accountant|solicitor|consultant|consulting/)) return {type:'Professional service', key:'professional', booking:'Make an Enquiry'};
    return {type:'Business', key:'general', booking:'Make an Enquiry'};
  }

  function available(type){
    if(type==='booking') return has('bookingUrl');
    if(type==='phone') return has('phone');
    if(type==='whatsapp') return has('whatsapp');
    if(type==='email') return has('email');
    if(type==='website') return has('website');
    if(type==='instagram') return has('instagram');
    if(type==='linkedin') return has('linkedin');
    if(type==='tiktok') return has('tiktok');
    return false;
  }

  function chooseActions(info){
    const priority = {
      hotel:['booking','phone','website','instagram','email'],
      restaurant:['booking','phone','instagram','website','whatsapp'],
      creative:['booking','instagram','phone','email','website','linkedin'],
      appointment:['booking','phone','whatsapp','instagram','website'],
      trade:['booking','phone','whatsapp','email','website'],
      retail:['website','instagram','phone','email','tiktok'],
      fitness:['booking','instagram','whatsapp','phone','website'],
      professional:['booking','phone','email','linkedin','website'],
      general:['booking','phone','whatsapp','email','website','instagram','linkedin']
    }[info.key] || [];

    if(has('bookingUrl')) setValue('bookingLabel', info.booking);
    const chosen = [];
    priority.forEach(type => {
      if(chosen.length>=5 || !available(type) || chosen.some(x=>x.type===type)) return;
      let label='';
      if(type==='booking') label=info.booking;
      if(type==='website' && info.key==='retail') label='Shop Online';
      if(type==='phone') label= info.key==='hotel' || info.key==='restaurant' ? 'Call Us' : 'Call';
      if(type==='whatsapp') label='WhatsApp';
      if(type==='email') label='Email';
      if(type==='instagram') label='Instagram';
      if(type==='linkedin') label='LinkedIn';
      if(type==='tiktok') label='TikTok';
      if(type==='website' && !label) label='Visit Website';
      chosen.push({type,label,primary:false});
    });
    if(chosen.length) chosen[0].primary=true;
    return chosen;
  }

  function deriveStyle(){
    const mood = (document.getElementById('designMood')?.textContent || '').toLowerCase();
    if(/premium|editorial|refined|understated/.test(mood)) return 'luxury';
    if(/bold|modern/.test(mood)) return 'bold';
    if(/warm|welcoming/.test(mood)) return 'soft';
    return 'clean';
  }

  function renderSummary(type){
    document.getElementById('smartBusinessType').textContent = type;
    document.getElementById('smartDesignStyle').textContent = smartDesignStyle.charAt(0).toUpperCase()+smartDesignStyle.slice(1);
    const list=document.getElementById('smartButtonList'); list.innerHTML='';
    const c=baseGetConfig();
    smartActions.forEach(a=>{
      const p=document.createElement('span'); p.className='smart-button-pill'+(a.primary?' primary':''); p.textContent=actionLabel(a,c); list.appendChild(p);
    });
    summary.classList.add('show');
  }

  function autoBuildFromScan(){
    const signature = val('scanUrl') + '|' + scanResults.textContent.length;
    if(!scanResults.classList.contains('show') || signature===lastHandledScan) return;
    lastHandledScan = signature;

    // Apply the website information the content scanner has already selected as useful.
    const apply = document.getElementById('applyScan');
    if(apply) apply.click();

    setTimeout(()=>{
      const info=inferBusiness();
      smartActions=chooseActions(info);
      smartDesignStyle=deriveStyle();
      renderSummary(info.type);
      update();
      showStatus('Smart card built — buttons, content and branding chosen from the website.');
    },80);
  }

  const resultsObserver = new MutationObserver(autoBuildFromScan);
  resultsObserver.observe(scanResults,{attributes:true,childList:true,subtree:true,attributeFilter:['class']});

  const mood = document.getElementById('designMood');
  if(mood){
    new MutationObserver(()=>{
      const next=deriveStyle();
      if(next!==smartDesignStyle){smartDesignStyle=next; renderSummary(document.getElementById('smartBusinessType').textContent||'Business'); update();}
    }).observe(mood,{childList:true,characterData:true,subtree:true});
  }

  scanButton.addEventListener('click',()=>{lastHandledScan='';});
})();