-- Run only in trusted Supabase SQL Editor after replacing both placeholders.
-- owner includes staff/settings control. Use admin for restricted administration.
begin;
insert into public.staff_profiles(operator_id, auth_user_id, role, is_active)
values ('REPLACE_WITH_ACTUAL_OPERATOR_UUID'::uuid,
        'REPLACE_WITH_ACTUAL_AUTH_USER_UUID'::uuid, 'owner', true)
on conflict (operator_id, auth_user_id)
do update set role = excluded.role, is_active = true;
commit;
-- Both IDs must reference existing records. Never put passwords in this file.
