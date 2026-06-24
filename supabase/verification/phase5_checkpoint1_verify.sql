-- ============================================================
-- PHASE 5, CHECKPOINT 5.1 — READ-ONLY VERIFICATION
--
-- Run this after the migration.
-- Every problem query near the bottom should return zero rows.
-- ============================================================


-- 1. Confirm the table exists.
select to_regclass('public.wardrobe_item_images') as wardrobe_item_images_table;


-- 2. Confirm all five new columns, their types, defaults, and nullability.
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'wardrobe_item_images'
  and column_name in (
    'background_removal_status',
    'background_removal_provider',
    'background_removal_error',
    'background_removed_at',
    'use_processed_image'
  )
order by column_name;


-- 3. Confirm the two integrity constraints exist.
select
  constraint_name,
  check_clause
from information_schema.check_constraints
where constraint_schema = 'public'
  and constraint_name in (
    'wardrobe_item_images_background_removal_status_check',
    'wardrobe_item_images_processed_selection_check'
  )
order by constraint_name;


-- 4. Confirm the supporting indexes exist.
select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'wardrobe_item_images'
  and indexname in (
    'wardrobe_item_images_user_background_status_idx',
    'wardrobe_item_images_processing_updated_idx',
    'wardrobe_item_images_selected_processed_idx'
  )
order by indexname;


-- 5. Current status summary.
select
  background_removal_status,
  count(*) as image_count
from public.wardrobe_item_images
group by background_removal_status
order by background_removal_status;


-- 6. Current original/processed selection summary.
select
  count(*) as total_image_rows,
  count(*) filter (
    where processed_image_path is not null
  ) as rows_with_processed_image,
  count(*) filter (
    where use_processed_image = true
  ) as rows_using_processed_image,
  count(*) filter (
    where background_removal_status = 'ready'
  ) as ready_rows
from public.wardrobe_item_images;


-- ============================================================
-- PROBLEM QUERIES — EACH SHOULD RETURN ZERO ROWS
-- ============================================================


-- 7. Invalid or missing statuses.
select *
from public.wardrobe_item_images
where background_removal_status is null
   or background_removal_status not in (
     'not_requested',
     'processing',
     'ready',
     'failed'
   );


-- 8. A processed image is selected without a processed file.
select *
from public.wardrobe_item_images
where use_processed_image = true
  and processed_image_path is null;


-- 9. A ready row has no processed file.
select *
from public.wardrobe_item_images
where background_removal_status = 'ready'
  and processed_image_path is null;


-- 10. A processed file is still marked not requested.
select *
from public.wardrobe_item_images
where processed_image_path is not null
  and background_removal_status = 'not_requested';


-- 11. A completed processed image is missing provider metadata.
select *
from public.wardrobe_item_images
where processed_image_path is not null
  and background_removal_provider is null;


-- 12. A completed processed image is missing a completion timestamp.
select *
from public.wardrobe_item_images
where processed_image_path is not null
  and background_removed_at is null;
