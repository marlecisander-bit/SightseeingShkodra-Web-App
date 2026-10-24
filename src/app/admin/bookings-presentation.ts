import type {PassengerSnapshot} from '@/modules/booking/passengers';
export type BookingListStatus='all'|'confirmed'|'pending'|'cancelled'|'expired';
export const bookingStatuses:BookingListStatus[]=['all','confirmed','pending','cancelled','expired'];
export function validBookingDay(value?:string){return value&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value?value:undefined;}
export function bookingAmount(minor:number,currency:string){
 if(!Number.isSafeInteger(minor)||minor<0||!/^[A-Z]{3}$/.test(currency))return 'Value unavailable';
 try{const amount=BigInt(minor),hundred=BigInt(100);return new Intl.NumberFormat('en-GB',{style:'currency',currency}).formatToParts(amount/hundred).map(p=>p.type==='fraction'?String(amount%hundred).padStart(2,'0'):p.value).join('');}catch{return 'Value unavailable';}
}
export type BookingItemView={product:string;date?:string;time?:string;quantity:number;seats:number;status:string;snapshot:PassengerSnapshot|null};
export type BookingPaymentView={status:string;amount:number;currency:string};
export type BookingRecordView={id:string;bookingId?:string;reference:string;name:string;email?:string|null;phone?:string|null;status:string;orderStatus:string;total:number;currency:string;collectionMode:string;items:BookingItemView[];payments:BookingPaymentView[];checkedInAt?:string|null;hasQr:boolean};
/** Presentation only. Financial eligibility remains in existing server actions/domain functions. */
export function bookingPaymentLabel(row:Pick<BookingRecordView,'payments'|'collectionMode'|'orderStatus'>){
 if(new Set(row.payments.map(p=>p.status)).size>1)return 'Review payment records';
 if(row.payments.some(p=>p.status==='partially_refunded'))return 'Partially refunded';
 if(row.payments.some(p=>p.status==='refunded'))return 'Refunded';
 if(row.payments.some(p=>p.status==='paid'))return 'Paid';
 if(row.payments.some(p=>p.status==='processing'))return 'Processing';
 if(row.payments.some(p=>p.status==='failed'))return 'Failed';
 if(row.payments.some(p=>p.status==='pending'))return 'Pending';
 if(row.payments.length)return 'Status unavailable';
 if(row.orderStatus==='cancelled')return 'No payment recorded';
 return row.collectionMode==='meeting_point'?'Due at meeting point':'No payment recorded';
}
export function bookingMatches(row:{searchText:string;status:string},query:string,status:string){
 const words=query.toLocaleLowerCase('en-GB').trim().split(/\s+/).filter(Boolean);
 return (status==='all'||row.status===status)&&words.every(word=>row.searchText.toLocaleLowerCase('en-GB').includes(word));
}
