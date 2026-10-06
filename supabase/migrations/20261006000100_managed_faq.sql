begin;
-- Extend validation only; no content rows, publication states or timestamps change.
do $$ declare definition text; begin
 definition:=pg_get_functiondef('public.validate_website_content_v1(jsonb)'::regprocedure);
 definition:=replace(definition,'FUNCTION public.validate_website_content_v1(', 'FUNCTION private.validate_website_before_faq_v1(');
 execute definition;
end $$;
revoke all on function private.validate_website_before_faq_v1(jsonb) from public,anon,authenticated;
grant execute on function private.validate_website_before_faq_v1(jsonb) to service_role;
create or replace function public.validate_website_content_v1(p_data jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare items jsonb; item jsonb; ids text[]:='{}';
begin
 if not private.validate_website_before_faq_v1(p_data-'faq.items') then return false; end if;
 if not p_data?'faq.items' then return true; end if;
 if jsonb_typeof(p_data->'faq.items') is distinct from 'string' or length(p_data->>'faq.items')>230000 then return false; end if;
 items:=(p_data->>'faq.items')::jsonb;
 if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items)>50 then return false; end if;
 for item in select value from jsonb_array_elements(items) loop
  if jsonb_typeof(item) is distinct from 'object' then return false; end if;
  if (select count(*) from jsonb_object_keys(item))<>5 or not item ?& array['id','question','answer','active','answerSource'] then return false; end if;
  if jsonb_typeof(item->'id') is distinct from 'string' or item->>'id' !~ '^[a-zA-Z0-9-]{1,64}$' or item->>'id'=any(ids) then return false; end if;
  ids:=array_append(ids,item->>'id');
  if jsonb_typeof(item->'active') is distinct from 'boolean' or jsonb_typeof(item->'question') is distinct from 'string' or length(btrim(item->>'question'))=0 or length(item->>'question')>300 then return false; end if;
  if jsonb_typeof(item->'answer') is distinct from 'string' or length(item->>'answer')>4000 or jsonb_typeof(item->'answerSource') is distinct from 'string' or item->>'answerSource' not in ('text','product-inclusions') then return false; end if;
  if item->>'answerSource'='text' and length(btrim(item->>'answer'))=0 then return false; end if;
 end loop;
 return true;
exception when others then return false;
end $$;
commit;
