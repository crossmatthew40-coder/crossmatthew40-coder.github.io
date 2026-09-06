const CACHE='hsm-shell-v1';
const SHELL=[
  '/high-style-match/',
  '/high-style-match/index.html',
  '/high-style-match/auth-config.js',
  '/high-style-match/app-config.js',
  '/high-style-match/cloud.js',
  '/high-style-match/production.js',
  '/high-style-match/tether/',
  '/high-style-match/sign-in/',
  '/high-style-match/customer/',
  '/high-style-match/onboarding/'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==location.origin) return;
  if(!url.pathname.startsWith('/high-style-match/')) return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(res=>{const clone=res.clone();caches.open(CACHE).then(c=>c.put(req,clone));return res}).catch(()=>caches.match(req).then(r=>r||caches.match('/high-style-match/'))));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{if(res.ok){const clone=res.clone();caches.open(CACHE).then(c=>c.put(req,clone))}return res})));
});
