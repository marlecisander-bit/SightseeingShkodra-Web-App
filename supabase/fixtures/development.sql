-- Synthetic local/test data only. Never include this file in migration or production seed paths.
begin;
do $$ begin
  if current_setting('app.fixture_mode', true) is distinct from 'development' then
    raise exception 'Development fixture mode must be explicitly enabled';
  end if;
end $$;

insert into public.operators(id,name,timezone,created_at,updated_at) values
('10000000-0000-4000-8000-000000000001','Demo Sightseeing Operator','Europe/Tirane','2030-01-01','2030-01-01'),
('10000000-0000-4000-8000-000000000002','Demo Isolation Operator','Europe/Tirane','2030-01-01','2030-01-01')
on conflict (id) do nothing;

insert into public.suppliers(id,operator_id,name,type,created_at,updated_at) values
('10000000-0000-4000-8000-000000000010','10000000-0000-4000-8000-000000000001','Demo Owned Inventory','owned','2030-01-01','2030-01-01')
on conflict (id) do nothing;

insert into public.products(id,operator_id,supplier_id,type,title,slug,status,pricing_rules,created_at,updated_at) values
('10000000-0000-4000-8000-000000000020','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000010','van_tour','Demo Shkodra Van Tour','demo-van-tour','draft','{"currency":"EUR","unit_amount":1500}','2030-01-01','2030-01-01'),
('10000000-0000-4000-8000-000000000021','10000000-0000-4000-8000-000000000002',null,'van_tour','Other Operator Demo Tour','demo-van-tour','draft','{"currency":"EUR","unit_amount":2000}','2030-01-01','2030-01-01')
on conflict (id) do nothing;

insert into public.vehicles(id,operator_id,name,created_at,updated_at) values
('10000000-0000-4000-8000-000000000030','10000000-0000-4000-8000-000000000001','Demo Van 01','2030-01-01','2030-01-01')
on conflict (id) do nothing;

insert into public.stops(id,operator_id,product_id,name,lat,lng,sort_order,created_at,updated_at) values
('10000000-0000-4000-8000-000000000040','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000020','Demo Pickup',42.06,19.51,0,'2030-01-01','2030-01-01'),
('10000000-0000-4000-8000-000000000041','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000020','Demo Stop A',42.05,19.50,1,'2030-01-01','2030-01-01'),
('10000000-0000-4000-8000-000000000042','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000020','Demo Stop B',42.07,19.49,2,'2030-01-01','2030-01-01')
on conflict (id) do nothing;

insert into public.departures(id,operator_id,product_id,vehicle_id,service_date,start_time,capacity,status,created_at,updated_at) values
('10000000-0000-4000-8000-000000000050','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000020','10000000-0000-4000-8000-000000000030','2030-06-01','09:00',0,'draft','2030-01-01','2030-01-01'),
('10000000-0000-4000-8000-000000000051','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000020','10000000-0000-4000-8000-000000000030','2030-06-01','12:00',1,'draft','2030-01-01','2030-01-01'),
('10000000-0000-4000-8000-000000000052','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000020','10000000-0000-4000-8000-000000000030','2030-06-02','09:00',8,'draft','2030-01-01','2030-01-01')
on conflict (id) do nothing;
commit;
