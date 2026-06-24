-- Phase 13: production security and reliability hardening.
-- Forward-only migration. Existing user data is preserved.

create table if not exists public.edge_rate_limits (
  id bigint generated always as identity primary key,
  scope_hash text not null,
  function_name text not null,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  unique (scope_hash, function_name)
);

create index if not exists edge_rate_limits_updated_at_idx
  on public.edge_rate_limits (updated_at);

alter table public.edge_rate_limits enable row level security;
revoke all on table public.edge_rate_limits from anon, authenticated;
grant all on table public.edge_rate_limits to service_role;

create or replace function public.consume_edge_rate_limit(
  p_scope_hash text,
  p_function_name text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row public.edge_rate_limits%rowtype;
  now_value timestamptz := clock_timestamp();
  reset_at timestamptz;
begin
  if p_scope_hash is null or char_length(p_scope_hash) < 32
     or p_function_name is null or char_length(p_function_name) > 80
     or p_limit < 1 or p_limit > 10000
     or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid rate limit input';
  end if;

  insert into public.edge_rate_limits (
    scope_hash,
    function_name,
    window_started_at,
    request_count,
    updated_at
  ) values (
    p_scope_hash,
    p_function_name,
    now_value,
    1,
    now_value
  )
  on conflict (scope_hash, function_name) do update
  set
    window_started_at = case
      when public.edge_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= now_value
        then now_value
      else public.edge_rate_limits.window_started_at
    end,
    request_count = case
      when public.edge_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= now_value
        then 1
      else public.edge_rate_limits.request_count + 1
    end,
    updated_at = now_value
  returning * into current_row;

  reset_at := current_row.window_started_at + make_interval(secs => p_window_seconds);

  return query select
    current_row.request_count <= p_limit,
    greatest(0, p_limit - current_row.request_count),
    greatest(0, ceil(extract(epoch from (reset_at - now_value)))::integer);
end;
$$;

revoke all on function public.consume_edge_rate_limit(text, text, integer, integer) from public;
grant execute on function public.consume_edge_rate_limit(text, text, integer, integer) to service_role;

-- Remove expired rate-limit buckets without exposing them to clients.
create or replace function public.prune_edge_rate_limits(p_older_than interval default interval '2 days')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.edge_rate_limits where updated_at < now() - p_older_than;
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;
revoke all on function public.prune_edge_rate_limits(interval) from public;
grant execute on function public.prune_edge_rate_limits(interval) to service_role;


-- Keep the private jacket-image bucket constrained at the server layer.
update storage.buckets
set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[]
where id = 'closet-images';

-- Enforce jacket-only records without changing existing valid rows.
do $$
begin
  if to_regclass('public.wardrobe_items') is not null then
    update public.wardrobe_items set category = 'jacket' where category is null;
    if not exists (
      select 1 from pg_constraint
      where conname = 'wardrobe_items_jacket_category_check'
        and conrelid = 'public.wardrobe_items'::regclass
    ) then
      alter table public.wardrobe_items
        add constraint wardrobe_items_jacket_category_check
        check (category = 'jacket') not valid;
      -- Keep the constraint NOT VALID so legacy non-jacket rows from the earlier
      -- wardrobe experiment are preserved. PostgreSQL still enforces it for all
      -- new or updated rows, while the active app only reads jacket records.
    end if;
  end if;
end
$$;

-- Preserve one existing primary image per jacket before enforcing uniqueness.
do $$
begin
  if to_regclass('public.wardrobe_item_images') is not null then
    with ranked_primary as (
      select
        id,
        row_number() over (
          partition by wardrobe_item_id
          order by display_order asc, created_at asc, id asc
        ) as primary_rank
      from public.wardrobe_item_images
      where is_primary = true
    )
    update public.wardrobe_item_images as image
    set is_primary = false
    from ranked_primary
    where image.id = ranked_primary.id
      and ranked_primary.primary_rank > 1;
  end if;
end
$$;

-- Exactly one primary image per jacket when an image is marked primary.
create unique index if not exists wardrobe_item_images_one_primary_idx
  on public.wardrobe_item_images (wardrobe_item_id)
  where is_primary = true;

-- Keep display order non-negative and feedback/profile enums constrained.
do $$
begin
  if to_regclass('public.wardrobe_item_images') is not null and not exists (
    select 1 from pg_constraint
    where conname = 'wardrobe_item_images_display_order_nonnegative'
      and conrelid = 'public.wardrobe_item_images'::regclass
  ) then
    update public.wardrobe_item_images
      set display_order = 0
      where display_order < 0;
    alter table public.wardrobe_item_images
      add constraint wardrobe_item_images_display_order_nonnegative
      check (display_order >= 0) not valid;
    alter table public.wardrobe_item_images validate constraint wardrobe_item_images_display_order_nonnegative;
  end if;

  if to_regclass('public.profiles') is not null and not exists (
    select 1 from pg_constraint
    where conname = 'profiles_trend_influence_phase13_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_trend_influence_phase13_check
      check (trend_influence in ('off', 'subtle', 'balanced')) not valid;
    alter table public.profiles validate constraint profiles_trend_influence_phase13_check;
  end if;
end
$$;

comment on table public.edge_rate_limits is
  'Server-only hashed rate-limit buckets for Supabase Edge Functions. Raw IP addresses are never stored.';
