/** One complete, statement-scoped booking-item projection; never merge pages across snapshots. */
export const dashboardRowLimit = 1000;
export const dashboardTimeZone = 'Europe/Tirane';
export function dashboardDate(now: Date, timeZone = dashboardTimeZone) {
 return new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
export type DailyBookings = {
 state: 'ready' | 'unavailable'; serviceDate: string; timeZone: string; checkedAt: string;
 passengers: number | null; seats: number | null; bookedMinor: number | null;
};
export function unavailableBookings(now: Date, timeZone = dashboardTimeZone): DailyBookings {
 return {state:'unavailable',serviceDate:dashboardDate(now,timeZone),timeZone,checkedAt:now.toISOString(),passengers:null,seats:null,bookedMinor:null};
}
const record = (v:unknown):v is Record<string,unknown> => !!v && typeof v==='object' && !Array.isArray(v);
const one = (v:unknown):Record<string,unknown>|null => record(v)?v:Array.isArray(v)&&v.length===1&&record(v[0])?v[0]:null;
const integer = (v:unknown) => typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
function money(v:unknown):number|null {
 if(typeof v==='string'&&!/^(0|[1-9]\d*)$/.test(v))return null;
 const n=typeof v==='string'?Number(v):v;return integer(n)?n as number:null;
}
export function summarizeBookings(operatorId:string,now:Date,timeZone:string,data:unknown,count:unknown):DailyBookings {
 const unavailable=unavailableBookings(now,timeZone);
 if(!Array.isArray(data)||!integer(count)||count!==data.length||data.length>dashboardRowLimit)return unavailable;
 let passengers=0,seats=0,bookedMinor=0;const seen=new Set<string>();
 for(const row of data){
  if(!record(row))return unavailable;
  const departure=one(row.departure),order=one(row.order),booking=one(order?.booking),amount=money(row.total_price);
  if(typeof row.id!=='string'||!row.id||seen.has(row.id)||row.operator_id!==operatorId||row.status!=='confirmed'||
   !departure||departure.operator_id!==operatorId||departure.service_date!==unavailable.serviceDate||
   !order||order.operator_id!==operatorId||order.status!=='confirmed'||order.currency!=='EUR'||
   !booking||booking.operator_id!==operatorId||booking.status!=='confirmed'||
   !integer(row.quantity)||(row.quantity as number)<1||!integer(row.occupied_seats)||(row.occupied_seats as number)<1||
   (row.occupied_seats as number)>(row.quantity as number)||amount===null)return unavailable;
  seen.add(row.id);passengers+=row.quantity as number;seats+=row.occupied_seats as number;bookedMinor+=amount;
  if(![passengers,seats,bookedMinor].every(integer))return unavailable;
 }
 return {...unavailable,state:'ready',passengers,seats,bookedMinor};
}
export function dashboardIsStale(checkedAt:string,timeZone:string,serviceDate:string,now:Date){
 const age=now.getTime()-Date.parse(checkedAt);
 return !Number.isFinite(age)||age<0||age>=120_000||dashboardDate(now,timeZone)!==serviceDate;
}

/** Format integer cents without floating-point division, including the largest safe total. */
export function formatBookedEUR(minor:number){
 const cents=BigInt(minor),fraction=String(cents%BigInt(100)).padStart(2,'0');
 return new Intl.NumberFormat('en-GB',{style:'currency',currency:'EUR'}).formatToParts(cents/BigInt(100)).map(part=>part.type==='fraction'?fraction:part.value).join('');
}
