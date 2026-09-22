const CACHE_VERSION="cancello-card-v1";

self.addEventListener("install",event=>{
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate",event=>{
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push",event=>{
  let data={};
  try{data=event.data?event.data.json():{};}catch(e){data={body:event.data?event.data.text():"Cancello update"};}
  const title=data.title||"Cancello";
  const target=data.url||"/cancello/?events=1";
  const options={
    body:data.body||"There is a new Cancello update.",
    icon:"/cancello/staff/apple-touch-icon-v13.png",
    badge:"/cancello/staff/apple-touch-icon-v13.png",
    tag:data.tag||"cancello-event",
    data:{url:target}
  };
  event.waitUntil((async()=>{
    try{
      await self.registration.showNotification(title,options);
    }catch(e){
      await self.registration.showNotification(title,{body:options.body,data:{url:target}});
    }
    try{
      if(self.navigator&&"setAppBadge" in self.navigator)await self.navigator.setAppBadge(1);
    }catch(e){}
  })());
});

self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const target=event.notification?.data?.url||"/cancello/?events=1";
  event.waitUntil((async()=>{
    const windows=await self.clients.matchAll({type:"window",includeUncontrolled:true});
    for(const client of windows){
      try{
        const url=new URL(client.url);
        if(url.origin===self.location.origin){
          await client.focus();
          await client.navigate(target);
          return;
        }
      }catch(e){}
    }
    await self.clients.openWindow(target);
  })());
});