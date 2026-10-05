/* Admin push only: deliberately no fetch handler and no offline booking cache. */
self.addEventListener('push',event=>{
 let data;try{data=event.data?.json();}catch{data=null;}
 const url=typeof data?.url==='string'&&/^\/admin\/[0-9a-f-]{36}\/bookings\?booking=[0-9a-f-]{36}$/.test(data.url)?data.url:'/admin';
 event.waitUntil(self.registration.showNotification('Sightseeing Shkodra',{body:typeof data?.body==='string'?data.body.slice(0,500):'New operational notification. Open Admin for details.',tag:typeof data?.tag==='string'?data.tag:undefined,icon:'/icons/site-icon-192.png',data:{url}}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const path=event.notification.data?.url;
 const url=new URL(typeof path==='string'&&/^\/admin(?:\/|$)/.test(path)?path:'/admin',self.location.origin);
 if(url.origin!==self.location.origin)return;
 event.waitUntil((async()=>{const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of windows){if(new URL(client.url).origin===url.origin&&new URL(client.url).pathname.startsWith('/admin')){await client.navigate(url.href);await client.focus();return;}}await self.clients.openWindow(url.href);})());
});
