begin;
create function public.save_catalog_v1(p_operator_id uuid,p_actor_id uuid,p_entity text,p_id uuid,p_data jsonb,p_delete boolean default false)
returns uuid language plpgsql set search_path='' as $$
declare saved uuid := coalesce(p_id,gen_random_uuid()); changed integer;
begin
  if not exists(select 1 from public.staff_profiles where operator_id=p_operator_id and id=p_actor_id and is_active and role in ('owner','admin')) then
    raise exception 'Catalog permission required' using errcode='42501'; end if;
  if p_entity not in ('product','supplier','stop') or p_entity is null or jsonb_typeof(p_data) is distinct from 'object' then
    raise exception 'Invalid catalog request' using errcode='22023'; end if;
  if p_delete then
    if p_id is null then raise exception 'Record required' using errcode='22023'; end if;
    case p_entity
      when 'product' then update public.products set status='archived' where operator_id=p_operator_id and id=p_id;
      when 'supplier' then delete from public.suppliers where operator_id=p_operator_id and id=p_id;
      when 'stop' then delete from public.stops where operator_id=p_operator_id and id=p_id;
    end case;
    get diagnostics changed=row_count;
    if changed<>1 then raise exception 'Record unavailable' using errcode='P0002'; end if;
  else
    if length(btrim(coalesce(p_data->>'name',p_data->>'title',''))) not between 1 and 200 then
      raise exception 'Name or title required' using errcode='22023'; end if;
    if p_entity='product' then
      if p_data->>'status' not in ('draft','published','archived') or p_data->>'status' is null
        or p_data->>'type' not in ('van_tour','boat_trip','attraction_ticket') or p_data->>'type' is null
        or length(coalesce(p_data->>'slug','')) not between 1 and 200
        or length(coalesce(p_data->>'meta_title',''))>200 or length(coalesce(p_data->>'meta_description',''))>500
        or (p_data->>'status'='published' and (length(btrim(coalesce(p_data->>'meta_title','')))=0 or length(btrim(coalesce(p_data->>'meta_description','')))=0))
        or (nullif(p_data->>'og_image','') is not null and (p_data->>'og_image' !~ '^https://[^[:space:]]+$' or length(btrim(coalesce(p_data->>'og_image_alt','')))=0)) then
        raise exception 'Invalid product or SEO fields' using errcode='22023'; end if;
      if p_id is null then
        insert into public.products(id,operator_id,title,slug,type) values(saved,p_operator_id,btrim(p_data->>'title'),p_data->>'slug',p_data->>'type');
      end if;
      update public.products set title=btrim(p_data->>'title'),slug=p_data->>'slug',type=p_data->>'type',status=p_data->>'status',
        supplier_id=nullif(p_data->>'supplier_id','')::uuid,meta_title=nullif(btrim(p_data->>'meta_title'),''),meta_description=nullif(btrim(p_data->>'meta_description'),''),
        og_image=nullif(p_data->>'og_image',''),og_image_alt=nullif(btrim(p_data->>'og_image_alt'),'') where operator_id=p_operator_id and id=saved;
    elsif p_entity='supplier' then
      if p_data->>'type' not in ('owned','partner') or p_data->>'type' is null then raise exception 'Invalid supplier type' using errcode='22023'; end if;
      if p_id is null then insert into public.suppliers(id,operator_id,name,type) values(saved,p_operator_id,btrim(p_data->>'name'),p_data->>'type'); end if;
      update public.suppliers set name=btrim(p_data->>'name'),type=p_data->>'type' where operator_id=p_operator_id and id=saved;
    else
      if p_id is null then insert into public.stops(id,operator_id,product_id,name,lat,lng,sort_order)
        values(saved,p_operator_id,(p_data->>'product_id')::uuid,btrim(p_data->>'name'),(p_data->>'lat')::double precision,(p_data->>'lng')::double precision,(p_data->>'sort_order')::integer); end if;
      update public.stops set product_id=(p_data->>'product_id')::uuid,name=btrim(p_data->>'name'),lat=(p_data->>'lat')::double precision,
        lng=(p_data->>'lng')::double precision,sort_order=(p_data->>'sort_order')::integer where operator_id=p_operator_id and id=saved;
    end if;
    get diagnostics changed=row_count;
    if changed<>1 then raise exception 'Record unavailable' using errcode='P0002'; end if;
  end if;
  perform public.record_domain_activity(p_operator_id,p_actor_id,'catalog:'||gen_random_uuid()::text,p_entity,saved,
    'catalog.changed',jsonb_build_object('entity',p_entity,'id',saved),'catalog.changed',jsonb_build_object('operation',case when p_delete then 'remove' else 'save' end));
  return saved;
end;
$$;
revoke all on function public.save_catalog_v1(uuid,uuid,text,uuid,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.save_catalog_v1(uuid,uuid,text,uuid,jsonb,boolean) to service_role;
commit;
