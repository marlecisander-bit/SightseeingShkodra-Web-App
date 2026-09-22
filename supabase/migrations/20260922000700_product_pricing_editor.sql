begin;
create function public.save_product_pricing_v1(p_operator_id uuid,p_actor_id uuid,p_product_id uuid,p_price_eur text,p_expected_updated_at timestamptz)
returns uuid language plpgsql set search_path='' as $$
declare p public.products; cents numeric; rules jsonb;
begin
  if not exists(select 1 from public.staff_profiles where operator_id=p_operator_id and id=p_actor_id and is_active and role in ('owner','admin')) then raise exception 'Catalog permission required' using errcode='42501'; end if;
  if p_price_eur is null or p_price_eur !~ '^[0-9]{1,14}([.][0-9]{1,2})?$' then raise exception 'Enter a nonnegative EUR price with at most two decimals' using errcode='22023'; end if;
  cents:=p_price_eur::numeric*100;
  if cents>9007199254740991 then raise exception 'Price too large' using errcode='22023'; end if;
  select * into p from public.products where operator_id=p_operator_id and id=p_product_id for update;
  if not found then raise exception 'Product unavailable' using errcode='P0002'; end if;
  if p.type<>'van_tour' then raise exception 'Only van tour pricing is supported' using errcode='22023'; end if;
  if p_expected_updated_at is null or p.updated_at<>p_expected_updated_at then raise exception 'Product changed; reload before saving' using errcode='PT409'; end if;
  rules:=jsonb_build_object('version',1,'model','per_guest','currency','EUR','unit_price',cents::bigint);
  perform public.unit_price_v1(rules);
  update public.products set pricing_rules=rules,capacity_rules='{"version":1,"model":"departure_seats"}'::jsonb where id=p.id;
  perform public.record_domain_activity(p_operator_id,p_actor_id,'product-pricing:'||gen_random_uuid()::text,'product',p.id,'product.pricing_changed',jsonb_build_object('productId',p.id),'product.pricing_changed',jsonb_build_object('previousPricing',p.pricing_rules,'pricing',rules));
  return p.id;
end;
$$;
revoke all on function public.save_product_pricing_v1(uuid,uuid,uuid,text,timestamptz) from public,anon,authenticated;
grant execute on function public.save_product_pricing_v1(uuid,uuid,uuid,text,timestamptz) to service_role;
commit;
