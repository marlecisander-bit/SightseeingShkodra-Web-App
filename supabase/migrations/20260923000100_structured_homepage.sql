-- Extend the existing CMS; no operational data is copied.
begin;
alter table public.content_pages add column published_body jsonb, add column published_at timestamptz;
create function public.validate_website_content_v1(p_data jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare spec jsonb := '{"hero.eyebrow":{"kind":"text","max":700},"hero.title":{"kind":"text","max":700},"hero.emphasis":{"kind":"text","max":700},"hero.description":{"kind":"text","max":700},"hero.subtitle":{"kind":"text","max":700},"hero.desktop":{"kind":"image","max":2000},"hero.mobile":{"kind":"image","max":2000},"hero.alt":{"kind":"text","max":700},"hero.book":{"kind":"text","max":700},"hero.track":{"kind":"text","max":700},"hero.discover":{"kind":"text","max":700},"intro.eyebrow":{"kind":"text","max":700},"intro.title":{"kind":"text","max":700},"intro.text":{"kind":"text","max":700},"intro.linkLabel":{"kind":"text","max":700},"intro.link":{"kind":"link","max":2000},"route.eyebrow":{"kind":"text","max":700},"route.title":{"kind":"text","max":700},"route.text":{"kind":"text","max":700},"destinations.eyebrow":{"kind":"text","max":700},"destinations.title":{"kind":"text","max":700},"place.centre.name":{"kind":"text","max":700},"place.centre.tag":{"kind":"text","max":700},"place.centre.text":{"kind":"text","max":700},"place.centre.detail":{"kind":"text","max":700},"place.centre.image":{"kind":"image","max":2000},"place.centre.alt":{"kind":"text","max":700},"place.centre.link":{"kind":"link","max":2000},"place.castle.name":{"kind":"text","max":700},"place.castle.tag":{"kind":"text","max":700},"place.castle.text":{"kind":"text","max":700},"place.castle.detail":{"kind":"text","max":700},"place.castle.image":{"kind":"image","max":2000},"place.castle.alt":{"kind":"text","max":700},"place.castle.link":{"kind":"link","max":2000},"place.lake.name":{"kind":"text","max":700},"place.lake.tag":{"kind":"text","max":700},"place.lake.text":{"kind":"text","max":700},"place.lake.detail":{"kind":"text","max":700},"place.lake.image":{"kind":"image","max":2000},"place.lake.alt":{"kind":"text","max":700},"place.lake.link":{"kind":"link","max":2000},"place.bridge.name":{"kind":"text","max":700},"place.bridge.tag":{"kind":"text","max":700},"place.bridge.text":{"kind":"text","max":700},"place.bridge.detail":{"kind":"text","max":700},"place.bridge.image":{"kind":"image","max":2000},"place.bridge.alt":{"kind":"text","max":700},"place.bridge.link":{"kind":"link","max":2000},"live.eyebrow":{"kind":"text","max":700},"live.title":{"kind":"text","max":700},"live.emphasis":{"kind":"text","max":700},"live.text":{"kind":"text","max":700},"live.linkLabel":{"kind":"text","max":700},"how.eyebrow":{"kind":"text","max":700},"how.title":{"kind":"text","max":700},"how.0.title":{"kind":"text","max":700},"how.0.text":{"kind":"text","max":700},"how.1.title":{"kind":"text","max":700},"how.1.text":{"kind":"text","max":700},"how.2.title":{"kind":"text","max":700},"how.2.text":{"kind":"text","max":700},"how.3.title":{"kind":"text","max":700},"how.3.text":{"kind":"text","max":700},"departures.eyebrow":{"kind":"text","max":700},"departures.title":{"kind":"text","max":700},"departures.linkLabel":{"kind":"text","max":700},"reviews.eyebrow":{"kind":"text","max":700},"reviews.title":{"kind":"text","max":700},"reviews.text":{"kind":"text","max":700},"reviews.second":{"kind":"text","max":700},"notebook.eyebrow":{"kind":"text","max":700},"notebook.title":{"kind":"text","max":700},"notebook.linkLabel":{"kind":"text","max":700},"notebook.0.tag":{"kind":"text","max":700},"notebook.0.title":{"kind":"text","max":700},"notebook.0.linkLabel":{"kind":"text","max":700},"notebook.1.tag":{"kind":"text","max":700},"notebook.1.title":{"kind":"text","max":700},"notebook.1.linkLabel":{"kind":"text","max":700},"notebook.2.tag":{"kind":"text","max":700},"notebook.2.title":{"kind":"text","max":700},"notebook.2.linkLabel":{"kind":"text","max":700},"final.eyebrow":{"kind":"text","max":700},"final.title":{"kind":"text","max":700},"final.emphasis":{"kind":"text","max":700},"final.book":{"kind":"text","max":700},"final.image":{"kind":"image","max":2000},"final.alt":{"kind":"text","max":700},"nav.0.label":{"kind":"text","max":700},"nav.0.link":{"kind":"link","max":2000},"nav.1.label":{"kind":"text","max":700},"nav.1.link":{"kind":"link","max":2000},"nav.2.label":{"kind":"text","max":700},"nav.2.link":{"kind":"link","max":2000},"nav.3.label":{"kind":"text","max":700},"nav.3.link":{"kind":"link","max":2000},"nav.4.label":{"kind":"text","max":700},"nav.4.link":{"kind":"link","max":2000},"nav.book":{"kind":"text","max":700},"nav.mobileBook":{"kind":"text","max":700},"nav.mobileMap":{"kind":"text","max":700},"footer.line1":{"kind":"text","max":700},"footer.line2":{"kind":"text","max":700},"footer.0.label":{"kind":"text","max":700},"footer.0.link":{"kind":"link","max":2000},"footer.1.label":{"kind":"text","max":700},"footer.1.link":{"kind":"link","max":2000},"footer.2.label":{"kind":"text","max":700},"footer.2.link":{"kind":"link","max":2000},"footer.3.label":{"kind":"text","max":700},"footer.3.link":{"kind":"link","max":2000},"footer.4.label":{"kind":"text","max":700},"footer.4.link":{"kind":"link","max":2000},"footer.5.label":{"kind":"text","max":700},"footer.5.link":{"kind":"link","max":2000},"footer.location":{"kind":"text","max":700},"footer.language":{"kind":"text","max":700},"footer.contact":{"kind":"text","max":700},"seo.title":{"kind":"text","max":700},"seo.description":{"kind":"text","max":700},"seo.image":{"kind":"image","max":2000},"seo.alt":{"kind":"text","max":700}}'::jsonb; k text; v text;
begin
 if jsonb_typeof(p_data) is distinct from 'object' or (select count(*) from jsonb_object_keys(p_data)) <> (select count(*) from jsonb_object_keys(spec)) then return false; end if;
 for k in select jsonb_object_keys(spec) loop
  v := p_data->>k;
  if jsonb_typeof(p_data->k) is distinct from 'string' or length(btrim(v))=0 or length(v)>(spec->k->>'max')::integer then return false; end if;
  if spec->k->>'kind'='link' and v !~ '^/($|#(route|booking|destinations)$|(tour|live|explore|book|credits|admin)(#(faq|timetable|centre|castle|lake|bridge))?$|explore/(centre|castle|lake|bridge)$)' then return false; end if;
  if spec->k->>'kind'='image' and v !~ '^/images/[a-zA-Z0-9/_-]+[.](webp|png|jpg|jpeg|avif)$' and v !~ '^https://[a-z0-9-]+[.]supabase[.]co/storage/v1/object/public/website-media/[a-f0-9-]+/[a-f0-9-]+[.](webp|png|jpg|avif)$' then return false; end if;
 end loop;
 return true;
end $$;
create function public.save_website_content_v1(p_operator_id uuid,p_actor_id uuid,p_content jsonb,p_expected_updated_at timestamptz,p_operation text)
returns public.content_pages language plpgsql set search_path='' as $$
declare existing public.content_pages; saved public.content_pages;
begin
 if not exists(select 1 from public.staff_profiles where id=p_actor_id and operator_id=p_operator_id and is_active and role in ('owner','admin','content_editor')) then raise exception 'Content permission required' using errcode='42501'; end if;
 if p_operation is null or p_operation not in ('initialize','draft','publish') or not public.validate_website_content_v1(p_content) then raise exception 'Invalid website content' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended('homepage:'||p_operator_id::text,0));
 select * into existing from public.content_pages where operator_id=p_operator_id and slug='website-homepage' for update;
 if found then
  if existing.body->>'format' is distinct from 'homepage_v1' then raise exception 'Homepage slot is occupied' using errcode='22023'; end if;
  if p_operation='initialize' then return existing; end if;
  if p_expected_updated_at is null or existing.updated_at<>p_expected_updated_at then raise exception 'Content changed; reload' using errcode='PT409'; end if;
 else
  if p_operation<>'initialize' then raise exception 'Initialize homepage first' using errcode='22023'; end if;
  insert into public.content_pages(operator_id,slug,title,status,body) values(p_operator_id,'website-homepage','Homepage','draft',jsonb_build_object('version',1,'format','homepage_v1','content',p_content)) returning * into existing;
 end if;
 update public.content_pages set body=jsonb_build_object('version',1,'format','homepage_v1','content',p_content),
  published_body=case when p_operation in ('publish','initialize') then jsonb_build_object('version',1,'format','homepage_v1','content',p_content) else published_body end,
  published_at=case when p_operation in ('publish','initialize') then clock_timestamp() else published_at end,
  status=case when p_operation in ('publish','initialize') then 'published' else status end,
  meta_title=case when p_operation in ('publish','initialize') then p_content->>'seo.title' else meta_title end,
  meta_description=case when p_operation in ('publish','initialize') then p_content->>'seo.description' else meta_description end
 where id=existing.id returning * into saved;
 perform public.record_domain_activity(p_operator_id,p_actor_id,'website-edit:'||gen_random_uuid()::text,'content_page',saved.id,'website.'||p_operation,jsonb_build_object('pageId',saved.id),'website.'||p_operation,jsonb_build_object('pageId',saved.id));
 return saved;
end $$;
revoke all on function public.validate_website_content_v1(jsonb) from public,anon,authenticated;
revoke all on function public.save_website_content_v1(uuid,uuid,jsonb,timestamptz,text) from public,anon,authenticated;
grant execute on function public.validate_website_content_v1(jsonb) to service_role;
grant execute on function public.save_website_content_v1(uuid,uuid,jsonb,timestamptz,text) to service_role;
-- Supabase Storage exists on hosted Supabase; disposable SQL test databases omit it.
do $$ begin
 if to_regclass('storage.buckets') is not null then
  insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('website-media','website-media',true,8388608,array['image/jpeg','image/png','image/webp','image/avif']) on conflict(id) do nothing;
 end if;
end $$;
commit;
