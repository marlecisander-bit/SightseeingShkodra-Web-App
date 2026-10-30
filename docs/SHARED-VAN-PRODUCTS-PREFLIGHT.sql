-- READ ONLY. Review before the shared-van migration, with the authorized operator.
-- The owner confirmed the existing allocation duration is 120 minutes.
-- No materialization, mutation, credentials or communication operation occurs here.
with allocations as (
 select i.operator_id,coalesce(d.vehicle_id,d.id) resource,
  (d.service_date+d.start_time) at time zone o.timezone starts,
  ((d.service_date+d.start_time) at time zone o.timezone)+interval '120 minutes' ends,
  i.occupied_seats seats
 from public.booking_items i join public.departures d on d.id=i.departure_id
 join public.operators o on o.id=i.operator_id where i.status='confirmed'
 union all
 select h.operator_id,coalesce(d.vehicle_id,d.id),
  (d.service_date+d.start_time) at time zone o.timezone,
  ((d.service_date+d.start_time) at time zone o.timezone)+interval '120 minutes',h.occupied_seats
 from public.inventory_holds h join public.departures d on d.id=h.departure_id
 join public.operators o on o.id=h.operator_id where h.status='active' and h.expires_at>statement_timestamp()
), slots as (
 select d.id,d.operator_id,coalesce(d.vehicle_id,d.id) resource,d.service_date,d.start_time,d.capacity,
  (d.service_date+d.start_time) at time zone o.timezone starts,
  ((d.service_date+d.start_time) at time zone o.timezone)+interval '120 minutes' ends
 from public.departures d join public.operators o on o.id=d.operator_id where d.status='scheduled'
 and ((d.service_date+d.start_time) at time zone o.timezone)+interval '120 minutes'>statement_timestamp()
), points as (
 select s.id,s.starts at_time from slots s
 union
 select s.id,greatest(s.starts,a.starts) from slots s join allocations a
 on a.operator_id=s.operator_id and a.resource=s.resource and a.starts<s.ends and a.ends>s.starts
), usage as (
 select s.operator_id,s.service_date,s.start_time,s.id,s.capacity,p.at_time,coalesce(sum(a.seats),0) occupied
 from slots s join points p on p.id=s.id left join allocations a
 on a.operator_id=s.operator_id and a.resource=s.resource and a.starts<=p.at_time and a.ends>p.at_time
 group by s.operator_id,s.service_date,s.start_time,s.id,s.capacity,p.at_time
)
select operator_id,service_date,start_time,id,capacity,max(occupied) peak_occupied
from usage group by operator_id,service_date,start_time,id,capacity
having max(occupied)>capacity order by operator_id,service_date,start_time;

-- Assigned vehicles are required before configuring shared all-day offers.
select d.operator_id,count(distinct d.id) unassigned_departures_with_future_reservations
from public.departures d where d.vehicle_id is null and public.booking_cutoff_v1(d.service_date,d.start_time)>statement_timestamp()
and (exists(select 1 from public.booking_items where departure_id=d.id and status='confirmed')
 or exists(select 1 from public.inventory_holds where departure_id=d.id and status='active' and expires_at>statement_timestamp()))
group by d.operator_id;
