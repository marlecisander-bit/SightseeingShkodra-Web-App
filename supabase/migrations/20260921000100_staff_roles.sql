begin;

alter table public.staff_profiles
  add constraint staff_profiles_role_valid
    check (role in ('owner', 'admin', 'operations', 'content_editor')),
  add column is_active boolean not null default true;

-- Membership provisioning and role changes remain server-controlled.
-- No grants or RLS policies are introduced before Phase 1E.
comment on column public.staff_profiles.role is
  'Canonical staff roles: owner, admin, operations, content_editor. Never sourced from user-editable auth metadata.';
comment on column public.staff_profiles.is_active is
  'Disabled memberships must be rejected even when an Auth session is valid.';

commit;
