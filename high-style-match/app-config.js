// High Style Match production configuration.
// Public, browser-safe values only. Never put private API keys here.
window.HSM_APP = {
  version: '1.6.0-premium-product',
  canonicalBase: 'https://crossmatthew40-coder.github.io/high-style-match/',
  preferredDomain: 'https://app.highstylegroup.co.uk/',
  supportEmail: 'support@highstylegroup.co.uk',
  notificationsEmail: 'notifications@highstylegroup.co.uk',
  logoUrl: '/high-style-logo.svg',
  sync: { enabled:true, intervalMs:60000, previewBatchSize:8, maxPreviewBytes:3000000 },
  monitoring: { enabled:true, reportClientErrors:false },
  billing: {
    provider:'stripe',
    checkoutFunction:'create-checkout-session',
    portalFunction:'create-billing-portal',
    plans:{
      complete:{name:'High Style Match Complete',monthlyGBP:25,trialDays:7,activeProjects:'unlimited',clientReviewProjects:'unlimited',everythingIncluded:true}
    }
  },
  entitlements:{
    complete:[
      'shotLists','projectTracking','advancedRename','smartCull','aiVision','bestPicksStudio','aiCompare',
      'preferenceLearning','shotListCoverage','duplicateGrouping','ratings','advancedMatching','compareMode','rawJpegPairing','workflowAutomation',
      'workflowTemplates','activityHistory','largeFileDelivery','deliveryTracking','clientFeedback','clientReview','cloudPreviewSync',
      'clientBranding','teamMembers','sharedProjects','rolePermissions','adminDashboard','photographerAssignments','sharedClients','teamReview','usageReporting'
    ]
  },
  features:{customerReview:true,customerInvites:true,cloudProjects:true,offlineQueue:true,deliveryTracking:true,adminConsole:true,captureOneBridge:false,largeFileDelivery:false,billing:false,aiVision:true,bestPicksStudio:true,aiCompare:true,preferenceLearning:true,shotListCoverage:true}
};
(function applyHighStyleBranding(){
  const BUILD='20260913-10';
  function loadTheme(){
    if(!document.querySelector('link[data-hsm-premium-product]')){
      const theme=document.createElement('link');
      theme.rel='stylesheet';theme.href=`./premium-product-theme.css?v=${BUILD}`;theme.dataset.hsmPremiumProduct='true';
      document.head.appendChild(theme);
    }
  }
  function ensureOpening(){const style=document.createElement('style');style.textContent=`
    .hsm-opening{animation:hsmOpeningOut .48s ease 1.35s both!important;background:radial-gradient(38rem 30rem at 22% 5%,rgba(249,253,255,.95),transparent 60%),linear-gradient(155deg,#e9f5fb,#d6e9f4 50%,#c7dfed)!important;overflow:hidden!important}
    .hsm-opening:before{content:"";position:absolute;right:-5vw;bottom:-20vh;width:34vw;height:66vh;border-radius:48%;background:linear-gradient(160deg,rgba(99,69,54,.12),rgba(247,156,112,.20));filter:blur(60px);transform:rotate(-12deg);animation:hsmOpeningGlow 2.1s ease-in-out both}
    .hsm-opening-logo{animation:hsmLogoSlide .55s cubic-bezier(.16,1,.3,1) both!important;display:grid!important;grid-template-columns:auto auto!important;grid-template-rows:auto!important;align-items:center!important;justify-content:center!important;column-gap:28px!important;width:min(94vw,1040px)!important;max-width:1040px!important;padding:24px!important;margin:auto!important;position:relative!important;z-index:1!important}
    .hsm-opening-logo>.brandmark{grid-column:1!important;width:clamp(112px,14vw,180px)!important;height:clamp(112px,14vw,180px)!important;max-width:26vh!important;max-height:26vh!important;flex:none!important;filter:drop-shadow(0 24px 50px rgba(72,96,115,.14))!important}
    .hsm-opening-brandcopy{grid-column:2!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:center!important;text-align:left!important;min-width:0!important}
    .hsm-opening-brandcopy strong{display:block!important;margin:0!important;font-size:clamp(36px,4.4vw,64px)!important;font-weight:560!important;letter-spacing:-.055em!important;line-height:.92!important;color:#35546a!important;white-space:nowrap!important;text-shadow:none!important}
    .hsm-opening-brandcopy span{display:block!important;margin-top:13px!important;font-size:clamp(8px,.9vw,11px)!important;letter-spacing:.14em!important;text-transform:uppercase!important;color:#7890a1!important;font-weight:650!important;white-space:nowrap!important}
    .hsm-opening-sub{display:none!important}
    @keyframes hsmOpeningGlow{from{opacity:0;transform:translate3d(5vw,5vh,0) rotate(-12deg) scale(.86)}to{opacity:1;transform:translate3d(0,0,0) rotate(-8deg) scale(1.06)}}
    @media(max-width:720px){.hsm-opening-logo{grid-template-columns:auto auto!important;column-gap:14px!important;width:98vw!important;padding:10px!important}.hsm-opening-logo>.brandmark{width:clamp(90px,27vw,132px)!important;height:clamp(90px,27vw,132px)!important}.hsm-opening-brandcopy strong{font-size:clamp(24px,7vw,36px)!important}.hsm-opening-brandcopy span{font-size:7px!important;letter-spacing:.1em!important;margin-top:7px!important}}
  `;document.head.appendChild(style)}
  function routeNewVisitorsAfterSplash(){if(!window.HSM_APP.features.billing)return;const path=location.pathname.replace(/\/+$/,'/');const isMainEntry=path==='/high-style-match/'||path.endsWith('/high-style-match/');if(!isMainEntry||sessionStorage.getItem('hsm_gate_seen')==='1')return;setTimeout(()=>{sessionStorage.setItem('hsm_gate_seen','1');location.href='./subscribe/'},5000)}
  function ensureReferenceTheme(){
    if(document.getElementById('hsm-reference-theme'))return;
    const style=document.createElement('style');style.id='hsm-reference-theme';style.textContent=`
      :root{--accent:#2f83e6!important;--accent-2:#59a9eb!important;--ink:#173b62!important;--muted:#63809b!important;--bg:#ddecf7!important;--line:rgba(255,255,255,.62)!important;--shadow:0 18px 52px rgba(48,91,126,.12)!important}
      html{background:#ddecf7!important}
      body{background:radial-gradient(40rem 30rem at 72% 2%,rgba(255,218,201,.78),transparent 58%),radial-gradient(42rem 36rem at 9% 76%,rgba(255,196,167,.55),transparent 58%),radial-gradient(48rem 38rem at 105% 87%,rgba(130,202,244,.65),transparent 64%),linear-gradient(135deg,#dbeefa 0%,#cce5f7 48%,#e9f2f8 100%)!important;background-attachment:fixed!important}
      body:before{right:auto!important;left:20vw!important;bottom:-24vh!important;width:48vw!important;height:42vh!important;background:rgba(255,224,207,.55)!important;filter:blur(80px)!important}
      body:after{left:-20vw!important;top:-15vw!important;background:rgba(164,214,245,.7)!important;filter:blur(85px)!important}
      .app{grid-template-columns:244px minmax(0,1fr)!important;background:transparent!important;color-scheme:light!important}
      .sidebar{margin:15px 0 15px 15px!important;height:calc(100vh - 30px)!important;padding:20px 12px!important;border:1px solid rgba(255,255,255,.52)!important;border-radius:30px!important;background:linear-gradient(160deg,rgba(54,91,124,.84),rgba(72,119,153,.72))!important;box-shadow:0 24px 64px rgba(38,76,107,.23)!important;backdrop-filter:blur(32px) saturate(125%)!important;-webkit-backdrop-filter:blur(32px) saturate(125%)!important}
      .brand{padding:7px 10px 28px!important}.brand strong{font-size:16px!important;font-weight:580!important;white-space:nowrap!important}.brand small{color:rgba(255,255,255,.68)!important}#hsmLocalBadge{display:none!important}
      .nav{gap:7px!important}.nav button{min-height:50px!important;border:1px solid transparent!important;background:transparent!important;color:rgba(255,255,255,.78)!important;border-radius:17px!important;font-size:12px!important}.nav button:hover{background:rgba(255,255,255,.13)!important;color:#fff!important}.nav button.on{background:linear-gradient(135deg,rgba(213,238,255,.53),rgba(255,255,255,.26))!important;border-color:rgba(255,255,255,.38)!important;color:#fff!important;box-shadow:inset 0 1px rgba(255,255,255,.25),0 10px 24px rgba(28,70,104,.14)!important}.nav button.on svg{color:#fff!important}
      .storage-card{background:rgba(25,66,99,.16)!important;border:1px solid rgba(255,255,255,.16)!important}
      .topbar{height:64px!important;margin:15px 20px 0!important;border:1px solid rgba(255,255,255,.58)!important;border-radius:20px!important;background:rgba(239,248,254,.38)!important;box-shadow:0 15px 40px rgba(56,99,132,.08)!important;backdrop-filter:blur(28px) saturate(135%)!important;-webkit-backdrop-filter:blur(28px) saturate(135%)!important}
      .global-search{height:42px!important;background:rgba(255,255,255,.3)!important;border:1px solid rgba(255,255,255,.58)!important}.global-search input{background:transparent!important;color:#21496f!important}
      .content{padding:34px 24px 72px!important;max-width:1540px!important}
      .panel,.stat,.mini-stat,.setting-card,.review-block,.workflow-step,.download-box,.delivery-step,.upload-zone,.empty,.cull-stat,.template-row,.table-row,.activity-item,.provider-card,.photo-card,.side-card,.shot-progress-card,.recent-card,.dash-stat,.home-project,.home-guide,.home-metric,.hsm-ai,.workflow-focus,.home-workflow{background:linear-gradient(145deg,rgba(255,255,255,.48),rgba(235,247,255,.25))!important;border:1px solid rgba(255,255,255,.68)!important;box-shadow:0 18px 45px rgba(58,103,137,.09),inset 0 1px rgba(255,255,255,.45)!important;backdrop-filter:blur(25px) saturate(128%)!important;-webkit-backdrop-filter:blur(25px) saturate(128%)!important}
      .shot-hub-hero,.workspace-head,.smart-cull-hero,.review-hero,.delivery-hero,.callout,.home-resume{background:linear-gradient(145deg,rgba(255,255,255,.48),rgba(222,241,253,.26))!important;color:var(--ink)!important;border:1px solid rgba(255,255,255,.68)!important;box-shadow:0 18px 48px rgba(55,99,132,.1),inset 0 1px rgba(255,255,255,.5)!important;backdrop-filter:blur(26px) saturate(128%)!important;-webkit-backdrop-filter:blur(26px) saturate(128%)!important}
      .shot-hub-hero h1,.workspace-head h1,.smart-cull-hero h2,.review-hero h2,.delivery-hero h2,.callout h2,.home-resume h2{color:var(--ink)!important}.shot-hub-hero p,.workspace-head p,.smart-cull-hero p,.review-hero p,.delivery-hero p,.callout p,.home-resume p,.home-resume p span{color:var(--muted)!important}.shot-hub-hero .eyebrow,.smart-cull-hero .eyebrow,.callout .eyebrow,.home-resume .home-kicker{color:#4483bc!important}
      .btn.primary,.hsm-ai button:not(.secondary),.hsm-bp button.primary,.hsm-rec{background:linear-gradient(135deg,#378fe9,#2476d4)!important;color:#fff!important;border-color:#4b9aeb!important;box-shadow:0 12px 24px rgba(39,117,201,.24)!important}.btn.primary:hover,.hsm-ai button:not(.secondary):hover,.hsm-bp button.primary:hover{background:linear-gradient(135deg,#2f84df,#1e6dc5)!important}
      .btn.secondary,.icon-btn,.hsm-ai button.secondary,.hsm-bp button:not(.primary),.filters button,.cull-toolbar button,.tabs button,.hsm-groups button,.dash-link,.cockpit-back{background:rgba(245,251,255,.48)!important;color:#315f88!important;border-color:rgba(255,255,255,.72)!important;box-shadow:inset 0 1px rgba(255,255,255,.48)!important}
      .filters button.on,.tabs button.on,.hsm-groups button.on{background:#2f83e6!important;color:#fff!important;border-color:#2f83e6!important}
      .home-heading{margin-bottom:18px!important}.home-heading h1{font-size:clamp(34px,4vw,48px)!important;font-weight:510!important;color:#173b62!important;letter-spacing:-.05em!important}.home-heading p:not(.home-kicker){font-size:15px!important;color:#68849e!important}.home-local{background:rgba(255,255,255,.32)!important;border:1px solid rgba(255,255,255,.55)!important;border-radius:14px!important;padding:9px 12px!important}
      .home-metrics{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:12px!important;margin-bottom:14px!important;background:transparent!important;border:0!important;box-shadow:none!important;overflow:visible!important;backdrop-filter:none!important}.home-metric{display:flex!important;flex-direction:column!important;min-height:150px!important;padding:22px!important;border-right:1px solid rgba(255,255,255,.68)!important}.home-metric>span{color:#244f77!important}.home-metric>strong{margin-top:auto!important;font-size:44px!important;background:none!important;color:#173b62!important;-webkit-text-fill-color:#173b62!important;font-family:"Avenir Next","SF Pro Display",sans-serif!important;font-weight:520!important;letter-spacing:-.04em!important}.home-metric:after{content:"";height:4px;border-radius:999px;background:linear-gradient(90deg,#3090ea,#66c8ef);margin-top:14px}.home-metric:nth-child(3):after{background:linear-gradient(90deg,#ffb49c,#ffd4b8)}
      .home-workflow{display:grid;grid-template-columns:repeat(9,minmax(86px,1fr));gap:0;margin:0 0 16px;padding:18px 14px;border-radius:24px;overflow-x:auto}.home-workflow button{position:relative;min-width:86px;border:0;background:transparent;color:#244a70;padding:2px 5px;font:650 10px/1.25 inherit;display:grid;justify-items:center;gap:8px;cursor:pointer}.home-workflow button:not(:last-child):after{content:"";position:absolute;left:65%;right:-35%;top:17px;border-top:1px solid rgba(255,255,255,.9)}.home-workflow i{position:relative;z-index:1;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.42);border:1px solid rgba(255,255,255,.82);font-style:normal;font-size:13px;box-shadow:0 5px 12px rgba(58,103,137,.08)}.home-workflow button:first-child i{background:#2f83e6;color:#fff;border-color:#69aff1;box-shadow:0 0 0 4px rgba(255,255,255,.45),0 8px 18px rgba(47,131,230,.24)}
      .home-resume{border-radius:22px!important}.home-guide{border-radius:24px!important}.home-project{border-radius:22px!important}.home-project-body{background:rgba(255,255,255,.18)!important}.home-project-image{background:rgba(177,213,236,.42)!important}
      .workflow-journey{padding:17px 13px!important;border-radius:24px!important;background:linear-gradient(145deg,rgba(255,255,255,.42),rgba(230,244,253,.22))!important;border:1px solid rgba(255,255,255,.66)!important;box-shadow:0 16px 40px rgba(56,101,135,.08)!important}.workflow-journey button{background:transparent!important;border:0!important;box-shadow:none!important;text-align:center!important;align-items:center!important}.workflow-journey button.on{color:#176ec5!important}.workflow-journey button i{width:34px!important;height:34px!important;background:rgba(255,255,255,.46)!important;border:1px solid rgba(255,255,255,.88)!important;color:#234e75!important}.workflow-journey button.on i{background:#2f83e6!important;color:#fff!important;border-color:#67acf0!important;box-shadow:0 0 0 4px rgba(255,255,255,.4)!important}
      .tabs{background:rgba(226,242,252,.4)!important;border-color:rgba(255,255,255,.66)!important;backdrop-filter:blur(22px)!important}
      input,textarea,select,.select,.field input,.field textarea,.field select,.rename-row input,.review-select{background:rgba(255,255,255,.44)!important;border-color:rgba(255,255,255,.75)!important;color:#1d456d!important}
      .photo-body,.table-row,.shoot-row,.template-row,.activity-item{background:rgba(255,255,255,.22)!important}.thumb,.review-thumb,.recent-thumb,.next-shot-thumb{background:rgba(173,210,234,.42)!important}
      @media(max-width:1100px){.home-workflow{grid-template-columns:repeat(9,100px)!important}.home-metrics{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
      @media(max-width:900px){.app{display:block!important}.home-heading h1{font-size:36px!important}.home-metrics{grid-template-columns:repeat(2,minmax(0,1fr))!important}.home-metric{min-height:130px!important}.home-workflow{grid-template-columns:repeat(9,94px)!important}.home-workflow button{min-width:94px!important}}
      @media(max-width:560px){.content{padding:20px 10px 70px!important}.home-heading{align-items:flex-start!important}.home-metrics{gap:8px!important}.home-metric{padding:16px!important;min-height:118px!important}.home-metric>strong{font-size:34px!important}.home-workflow{margin-left:0!important;margin-right:0!important}.panel,.home-project,.home-guide,.home-resume,.workspace-head{border-radius:20px!important}}
    `;document.head.appendChild(style)
  }
  function ensureMobileNavigation(){
    if(document.querySelector('.hsm-nav-tab'))return;
    const sidebar=document.querySelector('.sidebar');
    if(!sidebar)return;
    sidebar.id=sidebar.id||'hsm-navigation';
    const style=document.createElement('style');
    style.id='hsm-mobile-navigation-style';
    style.textContent=`
      .hsm-nav-tab{display:none}
      @media(max-width:900px){
        .main{padding-bottom:68px!important}
        .sidebar{bottom:62px!important;transform:translate3d(0,calc(100% + 82px),0)!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;transition:transform .28s cubic-bezier(.2,.8,.2,1),opacity .2s ease,visibility 0s linear .28s!important;box-shadow:0 20px 55px rgba(40,70,89,.24)!important}
        body.hsm-mobile-nav-open .sidebar{transform:translate3d(0,0,0)!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;transition-delay:0s!important}
        .sidebar .hsm-legal{display:none!important}
        .hsm-nav-tab{position:fixed;z-index:1002;left:50%;bottom:max(8px,env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;align-items:center;justify-content:center;gap:9px;min-width:132px;height:46px;padding:0 18px;border:0;border-radius:16px;background:#2f83e6;color:#fff;box-shadow:0 12px 30px rgba(39,117,201,.28);font:700 11px/1 -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;letter-spacing:.02em}
        .hsm-nav-tab:active{transform:translateX(-50%) scale(.97)}
        .hsm-nav-tab-icon{position:relative;width:16px;height:12px;border-top:2px solid currentColor;border-bottom:2px solid currentColor}
        .hsm-nav-tab-icon:after{content:"";position:absolute;left:0;right:0;top:4px;border-top:2px solid currentColor}
        body.hsm-mobile-nav-open .hsm-nav-tab-icon{height:16px;border:0}
        body.hsm-mobile-nav-open .hsm-nav-tab-icon:before,body.hsm-mobile-nav-open .hsm-nav-tab-icon:after{content:"";position:absolute;left:7px;top:0;height:17px;border-left:2px solid currentColor}
        body.hsm-mobile-nav-open .hsm-nav-tab-icon:before{transform:rotate(45deg)}
        body.hsm-mobile-nav-open .hsm-nav-tab-icon:after{transform:rotate(-45deg)}
      }
    `;
    document.head.appendChild(style);
    const button=document.createElement('button');
    button.type='button';button.className='hsm-nav-tab';button.setAttribute('aria-controls',sidebar.id);button.setAttribute('aria-expanded','false');button.innerHTML='<span class="hsm-nav-tab-icon" aria-hidden="true"></span><span>Menu</span>';
    const label=button.lastElementChild;
    const setOpen=open=>{document.body.classList.toggle('hsm-mobile-nav-open',open);button.setAttribute('aria-expanded',String(open));label.textContent=open?'Close':'Menu'};
    button.addEventListener('click',()=>setOpen(!document.body.classList.contains('hsm-mobile-nav-open')));
    sidebar.addEventListener('click',event=>{if(event.target.closest('.nav button'))setOpen(false)});
    document.addEventListener('pointerdown',event=>{if(document.body.classList.contains('hsm-mobile-nav-open')&&!sidebar.contains(event.target)&&!button.contains(event.target))setOpen(false)});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')setOpen(false)});
    matchMedia('(max-width:900px)').addEventListener?.('change',event=>{if(!event.matches)setOpen(false)});
    document.body.appendChild(button);
  }
  function apply(){loadTheme();ensureOpening();ensureReferenceTheme();ensureMobileNavigation();const logoUrl=window.HSM_APP.logoUrl;document.querySelectorAll('.brandmark').forEach(mark=>{const opening=mark.closest('.hsm-opening-logo');mark.innerHTML='';Object.assign(mark.style,{background:'transparent',backgroundColor:'transparent',boxShadow:'none',border:'0',borderRadius:'0',overflow:'visible',padding:'0'});const img=document.createElement('img');img.src=logoUrl;img.alt='High Style';img.decoding='async';Object.assign(img.style,{width:'100%',height:'100%',display:'block',objectFit:'contain',objectPosition:'center',background:'transparent',border:'0',boxShadow:'none',transform:'none',filter:'none'});mark.appendChild(img);if(opening){opening.querySelectorAll('.hsm-opening-brandcopy').forEach(el=>el.remove());const copy=document.createElement('div');copy.className='hsm-opening-brandcopy';copy.innerHTML='<strong>High Style Match</strong><span>Part of the High Style Group</span>';opening.appendChild(copy)}});let favicon=document.querySelector('link[rel="icon"]');if(!favicon){favicon=document.createElement('link');favicon.rel='icon';document.head.appendChild(favicon)}favicon.type='image/svg+xml';favicon.href=logoUrl;routeNewVisitorsAfterSplash()}
  function loadScript(src,key){if(document.querySelector(`script[data-${key}]`))return;const s=document.createElement('script');s.src=src;s.defer=true;s.setAttribute(`data-${key}`,'true');document.head.appendChild(s)}
  function loadNonCriticalTools(){
    loadScript(`./functional-runtime.js?v=${BUILD}`,'hsm-functional-runtime');
    loadScript(`./site-compliance.js?v=${BUILD}`,'hsm-compliance');
    loadScript(`./adobe-actions.js?v=${BUILD}`,'hsm-adobe-actions');
    loadScript(`./ai-vision-v2.js?v=${BUILD}`,'hsm-ai-vision');
    loadScript(`./best-picks-studio.js?v=${BUILD}`,'hsm-best-picks-studio');
  }
  function scheduleNonCritical(){if('requestIdleCallback'in window)requestIdleCallback(loadNonCriticalTools,{timeout:500});else setTimeout(loadNonCriticalTools,120)}
  function boot(){apply();scheduleNonCritical()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot()
})();
