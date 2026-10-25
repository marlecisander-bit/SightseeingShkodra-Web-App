import type {EmailBooking,EmailEnvelope} from './booking-email-template';

// Frozen owner design 1. Existing envelopes without the marker retain their retry body.
const escape=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]!);
const clean=(value:string)=>value.replace(/[\r\n\x00-\x1f\x7f]/g,' ').trim();
const count=(value:unknown):value is number=>Number.isSafeInteger(value)&&Number(value)>=0;
export function ownerContactPhone(value:string|null){
 if(!value)return null;
 const raw=value.trim();
 if(!/^(?:\+|00)[\d\s().-]+$/.test(raw))return null;
 const normalized=raw.replace(/^00/,'+').replace(/[\s().-]/g,'');
 return /^\+[1-9]\d{7,14}$/.test(normalized)?normalized:null;
}
function customerEmail(value:string|null){
 if(!value||value.length>254)return null;
 const parts=value.split('@');if(parts.length!==2)return null;
 const [local,domain]=parts;
 if(!local||local.length>64||local.startsWith('.')||local.endsWith('.')||local.includes('..')
  ||! /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)||!domain.includes('.')
  ||!domain.split('.').every(label=>/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label)))return null;
 return `mailto:${encodeURIComponent(value)}`;
}
function amount(b:EmailBooking,compact=false){
 if(!count(b.total)||! /^[A-Z]{3}$/.test(b.currency))return null;
 try{return new Intl.NumberFormat('en-IE',{style:'currency',currency:b.currency,minimumFractionDigits:compact&&b.total%100===0?0:2,maximumFractionDigits:2}).format(b.total/100);}catch{return `${b.currency} ${(b.total/100).toFixed(2)}`;}
}
function service(item:EmailBooking['items'][number]){
 const date=item.date&&/^\d{4}-\d{2}-\d{2}$/.test(item.date)?new Date(item.date+'T12:00:00Z'):null;
 const validDate=date&&Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===item.date;
 // SQL departure date/time are local wall-clock values, not UTC instants.
 // Only the configured Shkodra zone can be labelled as local Shkodra time.
 const local=item.timezone==='Europe/Tirane';
 const time=local&&item.time&&/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?$/.test(item.time)?item.time.slice(0,5):null;
 return {time,date:validDate?new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Tirane'}).format(date):null,title:clean(item.title)};
}
export function ownerPaymentLabel(b:EmailBooking){
 if(b.paymentStatuses.includes('refunded')||b.refundStatuses.includes('succeeded'))return 'Refund recorded';
 if(b.paymentStatuses.includes('partially_refunded'))return 'Partially refunded — review payment in Admin';
 if(b.paid||b.paymentStatuses.includes('paid'))return b.refundReview?'Payment received · refund review pending':'Payment received';
 if(b.status==='cancelled'||b.status==='expired')return 'No payment recorded';
 if(b.paymentStatuses.includes('pending'))return 'Payment pending';
 if(b.paymentStatuses.includes('failed'))return 'Payment failed';
 return b.collectionMode==='meeting_point'?'Payment due at meeting point':'Payment not recorded';
}
export function ownerNewBookingEmail(b:EmailBooking,envelope:EmailEnvelope,operatorId:string,bookingId:string){
 const services=b.items.map(service),single=services.length===1?services[0]:null;
 const seats=b.items.length&&b.items.every(item=>count(item.seats))?b.items.reduce((sum,item)=>sum+item.seats!,0):null;
 const counts=b.items.length&&b.items.every(item=>item.counts&&['adult','child','infant'].every(key=>count(item.counts![key as 'adult'|'child'|'infant'])))?b.items.reduce((sum,item)=>({adult:sum.adult+item.counts!.adult,child:sum.child+item.counts!.child,infant:sum.infant+item.counts!.infant}),{adult:0,child:0,infant:0}):null;
 const passengers=counts?[
  counts.adult?`${counts.adult} ${counts.adult===1?'adult':'adults'}`:'',
  counts.child?`${counts.child} ${counts.child===1?'child':'children'}`:'',
  counts.infant?`${counts.infant} ${counts.infant===1?'infant':'infants'} (no seats)`:'',
 ].filter(Boolean).join(' · '):'Passenger breakdown not recorded';
 const seatLabel=seats===null?'Occupied seats not recorded':`${seats} ${seats===1?'seat':'seats'}`;
 const name=clean(b.name)||'Customer name not recorded';
 const status=clean(b.status).replaceAll('_',' ')||'Status not recorded';
 const statusLabel=status[0].toUpperCase()+status.slice(1);
 const payment=ownerPaymentLabel(b),total=amount(b),shortTotal=amount(b,true);
 const admin=`${envelope.siteUrl}/admin/${encodeURIComponent(operatorId)}/bookings?booking=${encodeURIComponent(bookingId)}#booking-${encodeURIComponent(bookingId)}`;
 const phone=ownerContactPhone(b.phone),email=customerEmail(b.email);
 const when=single?.date&&single.time?` for ${single.date} at ${single.time}`:'';
 const whatsapp=phone?`https://wa.me/${phone.slice(1)}?text=${encodeURIComponent(`Hello ${clean(b.name)||'there'}, this is Sightseeing Shkodra regarding your booking${when}.`)}`:null;
 const footer=Array.from(new Set([b.reference?`Ref ${b.reference}`:'',single?.title,'Sightseeing Shkodra'].filter(Boolean))).join(' · ');
 const test=envelope.testRecipient?'TEST EMAIL — owner notification. Redirected to the approved test mailbox.':'';
 const subject=["New Booking",single?.time??(services.length>1?`${services.length} departures`:null),seats===null?null:seatLabel,shortTotal,clean(b.name)?clean(b.name).slice(0,48):null].filter(Boolean).join(' · ');
 const button=(label:string,url:string,primary=false)=>`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 8px"><tr><td align="center" bgcolor="${primary?'#9D103A':'#FFFFFF'}" style="mso-padding-alt:13px 12px;border:1px solid ${primary?'#9D103A':'#D8CCD1'};border-radius:6px"><a href="${escape(url)}" style="display:block;padding:13px 12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;font-weight:bold;color:${primary?'#FFFFFF':'#9D103A'};text-decoration:none;border-radius:6px;mso-padding-alt:0">${label}</a></td></tr></table>`;
 const text=[test,'Sightseeing Shkodra','New Booking!',statusLabel,...services.map(s=>[s.time??'Departure time not recorded',s.date??'Service date not recorded',s.time?'Local Shkodra time':'',services.length>1?s.title:''].filter(Boolean).join(' · ')),name,passengers,seatLabel,total??'Total not recorded',payment,whatsapp?`WhatsApp Customer: ${whatsapp}`:'',email?`Email Customer: ${email}`:'',!email&&!whatsapp?'Customer contact not recorded. See Admin.':'',`Open Booking in Admin: ${admin}`,b.reference?`Reference: ${clean(b.reference)}`:'',single?.title??''].filter(Boolean).join('\n\n');
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New Booking!</title></head><body style="margin:0;padding:12px 0;background:#F5F2F3;color:#25232A;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.4"><!--[if mso]><table role="presentation" align="center" width="460"><tr><td><![endif]--><table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:460px;margin:0 auto;background:#FFFFFF;border-collapse:collapse;table-layout:fixed"><tr><td bgcolor="#9D103A" style="padding:16px 20px;color:#FFFFFF"><p style="margin:0 0 8px;font-size:11px;font-weight:bold;letter-spacing:1px">SIGHTSEEING SHKODRA</p><h1 style="margin:0 0 8px;font-size:25px;line-height:1.2;color:#FFFFFF">New Booking!</h1><span style="display:inline-block;padding:3px 9px;border:1px solid #FFFFFF;border-radius:12px;font-size:12px;line-height:18px;word-wrap:break-word">${escape(statusLabel)}</span></td></tr>${test?`<tr><td style="padding:8px 20px;font-size:12px;color:#625D65">${escape(test)}</td></tr>`:''}${services.length?services.map(s=>`<tr><td style="padding:14px 20px 12px;border-bottom:1px solid #EEE7EA;word-wrap:break-word">${services.length>1&&s.title?`<p style="margin:0 0 4px;font-size:13px;color:#625D65">${escape(s.title)}</p>`:''}<p style="margin:0 0 3px;font-size:${s.time?'42':'16'}px;line-height:1.1;font-weight:bold;color:#9D103A">${escape(s.time??'Departure time not recorded')}</p><p style="margin:4px 0;font-size:15px">${escape(s.date??'Service date not recorded')}</p>${s.time?'<p style="margin:0;font-size:12px;color:#625D65">Local Shkodra time</p>':''}</td></tr>`).join(''):'<tr><td style="padding:14px 20px">Departure details not recorded</td></tr>'}<tr><td style="padding:14px 20px;word-wrap:break-word;overflow-wrap:anywhere"><h2 style="margin:0 0 5px;font-size:21px;line-height:1.25">${escape(name)}</h2><p style="margin:0 0 4px;font-size:14px;color:#625D65">${escape(passengers||'No passengers recorded')}</p><p style="margin:0;font-size:16px;font-weight:bold">${escape(seatLabel)}</p></td></tr><tr><td style="padding:0 20px 14px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#F7F0F3" style="width:100%;border-collapse:collapse;table-layout:fixed"><tr><td style="padding:12px;word-wrap:break-word"><p style="margin:0 0 3px;font-size:27px;font-weight:bold;line-height:1.2">${escape(total??'Total not recorded')}</p><p style="margin:0;font-size:14px">${escape(payment)}</p></td></tr></table></td></tr><tr><td style="padding:0 20px 8px">${whatsapp?button('WhatsApp Customer',whatsapp):''}${email?button('Email Customer',email,!whatsapp):''}${!email&&!whatsapp?'<p style="margin:0 0 10px;font-size:14px;color:#625D65">Customer contact not recorded. See Admin.</p>':''}${button('Open Booking in Admin',admin,true)}</td></tr><tr><td style="padding:10px 20px 14px;border-top:1px solid #EEE7EA;font-size:11px;color:#625D65;word-wrap:break-word;overflow-wrap:anywhere">${escape(footer)}</td></tr></table><!--[if mso]></td></tr></table><![endif]--></body></html>`;
 return {subject:`${test?'[TEST] ':''}${subject}`.slice(0,160),html,text};
}
