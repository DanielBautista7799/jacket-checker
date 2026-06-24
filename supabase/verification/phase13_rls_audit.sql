-- Phase 13 RLS audit. Run in the Supabase SQL Editor.
-- Expected: every user-owned table reports RLS enabled and has user-scoped policies.

select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  count(p.policyname) as policy_count,
  string_agg(distinct p.cmd, ', ' order by p.cmd) as policy_commands
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p
  on p.schemaname = n.nspname
 and p.tablename = c.relname
where n.nspname = 'public'
  and c.relname in (
    'profiles',
    'wardrobe_items',
    'wardrobe_item_images',
    'recommendation_history',
    'style_feedback',
    'jacket_embeddings',
    'style_trend_rules',
    'style_trend_feedback',
    'analytics_events',
    'edge_rate_limits'
  )
group by n.nspname, c.relname, c.relrowsecurity
order by c.relname;

-- Raw analytics and rate-limit rows must not be granted directly to browser roles.
select
  table_name,
  privilege_type,
  grantee
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('analytics_events', 'edge_rate_limits')
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- Review all active policies for ownership predicates.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles', 'wardrobe_items', 'wardrobe_item_images',
    'recommendation_history', 'style_feedback', 'jacket_embeddings',
    'style_trend_rules', 'style_trend_feedback', 'analytics_events',
    'edge_rate_limits'
  )
order by tablename, policyname;
