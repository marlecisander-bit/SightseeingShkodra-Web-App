begin;
-- Independent consumer state: do not mark the shared domain event published.
create table public.notification_deliveries(
 id uuid primary key default gen_random_uuid(), operator_id uuid not null references public.operators(id),
 event_id uuid not null, booking_id uuid not null,
 status text not null default 'pending' check(status in ('pending','leased','sending','retry','accepted','uncertain','failed','skipped')),
 channel text check(channel in ('whatsapp','email')), attempt_count integer not null default 0 check(attempt_count between 0 and 5),
 next_attempt_at timestamptz not null default now(), lease_token uuid, lease_until timestamptz,
 last_error_code text check(last_error_code ~ '^[a-z0-9_.:-]{1,80}$'), provider_reference text check(length(provider_reference) between 1 and 200),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(operator_id,id), unique(operator_id,booking_id),
 foreign key(operator_id,event_id) references public.domain_events(operator_id,id),
 foreign key(operator_id,booking_id) references public.bookings(operator_id,id),
 check((status in ('leased','sending')) = (lease_token is not null and lease_until is not null)),
 check(status in ('leased','sending') or (lease_token is null and lease_until is null))
);
alter table public.notification_deliveries enable row level security;
revoke all on public.notification_deliveries from anon,authenticated;
grant select on public.notification_deliveries to authenticated;
grant select,insert,update on public.notification_deliveries to service_role;
create policy staff_read on public.notification_deliveries for select to authenticated using(private.has_staff_role(operator_id,array['owner','admin','operations']));
create index notification_ready on public.notification_deliveries(operator_id,next_attempt_at) where status in ('pending','retry');

create function public.enqueue_booking_notifications_v1(p_operator_id uuid,p_since timestamptz) returns integer language plpgsql set search_path='' as $$
declare n integer;
begin
 if p_operator_id is null or p_since is null or not isfinite(p_since) then raise exception 'Operator and start time required' using errcode='22023'; end if;
 insert into public.notification_deliveries(operator_id,event_id,booking_id)
 select e.operator_id,e.id,b.id from public.domain_events e join public.bookings b on b.operator_id=e.operator_id and b.id::text=e.payload->>'bookingId'
 where e.operator_id=p_operator_id and e.created_at>=p_since and e.schema_version=1 and e.event_type in ('booking.confirmed','customer.notification.requested')
 and e.payload->>'orderId'=b.order_id::text and b.status='confirmed'
 and not exists(select 1 from public.notification_deliveries n where n.operator_id=e.operator_id and n.booking_id=b.id)
 order by e.created_at,e.id limit 200 on conflict(operator_id,booking_id) do nothing;
 get diagnostics n=row_count;return n;
end;
$$;
create function public.claim_booking_notification_v1(p_operator_id uuid) returns setof public.notification_deliveries language plpgsql set search_path='' as $$
begin
 -- A crashed sender may already have reached the provider. Never blindly resend it.
 update public.notification_deliveries set status='uncertain',last_error_code='sender_lease_expired',lease_token=null,lease_until=null,updated_at=clock_timestamp() where operator_id=p_operator_id and status='sending' and lease_until<=clock_timestamp();
 update public.notification_deliveries set status=case when attempt_count>=5 then 'failed' else 'retry' end,last_error_code='worker_lease_expired',lease_token=null,lease_until=null,updated_at=clock_timestamp() where operator_id=p_operator_id and status='leased' and lease_until<=clock_timestamp();
 return query with candidate as(select id from public.notification_deliveries where operator_id=p_operator_id and status in ('pending','retry') and next_attempt_at<=clock_timestamp() and attempt_count<5 order by next_attempt_at,id for update skip locked limit 1)
 update public.notification_deliveries n set status='leased',attempt_count=n.attempt_count+1,lease_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '2 minutes',updated_at=clock_timestamp() from candidate c where n.id=c.id returning n.*;
end;
$$;
create function public.read_booking_notification_v1(p_operator_id uuid,p_delivery_id uuid,p_token uuid) returns jsonb language plpgsql set search_path='' as $$
declare n public.notification_deliveries; result jsonb;
begin
 select * into n from public.notification_deliveries where operator_id=p_operator_id and id=p_delivery_id and lease_token=p_token and status='leased' and lease_until>clock_timestamp();
 if not found then raise exception 'Lease unavailable' using errcode='P0002'; end if;
 select jsonb_build_object('reference',b.booking_reference,'confirmed',b.status='confirmed' and o.status='confirmed','currency',o.currency,'total',o.total,'collectionMode',o.collection_mode,
 'paid',exists(select 1 from public.payments pay where pay.operator_id=o.operator_id and pay.order_id=o.id and pay.status='paid'),
 'email',c.email,'phone',c.phone,'whatsappAllowed',false,'items',(select coalesce(jsonb_agg(jsonb_build_object('title',p.title,'date',d.service_date,'time',d.start_time,'timezone',op.timezone,'guests',i.quantity) order by i.id),'[]'::jsonb) from public.booking_items i join public.products p on p.operator_id=i.operator_id and p.id=i.product_id join public.departures d on d.operator_id=i.operator_id and d.id=i.departure_id where i.operator_id=o.operator_id and i.order_id=o.id)) into result
 from public.bookings b join public.orders o on o.operator_id=b.operator_id and o.id=b.order_id join public.customers c on c.operator_id=o.operator_id and c.id=o.customer_id join public.operators op on op.id=o.operator_id where b.operator_id=p_operator_id and b.id=n.booking_id;
 return result;
end;
$$;
create function public.begin_booking_notification_v1(p_operator_id uuid,p_delivery_id uuid,p_token uuid,p_channel text) returns boolean language plpgsql set search_path='' as $$
declare n public.notification_deliveries;
begin
 if p_channel not in ('email','whatsapp') or p_channel is null then raise exception 'Invalid channel' using errcode='22023'; end if;
 select * into n from public.notification_deliveries where operator_id=p_operator_id and id=p_delivery_id and lease_token=p_token and status='leased' and lease_until>clock_timestamp() for update;
 if not found then raise exception 'Lease unavailable' using errcode='P0002'; end if;
 if not exists(select 1 from public.bookings b join public.orders o on o.operator_id=b.operator_id and o.id=b.order_id where b.operator_id=p_operator_id and b.id=n.booking_id and b.status='confirmed' and o.status='confirmed') then
 update public.notification_deliveries set status='skipped',last_error_code='booking_not_confirmed',lease_token=null,lease_until=null,updated_at=clock_timestamp() where id=n.id; return false;
 end if;
 update public.notification_deliveries set status='sending',channel=p_channel,updated_at=clock_timestamp() where id=n.id;return true;
end;
$$;
create function public.finish_booking_notification_v1(p_operator_id uuid,p_delivery_id uuid,p_token uuid,p_outcome text,p_error_code text default null,p_reference text default null) returns void language plpgsql set search_path='' as $$
declare n public.notification_deliveries;
begin
 if p_outcome not in ('accepted','retry','failed','uncertain','skipped') or p_outcome is null or (p_error_code is not null and p_error_code !~ '^[a-z0-9_.:-]{1,80}$') or length(p_reference)>200 then raise exception 'Invalid outcome' using errcode='22023'; end if;
 select * into n from public.notification_deliveries where operator_id=p_operator_id and id=p_delivery_id and lease_token=p_token and status in ('leased','sending') and lease_until>clock_timestamp() for update;
 if not found then raise exception 'Lease unavailable' using errcode='P0002'; end if;
 if p_outcome in ('accepted','uncertain') and n.status<>'sending' then raise exception 'Send must begin first' using errcode='P0001'; end if;
 update public.notification_deliveries set status=case when p_outcome='retry' and attempt_count>=5 then 'failed' else p_outcome end,
 next_attempt_at=clock_timestamp()+make_interval(secs=>least(3600,30*power(2,attempt_count)::integer)),last_error_code=p_error_code,provider_reference=p_reference,lease_token=null,lease_until=null,updated_at=clock_timestamp() where id=n.id;
end;
$$;
revoke all on function public.enqueue_booking_notifications_v1(uuid,timestamptz), public.claim_booking_notification_v1(uuid), public.read_booking_notification_v1(uuid,uuid,uuid), public.begin_booking_notification_v1(uuid,uuid,uuid,text), public.finish_booking_notification_v1(uuid,uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.enqueue_booking_notifications_v1(uuid,timestamptz), public.claim_booking_notification_v1(uuid), public.read_booking_notification_v1(uuid,uuid,uuid), public.begin_booking_notification_v1(uuid,uuid,uuid,text), public.finish_booking_notification_v1(uuid,uuid,uuid,text,text,text) to service_role;
commit;
