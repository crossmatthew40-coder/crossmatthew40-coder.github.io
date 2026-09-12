const CACHE='hsm-shell-v7-best-picks';

const ESSENTIAL=[
  '/high-style-match/',
  '/high-style-match/index.html',
  '/high-style-match/sign-in/',
  '/high-style-match/subscribe/',
  '/high-style-match/auth-config.js',
  '/high-style-match/high-style-mono-theme.css',
  '/high-style-logo.svg'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ESSENTIAL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;
  if(!(url.pathname.startsWith('/high-style-match/')||url.pathname==='/high-style-logo.svg'))return;

  // These files contain live routing/configuration and must never be one version behind.
  if(url.pathname==='/high-style-match/app-config.js'||url.pathname==='/high-style-match/delivery-config.js'){
    event.respondWith(caches.open(CACHE).then(async cache=>{
      try{
        const fresh=await fetch(new Request(req,{cache:'no-store'}));
        if(fresh.ok)cache.put(req,fresh.clone());
        return fresh;
      }catch{
        return (await cache.match(req,{ignoreSearch:true}))||Response.error();
      }
    }));
    return;
  }

  const staticAsset=/\.(?:css|js|svg|png|jpg|jpeg|webp|ico)$/.test(url.pathname);
  if(staticAsset){
    event.respondWith(caches.open(CACHE).then(async cache=>{
      const cached=await cache.match(req,{ignoreSearch:true});
      const fresh=fetch(req).then(res=>{if(res.ok)cache.put(req,res.clone());return res}).catch(()=>null);
      if(cached){event.waitUntil(fresh);return cached}
      return (await fresh)||Response.error();
    }));
    return;
  }

  if(req.mode==='navigate'){
    event.respondWith(caches.open(CACHE).then(async cache=>{
      const cached=await cache.match(req,{ignoreSearch:true});
      const fresh=fetch(req).then(res=>{if(res.ok)cache.put(req,res.clone());return res}).catch(()=>null);
      if(cached){event.waitUntil(fresh);return cached}
      return (await fresh)||cache.match('/high-style-match/',{ignoreSearch:true});
    }));
    return;
  }

  event.respondWith(caches.open(CACHE).then(async cache=>{
    const cached=await cache.match(req,{ignoreSearch:true});
    if(cached)return cached;
    const res=await fetch(req);
    if(res.ok)cache.put(req,res.clone());
    return res;
  }));
});
