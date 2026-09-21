-- Phase 2A: one statement snapshot; this does not reserve inventory.
begin;
create function public.read_availability_v1(p_operator_id uuid, p_product_id uuid, p_date date)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'operator_id', p.operator_id, 'product_id', p.id, 'service_date', p_date,
    'as_of', statement_timestamp(), 'pricing_rules', p.pricing_rules,
    'departures', coalesce((select jsonb_agg(jsonb_build_object(
      'id', d.id, 'start_time', d.start_time, 'capacity', d.capacity,
      'committed', (select coalesce(sum(i.quantity),0) from public.booking_items i
        where i.operator_id = p_operator_id and i.departure_id = d.id and i.status = 'confirmed'),
      'held', (select coalesce(sum(h.quantity),0) from public.inventory_holds h
        where h.operator_id = p_operator_id and h.departure_id = d.id
          and h.status = 'active' and h.expires_at > statement_timestamp())
    ) order by d.start_time, d.id)
      from public.departures d where d.operator_id = p_operator_id and d.product_id = p.id
        and d.service_date = p_date and d.status = 'scheduled'
        and (d.service_date + d.start_time) at time zone o.timezone > statement_timestamp()), '[]'::jsonb)
  ) from public.products p join public.operators o on o.id = p.operator_id
    where p.operator_id = p_operator_id and p.id = p_product_id and p.status = 'published'
      and p.type = 'van_tour' and p.capacity_rules = '{"version":1,"model":"departure_seats"}'::jsonb;
$$;
revoke all on function public.read_availability_v1(uuid,uuid,date) from public, anon, authenticated;
grant execute on function public.read_availability_v1(uuid,uuid,date) to service_role;
commit;
