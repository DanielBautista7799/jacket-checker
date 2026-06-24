begin;

-- ============================================================
-- PHASE 5, CHECKPOINT 5.1
-- BACKGROUND-REMOVAL STATE AND PROCESSING METADATA
--
-- Forward-only migration.
--
-- This migration:
-- - keeps every original image untouched
-- - keeps processed_image_path as the processed-image location
-- - adds explicit processing state and provider metadata
-- - lets the user choose the original or processed version
-- - safely backfills any pre-existing processed image rows
-- ============================================================


-- ============================================================
-- 1. ADD BACKGROUND-REMOVAL STATE COLUMNS
-- ============================================================

alter table public.wardrobe_item_images
add column if not exists background_removal_status text;

alter table public.wardrobe_item_images
add column if not exists background_removal_provider text;

alter table public.wardrobe_item_images
add column if not exists background_removal_error text;

alter table public.wardrobe_item_images
add column if not exists background_removed_at timestamptz;

alter table public.wardrobe_item_images
add column if not exists use_processed_image boolean;


-- ============================================================
-- 2. BACKFILL CURRENT ROWS
--
-- Rows that already have processed_image_path are treated as
-- ready and selected so later frontend changes preserve the
-- behavior that existed before this explicit selection column.
-- ============================================================

update public.wardrobe_item_images
set background_removal_status = case
  when processed_image_path is not null then 'ready'
  else 'not_requested'
end
where background_removal_status is null
   or background_removal_status not in (
     'not_requested',
     'processing',
     'ready',
     'failed'
   );

update public.wardrobe_item_images
set use_processed_image = (processed_image_path is not null)
where use_processed_image is null;

update public.wardrobe_item_images
set use_processed_image = false
where processed_image_path is null
  and use_processed_image = true;

update public.wardrobe_item_images
set background_removal_provider = 'legacy_import'
where processed_image_path is not null
  and background_removal_provider is null;

update public.wardrobe_item_images
set background_removed_at = coalesce(
  updated_at,
  created_at,
  now()
)
where processed_image_path is not null
  and background_removed_at is null;

update public.wardrobe_item_images
set background_removal_error = null
where background_removal_status in (
  'not_requested',
  'ready'
);


-- ============================================================
-- 3. DEFAULTS AND REQUIRED VALUES
-- ============================================================

alter table public.wardrobe_item_images
alter column background_removal_status
set default 'not_requested';

alter table public.wardrobe_item_images
alter column background_removal_status
set not null;

alter table public.wardrobe_item_images
alter column use_processed_image
set default false;

alter table public.wardrobe_item_images
alter column use_processed_image
set not null;


-- ============================================================
-- 4. DATA-INTEGRITY CONSTRAINTS
-- ============================================================

alter table public.wardrobe_item_images
drop constraint if exists
wardrobe_item_images_background_removal_status_check;

alter table public.wardrobe_item_images
add constraint wardrobe_item_images_background_removal_status_check
check (
  background_removal_status in (
    'not_requested',
    'processing',
    'ready',
    'failed'
  )
);

alter table public.wardrobe_item_images
drop constraint if exists
wardrobe_item_images_processed_selection_check;

alter table public.wardrobe_item_images
add constraint wardrobe_item_images_processed_selection_check
check (
  use_processed_image = false
  or processed_image_path is not null
);


-- ============================================================
-- 5. INDEXES FOR PROCESSING AND DISPLAY LOOKUPS
-- ============================================================

create index if not exists
wardrobe_item_images_user_background_status_idx
on public.wardrobe_item_images (
  user_id,
  background_removal_status
);

create index if not exists
wardrobe_item_images_processing_updated_idx
on public.wardrobe_item_images (
  updated_at
)
where background_removal_status = 'processing';

create index if not exists
wardrobe_item_images_selected_processed_idx
on public.wardrobe_item_images (
  wardrobe_item_id,
  display_order
)
where use_processed_image = true;


-- ============================================================
-- 6. DOCUMENTATION
-- ============================================================

comment on column public.wardrobe_item_images.background_removal_status is
  'Background-removal lifecycle: not_requested, processing, ready, or failed.';

comment on column public.wardrobe_item_images.background_removal_provider is
  'Provider identifier used to create the current processed image.';

comment on column public.wardrobe_item_images.background_removal_error is
  'Most recent safe, user-displayable background-removal error message.';

comment on column public.wardrobe_item_images.background_removed_at is
  'Time when the current processed image was successfully created.';

comment on column public.wardrobe_item_images.use_processed_image is
  'When true, displays use processed_image_path instead of the original image_path.';

commit;
