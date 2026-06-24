-- ============================================================
-- PHASE 4, CHECKPOINT 4.2
-- READ-ONLY DATA-LAYER VERIFICATION
--
-- Run this in the Supabase SQL Editor after installing and
-- exercising the Checkpoint 4.2 frontend data layer.
-- ============================================================

-- 1. The Phase 4.1 table must still exist.
select
  to_regclass('public.wardrobe_item_images') as wardrobe_item_images_table;

-- 2. High-level counts.
select
  (
    select count(*)
    from public.wardrobe_items
  ) as wardrobe_item_count,
  (
    select count(*)
    from public.wardrobe_items
    where image_path is not null
      and length(btrim(image_path)) > 0
  ) as items_with_legacy_primary_path,
  (
    select count(*)
    from public.wardrobe_item_images
  ) as wardrobe_image_row_count,
  (
    select count(*)
    from public.wardrobe_item_images
    where is_primary = true
  ) as primary_image_row_count;

-- 3. Every item with image rows must have exactly one primary.
-- Expected: zero rows.
select
  wardrobe_item_id,
  count(*) as image_count,
  count(*) filter (where is_primary) as primary_count
from public.wardrobe_item_images
group by wardrobe_item_id
having count(*) filter (where is_primary) <> 1;

-- 4. The compatibility image_path must match the primary row.
-- Expected: zero rows.
select
  wardrobe_item.id,
  wardrobe_item.name,
  wardrobe_item.image_path as compatibility_path,
  primary_image.image_path as primary_row_path
from public.wardrobe_items as wardrobe_item
join public.wardrobe_item_images as primary_image
  on primary_image.wardrobe_item_id = wardrobe_item.id
 and primary_image.user_id = wardrobe_item.user_id
 and primary_image.is_primary = true
where wardrobe_item.image_path is distinct from primary_image.image_path;

-- 5. No legacy image path should be missing from the image table.
-- Expected: zero rows.
select
  wardrobe_item.id,
  wardrobe_item.name,
  wardrobe_item.image_path
from public.wardrobe_items as wardrobe_item
where wardrobe_item.image_path is not null
  and length(btrim(wardrobe_item.image_path)) > 0
  and not exists (
    select 1
    from public.wardrobe_item_images as wardrobe_image
    where wardrobe_image.wardrobe_item_id = wardrobe_item.id
      and wardrobe_image.user_id = wardrobe_item.user_id
      and wardrobe_image.image_path = wardrobe_item.image_path
  );

-- 6. Image-row ownership must match wardrobe-item ownership.
-- Expected: zero rows.
select
  wardrobe_image.id,
  wardrobe_image.user_id as image_user_id,
  wardrobe_item.user_id as item_user_id
from public.wardrobe_item_images as wardrobe_image
join public.wardrobe_items as wardrobe_item
  on wardrobe_item.id = wardrobe_image.wardrobe_item_id
where wardrobe_image.user_id <> wardrobe_item.user_id;

-- 7. Display orders should be unique within an item after the
-- data layer has reordered or inserted images.
-- Expected: zero rows.
select
  wardrobe_item_id,
  display_order,
  count(*) as duplicate_count
from public.wardrobe_item_images
group by wardrobe_item_id, display_order
having count(*) > 1;

-- 8. Every original image row should still point at a file in
-- the private closet-images bucket.
-- Expected: zero rows.
select
  wardrobe_image.id,
  wardrobe_image.wardrobe_item_id,
  wardrobe_image.image_path
from public.wardrobe_item_images as wardrobe_image
left join storage.objects as storage_object
  on storage_object.bucket_id = 'closet-images'
 and storage_object.name = wardrobe_image.image_path
where storage_object.id is null;

-- 9. Every processed path, when present, should point at a file.
-- Expected: zero rows.
select
  wardrobe_image.id,
  wardrobe_image.wardrobe_item_id,
  wardrobe_image.processed_image_path
from public.wardrobe_item_images as wardrobe_image
left join storage.objects as storage_object
  on storage_object.bucket_id = 'closet-images'
 and storage_object.name = wardrobe_image.processed_image_path
where wardrobe_image.processed_image_path is not null
  and storage_object.id is null;

-- 10. Inspect the newest image rows and ordering.
select
  wardrobe_item.name,
  wardrobe_image.id,
  wardrobe_image.image_path,
  wardrobe_image.processed_image_path,
  wardrobe_image.display_order,
  wardrobe_image.is_primary,
  wardrobe_image.created_at,
  wardrobe_image.updated_at
from public.wardrobe_item_images as wardrobe_image
join public.wardrobe_items as wardrobe_item
  on wardrobe_item.id = wardrobe_image.wardrobe_item_id
 and wardrobe_item.user_id = wardrobe_image.user_id
order by
  wardrobe_item.updated_at desc,
  wardrobe_image.display_order asc,
  wardrobe_image.created_at asc
limit 100;
