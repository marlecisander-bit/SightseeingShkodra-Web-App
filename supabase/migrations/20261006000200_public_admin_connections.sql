begin;
-- Additive editorial contract. Stored historical fields remain valid and untouched.
do $$ declare d text; begin
 d:=pg_get_functiondef('public.validate_website_content_v1(jsonb)'::regprocedure);
 execute replace(d,'FUNCTION public.validate_website_content_v1(', 'FUNCTION private.validate_website_before_connections_v1(');
end $$;
revoke all on function private.validate_website_before_connections_v1(jsonb) from public,anon,authenticated;
grant execute on function private.validate_website_before_connections_v1(jsonb) to service_role;
create or replace function public.validate_website_content_v1(p_data jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare spec jsonb:='{"homeRoute.eyebrow":{"max":700,"kind":"text"},"homeRoute.title":{"max":700,"kind":"text"},"homeRoute.text":{"max":700,"kind":"text"},"homeRoute.action":{"max":700,"kind":"text"},"routePage.eyebrow":{"max":700,"kind":"text"},"routePage.title":{"max":700,"kind":"text"},"routePage.text":{"max":700,"kind":"text"},"routePage.departures":{"max":700,"kind":"text"},"routePage.stops":{"max":700,"kind":"text"},"routePage.mapAction":{"max":700,"kind":"text"},"routePage.seoTitle":{"max":700,"kind":"text"},"routePage.seoDescription":{"max":700,"kind":"text"},"routePage.seoImage":{"max":2000,"kind":"image"},"routePage.seoAlt":{"max":700,"kind":"text"},"labels.ticket":{"max":700,"kind":"text"},"labels.faq":{"max":700,"kind":"text"},"labels.guide":{"max":700,"kind":"text"},"labels.destination":{"max":700,"kind":"text"},"labels.tour":{"max":700,"kind":"text"},"labels.reviews":{"max":700,"kind":"text"},"labels.leaveReview":{"max":700,"kind":"text"},"labels.originalReview":{"max":700,"kind":"text"},"bookingDialog.title":{"max":700,"kind":"text"},"bookingDialog.text":{"max":700,"kind":"text"},"bookPage.seoTitle":{"max":700,"kind":"text"},"bookPage.seoDescription":{"max":700,"kind":"text"},"bookPage.seoImage":{"max":2000,"kind":"image"},"bookPage.seoAlt":{"max":700,"kind":"text"},"faqPage.seoTitle":{"max":700,"kind":"text"},"faqPage.seoDescription":{"max":700,"kind":"text"},"faqPage.seoImage":{"max":2000,"kind":"image"},"faqPage.seoAlt":{"max":700,"kind":"text"},"explorePage.seoTitle":{"max":700,"kind":"text"},"explorePage.seoDescription":{"max":700,"kind":"text"},"explorePage.seoImage":{"max":2000,"kind":"image"},"explorePage.seoAlt":{"max":700,"kind":"text"}}'::jsonb; base jsonb:=p_data; f record; v text;
begin
 for f in select * from jsonb_each(spec) loop
  if p_data?f.key then
   v:=p_data->>f.key;
   if jsonb_typeof(p_data->f.key) is distinct from 'string' or length(btrim(v))=0 or length(v)>(f.value->>'max')::int then return false; end if;
   if f.value->>'kind'='image' and not (v ~ '^/images/[a-zA-Z0-9/_-]+[.](webp|png|jpg|jpeg|avif)$' or v ~ '^https://[a-z0-9-]+[.]supabase[.]co/storage/v1/object/public/website-media/[a-f0-9-]+/[a-f0-9-]+[.](webp|png|jpg|avif)$') then return false; end if;
  end if;
  base:=base-f.key;
 end loop;
 if replace(coalesce(p_data->>'homeRoute.title',''),'{count}','') ~ '[{}0-9]' or array_length(string_to_array(coalesce(p_data->>'homeRoute.title',''),'{count}'),1)>2 then return false; end if;
 -- The historical validator still validates every original field. Normalize only
 -- newly approved route shapes for that validator; save verifies destination membership.
 for f in select * from jsonb_each_text(base) loop
  if f.key ~ '[.]link$' and (f.value in ('/route','/privacy-policy','/terms-and-conditions') or f.value ~ '^/explore/[a-z0-9]+(-[a-z0-9]+)*$') then base:=jsonb_set(base,array[f.key],'"/tour"'); end if;
 end loop;
 return private.validate_website_before_connections_v1(base);
exception when others then return false;
end $$;

create function private.check_website_connections_v1(op uuid,actor uuid,payload jsonb,operation text) returns void language plpgsql set search_path='' as $$
declare r text; old jsonb; published jsonb; f record;
begin
 select role::text into r from public.staff_profiles where id=actor and operator_id=op and is_active;
 if r is null or r not in ('owner','admin','content_editor') or (operation<>'draft' and r='content_editor') or (operation='initialize' and r<>'owner') then raise exception 'Publication permission required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended('homepage:'||op::text,0));
 select body->'content',published_body->'content' into old,published from public.content_pages where operator_id=op and slug='website-homepage' for update;
 for f in select * from jsonb_each_text(payload) loop
  if r<>'owner' and f.key ~ '^(footer[.]|whatsapp[.]|legal[.])' and ((old is not null and old->>f.key is distinct from f.value) or (operation='publish' and published->>f.key is distinct from f.value)) then raise exception 'Owner business settings permission required' using errcode='42501'; end if;
  if f.key ~ '[.]link$' and f.value ~ '^/explore/' and not exists(select 1 from public.content_pages where operator_id=op and is_destination and status='published' and (published_body->>'slug'=substring(f.value from 10) or substring(f.value from 10)=any(destination_aliases))) then raise exception 'Choose a published destination' using errcode='22023'; end if;
 end loop;
end $$;
revoke all on function private.check_website_connections_v1(uuid,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function private.check_website_connections_v1(uuid,uuid,jsonb,text) to service_role;
do $$ declare d text; begin
 d:=pg_get_functiondef('public.save_website_content_v1(uuid,uuid,jsonb,timestamptz,text)'::regprocedure);
 execute regexp_replace(d,'\mbegin\M',E'begin\n perform private.check_website_connections_v1(p_operator_id,p_actor_id,p_content,p_operation);','i');
 d:=pg_get_functiondef('public.save_destination_v1(uuid,uuid,uuid,jsonb,text,integer,timestamptz)'::regprocedure);
 execute regexp_replace(d,'\mbegin\M',E'begin\n if p_operation<>''draft'' and not exists(select 1 from public.staff_profiles where id=p_actor_id and operator_id=p_operator_id and is_active and role in (''owner'',''admin'')) then raise exception ''Publishing permission required'' using errcode=''42501''; end if;','i');
 d:=pg_get_functiondef('public.save_destination_v1(uuid,uuid,uuid,jsonb,text,integer,timestamptz)'::regprocedure);
 execute replace(d,'destination_order=p_order,destination_aliases=aliases','destination_order=case when p_operation=''draft'' and r.published_body is not null then r.destination_order else p_order end,destination_aliases=aliases');
 d:=pg_get_functiondef('public.save_passenger_pricing_v1(uuid,uuid,uuid,jsonb,timestamptz)'::regprocedure);
 execute replace(d,'''owner'',''admin'',''operations''','''owner'',''admin''');
 -- Calendar overrides include prices and restoration can restore prices, so this
 -- combined commercial operation is restricted. Base operational schedules remain operations-owned.
 d:=pg_get_functiondef('public.save_calendar_override_v1(uuid,uuid,uuid,date,date,integer[],jsonb,boolean,timestamptz,boolean)'::regprocedure);
 execute replace(d,'''owner'',''admin'',''operations''','''owner'',''admin''');
 d:=pg_get_functiondef('public.save_content_page_v1(uuid,uuid,uuid,jsonb,timestamptz)'::regprocedure);
 execute replace(d,'''owner'',''admin'',''content_editor''','''owner'',''admin''');
 d:=pg_get_functiondef('public.save_content_page_v1(uuid,uuid,uuid,jsonb,timestamptz)'::regprocedure);
 execute regexp_replace(d,'\mbegin\M',E'begin\n if p_data->>''slug''=''website-homepage'' or exists(select 1 from public.content_pages where id=p_id and operator_id=p_operator_id and (is_destination or slug=''website-homepage'')) then raise exception ''Use the owning Website or Destination editor'' using errcode=''42501'';end if;','i');
end $$;
create function private.protect_product_bindings_v1() returns trigger language plpgsql set search_path='' as $$ begin
 if new.slug is distinct from old.slug or new.type is distinct from old.type then raise exception 'Product address and operational type require a developer migration' using errcode='42501'; end if;
 return new;
end $$;
create trigger protect_product_bindings before update on public.products for each row execute function private.protect_product_bindings_v1();

create function private.commercial_settings_v1(v jsonb) returns jsonb language plpgsql immutable set search_path='' as $$
declare result jsonb:='{}'; f record; nested jsonb;begin
 if jsonb_typeof(v)<>'object' then return result;end if;
 for f in select * from jsonb_each(v) loop
  if f.key in ('prices','offer') then result:=result||jsonb_build_object(f.key,f.value);
  elsif jsonb_typeof(f.value)='object' then nested:=private.commercial_settings_v1(f.value);if nested<>'{}'::jsonb then result:=result||jsonb_build_object(f.key,nested);end if;end if;
 end loop;return result;
end $$;
create function private.check_calendar_commercial_v1(op uuid,actor uuid,schedule uuid,date_from date,date_to date,v jsonb,restore boolean) returns void language plpgsql set search_path='' as $$
declare old jsonb;begin
 if exists(select 1 from public.staff_profiles where id=actor and operator_id=op and is_active and role in ('owner','admin')) then return;end if;
 perform pg_advisory_xact_lock(hashtextextended('schedule:'||op::text||(select product_id::text from public.service_schedules where id=schedule and operator_id=op),0));
 if date_from=date_to then select calendar_settings into old from public.schedule_exceptions where schedule_id=schedule and operator_id=op and service_date=date_from;
 else select r into old from public.service_schedules s cross join lateral jsonb_array_elements(s.calendar_ranges) r where s.id=schedule and s.operator_id=op and r->>'from'=date_from::text and r->>'to'=date_to::text;end if;
 if private.commercial_settings_v1(case when restore then '{}'::jsonb else coalesce(v,'{}') end) is distinct from private.commercial_settings_v1(coalesce(old,'{}')) then raise exception 'Price and offer changes require commercial permission' using errcode='42501';end if;
end $$;
revoke all on function private.commercial_settings_v1(jsonb),private.check_calendar_commercial_v1(uuid,uuid,uuid,date,date,jsonb,boolean) from public,anon,authenticated;
grant execute on function private.commercial_settings_v1(jsonb),private.check_calendar_commercial_v1(uuid,uuid,uuid,date,date,jsonb,boolean) to service_role;
do $$ declare d text;begin
 d:=pg_get_functiondef('public.save_calendar_override_v1(uuid,uuid,uuid,date,date,integer[],jsonb,boolean,timestamptz,boolean)'::regprocedure);
 d:=replace(d,'''owner'',''admin''','''owner'',''admin'',''operations''');
 execute regexp_replace(d,'\mbegin\M',E'begin\n perform private.check_calendar_commercial_v1(p_operator,p_actor,p_schedule,p_from,p_to,p_value,p_restore);','i');
 d:=pg_get_functiondef('public.save_schedule_exception_v1(uuid,uuid,uuid,date,boolean,jsonb,text,boolean,timestamptz)'::regprocedure);
 execute regexp_replace(d,'\mbegin\M',E'begin\n if p_restore then perform private.check_calendar_commercial_v1(p_operator_id,p_actor_id,p_schedule_id,p_date,p_date,''{}''::jsonb,true);end if;','i');
end $$;
commit;
