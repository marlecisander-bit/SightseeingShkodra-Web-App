begin;
-- Read-only staff search. Authorization is checked both by the server and here.
create function public.search_admin_orders_v1(p_operator uuid,p_actor uuid,p_query text default '',p_day date default null,p_email text default null,p_status text default 'all',p_page integer default 1)
returns jsonb language plpgsql stable set search_path='' as $$
declare result jsonb;q text:=lower(btrim(coalesce(p_query,'')));begin
 if not exists(select 1 from public.staff_profiles s where s.operator_id=p_operator and s.id=p_actor and s.is_active and s.role in ('owner','admin','operations')) then raise exception 'Booking access required' using errcode='42501';end if;
 if length(q)>200 or p_page is null or p_page<1 or p_page>1000000 or p_status is null or p_status not in ('all','confirmed','pending','cancelled','expired') then raise exception 'Invalid booking search' using errcode='22023';end if;
 with matches as materialized (
  select o.id,o.created_at from public.orders o
  join public.customers c on c.operator_id=o.operator_id and c.id=o.customer_id
  left join public.bookings b on b.operator_id=o.operator_id and b.order_id=o.id
  where o.operator_id=p_operator
  and (q='' or strpos(lower(concat_ws(' ',c.name,c.email,c.phone,b.booking_reference)),q)>0)
  and (nullif(btrim(p_email),'') is null or lower(c.email)=lower(btrim(p_email)))
  and (p_status='all' or coalesce(b.status,o.status)=p_status)
  and (p_day is null or exists(select 1 from public.booking_items i join public.departures d on d.operator_id=i.operator_id and d.id=i.departure_id where i.operator_id=p_operator and i.order_id=o.id and d.service_date=p_day))
 ), totals as (select count(*) total,greatest(1,ceil(count(*)/25.0)::integer) pages from matches), paged as (select id,created_at from matches order by created_at desc,id desc limit 25 offset (select (least(p_page,pages)-1)*25 from totals))
 select jsonb_build_object('ids',coalesce((select jsonb_agg(id order by created_at desc,id desc) from paged),'[]'::jsonb),'total',(select total from totals),'page',(select least(p_page,pages) from totals),'pageSize',25) into result;
 return result;
end $$;
revoke all on function public.search_admin_orders_v1(uuid,uuid,text,date,text,text,integer) from public,anon,authenticated;
grant execute on function public.search_admin_orders_v1(uuid,uuid,text,date,text,text,integer) to service_role;
commit;
