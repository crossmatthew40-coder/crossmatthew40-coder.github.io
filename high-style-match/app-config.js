// High Style Match production configuration.
// Public, browser-safe values only. Never put private API keys here.
window.HSM_APP = {
  version: '1.1.14-adobe-handoff',
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
      'shotLists','liveShoot','projectTracking','advancedRename','smartCull','beforeYouLeave',
      'duplicateGrouping','ratings','advancedMatching','compareMode','rawJpegPairing','workflowAutomation',
      'workflowTemplates','activityHistory','captureOneBridge','largeFileDelivery','deliveryTracking',
      'clientFeedback','clientReview','cloudPreviewSync','clientBranding','teamMembers','sharedProjects',
      'rolePermissions','adminDashboard','photographerAssignments','sharedClients','teamReview','usageReporting'
    ]
  },
  features:{customerReview:true,customerInvites:true,cloudProjects:true,offlineQueue:true,deliveryTracking:true,adminConsole:true,captureOneBridge:true,largeFileDelivery:false,billing:false}
};
(function applyHighStyleBranding(){
  const BUILD='20260911-1';
  function loadTheme(){
    if(!document.querySelector('link[data-hsm-mono-theme]')){
      const mono=document.createElement('link');
      mono.rel='stylesheet';mono.href=`./high-style-mono-theme.css?v=${BUILD}`;mono.dataset.hsmMonoTheme='true';
      document.head.appendChild(mono);
    }
  }
  function ensureOpening(){const style=document.createElement('style');style.textContent=`
    .hsm-opening{animation:hsmOpeningOut .3s ease 4.7s both!important;background:#000!important}
    .hsm-opening-logo{animation:hsmLogoSlide .55s cubic-bezier(.16,1,.3,1) both!important;display:grid!important;grid-template-columns:auto auto!important;grid-template-rows:auto!important;align-items:center!important;justify-content:center!important;column-gap:34px!important;width:min(94vw,1040px)!important;max-width:1040px!important;padding:24px!important;margin:auto!important}
    .hsm-opening-logo>.brandmark{grid-column:1!important;width:clamp(170px,19vw,260px)!important;height:clamp(170px,19vw,260px)!important;max-width:34vh!important;max-height:34vh!important;flex:none!important}
    .hsm-opening-brandcopy{grid-column:2!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:center!important;text-align:left!important;min-width:0!important}
    .hsm-opening-brandcopy strong{display:block!important;margin:0!important;font-size:clamp(42px,5.6vw,78px)!important;font-weight:650!important;letter-spacing:-.055em!important;line-height:.9!important;color:#fff!important;white-space:nowrap!important}
    .hsm-opening-brandcopy span{display:block!important;margin-top:14px!important;font-size:clamp(9px,1vw,12px)!important;letter-spacing:.18em!important;text-transform:uppercase!important;color:#8f8f8f!important;font-weight:650!important;white-space:nowrap!important}
    .hsm-opening-sub{display:none!important}
    @media(max-width:720px){.hsm-opening-logo{grid-template-columns:auto auto!important;column-gap:14px!important;width:98vw!important;padding:10px!important}.hsm-opening-logo>.brandmark{width:clamp(92px,28vw,138px)!important;height:clamp(92px,28vw,138px)!important}.hsm-opening-brandcopy strong{font-size:clamp(24px,7vw,38px)!important}.hsm-opening-brandcopy span{font-size:7px!important;letter-spacing:.1em!important;margin-top:7px!important}}
  `;document.head.appendChild(style)}
  function routeNewVisitorsAfterSplash(){if(!window.HSM_APP.features.billing)return;const path=location.pathname.replace(/\/+$/,'/');const isMainEntry=path==='/high-style-match/'||path.endsWith('/high-style-match/');if(!isMainEntry||sessionStorage.getItem('hsm_gate_seen')==='1')return;setTimeout(()=>{sessionStorage.setItem('hsm_gate_seen','1');location.href='./subscribe/'},5000)}
  function apply(){loadTheme();ensureOpening();const logoUrl=window.HSM_APP.logoUrl;document.querySelectorAll('.brandmark').forEach(mark=>{const opening=mark.closest('.hsm-opening-logo');mark.innerHTML='';Object.assign(mark.style,{background:'transparent',backgroundColor:'transparent',boxShadow:'none',border:'0',borderRadius:'0',overflow:'visible',padding:'0'});const img=document.createElement('img');img.src=logoUrl;img.alt='High Style';img.decoding='async';Object.assign(img.style,{width:'100%',height:'100%',display:'block',objectFit:'contain',objectPosition:'center',background:'transparent',border:'0',boxShadow:'none',transform:'none',filter:'none'});mark.appendChild(img);if(opening){opening.querySelectorAll('.hsm-opening-brandcopy').forEach(el=>el.remove());const copy=document.createElement('div');copy.className='hsm-opening-brandcopy';copy.innerHTML='<strong>High Style Match</strong><span>Part of the High Style Group</span>';opening.appendChild(copy)}});let favicon=document.querySelector('link[rel="icon"]');if(!favicon){favicon=document.createElement('link');favicon.rel='icon';document.head.appendChild(favicon)}favicon.type='image/svg+xml';favicon.href=logoUrl;routeNewVisitorsAfterSplash()}
  function loadScript(src,key){if(document.querySelector(`script[data-${key}]`))return;const s=document.createElement('script');s.src=src;s.defer=true;s.setAttribute(`data-${key}`,'true');document.head.appendChild(s)}
  function loadNonCriticalTools(){loadScript(`./product-upgrades.js?v=${BUILD}`,'hsm-upgrades');loadScript(`./capture-delivery-tools.js?v=${BUILD}`,'hsm-capture-delivery');loadScript(`./adobe-actions.js?v=${BUILD}`,'hsm-adobe-actions')}
  function scheduleNonCritical(){if('requestIdleCallback'in window)requestIdleCallback(loadNonCriticalTools,{timeout:500});else setTimeout(loadNonCriticalTools,120)}
  function boot(){apply();scheduleNonCritical()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot()
})();
