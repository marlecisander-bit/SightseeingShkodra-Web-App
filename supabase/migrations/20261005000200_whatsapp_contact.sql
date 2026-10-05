begin;
-- Preserve the current validator exactly, including all earlier content amendments.
-- No content rows, publication state or timestamps are rewritten.
do $$ declare definition text; begin
 definition:=pg_get_functiondef('public.validate_website_content_v1(jsonb)'::regprocedure);
 definition:=replace(definition,'FUNCTION public.validate_website_content_v1(', 'FUNCTION private.validate_website_before_whatsapp_v1(');
 execute definition;
end $$;
revoke all on function private.validate_website_before_whatsapp_v1(jsonb) from public,anon,authenticated;
grant execute on function private.validate_website_before_whatsapp_v1(jsonb) to service_role;

create or replace function public.validate_website_content_v1(p_data jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare c jsonb; k text; phone text; digits text;
begin
 if jsonb_typeof(p_data) is distinct from 'object' then return false; end if;
 c:='{"whatsapp.enabled":"false","whatsapp.number":"","whatsapp.message":"Hello! I have a question about Sightseeing Shkodra Hop-On Hop-Off tours.","whatsapp.label":"Chat with us","whatsapp.desktop":"true","whatsapp.mobile":"true"}'::jsonb||p_data;
 foreach k in array array['whatsapp.enabled','whatsapp.number','whatsapp.message','whatsapp.label','whatsapp.desktop','whatsapp.mobile'] loop
  if jsonb_typeof(c->k) is distinct from 'string' then return false; end if;
 end loop;
 foreach k in array array['whatsapp.enabled','whatsapp.desktop','whatsapp.mobile'] loop
  if c->>k not in ('true','false') then return false; end if;
 end loop;
 if length(c->>'whatsapp.message')>700 or length(c->>'whatsapp.label')>60 or length(c->>'whatsapp.number')>40 then return false; end if;
 phone:=btrim(c->>'whatsapp.number');
 if phone<>'' or c->>'whatsapp.enabled'='true' then
  if phone !~ '^\+?[1-9][0-9 ()-]*$' then return false; end if;
  digits:=regexp_replace(phone,'[+ ()-]','','g');
  if digits !~ '^[1-9][0-9]{7,14}$' or digits ~ '^([0-9])\1+$' then return false; end if;
 end if;
 return private.validate_website_before_whatsapp_v1(p_data-array['whatsapp.enabled','whatsapp.number','whatsapp.message','whatsapp.label','whatsapp.desktop','whatsapp.mobile']);
end $$;
commit;
