-- Phase 10: provider metadata, pgvector jacket embeddings, user-isolated similarity search.
-- Forward-only migration. Existing jacket and image data is preserved.

create schema if not exists extensions;
create extension if not exists vector with schema extensions;

alter table public.wardrobe_items
  add column if not exists analysis_version text,
  add column if not exists analysis_status text not null default 'manual',
  add column if not exists analysis_error text,
  add column if not exists analyzed_at timestamptz;

update public.wardrobe_items
set
  analysis_status = case
    when ai_generated is true then 'ready'
    else 'manual'
  end,
  analysis_version = case
    when ai_generated is true then coalesce(analysis_version, 'legacy-pre-phase10')
    else analysis_version
  end,
  analyzed_at = case
    when ai_generated is true then coalesce(analyzed_at, updated_at, created_at, now())
    else analyzed_at
  end
where category = 'jacket';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'wardrobe_items_analysis_status_check'
      and conrelid = 'public.wardrobe_items'::regclass
  ) then
    alter table public.wardrobe_items
      add constraint wardrobe_items_analysis_status_check
      check (analysis_status in ('manual', 'pending', 'processing', 'ready', 'failed'));
  end if;
end
$$;

create table if not exists public.jacket_embeddings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wardrobe_item_id uuid not null references public.wardrobe_items(id) on delete cascade,
  provider text not null,
  model text not null,
  dimensions integer not null default 768 check (dimensions = 768),
  embedding extensions.vector(768),
  descriptor text not null default '',
  source_hash text not null default '',
  primary_image_path text,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'ready', 'failed', 'stale')),
  error_message text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (wardrobe_item_id, provider, model)
);

create index if not exists jacket_embeddings_user_status_idx
  on public.jacket_embeddings (user_id, status, updated_at desc);

create index if not exists jacket_embeddings_item_idx
  on public.jacket_embeddings (wardrobe_item_id);

create index if not exists jacket_embeddings_hnsw_cosine_idx
  on public.jacket_embeddings
  using hnsw (embedding extensions.vector_cosine_ops)
  where embedding is not null and status = 'ready';

alter table public.jacket_embeddings enable row level security;

drop policy if exists "Users can read their jacket embeddings" on public.jacket_embeddings;

create policy "Users can read their jacket embeddings"
  on public.jacket_embeddings
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their jacket embeddings" on public.jacket_embeddings;

create policy "Users can insert their jacket embeddings"
  on public.jacket_embeddings
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.wardrobe_items wi
      where wi.id = wardrobe_item_id
        and wi.user_id = auth.uid()
        and wi.category = 'jacket'
    )
  );

drop policy if exists "Users can update their jacket embeddings" on public.jacket_embeddings;

create policy "Users can update their jacket embeddings"
  on public.jacket_embeddings
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.wardrobe_items wi
      where wi.id = wardrobe_item_id
        and wi.user_id = auth.uid()
        and wi.category = 'jacket'
    )
  );

drop policy if exists "Users can delete their jacket embeddings" on public.jacket_embeddings;

create policy "Users can delete their jacket embeddings"
  on public.jacket_embeddings
  for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.phase10_touch_jacket_embedding_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists phase10_touch_jacket_embedding_updated_at
  on public.jacket_embeddings;

create trigger phase10_touch_jacket_embedding_updated_at
before update on public.jacket_embeddings
for each row
execute function public.phase10_touch_jacket_embedding_updated_at();

create or replace function public.phase10_mark_jacket_embedding_stale()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if old.category = 'jacket' and (
    old.name is distinct from new.name
    or old.subtype is distinct from new.subtype
    or old.primary_color is distinct from new.primary_color
    or old.secondary_color is distinct from new.secondary_color
    or old.materials is distinct from new.materials
    or old.warmth_rating is distinct from new.warmth_rating
    or old.rain_rating is distinct from new.rain_rating
    or old.wind_rating is distinct from new.wind_rating
    or old.formality_rating is distinct from new.formality_rating
    or old.fit is distinct from new.fit
    or old.style_tags is distinct from new.style_tags
    or old.weather_use is distinct from new.weather_use
    or old.description is distinct from new.description
    or old.image_path is distinct from new.image_path
  ) then
    update public.jacket_embeddings
    set status = 'stale', error_message = null
    where wardrobe_item_id = new.id
      and status <> 'processing';
  end if;

  return new;
end;
$$;

drop trigger if exists phase10_wardrobe_item_embedding_stale
  on public.wardrobe_items;

create trigger phase10_wardrobe_item_embedding_stale
after update on public.wardrobe_items
for each row
execute function public.phase10_mark_jacket_embedding_stale();

create or replace function public.phase10_mark_embedding_stale_from_image()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  target_item_id uuid;
  should_mark boolean := false;
begin
  if tg_op = 'INSERT' then
    target_item_id := new.wardrobe_item_id;
    should_mark := new.is_primary;
  elsif tg_op = 'DELETE' then
    target_item_id := old.wardrobe_item_id;
    should_mark := old.is_primary;
  else
    target_item_id := new.wardrobe_item_id;
    should_mark :=
      old.is_primary
      or new.is_primary
      or old.image_path is distinct from new.image_path
      or old.processed_image_path is distinct from new.processed_image_path;
  end if;

  if should_mark then
    update public.jacket_embeddings
    set status = 'stale', error_message = null
    where wardrobe_item_id = target_item_id
      and status <> 'processing';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists phase10_wardrobe_image_embedding_stale
  on public.wardrobe_item_images;

create trigger phase10_wardrobe_image_embedding_stale
after insert or update or delete on public.wardrobe_item_images
for each row
execute function public.phase10_mark_embedding_stale_from_image();

create or replace function public.match_user_jackets(
  query_embedding extensions.vector(768),
  match_provider text,
  match_model text,
  exclude_wardrobe_item_id uuid default null,
  match_threshold double precision default 0.72,
  match_count integer default 6
)
returns table (
  wardrobe_item_id uuid,
  similarity double precision,
  provider text,
  model text
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    je.wardrobe_item_id,
    1 - (je.embedding <=> query_embedding) as similarity,
    je.provider,
    je.model
  from public.jacket_embeddings je
  join public.wardrobe_items wi
    on wi.id = je.wardrobe_item_id
  where je.user_id = auth.uid()
    and wi.user_id = auth.uid()
    and wi.category = 'jacket'
    and wi.archived = false
    and je.status = 'ready'
    and je.embedding is not null
    and je.provider = match_provider
    and je.model = match_model
    and (
      exclude_wardrobe_item_id is null
      or je.wardrobe_item_id <> exclude_wardrobe_item_id
    )
    and 1 - (je.embedding <=> query_embedding) >= match_threshold
  order by je.embedding <=> query_embedding
  limit greatest(1, least(match_count, 20));
$$;

revoke all on function public.match_user_jackets(
  extensions.vector,
  text,
  text,
  uuid,
  double precision,
  integer
) from public;

grant execute on function public.match_user_jackets(
  extensions.vector,
  text,
  text,
  uuid,
  double precision,
  integer
) to authenticated;

create or replace function public.get_user_jacket_similarity_pairs(
  pair_threshold double precision default 0.80,
  pair_limit integer default 250
)
returns table (
  source_wardrobe_item_id uuid,
  target_wardrobe_item_id uuid,
  similarity double precision,
  provider text,
  model text
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    source_embedding.wardrobe_item_id,
    target_embedding.wardrobe_item_id,
    1 - (source_embedding.embedding <=> target_embedding.embedding) as similarity,
    source_embedding.provider,
    source_embedding.model
  from public.jacket_embeddings source_embedding
  join public.jacket_embeddings target_embedding
    on target_embedding.user_id = source_embedding.user_id
    and target_embedding.provider = source_embedding.provider
    and target_embedding.model = source_embedding.model
    and target_embedding.wardrobe_item_id <> source_embedding.wardrobe_item_id
  join public.wardrobe_items source_item
    on source_item.id = source_embedding.wardrobe_item_id
  join public.wardrobe_items target_item
    on target_item.id = target_embedding.wardrobe_item_id
  where source_embedding.user_id = auth.uid()
    and source_embedding.status = 'ready'
    and target_embedding.status = 'ready'
    and source_embedding.embedding is not null
    and target_embedding.embedding is not null
    and source_item.user_id = auth.uid()
    and target_item.user_id = auth.uid()
    and source_item.category = 'jacket'
    and target_item.category = 'jacket'
    and source_item.archived = false
    and target_item.archived = false
    and 1 - (source_embedding.embedding <=> target_embedding.embedding)
      >= greatest(0.5, least(0.99, pair_threshold))
  order by source_embedding.wardrobe_item_id,
    source_embedding.embedding <=> target_embedding.embedding
  limit greatest(1, least(pair_limit, 1000));
$$;

revoke all on function public.get_user_jacket_similarity_pairs(
  double precision,
  integer
) from public;

grant execute on function public.get_user_jacket_similarity_pairs(
  double precision,
  integer
) to authenticated;
