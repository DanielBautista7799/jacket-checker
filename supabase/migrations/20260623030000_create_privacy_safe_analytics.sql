create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anonymous_session_id uuid,
  event_name text not null,
  route text not null default '/',
  experience_mode text not null check (experience_mode in ('guest', 'personalized', 'developer')),
  success boolean not null default true,
  duration_ms integer check (duration_ms is null or (duration_ms >= 0 and duration_ms <= 300000)),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint analytics_event_identity_check check (user_id is not null or anonymous_session_id is not null),
  constraint analytics_metadata_object_check check (jsonb_typeof(metadata) = 'object'),
  constraint analytics_route_length_check check (char_length(route) <= 120),
  constraint analytics_event_name_length_check check (char_length(event_name) <= 80)
);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);

create index if not exists analytics_events_event_name_created_at_idx
  on public.analytics_events (event_name, created_at desc);

create index if not exists analytics_events_user_id_created_at_idx
  on public.analytics_events (user_id, created_at desc)
  where user_id is not null;

create index if not exists analytics_events_experience_mode_created_at_idx
  on public.analytics_events (experience_mode, created_at desc);

alter table public.analytics_events enable row level security;

revoke all on table public.analytics_events from anon, authenticated;
grant all on table public.analytics_events to service_role;

alter table public.profiles
  add column if not exists analytics_enabled boolean not null default true;

comment on table public.analytics_events is
  'First-party privacy-safe product analytics. Individual events are server-only and developer dashboards return aggregates.';

comment on column public.analytics_events.metadata is
  'Allowlisted low-cardinality metadata only. Never store emails, coordinates, image data, URLs, prompts, tokens, or raw responses.';

create or replace function public.delete_my_analytics()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.analytics_events
  where user_id = auth.uid();
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.delete_my_analytics() from public;
grant execute on function public.delete_my_analytics() to authenticated;
