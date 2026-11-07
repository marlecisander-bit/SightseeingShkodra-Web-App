'use client';
import {useState} from 'react';
import {ProductBookingCards} from '@/components/public/product-booking-cards';
import {ProductAvailabilityForm} from '@/app/admin/product-availability-form';
import {validateAvailability,type AvailabilityPresentation} from '@/modules/booking/product-availability';
import {initialWebsiteContent} from '@/modules/content/website-schema';
export function TourStatusFixture(){
 const [availability,setAvailability]=useState<AvailabilityPresentation>({state:'seasonal_break',reopening:{precision:'month',value:'2031-04'},actionUrl:'/route'}),[message,setMessage]=useState('');
 const card={enabled:true,image:'/images/lake.webp',alt:'Lake landscape',description:'A complete sightseeing route.',order:0};
 return <main className="public-site" style={{padding:24,maxWidth:1100,margin:'auto'}}><h1>Synthetic tour status preview</h1><ProductBookingCards preview embedded content={initialWebsiteContent} products={[{id:'10000000-0000-4000-8000-000000000020',title:'Tour with status',slug:'status',mode:'selected_departure',minutes:120,active:availability.state==='available',availability,unavailableMessage:message,adultPrice:1000,card},{id:'10000000-0000-4000-8000-000000000021',title:'Available tour',slug:'available',mode:'selected_departure',minutes:120,adultPrice:1500,card}]}/><ProductAvailabilityForm operatorId="fixture" id="fixture" stamp="fixture" active={false} presentation={availability} saveAction={async data=>{setAvailability(validateAvailability(JSON.parse(String(data.get('availability')))));setMessage(String(data.get('unavailable_message')));}}/></main>;
}
