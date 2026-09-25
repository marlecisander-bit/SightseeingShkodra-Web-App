begin;
alter table public.content_pages add column is_destination boolean not null default false, add column destination_order integer not null default 0, add column destination_aliases text[] not null default '{}', add column destination_legacy jsonb;
create index destination_listing on public.content_pages(operator_id,destination_order,id) where is_destination;
-- Preserve both CMS draft and published destination cards; existing guide data is retained.
do $$
declare h public.content_pages; old public.content_pages; key text; v_slug text; draft jsonb; pub jsonb; c jsonb; body jsonb; n integer; is_public boolean;
begin
 for h in select hp.* from public.content_pages hp where hp.slug='website-homepage' loop
  n:=0;
  for key in select k from jsonb_object_keys(h.body->'content') k where k ~ '^place\.[a-z0-9-]+\.name$' order by case split_part(k,'.',2) when 'centre' then 0 when 'castle' then 1 when 'lake' then 2 when 'bridge' then 3 else 4 end,k loop
   v_slug:=split_part(key,'.',2); select * into old from public.content_pages where operator_id=h.operator_id and content_pages.slug='explore-'||v_slug;
   if old.is_destination then continue; end if;
   draft:=null;pub:=null;
   for n in 0..1 loop
    c:=case when n=0 then h.body->'content' else h.published_body->'content' end;
    if c is null then continue; end if;
    body:=jsonb_build_object('version',1,'format','destination_v1','slug',v_slug,'name',c->>('place.'||v_slug||'.name'),'tag',c->>('place.'||v_slug||'.tag'),'text',c->>('place.'||v_slug||'.text'),'detail',c->>('place.'||v_slug||'.detail'),'image',c->>('place.'||v_slug||'.image'),'alt',c->>('place.'||v_slug||'.alt'),'legacyLink',c->>('place.'||v_slug||'.link'),'story',case when n=0 or old.status='published' then coalesce(old.body->>'text',c->>('place.'||v_slug||'.detail')) else c->>('place.'||v_slug||'.detail') end,'guidePublished',coalesce(old.status='published',false),'seoTitle',coalesce(old.meta_title,c->>('place.'||v_slug||'.name')),'seoDescription',coalesce(old.meta_description,c->>('place.'||v_slug||'.text')),'socialImage',coalesce(old.og_image,c->>('place.'||v_slug||'.image')),'location','','lat',null,'lng',null,'mapsUrl','','stopId',null,'showOnPage',true,'showOnHomepage',true);
    if n=0 then draft:=body;else pub:=body;end if;
   end loop;
   is_public:=h.status='published' and pub is not null;
   if old.id is null then
    insert into public.content_pages(operator_id,slug,title,status,body,published_body,published_at,is_destination,destination_order,meta_title,meta_description)
    values(h.operator_id,'explore-'||v_slug,draft->>'name',case when is_public then 'published' else 'draft' end,draft,pub,h.published_at,true,case v_slug when 'centre' then 0 when 'castle' then 1 when 'lake' then 2 when 'bridge' then 3 else 4 end,pub->>'seoTitle',pub->>'seoDescription');
   else
    update public.content_pages set destination_legacy=to_jsonb(old),is_destination=true,destination_order=case v_slug when 'centre' then 0 when 'castle' then 1 when 'lake' then 2 when 'bridge' then 3 else 4 end,body=draft,published_body=pub,published_at=h.published_at,status=case when is_public then 'published' else 'draft' end where id=old.id;
   end if;
  end loop;
 end loop;
end $$;
create function public.save_destination_v1(p_operator_id uuid,p_actor_id uuid,p_id uuid,p_data jsonb,p_operation text,p_order integer,p_stamp timestamptz) returns uuid language plpgsql set search_path='' as $$
declare r public.content_pages; saved uuid:=coalesce(p_id,gen_random_uuid()); k text; neighbor public.content_pages; aliases text[]; v_slug text:=p_data->>'slug';
begin
 if not exists(select 1 from public.staff_profiles where operator_id=p_operator_id and id=p_actor_id and is_active and role in ('owner','admin','content_editor')) then raise exception 'Content permission required' using errcode='42501';end if;
 if p_operation is null or p_operation not in ('draft','publish','unpublish','archive','order','earlier','later') then raise exception 'Invalid operation';end if;
 perform pg_advisory_xact_lock(hashtextextended('destinations:'||p_operator_id::text,0));
 if p_id is not null then
  select * into r from public.content_pages where operator_id=p_operator_id and id=p_id and is_destination for update;
  if not found then raise exception 'Destination unavailable';end if;
  if p_stamp is null or p_stamp<>r.updated_at then raise exception 'Destination changed; reload' using errcode='PT409';end if;
 end if;
 if p_order is null or p_order not between 0 and 10000 then raise exception 'Invalid display order';end if;
 if p_operation in ('draft','publish') then
  if jsonb_typeof(p_data)<>'object' or p_data->>'format'<>'destination_v1' or v_slug is null or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(v_slug)>150 or length(btrim(coalesce(p_data->>'name',''))) not between 1 and 200 then raise exception 'Check name and slug';end if;
  for k in select jsonb_object_keys(p_data) loop
   if k not in ('version','format','slug','name','tag','text','detail','story','image','alt','legacyLink','guidePublished','seoTitle','seoDescription','socialImage','location','lat','lng','mapsUrl','stopId','showOnPage','showOnHomepage') then raise exception 'Unknown field';end if;
   if length(p_data->>k)>(case when k='story' then 50000 else 2000 end) then raise exception 'Field too long';end if;
  end loop;
  if p_data->>'lat' is not null and (p_data->>'lat')::numeric not between -90 and 90 or p_data->>'lng' is not null and (p_data->>'lng')::numeric not between -180 and 180 then raise exception 'Invalid location';end if;
  if p_operation='publish' and (length(btrim(coalesce(p_data->>'seoTitle','')))=0 or length(btrim(coalesce(p_data->>'seoDescription','')))=0 or length(btrim(coalesce(p_data->>'text','')))=0 or length(btrim(coalesce(p_data->>'image','')))=0 or length(btrim(coalesce(p_data->>'alt','')))=0) then raise exception 'Publication requires description, image, alt text and SEO';end if;
  if exists(select 1 from public.content_pages where operator_id=p_operator_id and id<>saved and (content_pages.slug='explore-'||v_slug or (is_destination and (published_body->>'slug'=v_slug or v_slug=any(destination_aliases))))) then raise exception 'Slug already used';end if;
  aliases:=coalesce(r.destination_aliases,'{}');
  if p_operation='publish' and r.published_body->>'slug' is not null and r.published_body->>'slug'<>v_slug and not (r.published_body->>'slug'=any(aliases)) then aliases:=array_append(aliases,r.published_body->>'slug');end if;
  if p_id is null then insert into public.content_pages(id,operator_id,slug,title,is_destination) values(saved,p_operator_id,'explore-'||v_slug,p_data->>'name',true);end if;
  update public.content_pages set title=p_data->>'name',slug='explore-'||v_slug,body=case when p_operation='publish' then p_data||'{"guidePublished":true}'::jsonb else p_data end,destination_order=p_order,destination_aliases=aliases,
   published_body=case when p_operation='publish' then p_data||'{"guidePublished":true}'::jsonb else published_body end,
   status=case when p_operation='publish' then 'published' else coalesce(r.status,'draft') end,
   published_at=case when p_operation='publish' then clock_timestamp() else published_at end,
   meta_title=case when p_operation='publish' then p_data->>'seoTitle' else meta_title end,meta_description=case when p_operation='publish' then p_data->>'seoDescription' else meta_description end
  where id=saved;
 else
  if r.id is null then raise exception 'Destination unavailable';end if;
  if p_operation in ('earlier','later') then
   -- Normalize ranks under the operator lock, then swap adjacent records atomically.
   with ranked as (select id,row_number() over(order by destination_order,id)-1 as position from public.content_pages where operator_id=p_operator_id and is_destination)
   update public.content_pages p set destination_order=ranked.position from ranked where p.id=ranked.id;
   select * into r from public.content_pages where id=saved;
   select * into neighbor from public.content_pages where operator_id=p_operator_id and is_destination and destination_order=r.destination_order+case when p_operation='earlier' then -1 else 1 end;
   if neighbor.id is not null then
    update public.content_pages set destination_order=r.destination_order,updated_at=clock_timestamp() where id=neighbor.id;
    p_order:=neighbor.destination_order;
   else p_order:=r.destination_order;end if;
  end if;
  update public.content_pages set status=case p_operation when 'archive' then 'archived' when 'unpublish' then 'draft' else status end,destination_order=p_order,updated_at=clock_timestamp() where id=saved;
 end if;
 perform public.record_domain_activity(p_operator_id,p_actor_id,'destination:'||gen_random_uuid()::text,'content_page',saved,'destination.changed',jsonb_build_object('destinationId',saved),'destination.'||p_operation,jsonb_build_object('previousStatus',r.status));
 return saved;
end $$;
revoke all on function public.save_destination_v1(uuid,uuid,uuid,jsonb,text,integer,timestamptz) from public,anon,authenticated;
grant execute on function public.save_destination_v1(uuid,uuid,uuid,jsonb,text,integer,timestamptz) to service_role;
commit;

