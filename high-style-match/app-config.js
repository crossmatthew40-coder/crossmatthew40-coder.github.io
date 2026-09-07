// High Style Match production configuration.
// Public, browser-safe values only. Never put private API keys here.
window.HSM_APP = {
  version: '1.1.6-monochrome',
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
  function loadTheme(){
    if(!document.querySelector('link[data-hsm-pro-theme]')){const link=document.createElement('link');link.rel='stylesheet';link.href='./capture-one-theme.css?v=20260907-12';link.dataset.hsmProTheme='true';document.head.appendChild(link)}
    if(!document.querySelector('link[data-hsm-purple-theme]')){const purple=document.createElement('link');purple.rel='stylesheet';purple.href='./high-style-purple-theme.css?v=20260907-12';purple.dataset.hsmPurpleTheme='true';document.head.appendChild(purple)}
    if(!document.querySelector('link[data-hsm-mono-theme]')){const mono=document.createElement('link');mono.rel='stylesheet';mono.href='./high-style-mono-theme.css?v=20260907-12';mono.dataset.hsmMonoTheme='true';document.head.appendChild(mono)}
  }
  function ensureTwoSecondOpening(){const style=document.createElement('style');style.textContent=`
    .hsm-opening{animation:hsmOpeningOut .4s ease 2s both!important}
    .hsm-opening-logo{animation:hsmLogoSlide .7s cubic-bezier(.16,1,.3,1) both!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:24px!important;flex-wrap:nowrap!important;padding:24px!important}
    .hsm-opening-brandcopy{display:flex;flex-direction:column;justify-content:center;min-width:0}
    .hsm-opening-brandcopy strong{font-size:clamp(28px,4vw,54px);font-weight:650;letter-spacing:-.045em;line-height:.98;color:#fff;white-space:nowrap}
    .hsm-opening-brandcopy span{margin-top:8px;font-size:clamp(10px,1.2vw,14px);letter-spacing:.14em;text-transform:uppercase;color:#b5b5b5;font-weight:750;white-space:nowrap}
    @media(max-width:720px){.hsm-opening-logo{gap:12px!important;padding:14px!important}.hsm-opening-brandcopy strong{font-size:clamp(22px,7vw,34px)}.hsm-opening-brandcopy span{font-size:9px}}
  `;document.head.appendChild(style)}
  function routeNewVisitorsAfterSplash(){const path=location.pathname.replace(/\/+$/,'/');const isMainEntry=path==='/high-style-match/'||path.endsWith('/high-style-match/');if(!isMainEntry||sessionStorage.getItem('hsm_gate_seen')==='1')return;setTimeout(()=>{sessionStorage.setItem('hsm_gate_seen','1');location.href='./subscribe/'},2050)}
  function apply(){loadTheme();ensureTwoSecondOpening();const logoUrl=window.HSM_APP.logoUrl;document.querySelectorAll('.brandmark').forEach(mark=>{const opening=mark.closest('.hsm-opening-logo');mark.innerHTML='';Object.assign(mark.style,{background:'transparent',backgroundColor:'transparent',boxShadow:'none',border:'0',borderRadius:'0',overflow:'visible',padding:'0'});if(opening){mark.style.width='clamp(180px,24vw,300px)';mark.style.height='clamp(180px,24vw,300px)';mark.style.maxWidth='48vh';mark.style.maxHeight='48vh';mark.style.flex='0 0 auto'}const img=document.createElement('img');img.src=logoUrl;img.alt='High Style';Object.assign(img.style,{width:'100%',height:'100%',display:'block',objectFit:'contain',objectPosition:'center',background:'transparent',border:'0',boxShadow:'none',transform:'none',filter:'none'});mark.appendChild(img);if(opening&&!opening.querySelector('.hsm-opening-brandcopy')){const copy=document.createElement('div');copy.className='hsm-opening-brandcopy';copy.innerHTML='<strong>High Style Match</strong><span>Photography workflow</span>';opening.appendChild(copy)}});let favicon=document.querySelector('link[rel="icon"]');if(!favicon){favicon=document.createElement('link');favicon.rel='icon';document.head.appendChild(favicon)}favicon.type='image/svg+xml';favicon.href=logoUrl;routeNewVisitorsAfterSplash()}
  function loadScript(src,key){if(document.querySelector(`script[data-${key}]`))return;const s=document.createElement('script');s.src=src;s.defer=true;s.setAttribute(`data-${key}`,'true');document.head.appendChild(s)}
  function loadProductUpgrades(){loadScript('./product-upgrades.js?v=20260907-12','hsm-upgrades');loadScript('./capture-delivery-tools.js?v=20260907-12','hsm-capture-delivery');loadScript('./integration-notice.js?v=20260907-12','hsm-integration-notice')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{apply();loadProductUpgrades()},{once:true});else{apply();loadProductUpgrades()}
})();
