begin;
-- Extend the existing editorial JSON contract. No content or booking data changes.
do $$ declare definition text; begin
 definition:=pg_get_functiondef('public.validate_website_content_v1(jsonb)'::regprocedure);
 definition:=replace(definition,'FUNCTION public.validate_website_content_v1(', 'FUNCTION private.validate_website_before_seasonal_v1(');
 execute definition;
end $$;
revoke all on function private.validate_website_before_seasonal_v1(jsonb) from public,anon,authenticated;
grant execute on function private.validate_website_before_seasonal_v1(jsonb) to service_role;
create or replace function public.validate_website_content_v1(p_data jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare k text; v text; base jsonb:=p_data; start_date date; end_date date;
begin
 for k in select unnest(array['seasonal.enabled','seasonal.start','seasonal.end','seasonal.title','seasonal.message','seasonal.shortSeason','seasonal.season','seasonal.learnMore','seasonal.popupTitle','seasonal.description','seasonal.departuresLabel','seasonal.departures','seasonal.stopsLabel','seasonal.stops','seasonal.noticeLabel','seasonal.notice','seasonal.action','seasonal.close']) loop
  base:=base-k;
  if not p_data?k then continue; end if;
  v:=p_data->>k;
  if jsonb_typeof(p_data->k) is distinct from 'string' or length(btrim(v))=0 or length(v)>(case when k='seasonal.description' then 1200 else 700 end) then return false; end if;
  if k='seasonal.enabled' and v not in ('true','false') then return false; end if;
  if k in ('seasonal.start','seasonal.end') and v !~ '^\d{4}-\d{2}-\d{2}$' then return false; end if;
 end loop;
 if p_data?'seasonal.start' then start_date:=(p_data->>'seasonal.start')::date; end if;
 if p_data?'seasonal.end' then end_date:=(p_data->>'seasonal.end')::date; end if;
 if start_date>end_date then return false; end if;
 if p_data?'seasonal.stops' and cardinality(regexp_split_to_array(btrim(p_data->>'seasonal.stops'),E'\n'))>12 then return false; end if;
 return private.validate_website_before_seasonal_v1(base);
exception when invalid_datetime_format or datetime_field_overflow then return false;
end $$;
commit;
