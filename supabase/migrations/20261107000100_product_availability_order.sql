begin;
-- Availability is independent of editorial publication and physical shared inventory.
alter table public.products add column active boolean not null default true,
 add column unavailable_message text not null default '',
 add column display_order integer not null default 0 check(display_order>=0),
 add constraint product_unavailable_message_check check(length(unavailable_message)<=160 and (active or unavailable_message ~ '[^[:space:]]'));
-- Preserve the directory's existing order exactly (including deterministic ties).
with ranked as(select id,row_number() over(partition by operator_id order by coalesce((card_published->>'order')::integer,0),title,id)-1 position from public.products)
update public.products p set display_order=r.position from ranked r where p.id=r.id;

-- New drafts append after current products, rather than moving existing cards.
create function public.append_product_order_v1() returns trigger language plpgsql set search_path='' as $$
begin
 perform public.lock_seat_inventory_v1(new.operator_id);
 select coalesce(max(display_order)+1,0) into new.display_order from public.products where operator_id=new.operator_id;
 return new;
end $$;
create trigger append_product_order before insert on public.products for each row execute function public.append_product_order_v1();
revoke all on function public.append_product_order_v1() from public,anon,authenticated;

create function public.save_product_availability_v1(p_operator uuid,p_actor uuid,p_product uuid,p_stamp timestamptz,p_active boolean,p_message text) returns void language plpgsql set search_path='' as $$
declare p public.products;begin
 if not exists(select 1 from public.staff_profiles where id=p_actor and operator_id=p_operator and is_active and role in ('owner','admin')) then raise exception 'Product permission required' using errcode='42501';end if;
 perform public.lock_seat_inventory_v1(p_operator);
 select * into p from public.products where operator_id=p_operator and id=p_product for update;
 if not found then raise exception 'Product unavailable' using errcode='P0002';end if;
 if p.updated_at is distinct from p_stamp then raise exception 'Product changed. Reload before saving.' using errcode='PT409';end if;
 if p_active is null or p_message is null or length(p_message)>160 or (not p_active and p_message !~ '[^[:space:]]') then raise exception 'Enter an unavailable ribbon message (up to 160 characters).' using errcode='22023';end if;
 update public.products set active=p_active,unavailable_message=btrim(p_message) where id=p_product;
 perform public.record_domain_activity(p_operator,p_actor,'availability:'||gen_random_uuid()::text,'product',p_product,'product.availability_saved',jsonb_build_object('productId',p_product),'product.availability_saved',jsonb_build_object('active',p_active,'message',btrim(p_message)));
end $$;
create function public.move_product_v1(p_operator uuid,p_actor uuid,p_product uuid,p_stamp timestamptz,p_neighbor uuid,p_neighbor_stamp timestamptz) returns void language plpgsql set search_path='' as $$
declare p public.products;n public.products;begin
 if not exists(select 1 from public.staff_profiles where id=p_actor and operator_id=p_operator and is_active and role in ('owner','admin')) then raise exception 'Product permission required' using errcode='42501';end if;
 perform public.lock_seat_inventory_v1(p_operator);
 perform 1 from public.products where operator_id=p_operator order by id for update;
 select * into p from public.products where operator_id=p_operator and id=p_product;
 select * into n from public.products where operator_id=p_operator and id=p_neighbor;
 if p.id is null or n.id is null or p.id=n.id then raise exception 'Product unavailable' using errcode='P0002';end if;
 if p.updated_at is distinct from p_stamp or n.updated_at is distinct from p_neighbor_stamp then raise exception 'Product order changed. Reload before moving.' using errcode='PT409';end if;
 -- Normalize first, so newly created/tied positions can still move reliably.
 with ranked as(select id,row_number() over(order by display_order,title,id)-1 position from public.products where operator_id=p_operator)
 update public.products x set display_order=r.position from ranked r where x.id=r.id;
 select * into p from public.products where id=p_product;
 select * into n from public.products where id=p_neighbor;
 if abs(p.display_order-n.display_order)<>1 then raise exception 'Product order changed. Reload before moving.' using errcode='PT409';end if;
 update public.products set display_order=case when id=p.id then n.display_order else p.display_order end where id in (p.id,n.id);
 perform public.record_domain_activity(p_operator,p_actor,'product-order:'||gen_random_uuid()::text,'product',p_product,'product.order_saved',jsonb_build_object('productId',p_product),'product.order_saved',jsonb_build_object('neighborId',p_neighbor));
end $$;
-- Extend the existing projection; inactive offers stay in exactly the same directory.
do $$ declare d text;begin
 select pg_get_functiondef('public.read_public_products_v1(uuid)'::regprocedure) into d;
 d:=replace(d,'''id'',p.id,', '''active'',p.active,''unavailableMessage'',p.unavailable_message,''displayOrder'',p.display_order,''id'',p.id,');
 d:=replace(d,'order by coalesce((p.card_published->>''order'')::integer,0),p.title,p.id','order by p.display_order,p.title,p.id');
 if position('''displayOrder''' in d)=0 or position('order by p.display_order,p.title,p.id' in d)=0 then raise exception 'Product directory signature drift';end if;
 execute d;
end $$;
-- Keep the existing primary-card fallback on the same product-owned availability.
do $$ declare d text;begin
 select pg_get_functiondef('public.read_public_homepage_v1(uuid,text)'::regprocedure) into d;
 d:=replace(d,'''id'', p.id,', '''active'', p.active, ''unavailable_message'', p.unavailable_message, ''display_order'', p.display_order, ''id'', p.id,');
 if position('''unavailable_message''' in d)=0 then raise exception 'Homepage projection signature drift';end if;
 execute d;
end $$;
-- Guard the allocator and checkout below HTTP/UI. Existing reservations, cancellation,
-- check-in and payment reconciliation retain their contracts. A disabled inventory owner
-- does not disable a different, active offer sharing its physical schedule.
create function public.guard_product_availability_v1() returns trigger language plpgsql set search_path='' as $$
declare enabled boolean;begin
 perform public.lock_seat_inventory_v1(new.operator_id);
 select active into enabled from public.products where id=new.product_id and operator_id=new.operator_id for share;
 if enabled is false then raise exception 'Product unavailable for booking' using errcode='P0002';end if;
 return new;
end $$;
create trigger z_product_availability_guard before insert on public.inventory_holds for each row execute function public.guard_product_availability_v1();
create trigger z_product_availability_guard before insert on public.booking_items for each row execute function public.guard_product_availability_v1();
-- Return no sellable quote for inactive offers. Keep shared inventory reads available.
do $$ declare d text;begin
 select pg_get_functiondef('public.read_passenger_availability_v1(uuid,uuid,date,jsonb)'::regprocedure) into d;
 d:=replace(d,'and status=''published'' and type=''van_tour''','and status=''published'' and active and type=''van_tour''');
 if position('and status=''published'' and active and type=''van_tour''' in d)=0 then raise exception 'Availability projection signature drift';end if;
 execute d;
end $$;
revoke all on function public.save_product_availability_v1(uuid,uuid,uuid,timestamptz,boolean,text),public.move_product_v1(uuid,uuid,uuid,timestamptz,uuid,timestamptz),public.guard_product_availability_v1() from public,anon,authenticated;
grant execute on function public.save_product_availability_v1(uuid,uuid,uuid,timestamptz,boolean,text),public.move_product_v1(uuid,uuid,uuid,timestamptz,uuid,timestamptz) to service_role;
commit;
