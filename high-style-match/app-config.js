// High Style Match production configuration.
// Public, browser-safe values only. Never put private API keys here.
window.HSM_APP = {
  version: '1.1.4-logo-fit',
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
  function loadTheme(){if(!document.querySelector('link[data-hsm-pro-theme]')){const link=document.createElement('link');link.rel='stylesheet';link.href='./capture-one-theme.css?v=20260907-10';link.dataset.hsmProTheme='true';document.head.appendChild(link)}if(!document.querySelector('link[data-hsm-purple-theme]')){const purple=document.createElement('link');purple.rel='stylesheet';purple.href='./high-style-purple-theme.css?v=20260907-10';purple.dataset.hsmPurpleTheme='true';document.head.appendChild(purple)}}
  function ensureTwoSecondOpening(){const style=document.createElement('style');style.textContent='.hsm-opening{animation:hsmOpeningOut .4s ease 2s both!important}.hsm-opening-logo{animation:hsmLogoSlide .7s cubic-bezier(.16,1,.3,1) both!important}';document.head.appendChild(style)}
  function routeNewVisitorsAfterSplash(){const path=location.pathname.replace(/\/+$/,'/');const isMainEntry=path==='/high-style-match/'||path.endsWith('/high-style-match/');if(!isMainEntry||sessionStorage.getItem('hsm_gate_seen')==='1')return;setTimeout(()=>{sessionStorage.setItem('hsm_gate_seen','1');location.href='./subscribe/'},2050)}
  function apply(){loadTheme();ensureTwoSecondOpening();const logoUrl=window.HSM_APP.logoUrl;document.querySelectorAll('.brandmark').forEach(mark=>{const isOpeningLogo=!!mark.closest('.hsm-opening-logo');mark.innerHTML='';Object.assign(mark.style,{background:'transparent',backgroundColor:'transparent',boxShadow:'none',border:'0',borderRadius:'0',overflow:'visible',padding:'0'});if(isOpeningLogo){mark.style.width='clamp(280px, 38vw, 430px)';mark.style.height='clamp(280px, 38vw, 430px)';mark.style.maxWidth='78vh';mark.style.maxHeight='78vh';mark.style.flex='0 0 auto'}const img=document.createElement('img');img.src=logoUrl;img.alt='High Style';Object.assign(img.style,{width:'100%',height:'100%',display:'block',objectFit:'contain',objectPosition:'center',background:'transparent',border:'0',boxShadow:'none',transform:'none',filter:'none'});mark.appendChild(img)});let favicon=document.querySelector('link[rel="icon"]');if(!favicon){favicon=document.createElement('link');favicon.rel='icon';document.head.appendChild(favicon)}favicon.type='image/svg+xml';favicon.href=logoUrl;routeNewVisitorsAfterSplash()}
  function loadScript(src,key){if(document.querySelector(`script[data-${key}]`))return;const s=document.createElement('script');s.src=src;s.defer=true;s.setAttribute(`data-${key}`,'true');document.head.appendChild(s)}
  function loadProductUpgrades(){loadScript('./product-upgrades.js?v=20260907-10','hsm-upgrades');loadScript('./capture-delivery-tools.js?v=20260907-10','hsm-capture-delivery');loadScript('./integration-notice.js?v=20260907-10','hsm-integration-notice')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{apply();loadProductUpgrades()},{once:true});else{apply();loadProductUpgrades()}
})();
