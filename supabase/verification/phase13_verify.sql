-- Phase 13 verification summary.

select to_regclass('public.edge_rate_limits') as edge_rate_limits_table;

select proname
from pg_proc
join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
where pg_namespace.nspname = 'public'
  and proname in ('consume_edge_rate_limit', 'prune_edge_rate_limits', 'delete_my_analytics')
order by proname;

select conname, convalidated
from pg_constraint
where conrelid in (
  'public.wardrobe_items'::regclass,
  'public.wardrobe_item_images'::regclass,
  'public.profiles'::regclass
)
  and conname in (
    'wardrobe_items_jacket_category_check',
    'wardrobe_item_images_display_order_nonnegative',
    'profiles_trend_influence_phase13_check'
  )
order by conname;

select indexname
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'wardrobe_item_images_one_primary_idx',
    'edge_rate_limits_updated_at_idx'
  )
order by indexname;

-- Legacy non-jacket rows are informational only. The Phase 13 NOT VALID
-- constraint blocks new non-jacket writes without deleting earlier user data.
select id, category
from public.wardrobe_items
where category <> 'jacket' or category is null
order by created_at asc;

-- The remaining consistency checks should return zero rows.
select wardrobe_item_id, count(*) from public.wardrobe_item_images where is_primary = true group by wardrobe_item_id having count(*) > 1;
select id, display_order from public.wardrobe_item_images where display_order < 0;
select id, trend_influence from public.profiles where trend_influence not in ('off', 'subtle', 'balanced');
