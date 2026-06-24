-- Phase 14 production verification.
-- Read-only: this file does not create, alter, update, or delete data.
-- Expected result: every row reports PASS.

with required_tables(table_name) as (
  values
    ('profiles'),
    ('wardrobe_items'),
    ('wardrobe_item_images'),
    ('recommendation_history'),
    ('style_feedback'),
    ('jacket_embeddings'),
    ('style_trend_rules'),
    ('style_trend_feedback'),
    ('analytics_events'),
    ('edge_rate_limits')
),
table_checks as (
  select
    'table:' || table_name as check_name,
    case when to_regclass('public.' || table_name) is not null then 'PASS' else 'FAIL' end as status,
    coalesce(to_regclass('public.' || table_name)::text, 'missing') as details
  from required_tables
),
rls_checks as (
  select
    'rls:' || required_tables.table_name as check_name,
    case when pg_class.relrowsecurity is true then 'PASS' else 'FAIL' end as status,
    case when pg_class.relrowsecurity is true then 'enabled' else 'missing or disabled' end as details
  from required_tables
  left join pg_class on pg_class.relname = required_tables.table_name
  left join pg_namespace on pg_namespace.oid = pg_class.relnamespace and pg_namespace.nspname = 'public'
),
required_functions(function_name) as (
  values
    ('consume_edge_rate_limit'),
    ('prune_edge_rate_limits'),
    ('match_user_jackets'),
    ('get_user_jacket_similarity_pairs'),
    ('delete_my_analytics')
),
function_checks as (
  select
    'function:' || function_name as check_name,
    case when exists (
      select 1
      from pg_proc
      join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
      where pg_namespace.nspname = 'public'
        and pg_proc.proname = required_functions.function_name
    ) then 'PASS' else 'FAIL' end as status,
    function_name as details
  from required_functions
),
constraint_checks as (
  select * from (values
    (
      'constraint:wardrobe_items_jacket_category_check',
      case when exists (select 1 from pg_constraint where conname = 'wardrobe_items_jacket_category_check') then 'PASS' else 'FAIL' end,
      'new wardrobe records remain jacket-only while legacy rows are preserved'
    ),
    (
      'constraint:wardrobe_item_images_display_order_nonnegative',
      case when exists (select 1 from pg_constraint where conname = 'wardrobe_item_images_display_order_nonnegative' and convalidated) then 'PASS' else 'FAIL' end,
      'image ordering is nonnegative'
    ),
    (
      'constraint:profiles_trend_influence_phase13_check',
      case when exists (select 1 from pg_constraint where conname = 'profiles_trend_influence_phase13_check' and convalidated) then 'PASS' else 'FAIL' end,
      'trend influence values are constrained'
    ),
    (
      'index:wardrobe_item_images_one_primary_idx',
      case when exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'wardrobe_item_images_one_primary_idx') then 'PASS' else 'FAIL' end,
      'one primary image per jacket'
    )
  ) as checks(check_name, status, details)
),
storage_checks as (
  select
    'storage:closet-images-private' as check_name,
    case when exists (
      select 1 from storage.buckets
      where id = 'closet-images'
        and public = false
        and file_size_limit = 5242880
        and allowed_mime_types @> array['image/jpeg', 'image/png', 'image/webp']::text[]
    ) then 'PASS' else 'FAIL' end as status,
    'private, 5 MiB, JPEG/PNG/WebP' as details
),
server_only_checks as (
  select
    'grants:analytics-and-rate-limits-server-only' as check_name,
    case when not exists (
      select 1
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name in ('analytics_events', 'edge_rate_limits')
        and grantee in ('anon', 'authenticated')
    ) then 'PASS' else 'FAIL' end as status,
    'browser roles must have no direct table grants' as details
),
consistency_checks as (
  select * from (values
    (
      'data:no-duplicate-primary-images',
      case when not exists (
        select 1 from public.wardrobe_item_images where is_primary = true group by wardrobe_item_id having count(*) > 1
      ) then 'PASS' else 'FAIL' end,
      'zero jackets with multiple primary images'
    ),
    (
      'data:no-negative-image-order',
      case when not exists (
        select 1 from public.wardrobe_item_images where display_order < 0
      ) then 'PASS' else 'FAIL' end,
      'zero negative display_order values'
    ),
    (
      'data:no-invalid-trend-influence',
      case when not exists (
        select 1 from public.profiles where trend_influence not in ('off', 'subtle', 'balanced')
      ) then 'PASS' else 'FAIL' end,
      'all profile trend values are valid'
    )
  ) as checks(check_name, status, details)
)
select * from table_checks
union all select * from rls_checks
union all select * from function_checks
union all select * from constraint_checks
union all select * from storage_checks
union all select * from server_only_checks
union all select * from consistency_checks
order by check_name;
