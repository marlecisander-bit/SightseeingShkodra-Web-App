import type {CalendarDay} from '@/app/admin/operations-calendar';
export type DailyDepartures={state:'ready'|'unavailable';count:number|null;next:{time:string;title:string;scheduleId:string}|null};
export const unavailableDepartures=():DailyDepartures=>({state:'unavailable',count:null,next:null});
export type DepartureOffer={id:string;title:string;active?:boolean;status?:string;inventory_product_id?:string|null};
/** One physical schedule can serve several offers; pausing one never pauses the others. */
export function activeScheduleOffers(productId:string,products:DepartureOffer[]){
 return products.filter(p=>(p.inventory_product_id??p.id)===productId&&p.active===true&&p.status==='published');
}
/** Date/slot closure precedence is shared by Home and the read-only daily view. */
export function operatingSlots(day:CalendarDay){
 if(day.exception?.closed??day.range?.closed??false)return [];
 const settings=day.exception?.calendar_settings??day.range;
 return day.slots.filter(slot=>slot.open&&settings?.departures?.[slot.time]?.closed!==true);
}
/** Scheduled service only. This is not a booking-eligibility or live boarding status. */
export function summarizeDepartures(calendars:{id:string;title:string;days:CalendarDay[]}[],date:string,localTime:string):DailyDepartures{
 const slots=calendars.flatMap(calendar=>{
  const day=calendar.days.find(day=>day.date===date);
  if(!day)throw Error('Incomplete service date');
  return operatingSlots(day).map(slot=>({time:slot.time,title:calendar.title,scheduleId:calendar.id}));
 }).sort((a,b)=>a.time.localeCompare(b.time)||a.scheduleId.localeCompare(b.scheduleId));
 return {state:'ready',count:slots.length,next:slots.find(slot=>slot.time.slice(0,5)>=localTime)??null};
}
