/* Admin push only: deliberately no fetch handler and no offline booking cache. */
function adminDestination(path){
 return typeof path==='string'&&/^\/admin\/[0-9a-f-]{36}\/bookings\?booking=[0-9a-f-]{36}$/.test(path)?path:'/admin';
}
// Push-only worker: immediate activation does not cache or replace booking responses.
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
 let data;try{data=event.data?.json();}catch{data=null;}
 const url=adminDestination(data?.url);
 event.waitUntil(self.registration.showNotification(['New Sightseeing Shkodra booking','Booking modified','Booking cancelled','Test notification'].includes(data?.title)?data.title:'Sightseeing Shkodra',{body:typeof data?.body==='string'?data.body.slice(0,500):'New operational notification. Open Admin for details.',tag:typeof data?.tag==='string'?data.tag:undefined,icon:'/icons/site-icon-192.png',data:{url}}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const url=new URL(adminDestination(event.notification.data?.url),self.location.origin);
 event.waitUntil((async()=>{
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const client of windows){
   const current=new URL(client.url);
   if(current.origin===url.origin&&/^\/admin(?:\/|$)/.test(current.pathname)){
    try{const navigated=await client.navigate(url.href);if(navigated===null)continue;await client.focus();return;}catch{/* A stale window must not swallow the booking click. */}
   }
  }
  await self.clients.openWindow(url.href);
 })());
});
