import { passengerLabels, type PassengerKey } from "@/modules/booking/passengers";

/** Formatting only: amounts are authoritative minor-unit values, never recalculated here. */
export function bookingMoney(value:number,currency:string,discovery=false) {
  return new Intl.NumberFormat("en-IE",{style:"currency",currency,...(discovery&&value%100===0?{minimumFractionDigits:0,maximumFractionDigits:0}:{})}).format(value/100);
}
export function passengerCaption(key:PassengerKey,quantity:number) {
  return quantity+" "+(quantity===1?{adult:"Adult",child:"Child",infant:"Infant"}[key]:passengerLabels[key]);
}
export function bookingCutoff(value:string) {
  const date=new Date(value);
  return Number.isNaN(date.getTime())?undefined:new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Tirane"}).format(date);
}

/** Minimum among already supplied, date-scoped authoritative quotes. */
export function lowestQuotedFare(amounts:readonly number[]) {
 const valid=amounts.filter(value=>Number.isFinite(value)&&value>=0);
 const minimum=valid.length?Math.min(...valid):undefined;
 return minimum!==undefined&&minimum>0?minimum:undefined;
}

export function bookingDate(value:string) {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return "Choose a date";
 const date=new Date(value+"T12:00:00Z");
 return Number.isNaN(date.getTime())?"Choose a date":new Intl.DateTimeFormat("en-GB",{weekday:"short",day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(date);
}

// Scarcity affects wording only; remaining and availability are supplied by the engine.
export const scarcityThreshold=2;
export function availabilityLabel({remaining,available}:{remaining:number;available:boolean}) {
 if(!Number.isFinite(remaining))return "Unavailable";
 if(remaining<=0)return "Sold out";
 if(!available)return "Not enough seats";
 return remaining<=scarcityThreshold?`Only ${remaining} left`:"Available";
}

/** Only explicitly mapped tourist messages may reach management error feedback. */
export function safeBookingFeedback(error:unknown,messages:Record<string,string>) {
 return error instanceof Error&&Object.values(messages).includes(error.message)?error.message:messages.UNAVAILABLE;
}
