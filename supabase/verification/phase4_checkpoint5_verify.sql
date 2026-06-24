-- Phase 4, Checkpoint 4.5
-- Read-only final multi-image verification.
-- Every problem query should return zero rows unless its heading says otherwise.

-- 1. Summary counts. Informational only.
select
  (select count(*) from public.wardrobe_items) as wardrobe_items,
  (select count(*) from public.wardrobe_item_images) as wardrobe_image_rows,
  (
    select count(*)
    from public.wardrobe_items
    where image_path is not null
      and length(btrim(image_path)) > 0
  ) as compatibility_paths,
  (
    select count(*)
    from public.wardrobe_item_images
    where is_primary = true
  ) as primary_image_rows;

-- 2. Images whose owner does not match the parent wardrobe item.
-- Expected: zero rows.
select
  wardrobe_image.id,
  wardrobe_image.user_id as image_user_id,
  wardrobe_item.user_id as item_user_id,
  wardrobe_image.wardrobe_item_id
from public.wardrobe_item_images as wardrobe_image
join public.wardrobe_items as wardrobe_item
  on wardrobe_item.id = wardrobe_image.wardrobe_item_id
where wardrobe_image.user_id <> wardrobe_item.user_id;

-- 3. Items exceeding the application limit of eight images.
-- Expected: zero rows.
select
  wardrobe_item_id,
  count(*) as image_count
from public.wardrobe_item_images
group by wardrobe_item_id
having count(*) > 8;

-- 4. Items with images but not exactly one primary image.
-- Expected: zero rows.
select
  wardrobe_item_id,
  count(*) as image_count,
  count(*) filter (where is_primary = true) as primary_count
from public.wardrobe_item_images
group by wardrobe_item_id
having count(*) filter (where is_primary = true) <> 1;

-- 5. Duplicate display positions within one wardrobe item.
-- Expected: zero rows.
select
  wardrobe_item_id,
  display_order,
  count(*) as duplicate_count
from public.wardrobe_item_images
group by wardrobe_item_id, display_order
having count(*) > 1;

-- 6. Negative display positions.
-- Expected: zero rows.
select
  id,
  wardrobe_item_id,
  display_order
from public.wardrobe_item_images
where display_order < 0;

-- 7. Compatibility image_path that does not match the current primary row.
-- Expected: zero rows.
select
  wardrobe_item.id,
  wardrobe_item.name,
  wardrobe_item.image_path as compatibility_path,
  primary_image.image_path as primary_path
from public.wardrobe_items as wardrobe_item
left join public.wardrobe_item_images as primary_image
  on primary_image.wardrobe_item_id = wardrobe_item.id
 and primary_image.user_id = wardrobe_item.user_id
 and primary_image.is_primary = true
where wardrobe_item.image_path is distinct from primary_image.image_path;

-- 8. Original image rows whose Storage object is missing.
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

-- 9. Processed image rows whose Storage object is missing.
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

-- 10. Duplicate image paths assigned to more than one row.
-- Expected: zero rows.
select
  image_path,
  count(*) as duplicate_count
from public.wardrobe_item_images
group by image_path
having count(*) > 1;

-- 11. Informational review of unreferenced files in closet-images.
-- This can include old files from development. Review before deleting anything.
select
  storage_object.name,
  storage_object.created_at
from storage.objects as storage_object
where storage_object.bucket_id = 'closet-images'
  and not exists (
    select 1
    from public.wardrobe_item_images as wardrobe_image
    where wardrobe_image.image_path = storage_object.name
       or wardrobe_image.processed_image_path = storage_object.name
  )
  and not exists (
    select 1
    from public.wardrobe_items as wardrobe_item
    where wardrobe_item.image_path = storage_object.name
  )
order by storage_object.created_at desc;
