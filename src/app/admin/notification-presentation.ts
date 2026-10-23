import type {InboxItem} from '@/modules/notifications/contracts';
export function recentNotifications(items:InboxItem[],limit=5){
 const seen=new Set<string>();return [...items].sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)||b.id.localeCompare(a.id)).filter(item=>{if(seen.has(item.notification_id))return false;seen.add(item.notification_id);return true;}).slice(0,limit);
}
export function notificationSummary(item:InboxItem){
 const n=item.notification;
 // Parse only the existing SQL projection's exact shape. Never expose arbitrary raw payload/copy.
 const match=n.message.match(/^Booking (SS-[a-zA-Z0-9-]+) - (\d+) guests \/ \d+ seats - (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}) - ([A-Z]{3}) (\d+\.\d{2})\. Details at processing time\.$/);
 let summary='Open booking for details',reference='',amount='';
 if(match){const [,ref,guests,date,time,currency,total]=match;const parsed=new Date(date+'T12:00:00Z');if(Number.isFinite(parsed.getTime())){reference=ref;summary=`${guests} ${guests==='1'?'guest':'guests'} · ${new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',timeZone:'UTC'}).format(parsed)} · ${time}`;if(n.type==='booking_created'||n.type==='payment_status_changed')try{amount=new Intl.NumberFormat('en-IE',{style:'currency',currency}).format(Number(total));}catch{amount=`${currency} ${total}`;}}}
 return {summary,reference,amount};
}
export function notificationTime(time:string,now=Date.now()){
 const parsed=Date.parse(time);if(!Number.isFinite(parsed))return 'Time unavailable';
 const minutes=Math.max(0,Math.floor((now-parsed)/60000));return minutes<1?'Just now':minutes<60?`${minutes} min ago`:minutes<1440?`${Math.floor(minutes/60)} ${minutes<120?'hour':'hours'} ago`:`${Math.floor(minutes/1440)} ${minutes<2880?'day':'days'} ago`;
}
