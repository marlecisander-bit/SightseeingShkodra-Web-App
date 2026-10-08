begin;
create table public.meeting_point_versions(id uuid primary key default gen_random_uuid(),operator_id uuid not null references public.operators(id),effective_at timestamptz not null,details jsonb not null,created_at timestamptz not null default clock_timestamp(),unique(operator_id,effective_at));
alter table public.meeting_point_versions enable row level security;
revoke all on public.meeting_point_versions from anon,authenticated;
grant select,insert on public.meeting_point_versions to service_role;
create function public.save_meeting_point_v1(p_operator uuid,p_actor uuid,p_value jsonb,p_effective timestamptz,p_expected uuid) returns uuid language plpgsql set search_path='' as $$
declare latest uuid; result uuid; begin
 if not exists(select 1 from public.staff_profiles where id=p_actor and operator_id=p_operator and is_active and role='owner') then raise exception 'Owner required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended('meeting-point:'||p_operator::text,0));
 select id into latest from public.meeting_point_versions where operator_id=p_operator order by effective_at desc limit 1;
 if latest is distinct from p_expected then raise exception 'Setting changed; reload' using errcode='PT409';end if;
 if p_effective is null or not isfinite(p_effective) or p_effective<=clock_timestamp() or exists(select 1 from public.meeting_point_versions where id=latest and effective_at>=p_effective) then raise exception 'Choose a later future effective time' using errcode='22023';end if;
 if jsonb_typeof(p_value) is distinct from 'object' or (select count(*) from jsonb_object_keys(p_value))<>5 or not p_value?&array['name','directions','url','label','stopId'] or jsonb_typeof(p_value->'name') is distinct from 'string' or length(btrim(p_value->>'name')) not between 1 and 200 or jsonb_typeof(p_value->'directions') is distinct from 'string' or length(p_value->>'directions')>2000 or jsonb_typeof(p_value->'url') is distinct from 'string' or length(p_value->>'url')>2000 or p_value->>'url' !~ '^https://(maps[.]app[.]goo[.]gl/[a-zA-Z0-9]+|((www[.])?google[.]com|maps[.]google[.]com)/maps([/?][^[:space:]]*)?)$' or p_value->>'label' is distinct from 'Open meeting point in Google Maps' or not (p_value->'stopId'='null'::jsonb or (jsonb_typeof(p_value->'stopId')='string' and p_value->>'stopId' ~ '^[a-zA-Z0-9_-]{1,100}$')) then raise exception 'Invalid meeting point' using errcode='22023';end if;
 insert into public.meeting_point_versions(operator_id,effective_at,details) values(p_operator,p_effective,p_value) returning id into result;
 perform public.record_domain_activity(p_operator,p_actor,'meeting-point:'||result::text,'operator',p_operator,'meeting_point.scheduled',jsonb_build_object('versionId',result),'meeting_point.scheduled',jsonb_build_object('versionId',result));
 return result;
end $$;
revoke all on function public.save_meeting_point_v1(uuid,uuid,jsonb,timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.save_meeting_point_v1(uuid,uuid,jsonb,timestamptz,uuid) to service_role;
-- Existing commitments freeze the original approved link. No booking state changes.
alter table public.bookings add column meeting_point_snapshot jsonb not null default '{"name":"Meeting point","directions":"","url":"https://maps.app.goo.gl/rssrPnaBYZVWp316A","label":"Open meeting point in Google Maps","stopId":null}'::jsonb;
create function private.capture_meeting_point_v1() returns trigger language plpgsql set search_path='' as $$ begin
 if tg_op='UPDATE' then
  if new.meeting_point_snapshot is distinct from old.meeting_point_snapshot then raise exception 'Existing meeting point is immutable' using errcode='42501';end if;
 else
  perform pg_advisory_xact_lock(hashtextextended('meeting-point:'||new.operator_id::text,0));
  new.meeting_point_snapshot:=coalesce((select details from public.meeting_point_versions where operator_id=new.operator_id and effective_at<=clock_timestamp() order by effective_at desc limit 1),'{"name":"Meeting point","directions":"","url":"https://maps.app.goo.gl/rssrPnaBYZVWp316A","label":"Open meeting point in Google Maps","stopId":null}'::jsonb);
 end if;
 return new;
end $$;
create trigger booking_meeting_point before insert or update on public.bookings for each row execute function private.capture_meeting_point_v1();
do $$ declare d text; begin
 d:=pg_get_functiondef('public.create_meeting_point_booking_v1(uuid,uuid,text,text,text,text)'::regprocedure);
 if position('''bookingReference'',b.booking_reference' in d)=0 then raise exception 'Confirmation projection changed';end if;
 execute replace(d,'''bookingReference'',b.booking_reference','''meetingPoint'',b.meeting_point_snapshot,''bookingReference'',b.booking_reference');
 d:=pg_get_functiondef('public.customer_booking_v1(text)'::regprocedure);
 if position('''reference'',b.booking_reference' in d)=0 then raise exception 'Customer projection changed';end if;
 execute replace(d,'''reference'',b.booking_reference','''meetingPoint'',b.meeting_point_snapshot,''reference'',b.booking_reference');
 d:=pg_get_functiondef('public.prepare_booking_email_v2(uuid,uuid,uuid,jsonb)'::regprocedure);
 if position('''qrToken'',case' in d)=0 then raise exception 'Email projection changed';end if;
 execute replace(d,'''qrToken'',case','''meetingPoint'',b.meeting_point_snapshot,''qrToken'',case');
end $$;
commit;
