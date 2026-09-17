-- Phase 1B: structural foundation only. Holds/states, policies and helpers follow.
-- Supabase owns auth.users. All business relationships stay within one operator.
begin;

create table public.operators (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  timezone text not null default 'Europe/Tirane',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  auth_user_id uuid not null references auth.users(id),
  role text not null check (btrim(role) <> ''),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operator_id, id),
  unique (operator_id, auth_user_id)
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  name text not null check (btrim(name) <> ''),
  type text not null check (btrim(type) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operator_id, id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  supplier_id uuid,
  type text not null check (btrim(type) <> ''),
  title text not null check (btrim(title) <> ''),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status text not null default 'draft',
  meta_title text,
  meta_description text,
  og_image text,
  og_image_alt text,
  pricing_rules jsonb not null default '{}' check (jsonb_typeof(pricing_rules) = 'object'),
  capacity_rules jsonb not null default '{}' check (jsonb_typeof(capacity_rules) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operator_id, id),
  unique (operator_id, slug),
  foreign key (operator_id, supplier_id) references public.suppliers(operator_id, id),
  check (og_image is null or (btrim(og_image) <> '' and og_image_alt is not null and btrim(og_image_alt) <> ''))
);

create table public.stops (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  product_id uuid not null,
  name text not null check (btrim(name) <> ''),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operator_id, id),
  unique (operator_id, product_id, sort_order),
  foreign key (operator_id, product_id) references public.products(operator_id, id)
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  name text not null check (btrim(name) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operator_id, id)
);

create table public.departures (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  product_id uuid not null,
  vehicle_id uuid,
  service_date date not null,
  start_time time without time zone not null,
  capacity integer not null check (capacity >= 0),
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operator_id, id),
  unique (operator_id, product_id, id),
  foreign key (operator_id, product_id) references public.products(operator_id, id),
  foreign key (operator_id, vehicle_id) references public.vehicles(operator_id, id)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  name text not null check (btrim(name) <> ''),
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operator_id, id)
);

-- Monetary amounts are integer minor units (EUR cents), never floating point.
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  customer_id uuid not null,
  status text not null default 'pending',
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  subtotal bigint not null check (subtotal >= 0),
  total bigint not null check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operator_id, id),
  unique (operator_id, id, currency),
  foreign key (operator_id, customer_id) references public.customers(operator_id, id)
);

create table public.booking_items (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  order_id uuid not null,
  product_id uuid not null,
  departure_id uuid,
  quantity integer not null check (quantity > 0),
  unit_price bigint not null check (unit_price >= 0),
  total_price bigint not null check (total_price >= 0),
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operator_id, id),
  foreign key (operator_id, order_id) references public.orders(operator_id, id),
  foreign key (operator_id, product_id) references public.products(operator_id, id),
  foreign key (operator_id, product_id, departure_id) references public.departures(operator_id, product_id, id)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  order_id uuid not null,
  booking_reference text not null check (btrim(booking_reference) <> ''),
  status text not null default 'pending',
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operator_id, id),
  unique (operator_id, order_id),
  unique (operator_id, booking_reference),
  foreign key (operator_id, order_id) references public.orders(operator_id, id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  order_id uuid not null,
  provider text not null check (btrim(provider) <> ''),
  provider_ref text check (btrim(provider_ref) <> ''),
  amount bigint not null check (amount >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operator_id, id),
  unique (operator_id, id, provider),
  unique (operator_id, provider, provider_ref),
  foreign key (operator_id, order_id, currency) references public.orders(operator_id, id, currency)
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  payment_id uuid not null,
  provider text not null check (btrim(provider) <> ''),
  provider_event_id text not null check (btrim(provider_event_id) <> ''),
  event_type text not null check (btrim(event_type) <> ''),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (operator_id, id),
  unique (operator_id, provider, provider_event_id),
  foreign key (operator_id, payment_id, provider) references public.payments(operator_id, id, provider)
);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  payment_id uuid not null,
  provider text not null check (btrim(provider) <> ''),
  provider_ref text check (btrim(provider_ref) <> ''),
  amount bigint not null check (amount > 0),
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operator_id, id),
  unique (operator_id, provider, provider_ref),
  foreign key (operator_id, payment_id, provider) references public.payments(operator_id, id, provider)
);

-- One latest position per vehicle; no parallel tracking table.
create table public.vehicle_positions (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  vehicle_id uuid not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  heading double precision check (heading >= 0 and heading < 360),
  speed double precision check (speed >= 0 and speed < 'Infinity'::double precision),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operator_id, id),
  unique (operator_id, vehicle_id),
  foreign key (operator_id, vehicle_id) references public.vehicles(operator_id, id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  product_id uuid not null,
  rating smallint not null check (rating between 1 and 5),
  body text not null,
  source text not null check (btrim(source) <> ''),
  author text not null check (btrim(author) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operator_id, id),
  foreign key (operator_id, product_id) references public.products(operator_id, id)
);

create table public.content_pages (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (btrim(title) <> ''),
  body jsonb not null default '{}' check (jsonb_typeof(body) = 'object'),
  status text not null default 'draft',
  meta_title text,
  meta_description text,
  og_image text,
  og_image_alt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operator_id, id),
  unique (operator_id, slug),
  check (og_image is null or (btrim(og_image) <> '' and og_image_alt is not null and btrim(og_image_alt) <> ''))
);

-- Useful for future URL changes even though no legacy import is planned.
create table public.redirects (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  old_path text not null check (old_path like '/%' and old_path not like '//%'),
  new_path text not null check (new_path like '/%' and new_path not like '//%'),
  http_status smallint not null default 301 check (http_status in (301, 302, 307, 308)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operator_id, id),
  unique (operator_id, old_path),
  check (old_path <> new_path)
);

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  partner_label text not null check (btrim(partner_label) <> ''),
  scopes text[] not null default '{}',
  key_hash text not null unique check (key_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operator_id, id),
  check (expires_at is null or expires_at > created_at)
);

create table public.domain_events (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  aggregate_type text not null check (btrim(aggregate_type) <> ''),
  aggregate_id uuid not null,
  event_type text not null check (btrim(event_type) <> ''),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (operator_id, id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  actor_id uuid,
  action text not null check (btrim(action) <> ''),
  entity_type text not null check (btrim(entity_type) <> ''),
  entity_id uuid not null,
  metadata jsonb not null default '{}' check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  unique (operator_id, id),
  foreign key (operator_id, actor_id) references public.staff_profiles(operator_id, id)
);

create index staff_profiles_auth_user_idx on public.staff_profiles(auth_user_id);
create index products_supplier_idx on public.products(operator_id, supplier_id);
create index departures_schedule_idx on public.departures(operator_id, product_id, service_date, start_time);
create index departures_vehicle_idx on public.departures(operator_id, vehicle_id);
create index customers_email_idx on public.customers(operator_id, lower(email));
create index orders_customer_idx on public.orders(operator_id, customer_id);
create index booking_items_order_idx on public.booking_items(operator_id, order_id);
create index booking_items_departure_idx on public.booking_items(operator_id, product_id, departure_id);
create index payments_order_idx on public.payments(operator_id, order_id, currency);
create index payment_events_payment_idx on public.payment_events(operator_id, payment_id, provider);
create index refunds_payment_idx on public.refunds(operator_id, payment_id, provider);
create index reviews_product_idx on public.reviews(operator_id, product_id);
create index domain_events_pending_idx on public.domain_events(operator_id, created_at) where published_at is null;
create index audit_logs_entity_idx on public.audit_logs(operator_id, entity_type, entity_id, created_at);
create index audit_logs_actor_idx on public.audit_logs(operator_id, actor_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := statement_timestamp();
  return new;
end;
$$;
revoke all on function public.set_updated_at() from public, anon, authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'operators', 'staff_profiles', 'suppliers', 'products', 'stops', 'vehicles',
    'departures', 'customers', 'orders', 'booking_items', 'bookings', 'payments',
    'refunds', 'vehicle_positions', 'reviews', 'content_pages', 'redirects', 'api_keys'
  ] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
  end loop;
end $$;

-- Deny by default from day one; usable role policies belong to Phase 1E.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'operators', 'staff_profiles', 'suppliers', 'products', 'stops', 'vehicles',
    'departures', 'customers', 'orders', 'booking_items', 'bookings', 'payments',
    'payment_events', 'refunds', 'vehicle_positions', 'reviews', 'content_pages',
    'redirects', 'api_keys', 'domain_events', 'audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
  end loop;
end $$;

commit;
