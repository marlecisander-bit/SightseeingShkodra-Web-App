-- Phase 4A: bounded, published-only projection. No anonymous table/RPC grants.
begin;
create function public.read_public_homepage_v1(p_operator_id uuid, p_product_slug text)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'version', 1,
    'operator', jsonb_build_object('id', o.id, 'name', o.name, 'timezone', o.timezone),
    'service_date', (statement_timestamp() at time zone o.timezone)::date,
    'product', (select jsonb_build_object('id', p.id, 'title', p.title, 'slug', p.slug,
      'description', p.meta_description,
      'stops', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name,
        'lat', s.lat, 'lng', s.lng, 'sort_order', s.sort_order) order by s.sort_order, s.id)
        from public.stops s where s.operator_id = o.id and s.product_id = p.id), '[]'::jsonb))
      from public.products p where p.operator_id = o.id and p.slug = p_product_slug
        and p.status = 'published' and p.type = 'van_tour'),
    'content', coalesce((select jsonb_agg(jsonb_build_object('slug', c.slug, 'title', c.title,
      'text', c.body->>'text', 'meta_title', c.meta_title, 'meta_description', c.meta_description) order by c.slug)
      from public.content_pages c where c.operator_id = o.id and c.status = 'published'
        and c.body->>'format' = 'plain_text' and c.body->'version' = '1'::jsonb
        and jsonb_typeof(c.body->'text') = 'string'
        and c.slug in ('homepage-hero', 'homepage-intro', 'homepage-final',
          'explore-centre', 'explore-castle', 'explore-lake', 'explore-bridge')), '[]'::jsonb)
  ) from public.operators o where o.id = p_operator_id;
$$;
revoke all on function public.read_public_homepage_v1(uuid,text) from public, anon, authenticated;
grant execute on function public.read_public_homepage_v1(uuid,text) to service_role;
comment on function public.read_public_homepage_v1(uuid,text) is
  'Server-only public projection; operator/slug must come from trusted site configuration, never visitor input.';
commit;
