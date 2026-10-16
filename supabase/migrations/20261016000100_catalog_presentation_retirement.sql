-- F04: retire editor requirements only; retain columns, omitted values, permissions and consumers.
begin;
create or replace function public.save_catalog_v1(p_operator_id uuid,p_actor_id uuid,p_entity text,p_id uuid,p_data jsonb,p_delete boolean default false)
returns uuid language plpgsql set search_path='' as $$
declare saved uuid := coalesce(p_id,gen_random_uuid()); changed integer; effective_image text; effective_alt text;
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
      -- Omitted legacy keys preserve stored values. Lock before validating partial old-client image edits.
      if p_id is not null then
        select og_image,og_image_alt into effective_image,effective_alt from public.products
          where operator_id=p_operator_id and id=p_id for update;
      end if;
      if p_data ? 'og_image' then effective_image:=p_data->>'og_image'; end if;
      if p_data ? 'og_image_alt' then effective_alt:=p_data->>'og_image_alt'; end if;
      if p_data->>'status' not in ('draft','published','archived') or p_data->>'status' is null
        or p_data->>'type' not in ('van_tour','boat_trip','attraction_ticket') or p_data->>'type' is null
        or length(coalesce(p_data->>'slug','')) not between 1 and 200
        or length(coalesce(p_data->>'inclusions',''))>700 or length(coalesce(p_data->>'meta_title',''))>200 or length(coalesce(p_data->>'meta_description',''))>500
        or ((p_data ? 'og_image' or p_data ? 'og_image_alt') and nullif(effective_image,'') is not null
          and (effective_image !~ '^https://[^[:space:]]+$' or length(btrim(coalesce(effective_alt,'')))=0)) then
        raise exception 'Invalid product or retained fields' using errcode='22023'; end if;
      if p_id is null then
        insert into public.products(id,operator_id,title,slug,type) values(saved,p_operator_id,btrim(p_data->>'title'),p_data->>'slug',p_data->>'type');
      end if;
      update public.products set title=btrim(p_data->>'title'),slug=p_data->>'slug',type=p_data->>'type',status=p_data->>'status',
        inclusions=case when p_data ? 'inclusions' then nullif(p_data->>'inclusions','') else inclusions end, supplier_id=nullif(p_data->>'supplier_id','')::uuid,meta_title=case when p_data ? 'meta_title' then nullif(btrim(p_data->>'meta_title'),'') else meta_title end,meta_description=case when p_data ? 'meta_description' then nullif(btrim(p_data->>'meta_description'),'') else meta_description end,
        og_image=case when p_data ? 'og_image' then nullif(p_data->>'og_image','') else og_image end,og_image_alt=case when p_data ? 'og_image_alt' then nullif(btrim(p_data->>'og_image_alt'),'') else og_image_alt end where operator_id=p_operator_id and id=saved;
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
