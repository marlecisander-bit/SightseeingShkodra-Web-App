begin;
create or replace function public.save_product_card_v1(p_operator uuid,p_actor uuid,p_product uuid,p_stamp timestamptz,p_card jsonb,p_publish boolean default false) returns void language plpgsql set search_path='' as $$
declare p public.products;role text;begin
 select s.role into role from public.staff_profiles s where s.operator_id=p_operator and s.id=p_actor and s.is_active;
 if role is null or role not in ('owner','admin','content_editor') or (p_publish and role='content_editor') then raise exception 'Content permission required' using errcode='42501';end if;
 if p_card is null or jsonb_typeof(p_card)<>'object' or not (p_card ?& array['description','image','alt','enabled','order']) or jsonb_typeof(p_card->'description') is distinct from 'string' or jsonb_typeof(p_card->'image') is distinct from 'string' or jsonb_typeof(p_card->'alt') is distinct from 'string' or jsonb_typeof(p_card->'order') is distinct from 'number' or p_card-array['description','image','alt','enabled','order','features','feature_icons']<>'{}' or length(coalesce(p_card->>'description',''))>700 or length(coalesce(p_card->>'alt',''))>200 or jsonb_typeof(p_card->'enabled') is distinct from 'boolean' or coalesce(p_card->>'order','')!~ '^[0-9]{1,5}$' then raise exception 'Invalid product card' using errcode='22023';end if;
 if nullif(p_card->>'image','') is not null and (length(p_card->>'image')>2000 or (p_card->>'image' !~ '^/images/[a-zA-Z0-9/_-]+\.(webp|png|jpg|jpeg|avif)$' and p_card->>'image' !~ ('^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/website-media/'||p_operator::text||'/[a-f0-9-]+\.(webp|png|jpg|avif)$'))) then raise exception 'Invalid image' using errcode='22023';end if;
 if (p_card->>'enabled')::boolean and (nullif(btrim(p_card->>'image'),'') is null or nullif(btrim(p_card->>'alt'),'') is null) then raise exception 'Image and alternative text required to show a card' using errcode='22023';end if;
 if p_card ? 'features' then
 if jsonb_typeof(p_card->'features')<>'array' then raise exception 'Invalid product features' using errcode='22023';end if;
 if jsonb_array_length(p_card->'features')>11 or (select count(*) from jsonb_array_elements(p_card->'features'))<>(select count(distinct value) from jsonb_array_elements(p_card->'features')) or exists(select 1 from jsonb_array_elements(p_card->'features') as entries(feature) where jsonb_typeof(feature)<>'string' or feature#>>'{}' not in ('audio_guide','multilingual_audio_guide','two_hours_ticket','full_day_ticket','hop_on_hop_off','van_tour','live_guide','air_conditioning','wifi','walking','live_tracking')) then raise exception 'Invalid product features' using errcode='22023';end if;
 end if;
 if coalesce(p_card->'features','[]') ?& array['two_hours_ticket','full_day_ticket'] then raise exception 'Choose either a 2-hour ticket or a full-day ticket' using errcode='22023';end if;
 if p_card ? 'feature_icons' then
 if jsonb_typeof(p_card->'feature_icons')<>'object' then raise exception 'Invalid amenity icons' using errcode='22023';end if;
 if exists(select 1 from jsonb_each(p_card->'feature_icons') i where not (coalesce(p_card->'features','[]') ? i.key) or jsonb_typeof(i.value)<>'string' or i.value#>>'{}' not in ('clock','languages','stop','ticket','snowflake','wifi','people','van','map','pin','headphones','camera','info')) then raise exception 'Invalid amenity icons' using errcode='22023';end if;
 end if;
 select * into p from public.products where id=p_product and operator_id=p_operator for update;
 if not found then raise exception 'Product unavailable' using errcode='P0002';end if;
 if p.updated_at is distinct from p_stamp then raise exception 'Product changed; reload before saving' using errcode='PT409';end if;
 update public.products set card_draft=p_card,card_published=case when p_publish then p_card else card_published end where id=p_product;
 perform public.record_domain_activity(p_operator,p_actor,'product-card:'||gen_random_uuid()::text,'product',p_product,'product.card_saved',jsonb_build_object('productId',p_product),'product.card_saved',jsonb_build_object('published',p_publish));
end $$;
create or replace function public.read_public_products_v1(p_operator uuid) returns jsonb language sql stable set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'title',p.title,'slug',p.slug,'mode',p.seat_reservation_mode,'minutes',p.reservation_minutes,'card',p.card_published,'adultPrice',public.passenger_categories_v1(p.id)#>'{adult,price}') order by coalesce((p.card_published->>'order')::integer,0),p.title,p.id),'[]') from public.products p
 where p.operator_id=p_operator and p.status='published' and p.type='van_tour' and p.capacity_rules='{"version":1,"model":"departure_seats"}' and exists(select 1 from public.products source where source.id=coalesce(p.inventory_product_id,p.id) and source.operator_id=p_operator and source.status='published' and source.type='van_tour' and source.capacity_rules='{"version":1,"model":"departure_seats"}') and (exists(select 1 from public.service_schedules where product_id=coalesce(p.inventory_product_id,p.id) and status='active') or exists(select 1 from public.departures where operator_id=p_operator and product_id=coalesce(p.inventory_product_id,p.id) and status='scheduled' and public.booking_cutoff_v1(service_date,start_time)>statement_timestamp()));
$$;

-- Editorial changes stay private until the same product is published from Products.
alter table public.products add column editor_draft jsonb not null default '{}';
create function public.product_publish_blockers_v1(p_operator uuid,p_product uuid,p_draft jsonb default null) returns jsonb language plpgsql stable set search_path='' as $$
declare p public.products;d jsonb;c jsonb;source public.products;issues jsonb:='[]';k text;begin
 select * into p from public.products where operator_id=p_operator and id=p_product;
 if not found then return '["Product unavailable"]';end if;
 d:=coalesce(p_draft,p.editor_draft);c:=coalesce(d->'card',p.card_draft,p.card_published,'{}');
 if length(btrim(coalesce(d->>'title',p.title,'')))=0 then issues:=issues||'"Add a product name."'::jsonb;end if;
 if p.type<>'van_tour' then issues:=issues||'"Online booking currently supports van tours only."'::jsonb;end if;
 if nullif(btrim(c->>'image'),'') is null then issues:=issues||'"Add a product photo."'::jsonb;end if;
 if nullif(btrim(c->>'alt'),'') is null then issues:=issues||'"Add a photo description."'::jsonb;end if;
 if coalesce(c->>'enabled','false')<>'true' then issues:=issues||'"Enable the homepage booking card."'::jsonb;end if;
 select * into source from public.products where operator_id=p_operator and id=coalesce(p.inventory_product_id,p.id);
 if source.id is null or source.type<>'van_tour' or source.capacity_rules is distinct from '{"version":1,"model":"departure_seats"}'::jsonb or (source.id<>p.id and source.status<>'published') or source.inventory_product_id is not null then issues:=issues||'"Choose a published shared van schedule."'::jsonb;end if;
 if not exists(select 1 from public.service_schedules s where s.operator_id=p_operator and s.product_id=source.id and s.status='active' and s.end_date>=(statement_timestamp() at time zone 'Europe/Tirane')::date)
 and not exists(select 1 from public.departures x where x.operator_id=p_operator and x.product_id=source.id and x.status='scheduled' and public.booking_cutoff_v1(x.service_date,x.start_time)>statement_timestamp()) then issues:=issues||'"Choose a shared schedule or add an active operating period."'::jsonb;end if;
 if p.capacity_rules is distinct from '{"version":1,"model":"departure_seats"}'::jsonb then issues:=issues||'"Save the seat reservation settings."'::jsonb;end if;
 foreach k in array array['adult','child','infant'] loop
 if public.passenger_categories_v1(p.id)->k->>'price' is null then issues:=issues||to_jsonb('Set the '||k||' price (zero is allowed).');end if;end loop;
 return issues;
end $$;
create function public.save_product_workspace_v1(p_operator uuid,p_actor uuid,p_product uuid,p_stamp timestamptz,p_operation text,p_patch jsonb default '{}') returns uuid language plpgsql set search_path='' as $$
declare p public.products;d jsonb;c jsonb;issues jsonb;role text;saved uuid;begin
 select s.role into role from public.staff_profiles s where s.operator_id=p_operator and s.id=p_actor and s.is_active;
 if role is null or role not in ('owner','admin','content_editor') or (p_operation in ('create','publish','pause') and role='content_editor') then raise exception 'Product permission required' using errcode='42501';end if;
 if p_operation is null or p_operation not in ('create','draft','publish','pause') or p_patch is null or jsonb_typeof(p_patch)<>'object' or p_patch-array['title','inclusions','supplier_id','card']<>'{}' then raise exception 'Invalid product request' using errcode='22023';end if;
 perform public.lock_seat_inventory_v1(p_operator);
 if p_operation='create' then
 if p_product is not null then raise exception 'New product required' using errcode='22023';end if;
 saved:=public.save_catalog_v1(p_operator,p_actor,'product',null,jsonb_build_object('title',p_patch->>'title','slug','experience-'||gen_random_uuid()::text,'type','van_tour','status','draft'),false);
 return saved;
 end if;
 select * into p from public.products where operator_id=p_operator and id=p_product for update;
 if not found then raise exception 'Product unavailable' using errcode='P0002';end if;
 if p_stamp is distinct from p.updated_at then raise exception 'Product changed. Reload before saving.' using errcode='PT409';end if;
 d:=jsonb_build_object('title',p.title,'inclusions',coalesce(p.inclusions,''),'supplier_id',coalesce(p.supplier_id::text,''),'card',coalesce(p.card_published,'{}'))||p.editor_draft||p_patch;
 if length(btrim(coalesce(d->>'title',''))) not between 1 and 200 or length(coalesce(d->>'inclusions',''))>700 or jsonb_typeof(d->'title') is distinct from 'string' or jsonb_typeof(d->'inclusions') is distinct from 'string' then raise exception 'Check product name and inclusions.' using errcode='22023';end if;
 if nullif(d->>'supplier_id','') is not null and not exists(select 1 from public.suppliers where operator_id=p_operator and id=(d->>'supplier_id')::uuid) then raise exception 'Supplier unavailable' using errcode='22023';end if;
 -- Reuse existing media/card validation, actor policy and stale protection atomically.
 c:=jsonb_build_object('image','','alt','','description','','order',0,'enabled',false)||coalesce(d->'card','{}');
 perform public.save_product_card_v1(p_operator,p_actor,p_product,p.updated_at,c||'{"enabled":false}'::jsonb,false);
 d:=jsonb_set(d,'{card}',c);
 if p_operation='publish' then
 issues:=public.product_publish_blockers_v1(p_operator,p_product,d);
 if jsonb_array_length(issues)>0 then raise exception '%',array_to_string(array(select jsonb_array_elements_text(issues)),' ') using errcode='PT422';end if;
 update public.products set title=btrim(d->>'title'),inclusions=nullif(d->>'inclusions',''),supplier_id=nullif(d->>'supplier_id','')::uuid,card_draft=c,card_published=c,editor_draft=d,status='published' where id=p_product;
 elsif p_operation='pause' then
 update public.products set status='draft',editor_draft=d where id=p_product;
 else update public.products set editor_draft=d,card_draft=c where id=p_product;end if;
 perform public.record_domain_activity(p_operator,p_actor,'product-workspace:'||gen_random_uuid()::text,'product',p_product,'product.workspace_saved',jsonb_build_object('productId',p_product),'product.workspace_saved',jsonb_build_object('operation',p_operation));
 return p_product;
end $$;
revoke all on function public.product_publish_blockers_v1(uuid,uuid,jsonb),public.save_product_workspace_v1(uuid,uuid,uuid,timestamptz,text,jsonb) from public,anon,authenticated;
grant execute on function public.product_publish_blockers_v1(uuid,uuid,jsonb),public.save_product_workspace_v1(uuid,uuid,uuid,timestamptz,text,jsonb) to service_role;
commit;
