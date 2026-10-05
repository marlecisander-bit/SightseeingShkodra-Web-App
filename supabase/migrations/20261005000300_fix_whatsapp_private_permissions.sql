begin;

-- The invoker-rights CMS validator calls the preserved private validator.
-- service_role already has EXECUTE on that exact function; schema lookup
-- additionally requires USAGE. Do not grant CREATE or browser-role access.
grant usage on schema private to service_role;

commit;
