// High Style Match production configuration.
// Public, browser-safe values only. Never put private API keys here.
window.HSM_APP = {
  version: '1.1.9-five-second-opening',
  canonicalBase: 'https://crossmatthew40-coder.github.io/high-style-match/',
  preferredDomain: 'https://app.highstylegroup.co.uk/',
  supportEmail: 'support@highstylegroup.co.uk',
  notificationsEmail: 'notifications@highstylegroup.co.uk',
  logoUrl: '/high-style-logo.svg',
  sync: { enabled:true, intervalMs:60000, previewBatchSize:8, maxPreviewBytes:3000000 },
  monitoring: { enabled:true, reportClientErrors:true },
  billing: {
    provider:'stripe', checkoutFunction:'create-checkout-session', portalFunction:'create-billing-portal',
    plans:{
      solo:{name:'Solo',monthlyGBP:7,trialDays:7,activeProjects:5,clientReviewProjects:1},
      creator:{name:'Creator',monthlyGBP:15,trialDays:7,activeProjects:'unlimited',clientReviewProjects:'standard'},
      pro:{name:'Pro',monthlyGBP:25,trialDays:7,activeProjects:'unlimited',clientReviewProjects:'unlimited',recommended:true},
      studio:{name:'Studio',monthlyGBP:49,trialDays:7,activeProjects:'unlimited',clientReviewProjects:'unlimited',team:true}
    },
    addOns:{cloudStorage:{name:'Cloud Storage Pack'},clientBranding:{name:'Client Branding Pack'},aiCull:{name:'AI Cull Pack'},extraSeat:{name:'Extra Team Seat'},archive:{name:'Archive Pack'},priorityProcessing:{name:'Priority Processing'},whiteLabel:{name:'White-label Client Portal'}}
  },
  entitlements:{
    solo:['shotLists','liveShoot','projectTracking','simpleRename','basicCull','limitedClientReview'],
    creator:['shotLists','liveShoot','projectTracking','advancedRename','basicCull','beforeYouLeave','duplicateGrouping','ratings','shotMatching','clientFeedback','deliveryTracking','captureOneBridge'],
    pro:['shotLists','liveShoot','projectTracking','advancedRename','smartCull','beforeYouLeave','duplicateGrouping','ratings','advancedMatching','compareMode','rawJpegPairing','workflowAutomation','cloudPreviewSync','unlimitedClientReview','deliveryOpenTracking','clientBranding','workflowTemplates','captureOneBridge','largeFileDelivery'],
    studio:['shotLists','liveShoot','projectTracking','advancedRename','smartCull','beforeYouLeave','duplicateGrouping','ratings','advancedMatching','compareMode','rawJpegPairing','workflowAutomation','cloudPreviewSync','unlimitedClientReview','deliveryOpenTracking','clientBranding','workflowTemplates','teamMembers','sharedProjects','rolePermissions','adminDashboard','photographerAssignments','sharedClients','activityHistory','teamReview','usageReporting','prioritySupport','captureOneBridge','largeFileDelivery']
  },
  features:{customerReview:true,customerInvites:true,cloudProjects:true,offlineQueue:true,deliveryTracking:true,adminConsole:true,captureOneBridge:true,largeFileDelivery:true,billing:false}
};
(function applyHighStyleBranding(){
  const BUILD='20260907-15';
  function loadTheme(){
    if(!document.querySelector('link[data-hsm-mono-theme]')){
      const mono=document.createElement('link');
      mono.rel='stylesheet';mono.href=`./high-style-mono-theme.css?v=${BUILD}`;mono.dataset.hsmMonoTheme='true';
      document.head.appendChild(mono);
    }
  }
  function ensureOpening(){const style=document.createElement('style');style.textContent=`
    .hsm-opening{animation:hsmOpeningOut .28s ease 4.72s both!important}
    .hsm-opening-logo{animation:hsmLogoSlide .55s cubic-bezier(.16,1,.3,1) both!important;display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;gap:24px!important;flex-wrap:nowrap!important;padding:24px!important;width:min(94vw,900px)!important;max-width:900px!important}
    .hsm-opening-brandcopy{display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:center!important;min-width:0!important;text-align:left!important}
    .hsm-opening-brandcopy strong{font-size:clamp(34px,5vw,68px)!important;font-weight:650!important;letter-spacing:-.05em!important;line-height:.94!important;color:#fff!important;white-space:nowrap!important}
    .hsm-opening-brandcopy span{margin-top:11px!important;font-size:clamp(9px,1vw,12px)!important;letter-spacing:.17em!important;text-transform:uppercase!important;color:#8e8e8e!important;font-weight:650!important;white-space:nowrap!important}
    .hsm-opening-sub{display:none!important}
    .hsm-opening-logo .brandmark{width:clamp(150px,20vw,250px)!important;height:clamp(150px,20vw,250px)!important;max-width:34vh!important;max-height:34vh!important;flex:0 0 auto!important}
    @media(max-width:720px){
      .hsm-opening-logo{gap:12px!important;padding:14px!important;width:96vw!important}
      .hsm-opening-logo .brandmark{width:clamp(100px,29vw,150px)!important;height:clamp(100px,29vw,150px)!important}
      .hsm-opening-brandcopy strong{font-size:clamp(23px,7.2vw,36px)!important}
      .hsm-opening-brandcopy span{font-size:7px!important;letter-spacing:.1em!important;margin-top:7px!important}
    }
  `;document.head.appendChild(style)}
  function routeNewVisitorsAfterSplash(){const path=location.pathname.replace(/\/+$/,'/');const isMainEntry=path==='/high-style-match/'||path.endsWith('/high-style-match/');if(!isMainEntry||sessionStorage.getItem('hsm_gate_seen')==='1')return;setTimeout(()=>{sessionStorage.setItem('hsm_gate_seen','1');location.href='./subscribe/'},5000)}
  function apply(){loadTheme();ensureOpening();const logoUrl=window.HSM_APP.logoUrl;document.querySelectorAll('.brandmark').forEach(mark=>{const opening=mark.closest('.hsm-opening-logo');mark.innerHTML='';Object.assign(mark.style,{background:'transparent',backgroundColor:'transparent',boxShadow:'none',border:'0',borderRadius:'0',overflow:'visible',padding:'0'});const img=document.createElement('img');img.src=logoUrl;img.alt='High Style';img.decoding='async';Object.assign(img.style,{width:'100%',height:'100%',display:'block',objectFit:'contain',objectPosition:'center',background:'transparent',border:'0',boxShadow:'none',transform:'none',filter:'none'});mark.appendChild(img);if(opening&&!opening.querySelector('.hsm-opening-brandcopy')){const copy=document.createElement('div');copy.className='hsm-opening-brandcopy';copy.innerHTML='<strong>High Style Match</strong><span>Part of the High Style Group</span>';opening.appendChild(copy)}});let favicon=document.querySelector('link[rel="icon"]');if(!favicon){favicon=document.createElement('link');favicon.rel='icon';document.head.appendChild(favicon)}favicon.type='image/svg+xml';favicon.href=logoUrl;routeNewVisitorsAfterSplash()}
  function loadScript(src,key){if(document.querySelector(`script[data-${key}]`))return;const s=document.createElement('script');s.src=src;s.defer=true;s.setAttribute(`data-${key}`,'true');document.head.appendChild(s)}
  function loadNonCriticalTools(){loadScript(`./product-upgrades.js?v=${BUILD}`,'hsm-upgrades');loadScript(`./capture-delivery-tools.js?v=${BUILD}`,'hsm-capture-delivery')}
  function scheduleNonCritical(){if('requestIdleCallback'in window)requestIdleCallback(loadNonCriticalTools,{timeout:500});else setTimeout(loadNonCriticalTools,120)}
  function boot(){apply();scheduleNonCritical()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot()
})();
