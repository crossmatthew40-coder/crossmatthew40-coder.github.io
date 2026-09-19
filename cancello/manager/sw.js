const CACHE="cancello-manager-v1";
const SHELL=["/cancello/manager/","/cancello/manager/index.html","/cancello/manager/manifest.webmanifest","/cancello/staff/apple-touch-icon-v13.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{const r=e.request,u=new URL(r.url);if(r.method!=="GET"||u.origin!==self.location.origin)return;if(r.mode==="navigate"){e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put("/cancello/manager/",cp));return res}).catch(()=>caches.match("/cancello/manager/")));return}e.respondWith(caches.match(r).then(x=>x||fetch(r)))});
