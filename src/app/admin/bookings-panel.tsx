import {randomUUID} from 'node:crypto';
import Link from 'next/link';
import {createSessionClient} from '@/modules/identity/supabase-server';
import {requirePermission} from '@/modules/identity/require-permission';
import {hasPermission} from '@/modules/identity/roles';
import {withOperatorService} from '@/modules/identity/operator-service';
import type {PassengerCategories,PassengerSnapshot} from '@/modules/booking/passengers';
import {BookingQr} from '@/components/public/booking-pass';
import {emailOutcomeLabel} from '@/modules/integrations/email-delivery-status';
import {ownerEmailEvent,ownerStatus} from './presentation';
import {validBookingDay,bookingAmount,type BookingRecordView} from './bookings-presentation';
import {BookingsWorkspace,type BookingEntry} from './bookings-workspace';
import {BookingRecord} from './booking-record';
import {BookingDeletionForm} from './booking-deletion-form';
import {BookingConfirmation} from './booking-confirmation';
import {StaffPassengers} from './staff-passengers';
import {MutationForm} from './mutation-form';
import {SubmitButton} from './submit-button';
import {manualBooking,cancelBooking,collectPayment,loadBookingDepartures,deleteBooking} from './booking-actions';
import styles from './bookings.module.css';
function unavailable(message:string){return <div className={styles.workspace}><h1>Bookings</h1><p role="alert">{message} No partial booking details are shown.</p><Link prefetch={false} href="?">Retry without filters</Link></div>;}
export async function BookingsPanel({
  operatorId,
  result,
  create,
  date,
  email,
  requestId,
  q, status, page,
  booking: selectedBooking,
}: {
  operatorId: string;
  result?: string;
  create?: string;
  date?: string;
  email?: string;
  requestId?: string;
  q?:string;status?:string;page?:string;
  booking?: string;
}) {
  const context = await requirePermission(operatorId, "bookings.read");
  const client = await createSessionClient();
  if(selectedBooking&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedBooking))return unavailable('The booking link is invalid.');
  const day=validBookingDay(date),creating=create==='1';
  const searchEmail=email?.trim().toLowerCase().slice(0,254);
  const operator=await client.from('operators').select('timezone').eq('id',operatorId).single();
  if(operator.error)return unavailable('Booking dates are temporarily unavailable.');
  let today:string;try{today=new Intl.DateTimeFormat('en-CA',{timeZone:operator.data.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}catch{return unavailable('Booking dates are temporarily unavailable.');}
  let departureChoices = client.from('departures').select('id,product_id,service_date,start_time')
    .eq('operator_id', operatorId).eq('status', 'scheduled');
  departureChoices = day ? departureChoices.eq('service_date',day)
    : departureChoices.gte('service_date',today);
  const query=(q??'').trim().slice(0,200),searchStatus=['confirmed','pending','cancelled','expired'].includes(status??'')?status!:'all';
  const pageNumber=/^[1-9]\d{0,5}$/.test(page??'')?Number(page):1;
  const [departures,products,searchResult]=await Promise.all([
    creating?departureChoices.order('service_date').order('start_time').limit(100):Promise.resolve({data:[],error:null}),
    client.from('products').select('id,title,inventory_product_id,status,type').eq('operator_id',operatorId).limit(100),
    selectedBooking?Promise.resolve(null):withOperatorService(operatorId,'bookings.read',async(service,ctx)=>{
      const result=await service.rpc('search_admin_orders_v1',{p_operator:ctx.operatorId,p_actor:ctx.staffProfileId,p_query:query,p_day:day??null,p_email:searchEmail??null,p_status:searchStatus,p_page:pageNumber});
      if(result.error)throw Error('Booking search unavailable');return result.data as {ids:string[];total:number;page:number;pageSize:number};
    }).catch(()=>undefined),
  ]);
  if(departures.error||products.error||searchResult===undefined)return unavailable('Booking search is temporarily unavailable.');
  const categories=creating&&hasPermission(context.role,'bookings.create')?await withOperatorService(operatorId,'bookings.create',async(service)=>Object.fromEntries(await Promise.all(products.data.map(async(p)=>{const r=await service.rpc('passenger_categories_v1',{p_product:p.id});if(r.error)throw Error('Passenger categories unavailable');return [p.id,r.data as PassengerCategories];})))):{};
  let ordersQuery=client.from('orders').select('id,customer_id,status,total,currency,created_at,collection_mode',{count:'exact'}).eq('operator_id',operatorId).order('created_at',{ascending:false}).order('id',{ascending:false});
  if(selectedBooking){
    const selected=await client.from('bookings').select('order_id').eq('operator_id',operatorId).eq('id',selectedBooking).maybeSingle();
    if(selected.error)return unavailable('Booking is temporarily unavailable.');
    ordersQuery=ordersQuery.in('id',selected.data?[selected.data.order_id]:[]);
  }else ordersQuery=ordersQuery.in('id',searchResult!.ids);
  const orders = await ordersQuery;
  if (orders.error)
    return unavailable('Orders are temporarily unavailable.');
  const ids = orders.data.map((o) => o.id);
  const [people, bookings, items, payments] = await Promise.all([
    client
      .from("customers")
      .select("id,name,email,phone",{count:"exact"})
      .eq("operator_id", operatorId)
      .in(
        "id",
        orders.data.map((o) => o.customer_id),
      ),
    client
      .from("bookings")
      .select("id,order_id,booking_reference,status,qr_token,qr_created_at,checked_in_at",{count:"exact"})
      .eq("operator_id", operatorId)
      .in("order_id", ids),
    client
      .from("booking_items")
      .select("order_id,product_id,departure_id,quantity,occupied_seats,status,passenger_snapshot",{count:"exact"})
      .eq("operator_id", operatorId)
      .in("order_id", ids),
    hasPermission(context.role, "payments.collect")
      ? client
          .from("payments")
          .select("order_id,status,amount,currency",{count:"exact"})
          .eq("operator_id", operatorId)
          .in("order_id", ids)
      : Promise.resolve({ data: [], error: null, count:0 }),
  ]);
  if (
    people.error ||
    bookings.error ||
    items.error ||
    payments.error || people.count!==people.data?.length || bookings.count!==bookings.data?.length || items.count!==items.data?.length || payments.count!==payments.data?.length
  )
    return unavailable('Booking details are temporarily unavailable.');
  const preparedOrders=new Set(bookings.data.map(b=>b.order_id));
  const holdIds=selectedBooking?ids:orders.data.filter(o=>!preparedOrders.has(o.id)).map(o=>o.id);
  const holds=holdIds.length?await client.from('inventory_holds').select('order_id,status,expires_at',{count:'exact'}).eq('operator_id',operatorId).in('order_id',holdIds):{data:[],error:null,count:0};
  if(holds.error||holds.count!==holds.data?.length)return unavailable('Temporary seat reservations are unavailable.');
  const itemDepartures = await client.from("departures").select("id,service_date,start_time",{count:"exact"})
    .eq("operator_id",operatorId).in("id",[...new Set(items.data.map(i=>i.departure_id).filter(Boolean))]);
  if(itemDepartures.error||itemDepartures.count!==itemDepartures.data?.length) return unavailable('Departure details are temporarily unavailable.');
  const deliveries = selectedBooking?await client
    .from("notification_deliveries")
    .select("id,booking_id,status,channel,attempt_count,last_error_code,provider_status,provider_updated_at,provider_reason,provider_reference,recipient_type,event_type,manual,created_at")
    .eq("operator_id", operatorId)
    .in(
      "booking_id",
      bookings.data.map((b) => b.id),
    ).order("created_at", { ascending: false }).limit(1000):{data:[],error:null};
  const messages:Record<string,string>={deleted:'Booking permanently deleted. Financial and audit history retained. No refund was issued.',email_queued:'Confirmation emails requested. Check message status after refreshing.',created:'Reservation confirmed. Payment is due at the meeting point.',collected:'Full payment recorded at the meeting point.',cancelled:'Booking cancelled.',review:'Booking cancelled. Refund review requested; no refund has been issued.',departures_ready:'Booking departures loaded for the selected service date.',error:'Unable to complete the action. Check the latest booking details before retrying.'};
  const root=`/admin/${encodeURIComponent(operatorId)}`;
  const usableDepartures=departures.data.filter(d=>categories[d.product_id]);
  const creation=creating&&hasPermission(context.role,'bookings.create')?<section id="new-booking" className={styles.creation}>
   <div className={styles.creationTitle}><h2>Create booking</h2><Link prefetch={false} href={`${root}/bookings${day?'?date='+day:''}`}>Close</Link></div>
   <p>Confirm a reservation with payment due at the meeting point.</p>
   <details open={usableDepartures.length===0}><summary>Choose a service date</summary><p>Load this date’s departures before booking. This can add dated departures from the existing schedule; it does not reserve seats.</p>
    <BookingConfirmation message="Load booking departures for this date? This may prepare dated departures from the schedule, but does not reserve seats."><MutationForm action={loadBookingDepartures.bind(null,operatorId)}><label>Service date<input type="date" name="date" defaultValue={day??today} required/></label><SubmitButton>Load booking departures</SubmitButton></MutationForm></BookingConfirmation>
   </details>
   <BookingConfirmation message="Confirm this reservation now? Seats will be reserved immediately and full payment will be due at the meeting point."><MutationForm action={manualBooking.bind(null,operatorId)}>
    <input type="hidden" name="request_id" value={requestId&&/^[0-9a-f-]{36}$/i.test(requestId)?requestId:randomUUID()}/>
    <StaffPassengers departures={usableDepartures.flatMap(d=>products.data.filter(p=>p.status==='published'&&p.type==='van_tour'&&(p.inventory_product_id??p.id)===d.product_id).map(p=>({id:d.id,productId:p.id,label:`${d.service_date} ${d.start_time} | ${p.title}`,categories:categories[p.id]})))}/>
    <label>Guest name<input name="name" maxLength={200} autoComplete="name" required/></label><label>Email<input name="email" type="email" maxLength={254} autoComplete="email" required/></label><label>Phone<input name="phone" type="tel" maxLength={50} autoComplete="tel"/></label>
    <SubmitButton disabled={!usableDepartures.length}>Confirm reservation</SubmitButton>
    {!usableDepartures.length&&<p>No bookable departure with passenger configuration is loaded. Choose a service date above.</p>}
    <small>Up to 100 scheduled departures are offered. Capacity, cutoff and prices are checked again when confirming.</small>
   </MutationForm></BookingConfirmation>
  </section>:undefined;
  // Index related rows once instead of rescanning every collection for every card.
  const peopleById=new Map(people.data.map(p=>[p.id,p])),bookingByOrder=new Map(bookings.data.map(b=>[b.order_id,b]));
  const departureById=new Map(itemDepartures.data.map(d=>[d.id,d])),productById=new Map(products.data.map(p=>[p.id,p]));
  const group=<T extends {order_id:string|null}>(rows:T[])=>{const map=new Map<string,T[]>();for(const row of rows)if(row.order_id){const list=map.get(row.order_id)??[];list.push(row);map.set(row.order_id,list);}return map;};
  const itemsByOrder=group(items.data),paymentsByOrder=group(payments.data),holdsByOrder=group(holds.data);
  const entries:BookingEntry[]=orders.data.map(order=>{
   const person=peopleById.get(order.customer_id),booking=bookingByOrder.get(order.id),orderItems=itemsByOrder.get(order.id)??[],orderPayments=paymentsByOrder.get(order.id)??[];
   const row:BookingRecordView={id:order.id,bookingId:booking?.id,reference:booking?.booking_reference??'Pending reservation',name:person?.name??'Guest unavailable',email:person?.email,phone:person?.phone,status:booking?.status??order.status,orderStatus:order.status,total:order.total,currency:order.currency,collectionMode:order.collection_mode,checkedInAt:booking?.checked_in_at,hasQr:!!booking?.qr_token,payments:orderPayments,items:orderItems.map(i=>{const d=departureById.get(i.departure_id);return {product:productById.get(i.product_id)?.title??'Product unavailable',date:d?.service_date,time:d?.start_time,quantity:i.quantity,seats:i.occupied_seats,status:i.status,snapshot:i.passenger_snapshot as PassengerSnapshot|null};})};
   const selected=!!booking&&booking.id===selectedBooking;
   const actions=<>
    {hasPermission(context.role,'payments.collect')&&order.collection_mode==='meeting_point'&&order.status==='confirmed'&&!orderPayments.length&&<BookingConfirmation message={`Record full payment of ${bookingAmount(order.total,order.currency)} as received for ${row.reference}? This records receipt; it does not charge a card.`}><MutationForm action={collectPayment.bind(null,operatorId,order.id)}><label className={styles.check}><input type="checkbox" name="received" value="yes" required/>I received the full {bookingAmount(order.total,order.currency)} at the meeting point</label><SubmitButton>Record payment received</SubmitButton></MutationForm></BookingConfirmation>}
    {hasPermission(context.role,'bookings.cancel')&&['pending','awaiting_payment','paid','confirmed'].includes(order.status)&&<details className={styles.cancel}><summary>Cancel this booking</summary><BookingConfirmation message={`Cancel ${row.reference} and release its reserved seats? Paid bookings are flagged for review; no refund is issued.`}><MutationForm action={cancelBooking.bind(null,operatorId,order.id)}><label>Cancellation reason<textarea name="reason" maxLength={500} required/></label><label className={styles.check}><input type="checkbox" name="confirm" value="yes" required/>Confirm cancellation and release these seats</label><SubmitButton>Cancel booking</SubmitButton><p>Paid bookings are flagged for refund review. This does not issue a refund.</p></MutationForm></BookingConfirmation></details>}
    {booking&&hasPermission(context.role,'bookings.delete')&&<BookingDeletionForm reference={booking.booking_reference} action={deleteBooking.bind(null,operatorId,booking.id)}/>}
    {(!hasPermission(context.role,'bookings.cancel')||!['pending','awaiting_payment','paid','confirmed'].includes(order.status))&&<p>No cancellation action is available.</p>}
   </>;
   const history=deliveries.data?.filter(d=>d.booking_id===booking?.id)??[];
   const communications=<>{deliveries.error?<p>Confirmation status temporarily unavailable.</p>:<>{!history.length&&<p>No email history is recorded in this loaded view.</p>}<ul>{history.slice(0,10).map(d=><li key={d.id}>{d.recipient_type==='owner'?'Owner':'Customer'} · {ownerEmailEvent(d.event_type)}{d.manual?' (manual resend)':''}: {emailOutcomeLabel(d)}<details><summary>Delivery details</summary>{d.attempt_count} attempt(s){d.last_error_code?` · ${d.last_error_code}`:''}</details></li>)}</ul><small>Up to 10 most recent loaded notifications. Sent does not confirm inbox arrival; this history may be limited.</small></>}{booking&&hasPermission(context.role,'integrations.manage')&&<p><Link prefetch={false} href={`${root}/email?booking=${encodeURIComponent(booking.booking_reference)}`}>Inspect delivery outcomes</Link>. Unresolved accepted messages cannot be resent.</p>}</>;
   return {id:order.id,status:row.status,searchText:[row.name,row.reference,row.email,row.phone].filter(Boolean).join(' '),content:<BookingRecord operatorId={operatorId} row={row} selected={selected} actions={actions} communications={communications} qr={selected&&booking?.qr_token?<BookingQr token={booking.qr_token}/>:undefined} holdNotes={(holdsByOrder.get(order.id)??[]).filter(h=>h.status!=='consumed').map((h,i)=><p key={i}>Temporary seat reservation: {ownerStatus(h.status)} · ends {new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:operator.data.timezone}).format(new Date(h.expires_at))}.</p>)}/>};
  });
  return <BookingsWorkspace operatorId={operatorId} today={today} day={day} email={searchEmail} selectedBooking={selectedBooking} entries={entries} creation={creation} canCreate={hasPermission(context.role,'bookings.create')} serverSearch={{query,status:searchStatus,page:searchResult?.page??1,total:searchResult?.total??entries.length,pageSize:25}} limited={orders.count===null||orders.count>orders.data.length} result={result?messages[result]??messages.error:undefined}/>;
}
