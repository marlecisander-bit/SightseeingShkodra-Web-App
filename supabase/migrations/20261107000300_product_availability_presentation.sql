begin;
-- Additive presentation only. Existing active flags and copy are never backfilled.
alter table public.products add column availability_presentation jsonb;
alter table public.products drop constraint product_unavailable_message_check;
alter table public.products add constraint product_unavailable_message_check check(length(unavailable_message)<=160);
create function public.valid_product_availability_presentation_v1(p jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare r jsonb;v text;d date;begin
 if p is null then return true;end if;
 if jsonb_typeof(p)<>'object' or jsonb_typeof(p->'state') is distinct from 'string' or p->>'state' not in ('available','seasonal_break','temporarily_unavailable','sold_out') then return false;end if;
 if exists(select 1 from jsonb_object_keys(p) k where k not in ('state','label','actionLabel','actionUrl','reopening')) then return false;end if;
 foreach v in array array['label','actionLabel','actionUrl'] loop
  if p ? v and (jsonb_typeof(p->v)<>'string' or length(p->>v)>case when v='actionUrl' then 2048 else 80 end) then return false;end if;
 end loop;
 v:=coalesce(p->>'actionUrl','');
 -- Same supported relative routes and credential-free HTTPS convention as website-links.ts.
 if v<>'' and not(v ~ '^/(($|#(route|booking|destinations)$)|((tour|route|live|explore|book|credits|admin|faq|privacy-policy|terms-and-conditions)(#(faq|timetable|centre|castle|lake|bridge))?$)|explore/[a-z0-9]+(-[a-z0-9]+)*$)' or (v ~ '^https://[a-zA-Z0-9][a-zA-Z0-9.-]*([/?#][^[:space:]<>\\]*)?$')) then return false;end if;
 if p ? 'reopening' then
  r:=p->'reopening';v:=r->>'value';
  if exists(select 1 from jsonb_object_keys(r) k where k not in ('precision','value')) then return false;end if;
  if jsonb_typeof(r)<>'object' or r->>'precision' is null or v is null or r->>'precision' not in ('month','day') then return false;end if;
  if r->>'precision'='month' then
   if v !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' then return false;end if;
   d:=(v||'-01')::date;
  else
   if v !~ '^[0-9]{4}-(0[1-9]|1[0-2])-[0-9]{2}$' then return false;end if;
   d:=v::date;
  end if;
  if extract(year from d)<1 then return false;end if;
 end if;
 return true;
 exception when others then return false;
end $$;
alter table public.products add constraint product_availability_presentation_check check(public.valid_product_availability_presentation_v1(availability_presentation));
create function public.save_product_availability_v2(p_operator uuid,p_actor uuid,p_product uuid,p_stamp timestamptz,p_presentation jsonb,p_message text) returns void language plpgsql set search_path='' as $$
begin
 if p_presentation is null or not public.valid_product_availability_presentation_v1(p_presentation) or p_message is null or length(p_message)>160 then raise exception 'Check availability status, reopening date and secondary link.' using errcode='22023';end if;
 -- Reuse existing authorization, inventory lock, optimistic concurrency and activity audit.
 perform public.save_product_availability_v1(p_operator,p_actor,p_product,p_stamp,p_presentation->>'state'='available',coalesce(nullif(btrim(p_message),''),'Temporarily unavailable'));
 update public.products set unavailable_message=btrim(p_message),availability_presentation=p_presentation where id=p_product and operator_id=p_operator;
end $$;
do $$ declare d text;begin
 select pg_get_functiondef('public.read_public_products_v1(uuid)'::regprocedure) into d;
 d:=replace(d,'''active'',p.active,','''availability'',p.availability_presentation,''active'',p.active,');
 if position('''availability''' in d)=0 then raise exception 'Product directory signature drift';end if;execute d;
 select pg_get_functiondef('public.read_public_homepage_v1(uuid,text)'::regprocedure) into d;
 d:=replace(d,'''active'', p.active,','''availability_presentation'', p.availability_presentation, ''active'', p.active,');
 if position('''availability_presentation''' in d)=0 then raise exception 'Homepage signature drift';end if;execute d;
end $$;
revoke all on function public.save_product_availability_v2(uuid,uuid,uuid,timestamptz,jsonb,text) from public,anon,authenticated;
grant execute on function public.save_product_availability_v2(uuid,uuid,uuid,timestamptz,jsonb,text) to service_role;
commit;
