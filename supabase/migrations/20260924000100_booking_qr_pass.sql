begin;
-- One permanent credential on the existing booking, never a public lookup URL.
alter table public.bookings
  add column qr_token text unique,
  add column qr_created_at timestamptz,
  add column checked_in_at timestamptz,
  add column checked_in_by uuid,
  add constraint booking_check_in_actor_fk foreign key(operator_id,checked_in_by) references public.staff_profiles(operator_id,id);

-- Two independently random UUIDv4 values provide 244 random bits without an extension.
-- Backfill previously confirmed bookings, including those since cancelled.
update public.bookings set qr_token=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-',''),qr_created_at=clock_timestamp()
where status='confirmed' or confirmed_at is not null;

alter table public.bookings
  add constraint booking_qr_shape check ((qr_token is null and qr_created_at is null) or (qr_token is not null and qr_token ~ '^[0-9a-f]{64}$' and qr_created_at is not null)),
  add constraint confirmed_booking_has_qr check(status<>'confirmed' or qr_token is not null),
  add constraint booking_check_in_shape check((checked_in_at is null and checked_in_by is null) or (checked_in_at is not null and checked_in_by is not null and qr_token is not null));

create function public.guard_booking_pass_v1() returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op='INSERT' then
    if new.qr_token is not null or new.qr_created_at is not null or new.checked_in_at is not null or new.checked_in_by is not null then
      raise exception 'Booking credentials are server-issued on confirmation' using errcode='23514';
    end if;
  else
    if new.qr_token is distinct from old.qr_token or new.qr_created_at is distinct from old.qr_created_at then
      raise exception 'Booking credential is permanent' using errcode='23514';
    end if;
    if old.checked_in_at is not null and (new.checked_in_at is distinct from old.checked_in_at or new.checked_in_by is distinct from old.checked_in_by) then
      raise exception 'Check-in is permanent' using errcode='23514';
    end if;
    if new.checked_in_at is not null and old.checked_in_at is null and new.status<>'confirmed' then
      raise exception 'Only confirmed bookings can check in' using errcode='23514';
    end if;
  end if;
  if new.status='confirmed' and new.qr_token is null then
    loop
      new.qr_token:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
      exit when not exists(select 1 from public.bookings where qr_token=new.qr_token);
    end loop;
    new.qr_created_at:=clock_timestamp();
  end if;
  return new;
end;
$$;
revoke all on function public.guard_booking_pass_v1() from public,anon,authenticated;
create trigger guard_booking_pass before insert or update on public.bookings for each row execute function public.guard_booking_pass_v1();

-- Service-only port for a future scanner; the trusted server supplies the authenticated actor.
-- No public credential-to-booking endpoint. Row lock prevents concurrent double check-ins.
create function public.resolve_booking_pass_v1(p_operator_id uuid,p_actor_id uuid,p_token text,p_check_in boolean default false)
returns jsonb language plpgsql set search_path='' as $$
declare b public.bookings; outcome text;
begin
  if not exists(select 1 from public.staff_profiles where operator_id=p_operator_id and id=p_actor_id and is_active and role in ('owner','admin','operations')) then
    raise exception 'Booking access required' using errcode='42501';
  end if;
  if p_check_in is null or p_token is null or p_token !~ '^[0-9a-f]{64}$' then return jsonb_build_object('status','INVALID'); end if;
  select * into b from public.bookings where operator_id=p_operator_id and qr_token=p_token for update;
  if not found then return jsonb_build_object('status','INVALID'); end if;
  if b.status='cancelled' then outcome:='CANCELLED';
  elsif b.status<>'confirmed' then outcome:='INVALID';
  elsif b.checked_in_at is not null then outcome:='ALREADY_CHECKED_IN';
  elsif p_check_in then
    update public.bookings set checked_in_at=clock_timestamp(),checked_in_by=p_actor_id where operator_id=p_operator_id and id=b.id returning * into b;
    perform public.record_domain_activity(p_operator_id,p_actor_id,'booking-check-in:'||b.id::text,'booking',b.id,'booking.checked_in',jsonb_build_object('bookingId',b.id),'booking.checked_in',jsonb_build_object('bookingId',b.id));
    outcome:='CHECKED_IN';
  else outcome:='VALID'; end if;
  return jsonb_build_object('status',outcome,'bookingId',b.id,'bookingReference',b.booking_reference,'bookingStatus',b.status,'checkedInAt',b.checked_in_at,
    'departures',(select coalesce(jsonb_agg(jsonb_build_object('date',d.service_date,'time',d.start_time,'guests',i.quantity) order by d.service_date,d.start_time),'[]'::jsonb) from public.booking_items i join public.departures d on d.operator_id=i.operator_id and d.id=i.departure_id where i.operator_id=p_operator_id and i.order_id=b.order_id));
end;
$$;
revoke all on function public.resolve_booking_pass_v1(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.resolve_booking_pass_v1(uuid,uuid,text,boolean) to service_role;
commit;
