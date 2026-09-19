const CACHE="cancello-staff-v10";
const SHELL=[
  "/cancello/staff/",
  "/cancello/staff/index.html",
  "/cancello/staff/manifest.webmanifest",
  "/cancello/staff/icon.svg"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  const req=event.request;
  const url=new URL(req.url);
  if(req.method!=="GET" || url.origin!==self.location.origin) return;
  if(req.mode==="navigate"){
    event.respondWith(
      fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(cache=>cache.put("/cancello/staff/",copy));
        return res;
      }).catch(()=>caches.match("/cancello/staff/"))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then(cached=>cached||fetch(req).then(res=>{
      const copy=res.clone();
      caches.open(CACHE).then(cache=>cache.put(req,copy));
      return res;
    }))
  );
});

self.addEventListener("push",event=>{
  let data={};
  try{data=event.data?event.data.json():{};}catch(e){data={body:event.data?event.data.text():"New Cancello pre-order"};}
  const title=data.title||"New Cancello pre-order";
  const options={
    body:data.body||"A new pre-order has been received.",
    icon:"/cancello/staff/icon.svg",
    badge:"/cancello/staff/icon.svg",
    tag:data.tag||"cancello-preorder",
    renotify:true,
    data:{url:data.url||"/cancello/staff/"}
  };
  event.waitUntil(self.registration.showNotification(title,options));
});

self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const target=new URL(event.notification?.data?.url||"/cancello/staff/",self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({type:"window",includeUncontrolled:true}).then(clients=>{
      for(const client of clients){
        if("focus" in client){
          try{if("navigate" in client) client.navigate(target);}catch(e){}
          return client.focus();
        }
      }
      if(self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
