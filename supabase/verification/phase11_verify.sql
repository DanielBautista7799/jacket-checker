-- Phase 11 verification: trend-aware style intelligence
-- Run in the Supabase SQL Editor after applying the migration.

select
  column_name,
  data_type,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in ('use_style_trends', 'trend_influence')
order by column_name;

select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('style_trend_rules', 'style_trend_feedback')
order by table_name;

select
  count(*) as total_rules,
  count(*) filter (
    where is_active
      and starts_at <= now()
      and expires_at >= now()
  ) as currently_active_rules,
  count(distinct value) as covered_styles
from public.style_trend_rules
cross join lateral unnest(style_tags) as style(value);

select
  style_value as style,
  count(*) as rule_count
from public.style_trend_rules
cross join lateral unnest(style_tags) as style_name(style_value)
where is_active
  and starts_at <= now()
  and expires_at >= now()
group by style_value
order by style;

select
  policyname,
  tablename,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
  and tablename in ('style_trend_rules', 'style_trend_feedback')
order by tablename, policyname;

select
  indexname,
  tablename
from pg_indexes
where schemaname = 'public'
  and tablename in ('style_trend_rules', 'style_trend_feedback')
order by tablename, indexname;

select
  slug,
  name,
  seasons,
  style_tags,
  starts_at,
  expires_at,
  weight,
  is_active
from public.style_trend_rules
order by style_tags[1], slug;
