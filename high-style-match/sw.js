const CACHE='hsm-shell-v3-fast';
const SHELL=[
  '/high-style-match/',
  '/high-style-match/index.html',
  '/high-style-match/auth-config.js',
  '/high-style-match/app-config.js',
  '/high-style-match/high-style-mono-theme.css',
  '/high-style-match/product-upgrades.js',
  '/high-style-match/capture-delivery-tools.js',
  '/high-style-match/cloud.js',
  '/high-style-match/production.js',
  '/high-style-match/tether/',
  '/high-style-match/sign-in/',
  '/high-style-match/subscribe/',
  '/high-style-match/customer/',
  '/high-style-match/onboarding/',
  '/high-style-logo.svg'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;
  if(!(url.pathname.startsWith('/high-style-match/')||url.pathname==='/high-style-logo.svg'))return;

  const staticAsset=/\.(?:css|js|svg|png|jpg|jpeg|webp|ico)$/.test(url.pathname);
  if(staticAsset){
    // Stale-while-revalidate: return cached UI assets immediately, refresh silently.
    event.respondWith(caches.open(CACHE).then(async cache=>{
      const cached=await cache.match(req,{ignoreSearch:true});
      const fresh=fetch(req).then(res=>{if(res.ok)cache.put(req,res.clone());return res}).catch(()=>null);
      if(cached){event.waitUntil(fresh);return cached}
      return (await fresh)||Response.error();
    }));
    return;
  }

  if(req.mode==='navigate'){
    // Cache-first navigation makes repeat launches instant; refresh cache in background.
    event.respondWith(caches.open(CACHE).then(async cache=>{
      const cached=await cache.match(req);
      const fresh=fetch(req).then(res=>{if(res.ok)cache.put(req,res.clone());return res}).catch(()=>null);
      if(cached){event.waitUntil(fresh);return cached}
      return (await fresh)||cache.match('/high-style-match/');
    }));
    return;
  }

  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{if(res.ok){const clone=res.clone();caches.open(CACHE).then(c=>c.put(req,clone))}return res})));
});
