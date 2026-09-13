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
  const BUILD='20260913-8';
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
        .hsm-nav-tab{position:fixed;z-index:1002;left:50%;bottom:max(8px,env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;align-items:center;justify-content:center;gap:9px;min-width:132px;height:46px;padding:0 18px;border:0;border-radius:16px;background:#426b84;color:#fff;box-shadow:0 12px 30px rgba(45,78,99,.25);font:700 11px/1 -apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;letter-spacing:.02em}
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
  function apply(){loadTheme();ensureOpening();ensureMobileNavigation();const logoUrl=window.HSM_APP.logoUrl;document.querySelectorAll('.brandmark').forEach(mark=>{const opening=mark.closest('.hsm-opening-logo');mark.innerHTML='';Object.assign(mark.style,{background:'transparent',backgroundColor:'transparent',boxShadow:'none',border:'0',borderRadius:'0',overflow:'visible',padding:'0'});const img=document.createElement('img');img.src=logoUrl;img.alt='High Style';img.decoding='async';Object.assign(img.style,{width:'100%',height:'100%',display:'block',objectFit:'contain',objectPosition:'center',background:'transparent',border:'0',boxShadow:'none',transform:'none',filter:'none'});mark.appendChild(img);if(opening){opening.querySelectorAll('.hsm-opening-brandcopy').forEach(el=>el.remove());const copy=document.createElement('div');copy.className='hsm-opening-brandcopy';copy.innerHTML='<strong>High Style Match</strong><span>Part of the High Style Group</span>';opening.appendChild(copy)}});let favicon=document.querySelector('link[rel="icon"]');if(!favicon){favicon=document.createElement('link');favicon.rel='icon';document.head.appendChild(favicon)}favicon.type='image/svg+xml';favicon.href=logoUrl;routeNewVisitorsAfterSplash()}
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
