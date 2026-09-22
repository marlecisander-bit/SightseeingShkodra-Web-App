import {randomUUID} from 'node:crypto';
import {createSessionClient} from '../../modules/identity/supabase-server';
import {requirePermission} from '../../modules/identity/require-permission';
import {hasPermission} from '../../modules/identity/roles';
import {manualBooking,cancelBooking} from './booking-actions';
import {SubmitButton} from './submit-button';
import Link from 'next/link';
export async function BookingsPanel({operatorId,result,date,email,requestId}:{operatorId:string;result?:string;date?:string;email?:string;requestId?:string}) {
  const context=await requirePermission(operatorId,'bookings.read');
  const client=await createSessionClient();
  const day=date&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date?date:undefined;
  const searchEmail=email?.trim().toLowerCase().slice(0,254);
  const [customers,departures,products]=await Promise.all([
    searchEmail?client.from('customers').select('id,name,email,phone').eq('operator_id',operatorId).eq('email',searchEmail).limit(100):Promise.resolve({data:[],error:null}),
    client.from('departures').select('id,product_id,service_date,start_time').eq('operator_id',operatorId).eq('status','scheduled').gte('service_date',new Date().toISOString().slice(0,10)).order('service_date').order('start_time').limit(100),
    client.from('products').select('id,title').eq('operator_id',operatorId).limit(100)]);
  if(customers.error||departures.error||products.error)return <p role="alert">Booking data is temporarily unavailable.</p>;
  let ordersQuery=client.from('orders').select('id,customer_id,status,total,currency,created_at').eq('operator_id',operatorId).order('created_at',{ascending:false}).limit(100);
  if(searchEmail)ordersQuery=ordersQuery.in('customer_id',customers.data.map(c=>c.id));
  if(day){
    const scheduled=await client.from('departures').select('id').eq('operator_id',operatorId).eq('service_date',day).limit(1000);
    if(scheduled.error)return <p role="alert">Calendar is unavailable.</p>;
    const items=await client.from('booking_items').select('order_id').eq('operator_id',operatorId).in('departure_id',scheduled.data.map(d=>d.id)).limit(1000);
    if(items.error)return <p role="alert">Calendar is unavailable.</p>;
    ordersQuery=ordersQuery.in('id',items.data.map(i=>i.order_id));
  }
  const orders=await ordersQuery;
  if(orders.error)return <p role="alert">Orders are temporarily unavailable.</p>;
  const ids=orders.data.map(o=>o.id);
  const [people,bookings,items,payments,holds]=await Promise.all([
    client.from('customers').select('id,name,email,phone').eq('operator_id',operatorId).in('id',orders.data.map(o=>o.customer_id)),
    client.from('bookings').select('order_id,booking_reference,status').eq('operator_id',operatorId).in('order_id',ids),
    client.from('booking_items').select('order_id,product_id,quantity,status').eq('operator_id',operatorId).in('order_id',ids),
    hasPermission(context.role,'payments.refund')?client.from('payments').select('order_id,status,amount,currency').eq('operator_id',operatorId).in('order_id',ids):Promise.resolve({data:[],error:null}),
    client.from('inventory_holds').select('order_id,status,expires_at').eq('operator_id',operatorId).in('order_id',ids)]);
  if(people.error||bookings.error||items.error||payments.error||holds.error)return <p role="alert">Booking details are temporarily unavailable.</p>;
  const messages:Record<string,string>={created:'Unpaid booking created. Its seat hold expires unless payment is completed.',cancelled:'Order cancelled.',review:'Order cancelled. Refund review requested; no refund has been issued.',error:'Unable to complete the action. Check availability, configured pricing and customer details, then refresh before retrying.'};
  return <div>{result&&<p role="status">{messages[result]??messages.error}</p>}
    <form method="get"><label>Departure date<input type="date" name="date" defaultValue={day}/></label><label>Customer email (exact match)<input type="email" name="email" defaultValue={searchEmail}/></label><button>Find bookings</button> <Link href={`/admin/${operatorId}/bookings`}>Clear filters</Link></form>
    {searchEmail&&<div><h2>Customer lookup</h2>{customers.data.length?customers.data.map(c=><p key={c.id}>{c.name} · {c.email} · {c.phone??'No phone'}</p>):<p>No matching customer.</p>}</div>}
    {hasPermission(context.role,'bookings.create')&&<details><summary>Create manual booking</summary><p>This creates an unpaid booking and a time-limited hold. Payment collection is not connected yet.</p>
      <form action={manualBooking.bind(null,operatorId)}><input type="hidden" name="request_id" value={requestId&&/^[0-9a-f-]{36}$/i.test(requestId)?requestId:randomUUID()}/>
        <label>Departure<select name="departure_id" required><option value="">Choose departure</option>{departures.data.map(d=><option key={d.id} value={d.id}>{d.service_date} {d.start_time} · {products.data.find(p=>p.id===d.product_id)?.title??'Product'}</option>)}</select></label>
        <label>Guests<input name="quantity" type="number" min="1" max="2147483647" step="1" defaultValue={1} required/></label>
        <label>Customer name<input name="name" maxLength={200} required/></label><label>Email<input name="email" type="email" maxLength={254} required/></label><label>Phone<input name="phone" type="tel" maxLength={50}/></label><SubmitButton disabled={departures.data.length===0}>Create unpaid booking</SubmitButton>
        {departures.data.length===0&&<p>No scheduled departure is available. Schedule a departure before creating a booking.</p>}
      </form></details>}
    <h2>Orders</h2>{orders.data.length===0&&<p>No orders match these filters.</p>}
    {orders.data.map(order=>{const person=people.data.find(p=>p.id===order.customer_id), booking=bookings.data.find(b=>b.order_id===order.id);return <details key={order.id}><summary>{booking?.booking_reference??order.id} · {person?.name??'Customer'} · {order.status}</summary>
      <p>{person?.email} {person?.phone}</p><p>Order: {order.id}</p><p>Total: {order.currency} {(order.total/100).toFixed(2)}</p><p>Booking: {booking?.status??'Not prepared'}</p>
      {holds.data.filter(h=>h.order_id===order.id).map((h,index)=><p key={index}>Hold record: {h.status} · expiry: {h.expires_at}. Unpaid inventory is not reserved beyond this time.</p>)}
      <ul>{items.data.filter(i=>i.order_id===order.id).map((i,index)=><li key={index}>{products.data.find(p=>p.id===i.product_id)?.title??i.product_id} · {i.quantity} guests · {i.status}</li>)}</ul>
      {payments.data.filter(p=>p.order_id===order.id).map((p,index)=><p key={index}>Payment: {p.status} · {p.currency} {(p.amount/100).toFixed(2)}</p>)}
      {hasPermission(context.role,'bookings.cancel')&&['pending','awaiting_payment','paid','confirmed'].includes(order.status)&&<form action={cancelBooking.bind(null,operatorId,order.id)}><label>Cancellation reason<textarea name="reason" maxLength={500} required/></label><label><input type="checkbox" name="confirm" value="yes" required/> Confirm cancellation and inventory release</label><SubmitButton>Cancel order</SubmitButton><p>Paid orders will be flagged for refund review. This does not issue a refund.</p></form>}
    </details>;})}<p>Showing up to 100 orders and upcoming departures. Date lookup is limited to 1,000 departures/items. No payment or refund can be marked successful here.</p></div>;
}
