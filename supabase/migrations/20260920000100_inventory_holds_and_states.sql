-- Phase 1C: row-level lifecycle invariants. No public API or capacity allocator.
begin;

create table public.inventory_holds (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  departure_id uuid not null,
  order_id uuid,
  session_key text not null check (btrim(session_key) <> ''),
  quantity integer not null check (quantity > 0),
  status text not null default 'active'
    check (status in ('active', 'consumed', 'expired', 'released')),
  expires_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operator_id, id),
  foreign key (operator_id, departure_id) references public.departures(operator_id, id),
  foreign key (operator_id, order_id) references public.orders(operator_id, id),
  check (isfinite(created_at) and isfinite(expires_at) and expires_at > created_at),
  check ((status = 'active' and ended_at is null)
    or (status <> 'active' and ended_at is not null and isfinite(ended_at) and ended_at >= created_at)),
  check (status <> 'consumed' or (order_id is not null and ended_at < expires_at)),
  check (status <> 'expired' or ended_at >= expires_at)
);

create index inventory_holds_departure_active_idx
  on public.inventory_holds(operator_id, departure_id, expires_at) where status = 'active';
create index inventory_holds_expiry_idx
  on public.inventory_holds(expires_at, id) where status = 'active';
create index inventory_holds_order_idx on public.inventory_holds(operator_id, order_id);
create index inventory_holds_session_idx on public.inventory_holds(operator_id, session_key);

alter table public.inventory_holds enable row level security;
revoke all on public.inventory_holds from public, anon, authenticated;

alter table public.orders add constraint orders_status_valid
  check (status in ('pending', 'awaiting_payment', 'paid', 'confirmed',
    'cancelled', 'expired', 'partially_refunded', 'refunded'));
alter table public.payments add constraint payments_status_valid
  check (status in ('pending', 'processing', 'paid', 'failed', 'partially_refunded', 'refunded'));
alter table public.payments add constraint payments_settled_reference_required
  check (status not in ('paid', 'partially_refunded', 'refunded') or provider_ref is not null);
alter table public.bookings add constraint bookings_status_valid
  check (status in ('pending', 'confirmed', 'cancelled', 'expired'));
alter table public.booking_items add constraint booking_items_status_valid
  check (status in ('pending', 'confirmed', 'cancelled', 'expired'));
alter table public.bookings add constraint bookings_lifecycle_timestamps
  check (
    (confirmed_at is null or (isfinite(confirmed_at) and confirmed_at >= created_at))
    and (cancelled_at is null or (isfinite(cancelled_at) and cancelled_at >= created_at))
    and (status <> 'confirmed' or confirmed_at is not null)
    and (status not in ('pending', 'expired') or confirmed_at is null)
    and ((status = 'cancelled') = (cancelled_at is not null))
    and (confirmed_at is null or cancelled_at is null or cancelled_at >= confirmed_at)
  );

-- SQL is the single definition of allowable transitions at this phase.
-- Same-state updates are allowed for safely replaying an already processed event.
create function public.guard_booking_lifecycle()
returns trigger
language plpgsql
set search_path = ''
as $$
declare allowed boolean := false;
begin
  if tg_op = 'INSERT' then
    if new.status is distinct from 'pending' then
      raise exception 'New % records must start pending', tg_table_name using errcode = '23514';
    end if;
    return new;
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  case tg_table_name
    when 'orders' then
      allowed := case old.status
        when 'pending' then new.status in ('awaiting_payment', 'cancelled', 'expired')
        when 'awaiting_payment' then new.status in ('paid', 'cancelled', 'expired')
        when 'paid' then new.status in ('confirmed', 'cancelled', 'partially_refunded', 'refunded')
        when 'confirmed' then new.status in ('cancelled', 'partially_refunded', 'refunded')
        when 'cancelled' then new.status in ('partially_refunded', 'refunded')
        when 'partially_refunded' then new.status = 'refunded'
        else false end;
    when 'payments' then
      allowed := case old.status
        when 'pending' then new.status in ('processing', 'paid', 'failed')
        when 'processing' then new.status in ('paid', 'failed')
        -- A provider attempt can be retried or later report a verified success.
        when 'failed' then new.status in ('processing', 'paid')
        when 'paid' then new.status in ('partially_refunded', 'refunded')
        when 'partially_refunded' then new.status = 'refunded'
        else false end;
    when 'bookings', 'booking_items' then
      allowed := case old.status
        when 'pending' then new.status in ('confirmed', 'cancelled', 'expired')
        when 'confirmed' then new.status = 'cancelled'
        else false end;
    else
      raise exception 'Unexpected lifecycle table' using errcode = '23514';
  end case;

  if not coalesce(allowed, false) then
    raise exception 'Invalid % transition: % -> %', tg_table_name, old.status, new.status using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_booking_lifecycle() from public, anon, authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array['orders', 'payments', 'bookings', 'booking_items'] loop
    execute format('create trigger guard_lifecycle before insert or update on public.%I for each row execute function public.guard_booking_lifecycle()', table_name);
  end loop;
end $$;

-- These timestamps are database-owned; retrying a transition preserves the original.
create function public.stamp_booking_lifecycle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.confirmed_at is not null or new.cancelled_at is not null then
      raise exception 'New booking cannot carry lifecycle timestamps' using errcode = '23514';
    end if;
  else
    if new.created_at is distinct from old.created_at
      or new.confirmed_at is distinct from old.confirmed_at
      or new.cancelled_at is distinct from old.cancelled_at then
      raise exception 'Booking lifecycle timestamps are immutable' using errcode = '23514';
    end if;
    if new.status = 'confirmed' and old.status <> 'confirmed' then
      new.confirmed_at := clock_timestamp();
    elsif new.status = 'cancelled' and old.status <> 'cancelled' then
      new.cancelled_at := clock_timestamp();
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.stamp_booking_lifecycle() from public, anon, authenticated;
create trigger stamp_lifecycle before insert or update on public.bookings
  for each row execute function public.stamp_booking_lifecycle();

create function public.guard_inventory_hold()
returns trigger
language plpgsql
set search_path = ''
as $$
declare current_instant timestamptz := clock_timestamp();
begin
  if tg_op = 'INSERT' then
    if new.status is distinct from 'active' or new.ended_at is not null
      or new.expires_at <= current_instant or new.created_at > current_instant then
      raise exception 'New holds must be active with a future expiry' using errcode = '23514';
    end if;
    return new;
  end if;

  if row(new.id, new.operator_id, new.departure_id, new.session_key, new.quantity, new.expires_at, new.created_at)
    is distinct from row(old.id, old.operator_id, old.departure_id, old.session_key, old.quantity, old.expires_at, old.created_at)
    or new.ended_at is distinct from old.ended_at then
    raise exception 'Hold reservation terms and end timestamp are immutable' using errcode = '23514';
  end if;

  -- An active hold may attach to its first order, but cannot be moved to another.
  if new.order_id is distinct from old.order_id and (old.order_id is not null or old.status <> 'active') then
    raise exception 'Hold order cannot be reassigned' using errcode = '23514';
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;
  if old.status <> 'active' or new.status is null or new.status not in ('consumed', 'expired', 'released') then
    raise exception 'Invalid hold transition: % -> %', old.status, new.status using errcode = '23514';
  end if;
  if new.status = 'consumed' and (old.expires_at <= current_instant or new.order_id is null) then
    raise exception 'Consumption requires an unexpired hold attached to an order' using errcode = '23514';
  end if;
  if new.status = 'expired' and old.expires_at > current_instant then
    raise exception 'Hold has not expired yet' using errcode = '23514';
  end if;
  new.ended_at := current_instant;
  return new;
end;
$$;
revoke all on function public.guard_inventory_hold() from public, anon, authenticated;
create trigger guard_lifecycle before insert or update on public.inventory_holds
  for each row execute function public.guard_inventory_hold();
create trigger set_updated_at before update on public.inventory_holds
  for each row execute function public.set_updated_at();

commit;
