/** Independent consumer of the existing business outbox; email enablement is unrelated. */
export async function invokeAdminNotifications(context,env=process.env,transport=fetch){
 if(context?.deploy?.context!=='production'||context.deploy.published!==true||env.APP_ENV!=='production'||env.ADMIN_NOTIFICATIONS_ENABLED!=='true')return {status:'disabled'};
 if(!env.CRON_SECRET||env.CRON_SECRET.length<32)throw Error('notification_scheduler_configuration');
 const site=new URL(context.site.url),configured=new URL(env.NEXT_PUBLIC_SITE_URL);
 if(site.protocol!=='https:'||site.origin!==configured.origin||site.username||site.password)throw Error('notification_scheduler_configuration');
 const r=await transport(new URL('/api/internal/admin-notifications',site.origin),{headers:{Authorization:`Bearer ${env.CRON_SECRET}`},redirect:'error',cache:'no-store',signal:AbortSignal.timeout(28000)});
 if(!r.ok)throw Error('notification_worker_unconfirmed');
 const result=await r.json();return {status:result.status};
}
export default async function schedule(_request,context){console.info(JSON.stringify({component:'admin_notifications_schedule',...await invokeAdminNotifications(context)}));}
export const config={schedule:'* * * * *'};
