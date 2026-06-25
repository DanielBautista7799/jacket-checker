-- Developer access registry verification.
-- Read-only: this file does not create, alter, update, or delete data.

select
  'table:developer_access_registry' as check_name,
  case when to_regclass('public.developer_access_registry') is not null then 'PASS' else 'FAIL' end as status,
  coalesce(to_regclass('public.developer_access_registry')::text, 'missing') as details
union all
select
  'table:developer_access_audit',
  case when to_regclass('public.developer_access_audit') is not null then 'PASS' else 'FAIL' end,
  coalesce(to_regclass('public.developer_access_audit')::text, 'missing')
union all
select
  'rls:developer_access_registry',
  case when exists (
    select 1
    from pg_class
    join pg_namespace on pg_namespace.oid = pg_class.relnamespace
    where pg_namespace.nspname = 'public'
      and pg_class.relname = 'developer_access_registry'
      and pg_class.relrowsecurity = true
  ) then 'PASS' else 'FAIL' end,
  'RLS must be enabled'
union all
select
  'rls:developer_access_audit',
  case when exists (
    select 1
    from pg_class
    join pg_namespace on pg_namespace.oid = pg_class.relnamespace
    where pg_namespace.nspname = 'public'
      and pg_class.relname = 'developer_access_audit'
      and pg_class.relrowsecurity = true
  ) then 'PASS' else 'FAIL' end,
  'RLS must be enabled'
union all
select
  'grants:browser-roles-blocked',
  case when not exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name in ('developer_access_registry', 'developer_access_audit')
      and grantee in ('anon', 'authenticated')
  ) then 'PASS' else 'FAIL' end,
  'anon and authenticated must have no direct grants'
union all
select
  'data:active-owner-exists',
  case when exists (
    select 1
    from public.developer_access_registry
    where active = true and role = 'owner'
  ) then 'PASS' else 'FAIL' end,
  'Initialize the owner registry from /dev/access before production launch'
union all
select
  'data:no-active-owner-duplicates',
  case when (
    select count(*)
    from public.developer_access_registry
    where active = true and role = 'owner'
  ) = 1 then 'PASS' else 'FAIL' end,
  'Exactly one active owner is expected for the current management model'
order by check_name;

-- Readable roster for security review.
select
  email_snapshot as approved_email,
  user_id,
  role,
  active,
  granted_at,
  granted_by,
  revoked_at,
  revoked_by,
  notes,
  updated_at
from public.developer_access_registry
order by active desc, role desc, granted_at asc;

-- Latest immutable access changes.
select
  action,
  actor_email_snapshot,
  target_email_snapshot,
  previous_role,
  new_role,
  notes,
  request_id,
  created_at
from public.developer_access_audit
order by created_at desc
limit 100;
