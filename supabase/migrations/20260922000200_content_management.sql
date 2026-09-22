begin;
create function public.save_content_page_v1(p_operator_id uuid,p_actor_id uuid,p_id uuid,p_data jsonb,p_expected_updated_at timestamptz default null)
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
      raise exception 'Content changed; reload first' using errcode='40001'; end if;
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
