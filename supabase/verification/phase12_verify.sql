-- Phase 12 verification only. This file does not modify data.

select
  n.nspname as table_schema,
  c.relname as table_name,
  c.relrowsecurity as row_level_security_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'analytics_events'
  and c.relkind = 'r';

select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'analytics_events'
order by ordinal_position;

select
  column_name,
  data_type,
  column_default,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'analytics_enabled';

select
  indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'analytics_events'
order by indexname;

select
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'analytics_events'
order by grantee, privilege_type;

select
  has_function_privilege(
    'authenticated',
    'public.delete_my_analytics()',
    'execute'
  ) as authenticated_can_delete_own_analytics;
