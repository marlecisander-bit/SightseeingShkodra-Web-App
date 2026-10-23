import type {CalendarDay,Settings} from './operations-calendar';

/** Labels only: operational state and quotes remain supplied by the calendar API. */
export function calendarDayPresentation(day:CalendarDay){
 const open=day.slots.filter(slot=>slot.open);
 const overrides=[day.range,day.exception?.calendar_settings].filter((value):value is Settings=>!!value);
 const hasPrices=(value:Settings):boolean=>!!value.offer||Object.keys(value.prices??{}).length>0||Object.values(value.departures??{}).some(hasPrices);
 const hasSchedule=(value:Settings):boolean=>value.closed!==undefined||value.times!==undefined||value.capacity!==undefined||Object.values(value.departures??{}).some(hasSchedule);
 const price=overrides.some(hasPrices);
 const schedule=overrides.some(hasSchedule);
 const changed=!!day.range||!!day.exception;
 const explicitlyClosed=day.exception?.closed??day.range?.closed??false;
 const state=open.length?'Open':explicitlyClosed||day.slots.length?'Closed':'No service';
 const labels=[...(price?['Custom price']:[]),...(schedule?['Custom schedule']:[]),...(changed&&!price&&!schedule?['Changed']:[])];
 const full=open.length>0&&open.every(slot=>slot.remaining===0);
 return {state,changed,labels,full,departures:open.length,marker:state==='Closed'?'\u00d7':state==='No service'?'\u2014':changed?'\u2022':''};
}

/** Visual cue only; never used to accept/reject a booking or change inventory. */
export const LIMITED_SEAT_RATIO = 0.25;
export function calendarDayOverview(day:CalendarDay, today:string, service:{start_date:string;end_date:string;status:string}) {
 const presentation=calendarDayPresentation(day);
 const outside=day.date<service.start_date||day.date>service.end_date;
 const departureClosures=day.exception?.calendar_settings.departures;
 const configuredTimes=day.exception?.departure_times??[];
 const individuallyClosed=configuredTimes.length>0&&configuredTimes.every(slot=>departureClosures?.[slot.time]?.closed===true);
 const closed=(day.exception?.closed??day.range?.closed??false)||individuallyClosed;
 const open=day.slots.filter(slot=>slot.open);
 const priced=open.filter(slot=>slot.quote);
 const capacity=day.slots.reduce((sum,slot)=>sum+slot.capacity,0);
 const booked=day.slots.reduce((sum,slot)=>sum+slot.booked,0);
 const held=day.slots.reduce((sum,slot)=>sum+slot.held,0);
 // Remaining is supplied by SQL, already net of confirmed seats and active holds.
 const remaining=open.reduce((sum,slot)=>sum+slot.remaining,0);
 let state='available',label='Available',symbol='●';
 if(outside){state='neutral';label='Outside service';symbol='—';}
 else if(service.status!=='active'||(!day.slots.length&&!closed)){state='neutral';label='No service';symbol='—';}
 else if(day.date<today){state='past';label='Past';symbol='◷';}
 else if(closed){state='closed';label='Admin closed';symbol='🔒';}
 else if(!open.length){state='unavailable';label='Unavailable';symbol='×';}
 else if(open.every(slot=>slot.remaining===0)){
  state='full';label=open.length===day.slots.length?'Fully booked':'Unavailable';symbol='×';
 }
 else if(day.date===today){state='neutral';label='Check cutoff';symbol='◷';}
 else if(!priced.some(slot=>slot.remaining>0)){state='unavailable';label='Price unavailable';symbol='×';}
 else if(priced.reduce((sum,slot)=>sum+slot.remaining,0)<=priced.reduce((sum,slot)=>sum+slot.capacity,0)*LIMITED_SEAT_RATIO){state='limited';label='Limited';symbol='◐';}
 return {...presentation,state,label,symbol,capacity,booked,held,remaining,
  description:`${label}. ${open.length} open of ${day.slots.length} projected departures; ${booked} booked seats, ${held} temporarily held, ${remaining} remaining in open departures.${day.date===today?' Cutoff eligibility is not supplied by this read-only calendar.':''}`};
}
