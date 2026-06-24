-- Phase 13 Storage audit. Run in the Supabase SQL Editor.

select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'closet-images';

select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;

-- Unexpected object paths should return zero rows.
select name
from storage.objects
where bucket_id = 'closet-images'
  and name !~ '^[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}\.(jpg|png|webp)$'
limit 50;

-- Orphaned database image rows should return zero rows.
select wii.id, wii.wardrobe_item_id, wii.image_path
from public.wardrobe_item_images wii
left join public.wardrobe_items wi on wi.id = wii.wardrobe_item_id
where wi.id is null
limit 50;
