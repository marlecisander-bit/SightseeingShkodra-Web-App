export const plannerTimezone = 'Europe/Tirane';
export function plannerClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:plannerTimezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
  const get=(key:string)=>parts.find(p=>p.type===key)!.value;
  return {date:`${get('year')}-${get('month')}-${get('day')}`,time:`${get('hour')}:${get('minute')}`};
}
export type DayPlannerData={date:string;title:string;times:string[]|null;fares:{time:string;amount:number}[];stops:{id:string;label:string}[]|null};
export function plannerSummary(data:DayPlannerData, now=new Date()) {
 const clock=plannerClock(now),current=clock.date===data.date;
 const upcoming=current?data.times?.filter(t=>t>clock.time):undefined;
 const fares=current?data.fares.filter(f=>f.time>clock.time).map(f=>f.amount):[];
 return {upcoming,price:fares.length?Math.min(...fares):null,status:!current||data.times===null?'View today’s schedule':!data.times.length?'No service today':!upcoming?.length?'Service finished for today':`Next: ${upcoming[0]}`};
}
