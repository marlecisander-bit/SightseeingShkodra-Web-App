import 'server-only';
import {redirect} from 'next/navigation';
import {requirePermission} from '@/modules/identity/require-permission';
import {AuthorizationError} from '@/modules/identity/authorization';
import {adminSections} from '@/modules/identity/admin-navigation';
import {safeAdminReturn} from '@/modules/notifications/contracts';
export type SectionSearch={result?:string;product?:string;tab?:string;create?:string;fromBookings?:string;view?:string;history?:string;date?:string;email?:string;requestId?:string;booking?:string;delivery?:string;recipient?:string};
export type SectionProps={params:Promise<{operatorId:string}>;searchParams:Promise<SectionSearch>};
export async function sectionAccess(section:string,props:SectionProps){
 const {operatorId}=await props.params;const selected=adminSections.find(item=>item.slug===section)!;
 try{return await requirePermission(operatorId,selected.permission);}
 catch(error){
  if(error instanceof AuthorizationError){
   const search=await props.searchParams;const query=new URLSearchParams();
   if(section==='products'){if(search.product)query.set('product',search.product);if(search.tab)query.set('tab',search.tab);}
   if(section==='bookings'&&search.booking)query.set('booking',search.booking);
   if(['bookings','departures'].includes(section)&&search.date)query.set('date',search.date);
   // A sign-in round trip must not drop the safe Bookings handoff into legacy dated preparation.
   const returnSection=section==='departures'&&search.fromBookings==='1'?'bookings':section;
   const next=safeAdminReturn(`/admin/${operatorId}/${returnSection}${query.size?'?'+query:''}`);
   redirect(`/auth/sign-in?next=${encodeURIComponent(next)}&error=${error.code==='UNAUTHENTICATED'?'signin':error.code==='FORBIDDEN'?'access':'unavailable'}`);
  }throw error;
 }
}
