import { Button } from "@/components/ui/button";
import { createSessionClient } from '../../modules/identity/supabase-server';
import { requirePermission } from '../../modules/identity/require-permission';
import { saveDeparture } from './departure-actions';
import { SubmitButton } from './submit-button';
import Link from 'next/link';
import { MutationForm } from './mutation-form';
import { ScheduleEditor, ExceptionEditor, type ServiceSchedule, type ScheduleException } from './schedule-editor';
import { prepareServiceDate } from '@/modules/booking/schedules-server';
type Departure={id?:string;product_id?:string;vehicle_id?:string|null;service_date?:string;start_time?:string;capacity?:number;status?:string;updated_at?:string};
type Choice={id:string;label:string};
function Editor({operatorId,row,products,vehicles}:{operatorId:string;row:Departure;products:Choice[];vehicles:Choice[]}) {
  return <MutationForm action={saveDeparture.bind(null,operatorId)}>
    <input type="hidden" name="id" value={row.id ?? ''}/><input type="hidden" name="updated_at" value={row.updated_at ?? ''}/>
    <label>Product<select name="product_id" required defaultValue={row.product_id ?? ''}><option value="">Choose product</option>{products.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
    <label>Vehicle<select name="vehicle_id" defaultValue={row.vehicle_id ?? ''}><option value="">Unassigned</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}</select></label>
    <label>Service date<input name="service_date" type="date" required defaultValue={row.service_date}/></label>
    <label>Local departure time<input name="start_time" type="time" step="1" required defaultValue={row.start_time}/></label>
    <label>Seat capacity<input name="capacity" type="number" min="0" max="2147483647" step="1" required defaultValue={row.capacity ?? 0}/></label>
    <label>Status<select name="status" defaultValue={row.status ?? 'draft'}>{['draft','scheduled','cancelled'].map(s=><option key={s}>{s}</option>)}</select></label>
    <SubmitButton disabled={products.length===0}>{row.id?'Save departure':'Create departure'}</SubmitButton>
    {products.length===0&&<p>Create a product before scheduling a departure.</p>}
  </MutationForm>;
}
export async function InventoryHistoryPanel({operatorId,date,result}:{operatorId:string;date?:string;result?:string}) {
  await requirePermission(operatorId,'departures.manage');
  const client=await createSessionClient();
  const day=date && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0,10)===date?date:undefined;
  try { if(day) await prepareServiceDate(operatorId,day); } catch { return <p role="alert">Service schedules are unavailable. Check that the schedule migration has been applied.</p>; }
  let query=client.from('departures').select('id,product_id,vehicle_id,service_date,start_time,capacity,status,updated_at,schedule_id').eq('operator_id',operatorId).order('service_date',{ascending:false}).order('start_time').limit(100);
  if(day)query=query.eq('service_date',day);
  const [departures,products,vehicles,operator,schedules,exceptions]=await Promise.all([query,
    client.from('products').select('id,title').eq('operator_id',operatorId).eq('type','van_tour').order('title').limit(100),
    client.from('vehicles').select('id,name').eq('operator_id',operatorId).order('name').limit(100),
    client.from('operators').select('timezone').eq('id',operatorId).single(),
    client.from('service_schedules').select('*').eq('operator_id',operatorId).order('start_date').limit(100),
    client.from('schedule_exceptions').select('*').eq('operator_id',operatorId).order('service_date').limit(500)]);
  if(departures.error||products.error||vehicles.error||operator.error||schedules.error||exceptions.error)return <p role="alert">Schedule data is temporarily unavailable. Check that the service schedule migration has been applied.</p>;
  const p=products.data.map(r=>({id:r.id,label:r.title})),v=vehicles.data.map(r=>({id:r.id,label:r.name}));
  const messages:Record<string,string>={saved:'Departure saved.',stale:'This departure changed. Review the latest values before saving.',inventory:'Reserved inventory or booking history prevents this change. Resolve affected bookings before changing the schedule.',error:'Unable to save. Check the date, time, capacity and linked records.'};
  const availableProducts=p.filter(product=>!schedules.data.some(schedule=>schedule.product_id===product.id));
  return <div>{result&&<p role="status">{result==='schedule'?'Service schedule saved.':messages[result]??messages.error}</p>}<h2>Service schedules</h2><p>Set an operating period once. Departure inventory is created automatically when a date is requested. All dates and times use {operator.data.timezone}.</p><p>Seats are reserved for the selected departure. This system does not currently validate all-day reboarding entitlement.</p>
    <details><summary>Create service schedule</summary><ScheduleEditor operatorId={operatorId} products={availableProducts} vehicles={v}/>{!availableProducts.length&&<p>Create a van-tour product without an existing schedule first.</p>}</details>
    {(schedules.data as ServiceSchedule[]).map(schedule=><details key={`${schedule.id}-${schedule.updated_at}`}><summary>{p.find(item=>item.id===schedule.product_id)?.label ?? 'Product'} · {schedule.start_date} – {schedule.end_date} · {schedule.status} · {schedule.departure_times.map(t=>t.time).join(', ')}</summary>
      <ScheduleEditor operatorId={operatorId} schedule={schedule} products={p} vehicles={v}/>
      <h3>Schedule exceptions</h3><details><summary>+ Add exception</summary><ExceptionEditor operatorId={operatorId} schedule={schedule} vehicles={v}/></details>
      {(exceptions.data as ScheduleException[]).filter(e=>e.schedule_id===schedule.id).map(exception=><details key={exception.id}><summary>{exception.service_date} · {exception.closed?'Closed':exception.departure_times.map(t=>t.time).join(', ')}</summary><ExceptionEditor operatorId={operatorId} schedule={schedule} exception={exception} vehicles={v}/></details>)}
    </details>)}
    <h2>Dated inventory &amp; history</h2><p>Use a date to inspect generated inventory. Historical records are retained; schedule-linked departures are managed through the schedule and its exceptions.</p>
    <form method="get"><label>Browse calendar date<input type="date" name="date" defaultValue={day}/></label><Button>Show departures</Button> <Link href={`/admin/${operatorId}/departures`}>Clear filter</Link></form>
    {departures.data.length===0&&<p>No departures found.</p>}
    {departures.data.map(row=><details key={row.id}><summary>{row.service_date} · {row.start_time} · {p.find(item=>item.id===row.product_id)?.label ?? 'Product'} · {row.status} · {row.capacity} seats</summary>{row.schedule_id?<p>Managed by its service schedule. Use a date exception to make changes.</p>:<Editor operatorId={operatorId} row={row} products={p} vehicles={v}/>}</details>)}
    <p>Showing up to 100 departures. Filter by date to narrow the list. Departures with inventory history cannot be moved to another product, date or time.</p></div>;
}
