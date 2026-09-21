begin;
-- Database validation of the existing V1 pricing contract at checkout time.
create function public.unit_price_v1(p_rules jsonb) returns bigint language plpgsql immutable set search_path='' as $$
declare amount numeric;
begin
  if p_rules is null or jsonb_typeof(p_rules) <> 'object' or
    p_rules - array['version','model','currency','unit_price'] <> '{}'::jsonb or
    p_rules->'version' is distinct from '1'::jsonb or p_rules->>'model' is distinct from 'per_guest' or
    p_rules->>'currency' is distinct from 'EUR' or jsonb_typeof(p_rules->'unit_price') is distinct from 'number' then
    raise exception 'Invalid pricing configuration' using errcode='22023';
  end if;
  amount := (p_rules->>'unit_price')::numeric;
  if amount < 0 or amount <> trunc(amount) or amount > 9007199254740991 then
    raise exception 'Invalid pricing amount' using errcode='22023';
  end if;
  return amount::bigint;
end;
$$;
revoke all on function public.unit_price_v1(jsonb) from public,anon,authenticated;
grant execute on function public.unit_price_v1(jsonb) to service_role;

create function public.create_pending_order_v1(p_operator_id uuid,p_hold_id uuid,p_session_key text,
  p_customer_name text,p_customer_email text,p_customer_phone text default null)
returns jsonb language plpgsql set search_path='' as $$
declare h public.inventory_holds; d public.departures; p public.products; c public.customers;
  o public.orders; price bigint; total_amount numeric; departure_time timestamptz;
begin
  if p_operator_id is null or p_hold_id is null or p_session_key is null
    or p_customer_name is null or length(btrim(p_customer_name)) not between 1 and 200
    or p_customer_email is null or length(p_customer_email)>254 or btrim(p_customer_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or length(coalesce(p_customer_phone,''))>50 then
    raise exception 'Invalid checkout request' using errcode='22023';
  end if;
  select * into h from public.inventory_holds where operator_id=p_operator_id and id=p_hold_id and session_key=p_session_key;
  if not found then raise exception 'Hold unavailable' using errcode='P0002'; end if;
  -- Same lock order as allocation: departure, then hold. Revalidate after waiting.
  select * into d from public.departures where operator_id=p_operator_id and id=h.departure_id for update;
  select * into h from public.inventory_holds where operator_id=p_operator_id and id=p_hold_id and session_key=p_session_key for update;
  if h.order_id is not null then
    select * into o from public.orders where operator_id=p_operator_id and id=h.order_id;
    select * into c from public.customers where operator_id=p_operator_id and id=o.customer_id;
    if c.name is distinct from btrim(p_customer_name) or c.email is distinct from lower(btrim(p_customer_email))
      or c.phone is distinct from nullif(btrim(p_customer_phone),'') then
      raise exception 'Conflicting checkout retry' using errcode='23505';
    end if;
  else
    if h.status<>'active' or h.expires_at <= clock_timestamp() then raise exception 'Hold inactive' using errcode='P0001'; end if;
    select * into p from public.products where operator_id=p_operator_id and id=d.product_id for share;
    select (d.service_date+d.start_time) at time zone timezone into departure_time from public.operators where id=p_operator_id;
    if d.status<>'scheduled' or departure_time<=clock_timestamp() or p.status<>'published'
      or p.type<>'van_tour' or p.capacity_rules <> '{"version":1,"model":"departure_seats"}'::jsonb then
      raise exception 'Product unavailable' using errcode='P0002';
    end if;
    price := public.unit_price_v1(p.pricing_rules);
    total_amount := price::numeric*h.quantity;
    if total_amount > 9007199254740991 then raise exception 'Unsafe order total' using errcode='22023'; end if;
    insert into public.customers(operator_id,name,email,phone) values(p_operator_id,btrim(p_customer_name),lower(btrim(p_customer_email)),nullif(btrim(p_customer_phone),'')) returning * into c;
    insert into public.orders(operator_id,customer_id,currency,subtotal,total)
      values(p_operator_id,c.id,'EUR',total_amount,total_amount) returning * into o;
    insert into public.booking_items(operator_id,order_id,product_id,departure_id,quantity,unit_price,total_price)
      values(p_operator_id,o.id,p.id,d.id,h.quantity,price,total_amount);
    if h.expires_at <= clock_timestamp() then raise exception 'Hold expired during checkout' using errcode='P0001'; end if;
    update public.inventory_holds set order_id=o.id where id=h.id;
    perform public.record_domain_activity(p_operator_id,null,'order-created:'||o.id::text,
      'order',o.id,'order.created',jsonb_build_object('orderId',o.id,'currency','EUR','total',o.total),
      'order.created',jsonb_build_object('holdId',h.id));
  end if;
  return jsonb_build_object('version',1,'orderId',o.id,'status',o.status,'currency',o.currency,'total',o.total,
    'holdId',h.id,'expiresAt',h.expires_at,'items',(select jsonb_agg(jsonb_build_object('id',i.id,'productId',i.product_id,
      'departureId',i.departure_id,'quantity',i.quantity,'unitPrice',i.unit_price,'total',i.total_price,'status',i.status) order by i.id)
      from public.booking_items i where i.operator_id=p_operator_id and i.order_id=o.id));
end;
$$;
revoke all on function public.create_pending_order_v1(uuid,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.create_pending_order_v1(uuid,uuid,text,text,text,text) to service_role;
commit;
