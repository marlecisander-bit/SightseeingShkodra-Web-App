begin;
create table public.admin_notification_sources (
 operator_id uuid not null references public.operators(id), source_key text not null, created_at timestamptz not null default clock_timestamp(), primary key(operator_id,source_key)
);
alter table public.admin_notification_sources enable row level security;
revoke all on public.admin_notification_sources from anon,authenticated;
grant all on public.admin_notification_sources to service_role;
create table public.admin_notifications (
 id uuid primary key default gen_random_uuid(), operator_id uuid not null references public.operators(id),
 source_key text not null, booking_id uuid not null, type text not null check(type in ('booking_created','booking_modified','booking_cancelled','booking_status_changed','payment_status_changed','email_delivery_failed')),
 title text not null, message text not null, severity text not null default 'info' check(severity in ('info','warning')),
 created_at timestamptz not null default clock_timestamp(), event_at timestamptz not null,
 unique(operator_id,id), unique(operator_id,source_key,booking_id),
 foreign key(operator_id,booking_id) references public.bookings(operator_id,id)
);
create table public.admin_notification_receipts (
 id uuid primary key default gen_random_uuid(), operator_id uuid not null, notification_id uuid not null,
 user_id uuid not null references auth.users(id) on delete cascade, visible boolean not null default true,
 read_at timestamptz, created_at timestamptz not null default clock_timestamp(),
 unique(notification_id,user_id), foreign key(operator_id,notification_id) references public.admin_notifications(operator_id,id) on delete cascade
);
create table public.admin_notification_preferences (
 operator_id uuid not null references public.operators(id), user_id uuid not null references auth.users(id) on delete cascade,
 type text not null check(type in ('booking_created','booking_modified','booking_cancelled','booking_status_changed','payment_status_changed','email_delivery_failed')),
 created_at timestamptz not null default clock_timestamp(), in_app boolean not null default true, push boolean not null default true, primary key(operator_id,user_id,type)
);
create table public.admin_push_subscriptions (
 id uuid primary key default gen_random_uuid(), operator_id uuid not null references public.operators(id),
 user_id uuid not null references auth.users(id) on delete cascade, endpoint text not null unique check(length(endpoint)<=2048),
 p256dh text not null check(length(p256dh)<=128), auth text not null check(length(auth)<=64),
 device_name text not null check(length(device_name) between 1 and 60), enabled boolean not null default true,
 created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), last_used_at timestamptz,
 unique(operator_id,id)
);
create table public.admin_push_deliveries (
 id uuid primary key default gen_random_uuid(), operator_id uuid not null, notification_id uuid not null, subscription_id uuid not null,
 status text not null default 'pending' check(status in ('pending','sending','accepted','failed','uncertain','skipped')),
 attempts integer not null default 0, next_attempt_at timestamptz not null default clock_timestamp(),
 lease_token uuid, leased_at timestamptz, error_code text, created_at timestamptz not null default clock_timestamp(),
 unique(notification_id,subscription_id),
 foreign key(operator_id,notification_id) references public.admin_notifications(operator_id,id),
 foreign key(operator_id,subscription_id) references public.admin_push_subscriptions(operator_id,id) on delete cascade
);
create index admin_receipts_latest on public.admin_notification_receipts(operator_id,user_id,created_at desc,id desc) where visible;
create index admin_receipts_unread on public.admin_notification_receipts(operator_id,user_id) where visible and read_at is null;
create index admin_push_ready on public.admin_push_deliveries(operator_id,next_attempt_at,id) where status='pending';
create index admin_push_membership on public.admin_push_subscriptions(operator_id,user_id) where enabled;
create index admin_events_scan on public.domain_events(operator_id,created_at,id) where event_type in ('booking.confirmed','booking.modified','order.cancelled','booking.checked_in','payment.collected');

alter table public.admin_notifications enable row level security;
alter table public.admin_notification_receipts enable row level security;
alter table public.admin_notification_preferences enable row level security;
alter table public.admin_push_subscriptions enable row level security;
alter table public.admin_push_deliveries enable row level security;
revoke all on public.admin_notifications,public.admin_notification_receipts,public.admin_notification_preferences,public.admin_push_subscriptions,public.admin_push_deliveries from anon,authenticated;
grant select on public.admin_notifications,public.admin_notification_receipts,public.admin_notification_preferences to authenticated;
grant all on public.admin_notifications,public.admin_notification_receipts,public.admin_notification_preferences,public.admin_push_subscriptions,public.admin_push_deliveries to service_role;
create policy own_receipts on public.admin_notification_receipts for select to authenticated using(user_id=(select auth.uid()) and private.has_staff_role(operator_id,array['owner','admin','operations']));
create policy own_notifications on public.admin_notifications for select to authenticated using(private.has_staff_role(operator_id,array['owner','admin','operations']) and exists(select 1 from public.admin_notification_receipts r where r.notification_id=admin_notifications.id and r.user_id=(select auth.uid())));
create policy own_preferences on public.admin_notification_preferences for select to authenticated using(user_id=(select auth.uid()) and private.has_staff_role(operator_id,array['owner','admin','operations']));
-- Device credentials and delivery attempts have no browser grants or policies.
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  alter publication supabase_realtime add table public.admin_notification_receipts;
 end if;
end $$;

-- Independent outbox consumer. No trigger is added to booking/payment transactions.
create function public.project_admin_notifications_v1(p_operator_id uuid,p_since timestamptz) returns integer language plpgsql set search_path='' as $$
declare e record; b record; nid uuid; kind text; heading text; summary text; n integer:=0;
begin
 if p_since is null or not isfinite(p_since) then raise exception 'Activation time required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_operator_id::text||':admin-notifications',0));
 for e in
  select x.* from (
   select 'event:'||d.id as source_key,d.event_type,d.payload,d.created_at
   from public.domain_events d where d.operator_id=p_operator_id and d.created_at>=p_since and d.schema_version=1
   and d.event_type in ('booking.confirmed','booking.modified','order.cancelled','booking.checked_in','payment.collected')
   union all
   select 'email:'||d.id,'email.failed',jsonb_build_object('bookingId',d.booking_id),d.created_at
   from public.notification_deliveries d where d.operator_id=p_operator_id and d.created_at>=p_since and d.channel='email' and d.status in ('failed','uncertain')
  ) x where not exists(select 1 from public.admin_notification_sources a where a.operator_id=p_operator_id and a.source_key=x.source_key)
  order by x.created_at,x.source_key limit 100
 loop
  kind:=case e.event_type when 'booking.confirmed' then 'booking_created' when 'booking.modified' then 'booking_modified' when 'order.cancelled' then 'booking_cancelled' when 'booking.checked_in' then 'booking_status_changed' when 'payment.collected' then 'payment_status_changed' else 'email_delivery_failed' end;
  heading:=case kind when 'booking_created' then 'New booking' when 'booking_modified' then 'Booking modified' when 'booking_cancelled' then 'Booking cancelled' when 'booking_status_changed' then 'Guest checked in' when 'payment_status_changed' then 'Payment collected' else 'Booking email needs attention' end;
  for b in select bk.*,o.total,o.currency from public.bookings bk join public.orders o on o.operator_id=bk.operator_id and o.id=bk.order_id
   where bk.operator_id=p_operator_id and (bk.id::text=e.payload->>'bookingId' or bk.order_id::text=e.payload->>'orderId') and bk.confirmed_at is not null
  loop
   select coalesce(string_agg(concat(i.quantity,' guests / ',i.occupied_seats,' seats',case when d.id is not null then ' - '||d.service_date::text||' '||to_char(d.start_time,'HH24:MI') else '' end),'; ' order by i.id),'Booking details available') into summary
   from public.booking_items i left join public.departures d on d.operator_id=i.operator_id and d.id=i.departure_id where i.operator_id=p_operator_id and i.order_id=b.order_id;
   insert into public.admin_notifications(operator_id,source_key,booking_id,type,title,message,severity,event_at)
   values(p_operator_id,e.source_key,b.id,kind,heading,'Booking '||b.booking_reference||' - '||left(summary,450)||' - '||b.currency||' '||to_char(b.total::numeric/100,'FM999999990.00')||'. Details at processing time.',case when kind='email_delivery_failed' then 'warning' else 'info' end,e.created_at)
   on conflict do nothing returning id into nid;
   if nid is not null then
    insert into public.admin_notification_receipts(operator_id,notification_id,user_id,visible)
    select p_operator_id,nid,s.auth_user_id,coalesce(p.in_app,true) from public.staff_profiles s left join public.admin_notification_preferences p on p.operator_id=s.operator_id and p.user_id=s.auth_user_id and p.type=kind
    where s.operator_id=p_operator_id and s.is_active and s.role in ('owner','admin','operations') on conflict do nothing;
    insert into public.admin_push_deliveries(operator_id,notification_id,subscription_id)
    select p_operator_id,nid,s.id from public.admin_push_subscriptions s join public.admin_notification_receipts r on r.notification_id=nid and r.user_id=s.user_id
    left join public.admin_notification_preferences p on p.operator_id=s.operator_id and p.user_id=s.user_id and p.type=kind
    where s.operator_id=p_operator_id and s.enabled and coalesce(p.push,true) on conflict do nothing;
    n:=n+1;
   end if;
  end loop;
  insert into public.admin_notification_sources(operator_id,source_key) values(p_operator_id,e.source_key) on conflict do nothing;
 end loop;
 return n;
end $$;
revoke all on function public.project_admin_notifications_v1(uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.project_admin_notifications_v1(uuid,timestamptz) to service_role;

create function public.claim_admin_push_v1(p_operator_id uuid) returns setof public.admin_push_deliveries language plpgsql set search_path='' as $$
declare job public.admin_push_deliveries; scan integer;
begin
 update public.admin_push_deliveries set status='uncertain',error_code='lease_expired' where operator_id=p_operator_id and status='sending' and leased_at<clock_timestamp()-interval '2 minutes';
 for scan in 1..20 loop
  select * into job from public.admin_push_deliveries where operator_id=p_operator_id and status='pending' and next_attempt_at<=clock_timestamp() order by next_attempt_at,id limit 1 for update skip locked;
  if not found then return; end if;
  if not exists(select 1 from public.admin_push_subscriptions s join public.staff_profiles u on u.operator_id=s.operator_id and u.auth_user_id=s.user_id
   join public.admin_notifications n on n.id=job.notification_id left join public.admin_notification_preferences p on p.operator_id=s.operator_id and p.user_id=s.user_id and p.type=n.type
   where s.id=job.subscription_id and s.enabled and u.is_active and u.role in ('owner','admin','operations') and coalesce(p.push,true)) then
   update public.admin_push_deliveries set status='skipped',error_code='disabled' where id=job.id; continue;
  end if;
  return query update public.admin_push_deliveries set status='sending',attempts=attempts+1,lease_token=gen_random_uuid(),leased_at=clock_timestamp() where id=job.id returning *;
  return;
 end loop;
end $$;
create function public.finish_admin_push_v1(p_operator_id uuid,p_id uuid,p_token uuid,p_result text,p_code text) returns void language plpgsql set search_path='' as $$
declare j public.admin_push_deliveries;
begin
 if p_result not in ('accepted','retry','failed','uncertain','expired','skipped') or length(p_code)>60 then raise exception 'Invalid outcome'; end if;
 select * into j from public.admin_push_deliveries where operator_id=p_operator_id and id=p_id and lease_token=p_token and status='sending' for update;
 if not found then raise exception 'Stale delivery'; end if;
 update public.admin_push_deliveries set status=case when p_result='retry' and attempts<5 then 'pending' when p_result in ('expired','retry') then 'failed' else p_result end,error_code=p_code,next_attempt_at=clock_timestamp()+interval '1 minute'*power(2,attempts),lease_token=null where id=j.id;
 if p_result='expired' then update public.admin_push_subscriptions set enabled=false,updated_at=clock_timestamp() where id=j.subscription_id; end if;
 if p_result='accepted' then update public.admin_push_subscriptions set last_used_at=clock_timestamp() where id=j.subscription_id; end if;
end $$;
revoke all on function public.claim_admin_push_v1(uuid),public.finish_admin_push_v1(uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.claim_admin_push_v1(uuid),public.finish_admin_push_v1(uuid,uuid,uuid,text,text) to service_role;
commit;
