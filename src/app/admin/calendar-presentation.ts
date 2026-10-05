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
