import {safeSocialUrl,safeWebsiteLink} from '../content/website-links';
export const availabilityStates=['available','seasonal_break','temporarily_unavailable','sold_out'] as const;
export type AvailabilityState=typeof availabilityStates[number];
export type AvailabilityPresentation={state:AvailabilityState;label?:string;reopening?:{precision:'month'|'day';value:string};actionLabel?:string;actionUrl?:string};
// The public site currently uses English and en-IE formatting, like booking dates/prices.
export const availabilityLabels:Record<AvailabilityState,string>={available:'Available',seasonal_break:'Seasonal break',temporarily_unavailable:'Temporarily unavailable',sold_out:'Sold out'};
const messages:Record<AvailabilityState,string>={available:'',seasonal_break:'Bookings are paused for the season.',temporarily_unavailable:'Bookings are temporarily paused.',sold_out:'There are no places available at the moment.'};
export function validReopening(value:string,precision:'month'|'day'){
 if(!new RegExp(precision==='month'?'^\\d{4}-(0[1-9]|1[0-2])$':'^\\d{4}-(0[1-9]|1[0-2])-([0-2][0-9]|3[01])$').test(value)||Number(value.slice(0,4))<1)return false;
 if(precision==='month')return true;
 const date=new Date(value+'T12:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
export function validSecondaryAction(value:string){return safeWebsiteLink(value)||(safeSocialUrl(value)&&/^https:\/\/[a-zA-Z0-9][a-zA-Z0-9.-]*(?:[/?#][^\s<>\\]*)?$/.test(value));}
export function validateAvailability(value:unknown):AvailabilityPresentation{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Choose an availability status.');
 const p=value as Record<string,unknown>;
 if(Object.keys(p).some(k=>!['state','label','reopening','actionLabel','actionUrl'].includes(k)))throw Error('Unknown availability setting.');
 if(!availabilityStates.includes(p.state as AvailabilityState))throw Error('Choose an availability status.');
 for(const [key,max]of [['label',80],['actionLabel',80],['actionUrl',2048]] as const)if(p[key]!==undefined&&(typeof p[key]!=='string'||(p[key] as string).length>max))throw Error('Status labels must be at most 80 characters; links at most 2048.');
 if(p.actionUrl&&!validSecondaryAction(p.actionUrl as string))throw Error('Use a supported site path or an HTTPS link without credentials.');
 const r=p.reopening as AvailabilityPresentation['reopening'];
 if(p.reopening!==undefined&&(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).some(k=>!['precision','value'].includes(k))||!['month','day'].includes(r.precision)||typeof r.value!=='string'||!validReopening(r.value,r.precision)))throw Error('Enter a valid reopening month or date.');
 return {state:p.state as AvailabilityState,label:(p.label as string|undefined)?.trim(),actionLabel:(p.actionLabel as string|undefined)?.trim(),actionUrl:(p.actionUrl as string|undefined)?.trim(),...(r?{reopening:{precision:r.precision,value:r.value}}:{})};
}
export function availabilityPresentation(product:{active?:boolean;availability?:AvailabilityPresentation;unavailableMessage?:string},locale='en-IE'){
 let saved:AvailabilityPresentation|undefined;try{saved=product.availability?validateAvailability(product.availability):undefined;}catch{/* Legacy/malformed presentation never enables booking. */}
 const state=product.active===false?(saved?.state&&saved.state!=='available'?saved.state:'temporarily_unavailable'):'available';
 const reopening=saved?.reopening;
 const date=reopening?new Intl.DateTimeFormat(locale,{month:'long',year:'numeric',...(reopening.precision==='day'?{day:'numeric'}:{}),timeZone:'UTC'}).format(new Date(reopening.value+(reopening.precision==='month'?'-01':'')+'T12:00:00Z')):null;
 return {state,label:saved?.label||availabilityLabels[state],message:product.unavailableMessage?.trim()||messages[state],reopening:date?`Expected to reopen ${reopening?.precision==='month'?'in':'on'} ${date}`:null,actionUrl:saved?.actionUrl||null,actionLabel:saved?.actionLabel||'Explore the route'};
}
