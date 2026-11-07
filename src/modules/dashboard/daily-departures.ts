import type {CalendarDay} from '@/app/admin/operations-calendar';
export type DailyDepartures={state:'ready'|'unavailable';count:number|null;next:{time:string;title:string;scheduleId:string}|null};
export const unavailableDepartures=():DailyDepartures=>({state:'unavailable',count:null,next:null});
/** Scheduled service only. This is not a booking-eligibility or live boarding status. */
export function summarizeDepartures(calendars:{id:string;title:string;days:CalendarDay[]}[],date:string,localTime:string):DailyDepartures{
 const slots=calendars.flatMap(calendar=>{
  const day=calendar.days.find(day=>day.date===date);
  if(!day)throw Error('Incomplete service date');
  return day.slots.filter(slot=>slot.open).map(slot=>({time:slot.time,title:calendar.title,scheduleId:calendar.id}));
 }).sort((a,b)=>a.time.localeCompare(b.time)||a.scheduleId.localeCompare(b.scheduleId));
 return {state:'ready',count:slots.length,next:slots.find(slot=>slot.time.slice(0,5)>=localTime)??null};
}
