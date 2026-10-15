begin;
-- Editorial partner identities are separate from operational product suppliers.
create table public.partners (
 id uuid primary key default gen_random_uuid(),
 operator_id uuid not null references public.operators(id),
 name text not null check(length(btrim(name)) between 1 and 160),
 logo_url text not null default '',
 website_url text not null default '',
 description text not null default '' check(length(description)<=300),
 display_order integer not null default 0 check(display_order between 0 and 100000),
 is_active boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint partner_logo_safe check(logo_url='' or logo_url ~ '^/images/[a-zA-Z0-9/_-]+[.](webp|png|jpg|jpeg|avif)$' or logo_url ~ ('^https://[a-z0-9-]+[.]supabase[.]co/storage/v1/object/public/website-media/'||operator_id::text||'/[a-f0-9-]+[.](webp|png|jpg|avif)$')),
 constraint partner_active_logo check(not is_active or logo_url<>''),
 constraint partner_website_safe check(length(website_url)<=2000 and (website_url='' or (website_url ~ '^https://[^/@[:space:]<>\\]+([/:?#]|$)' and website_url !~ '[[:space:]<>\\]' and website_url !~ '^https://[^/?#]*@')))
);
create index partners_public_order on public.partners(operator_id,display_order,id) where is_active;
alter table public.partners enable row level security;
revoke all on public.partners from public,anon,authenticated;
grant select on public.partners to anon,authenticated;
grant select,insert,update,delete on public.partners to service_role;
-- Public readers cannot access inactive or incomplete rows. Staff see only their operator.
create policy partners_public_read on public.partners for select to anon,authenticated using(is_active and logo_url<>'');
create policy partners_staff_read on public.partners for select to authenticated using(private.has_staff_role(operator_id,array['owner','admin','content_editor']));
-- Writes are restricted to the existing authenticated, operator-scoped server action;
-- there are deliberately no browser INSERT/UPDATE/DELETE grants or policies.

do $$ declare definition text; begin
 definition:=pg_get_functiondef('public.validate_website_content_v1(jsonb)'::regprocedure);
 definition:=replace(definition,'FUNCTION public.validate_website_content_v1(', 'FUNCTION private.validate_website_before_partners_v1(');
 execute definition;
end $$;
revoke all on function private.validate_website_before_partners_v1(jsonb) from public,anon,authenticated;
grant execute on function private.validate_website_before_partners_v1(jsonb) to service_role;
create or replace function public.validate_website_content_v1(p_data jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare k text; v text; base jsonb:=p_data;
begin
 for k in select unnest(array['partners.eyebrow','partners.title','partners.description','partners.showOnHomepage','partners.ctaEnabled','partners.ctaLabel','partners.ctaUrl']) loop
  base:=base-k;
  if not p_data?k then continue; end if;
  v:=p_data->>k;
  if jsonb_typeof(p_data->k) is distinct from 'string' then return false; end if;
  if k in ('partners.showOnHomepage','partners.ctaEnabled') then
   if v not in ('true','false') then return false; end if;
  elsif k='partners.ctaUrl' then
   if length(v)>2000 or (v<>'' and v !~ '^/($|#(route|booking|destinations)$|(tour|route|live|explore|book|credits|admin|faq|privacy-policy|terms-and-conditions)(#(faq|timetable|centre|castle|lake|bridge))?$|explore/[a-z0-9]+(-[a-z0-9]+)*$)' and (v !~ '^https://[^/@[:space:]<>\\]+([/:?#]|$)' or v ~ '[[:space:]<>\\]' or v ~ '^https://[^/?#]*@')) then return false; end if;
  elsif length(btrim(v))=0 or length(v)>700 then return false;
  end if;
 end loop;
 if p_data->>'partners.ctaEnabled'='true' and coalesce(length(btrim(p_data->>'partners.ctaUrl')),0)=0 then return false; end if;
 return private.validate_website_before_partners_v1(base);
end $$;
commit;
