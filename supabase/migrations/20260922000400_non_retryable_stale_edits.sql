-- Expected stale edits must not use serialization_failure (40001): PostgREST retries it.
-- PT409 returns HTTP 409 immediately; locking, permissions and audit behavior are unchanged.
begin;
create or replace function public.save_departure_v1(p_operator_id uuid,p_actor_id uuid,p_id uuid,p_product_id uuid,
  p_vehicle_id uuid,p_date date,p_time time,p_capacity integer,p_status text,p_expected_updated_at timestamptz default null)
returns uuid language plpgsql set search_path='' as $$
declare d public.departures; saved uuid; used bigint; zone text;
begin
  if not exists(select 1 from public.staff_profiles where operator_id=p_operator_id and id=p_actor_id and is_active and role in ('owner','admin','operations')) then
    raise exception 'Departure permission required' using errcode='42501'; end if;
  if p_product_id is null or p_date is null or not isfinite(p_date) or p_time is null or p_time='24:00:00'::time
    or p_capacity is null or p_capacity<0 or p_status is null or p_status not in ('draft','scheduled','cancelled') then
    raise exception 'Invalid departure fields' using errcode='22023'; end if;
  select timezone into zone from public.operators where id=p_operator_id;
  if p_status='scheduled' and (p_date+p_time) at time zone zone<=clock_timestamp() then
    raise exception 'Scheduled departure must be in the future' using errcode='22023'; end if;
  if p_id is not null then
    select * into d from public.departures where operator_id=p_operator_id and id=p_id for update;
    if not found then raise exception 'Departure unavailable' using errcode='P0002'; end if;
    if p_expected_updated_at is null or d.updated_at<>p_expected_updated_at then
      raise exception 'Departure changed; reload before saving' using errcode='PT409'; end if;
    if row(p_product_id,p_date,p_time) is distinct from row(d.product_id,d.service_date,d.start_time)
      and (exists(select 1 from public.inventory_holds where operator_id=p_operator_id and departure_id=d.id)
        or exists(select 1 from public.booking_items where operator_id=p_operator_id and departure_id=d.id)) then
      raise exception 'Inventory history prevents rescheduling' using errcode='P0001'; end if;
    select (select coalesce(sum(quantity),0) from public.booking_items where operator_id=p_operator_id and departure_id=d.id and status='confirmed')
      +(select coalesce(sum(quantity),0) from public.inventory_holds where operator_id=p_operator_id and departure_id=d.id and status='active' and expires_at>clock_timestamp()) into used;
    if p_capacity<used or (p_status<>'scheduled' and used>0) then
      raise exception 'Resolve reserved inventory before this change' using errcode='P0001'; end if;
    update public.departures set product_id=p_product_id,vehicle_id=p_vehicle_id,service_date=p_date,start_time=p_time,
      capacity=p_capacity,status=p_status where id=d.id returning id into saved;
  else
    insert into public.departures(operator_id,product_id,vehicle_id,service_date,start_time,capacity,status)
      values(p_operator_id,p_product_id,p_vehicle_id,p_date,p_time,p_capacity,p_status) returning id into saved;
  end if;
  perform public.record_domain_activity(p_operator_id,p_actor_id,'departure-edit:'||gen_random_uuid()::text,'departure',saved,
    'departure.changed',jsonb_build_object('departureId',saved),'departure.changed',jsonb_build_object(
      'previousCapacity',d.capacity,'capacity',p_capacity,'previousStatus',d.status,'status',p_status,
      'serviceDate',p_date,'startTime',p_time,'productId',p_product_id,'vehicleId',p_vehicle_id));
  return saved;
end;
$$;
revoke all on function public.save_departure_v1(uuid,uuid,uuid,uuid,uuid,date,time,integer,text,timestamptz) from public,anon,authenticated;
grant execute on function public.save_departure_v1(uuid,uuid,uuid,uuid,uuid,date,time,integer,text,timestamptz) to service_role;

create or replace function public.save_content_page_v1(p_operator_id uuid,p_actor_id uuid,p_id uuid,p_data jsonb,p_expected_updated_at timestamptz default null)
returns uuid language plpgsql set search_path='' as $$
declare existing public.content_pages; saved uuid := coalesce(p_id,gen_random_uuid());
begin
  if not exists(select 1 from public.staff_profiles where operator_id=p_operator_id and id=p_actor_id and is_active and role in ('owner','admin','content_editor')) then
    raise exception 'Content permission required' using errcode='42501'; end if;
  if jsonb_typeof(p_data) is distinct from 'object' or length(btrim(coalesce(p_data->>'title',''))) not between 1 and 200
    or length(coalesce(p_data->>'slug','')) not between 1 and 200
    or p_data->>'status' is null or p_data->>'status' not in ('draft','published','archived')
    or length(coalesce(p_data->>'text',''))>50000 or length(coalesce(p_data->>'meta_title',''))>200
    or length(coalesce(p_data->>'meta_description',''))>500 or length(coalesce(p_data->>'og_image',''))>2000
    or length(coalesce(p_data->>'og_image_alt',''))>500 then
    raise exception 'Invalid content fields' using errcode='22023'; end if;
  if p_data->>'status'='published' and (length(btrim(coalesce(p_data->>'text','')))=0
    or length(btrim(coalesce(p_data->>'meta_title','')))=0 or length(btrim(coalesce(p_data->>'meta_description','')))=0) then
    raise exception 'Publication requires content and SEO fields' using errcode='22023'; end if;
  if nullif(p_data->>'og_image','') is not null and (p_data->>'og_image' !~ '^https://[^[:space:]]+$'
    or length(btrim(coalesce(p_data->>'og_image_alt','')))=0) then
    raise exception 'Image requires HTTPS and alt text' using errcode='22023'; end if;
  if p_id is not null then
    select * into existing from public.content_pages where operator_id=p_operator_id and id=p_id for update;
    if not found then raise exception 'Content unavailable' using errcode='P0002'; end if;
    if p_expected_updated_at is null or existing.updated_at<>p_expected_updated_at then
      raise exception 'Content changed; reload first' using errcode='PT409'; end if;
    if existing.body<>'{}'::jsonb and (existing.body->>'format' is distinct from 'plain_text' or existing.body->'version' is distinct from '1'::jsonb) then
      raise exception 'Unsupported existing content format' using errcode='22023'; end if;
  else
    insert into public.content_pages(id,operator_id,slug,title) values(saved,p_operator_id,p_data->>'slug',btrim(p_data->>'title'));
  end if;
  update public.content_pages set title=btrim(p_data->>'title'),slug=p_data->>'slug',status=p_data->>'status',
    body=jsonb_build_object('version',1,'format','plain_text','text',coalesce(p_data->>'text','')),
    meta_title=nullif(btrim(p_data->>'meta_title'),''),meta_description=nullif(btrim(p_data->>'meta_description'),''),
    og_image=nullif(p_data->>'og_image',''),og_image_alt=nullif(btrim(p_data->>'og_image_alt'),'') where id=saved and operator_id=p_operator_id;
  perform public.record_domain_activity(p_operator_id,p_actor_id,'content-edit:'||gen_random_uuid()::text,'content_page',saved,
    'content.changed',jsonb_build_object('pageId',saved),'content.changed',jsonb_build_object('previousStatus',existing.status,'status',p_data->>'status','slug',p_data->>'slug'));
  return saved;
end;
$$;
revoke all on function public.save_content_page_v1(uuid,uuid,uuid,jsonb,timestamptz) from public,anon,authenticated;
grant execute on function public.save_content_page_v1(uuid,uuid,uuid,jsonb,timestamptz) to service_role;

commit;
