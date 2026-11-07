import {notFound} from 'next/navigation';
import {type CalendarDay} from '../../admin/operations-calendar';
import type {ServiceSchedule} from '../../admin/schedule-editor';
import {OperatingCalendarWorkspace} from '../../admin/operating-calendar-workspace';
import adminStyles from '../../admin/admin.module.css';
export default async function CalendarPreview({searchParams}:{searchParams:Promise<{date?:string;schedule?:string}>}){
 if(process.env.NODE_ENV!=='development')notFound();
 const query=await searchParams;
 const month=query.date&&/^\d{4}-\d{2}-\d{2}$/.test(query.date)?query.date.slice(0,7)+'-01':'2026-10-01';
 const length=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).getUTCDate();
 const schedule:ServiceSchedule={id:'local-preview',product_id:'local-preview',start_date:'2026-10-03',end_date:'2026-10-29',weekdays:[1,2,3,4,5,6,7],departure_times:[{time:'09:00'},{time:'11:00'},{time:'13:00'},{time:'15:00'}],default_capacity:8,vehicle_id:null,status:'active',updated_at:'local',calendar_ranges:[{from:'2026-10-24',to:'2026-10-28',weekdays:[1,2,3,4,5,6,7],capacity:8}]};
 const days:CalendarDay[]=Array.from({length},(_,i)=>{const date=`${month.slice(0,7)}-${String(i+1).padStart(2,'0')}`;return {date,range:i===25?{closed:true}:null,exception:null,slots:i===26?[]:schedule.departure_times.map(t=>({id:null,time:t.time,capacity:8,open:i!==25,booked:i===24?8:i===23?6:2,held:0,remaining:i===24?0:i===23?2:6,quote:{version:1,currency:'EUR',total:1000,lines:[]} as unknown as NonNullable<CalendarDay['slots'][number]['quote']>}))};});
 return <main className={adminStyles.shell}><div style={{width:"100%",minWidth:0}}><h1>Schedule &amp; Departures</h1><p>Local synthetic layout fixture. Do not submit changes. No database reads or writes are used to load this preview.</p><OperatingCalendarWorkspace key={month} operatorId="local-preview" calendars={[{schedule,title:'Daily Ticket',days},{schedule:{...schedule,id:'panorama',product_id:'panorama'},title:'Panorama Tour',days}]} products={[{id:'local-preview',title:'Daily Ticket',active:false,availability_presentation:{state:'seasonal_break'},inventory_product_id:null},{id:'panorama',title:'Panorama Tour',active:true,inventory_product_id:null},{id:'shared',title:'Shared-van offer',active:true,inventory_product_id:'local-preview'}]} selectedSchedule={query.schedule} selectedDate={query.date??'2026-10-24'} month={month} today="2026-10-23" timeZone="Europe/Tirane" canPrice/></div></main>;
}
