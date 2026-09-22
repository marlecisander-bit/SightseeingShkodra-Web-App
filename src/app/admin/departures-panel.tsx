import { createSessionClient } from '../../modules/identity/supabase-server';
import { requirePermission } from '../../modules/identity/require-permission';
import { saveDeparture } from './departure-actions';
import { SubmitButton } from './submit-button';
import Link from 'next/link';
import { MutationForm } from './mutation-form';
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
export async function DeparturesPanel({operatorId,date,result}:{operatorId:string;date?:string;result?:string}) {
  await requirePermission(operatorId,'departures.manage');
  const client=await createSessionClient();
  const day=date && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0,10)===date?date:undefined;
  let query=client.from('departures').select('id,product_id,vehicle_id,service_date,start_time,capacity,status,updated_at').eq('operator_id',operatorId).order('service_date',{ascending:false}).order('start_time').limit(100);
  if(day)query=query.eq('service_date',day);
  const [departures,products,vehicles,operator]=await Promise.all([query,
    client.from('products').select('id,title').eq('operator_id',operatorId).order('title').limit(100),
    client.from('vehicles').select('id,name').eq('operator_id',operatorId).order('name').limit(100),
    client.from('operators').select('timezone').eq('id',operatorId).single()]);
  if(departures.error||products.error||vehicles.error||operator.error)return <p role="alert">Departure data is temporarily unavailable.</p>;
  const p=products.data.map(r=>({id:r.id,label:r.title})),v=vehicles.data.map(r=>({id:r.id,label:r.name}));
  const messages:Record<string,string>={saved:'Departure saved.',stale:'This departure changed. Review the latest values before saving.',inventory:'Reserved inventory or booking history prevents this change. Resolve affected bookings before changing the schedule.',error:'Unable to save. Check the date, time, capacity and linked records.'};
  return <div>{result&&<p role="status">{messages[result]??messages.error}</p>}<p>All departure dates and times use {operator.data.timezone}. Capacity changes are checked against current reservations.</p>
    <form method="get"><label>Browse calendar date<input type="date" name="date" defaultValue={day}/></label><button>Show departures</button> <Link href={`/admin/${operatorId}/departures`}>Clear filter</Link></form>
    <details><summary>Create departure</summary><Editor operatorId={operatorId} row={{service_date:day}} products={p} vehicles={v}/></details>
    {departures.data.length===0&&<p>No departures found.</p>}
    {departures.data.map(row=><details key={row.id}><summary>{row.service_date} · {row.start_time} · {p.find(item=>item.id===row.product_id)?.label ?? 'Product'} · {row.status} · {row.capacity} seats</summary><Editor operatorId={operatorId} row={row} products={p} vehicles={v}/></details>)}
    <p>Showing up to 100 departures. Filter by date to narrow the list. Departures with inventory history cannot be moved to another product, date or time.</p></div>;
}
