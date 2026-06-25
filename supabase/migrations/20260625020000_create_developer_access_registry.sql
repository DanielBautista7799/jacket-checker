-- Developer access registry and immutable audit log.
-- Forward-only migration. Existing application data is preserved.

create table if not exists public.developer_access_registry (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_snapshot text not null,
  role text not null default 'admin',
  active boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint developer_access_registry_role_check
    check (role in ('owner', 'admin')),
  constraint developer_access_registry_email_check
    check (
      email_snapshot = lower(btrim(email_snapshot))
      and char_length(email_snapshot) between 3 and 320
      and position('@' in email_snapshot) > 1
    ),
  constraint developer_access_registry_notes_check
    check (notes is null or char_length(notes) <= 500),
  constraint developer_access_registry_revocation_check
    check (
      (active = true and revoked_at is null)
      or (active = false and revoked_at is not null)
    )
);

create index if not exists developer_access_registry_active_role_idx
  on public.developer_access_registry (active, role, granted_at desc);

create table if not exists public.developer_access_audit (
  id bigint generated always as identity primary key,
  action text not null,
  actor_user_id uuid,
  actor_email_snapshot text,
  target_user_id uuid,
  target_email_snapshot text not null,
  previous_role text,
  new_role text,
  notes text,
  request_id text,
  created_at timestamptz not null default now(),
  constraint developer_access_audit_action_check
    check (action in ('bootstrap_owner', 'grant', 'reactivate', 'revoke')),
  constraint developer_access_audit_actor_email_check
    check (
      actor_email_snapshot is null
      or (
        actor_email_snapshot = lower(btrim(actor_email_snapshot))
        and char_length(actor_email_snapshot) between 3 and 320
        and position('@' in actor_email_snapshot) > 1
      )
    ),
  constraint developer_access_audit_target_email_check
    check (
      target_email_snapshot = lower(btrim(target_email_snapshot))
      and char_length(target_email_snapshot) between 3 and 320
      and position('@' in target_email_snapshot) > 1
    ),
  constraint developer_access_audit_previous_role_check
    check (previous_role is null or previous_role in ('owner', 'admin')),
  constraint developer_access_audit_new_role_check
    check (new_role is null or new_role in ('owner', 'admin')),
  constraint developer_access_audit_notes_check
    check (notes is null or char_length(notes) <= 500),
  constraint developer_access_audit_request_id_check
    check (request_id is null or char_length(request_id) <= 128)
);

create index if not exists developer_access_audit_created_at_idx
  on public.developer_access_audit (created_at desc);

create index if not exists developer_access_audit_target_idx
  on public.developer_access_audit (target_user_id, created_at desc);

alter table public.developer_access_registry enable row level security;
alter table public.developer_access_audit enable row level security;

revoke all on table public.developer_access_registry from anon, authenticated;
revoke all on table public.developer_access_audit from anon, authenticated;
grant select, insert, update, delete on table public.developer_access_registry to service_role;
grant select, insert on table public.developer_access_audit to service_role;
grant usage, select on sequence public.developer_access_audit_id_seq to service_role;

comment on table public.developer_access_registry is
  'Server-only UUID-based registry for Jacket Checker developer access. Browser roles have no direct grants.';

comment on table public.developer_access_audit is
  'Append-only server audit log for developer access grants, reactivations, revocations, and initial owner bootstrap.';

create or replace function public.set_developer_access_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_developer_access_updated_at() from public;

drop trigger if exists developer_access_registry_updated_at
  on public.developer_access_registry;

create trigger developer_access_registry_updated_at
before update on public.developer_access_registry
for each row execute function public.set_developer_access_updated_at();

create or replace function public.protect_active_developer_owner()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.active = true and old.role = 'owner' then
    raise exception using
      errcode = '42501',
      message = 'active_developer_owner_cannot_be_deleted';
  end if;
  return old;
end;
$$;

revoke all on function public.protect_active_developer_owner() from public;

drop trigger if exists developer_access_owner_delete_guard
  on public.developer_access_registry;

create trigger developer_access_owner_delete_guard
before delete on public.developer_access_registry
for each row execute function public.protect_active_developer_owner();

create or replace function public.prevent_developer_access_audit_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception using
    errcode = '42501',
    message = 'developer_access_audit_is_append_only';
end;
$$;

revoke all on function public.prevent_developer_access_audit_mutation() from public;

drop trigger if exists developer_access_audit_append_only
  on public.developer_access_audit;

create trigger developer_access_audit_append_only
before update or delete on public.developer_access_audit
for each row execute function public.prevent_developer_access_audit_mutation();

create or replace function public.bootstrap_developer_owner(
  p_user_id uuid,
  p_email text,
  p_request_id text default null,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(btrim(coalesce(p_email, '')));
begin
  if p_user_id is null
     or char_length(normalized_email) < 3
     or char_length(normalized_email) > 320
     or position('@' in normalized_email) <= 1
     or (p_notes is not null and char_length(p_notes) > 500)
     or (p_request_id is not null and char_length(p_request_id) > 128) then
    raise exception using errcode = '22023', message = 'invalid_developer_access_input';
  end if;

  perform pg_advisory_xact_lock(hashtext('jacket_checker_developer_owner_bootstrap'));

  if exists (
    select 1 from public.developer_access_registry where active = true
  ) then
    raise exception using errcode = 'P0001', message = 'developer_registry_initialized';
  end if;

  insert into public.developer_access_registry (
    user_id,
    email_snapshot,
    role,
    active,
    granted_by,
    granted_at,
    revoked_by,
    revoked_at,
    notes
  ) values (
    p_user_id,
    normalized_email,
    'owner',
    true,
    p_user_id,
    now(),
    null,
    null,
    p_notes
  )
  on conflict (user_id) do update
  set
    email_snapshot = excluded.email_snapshot,
    role = 'owner',
    active = true,
    granted_by = p_user_id,
    granted_at = now(),
    revoked_by = null,
    revoked_at = null,
    notes = excluded.notes;

  insert into public.developer_access_audit (
    action,
    actor_user_id,
    actor_email_snapshot,
    target_user_id,
    target_email_snapshot,
    previous_role,
    new_role,
    notes,
    request_id
  ) values (
    'bootstrap_owner',
    p_user_id,
    normalized_email,
    p_user_id,
    normalized_email,
    null,
    'owner',
    p_notes,
    p_request_id
  );
end;
$$;

revoke all on function public.bootstrap_developer_owner(uuid, text, text, text) from public;
grant execute on function public.bootstrap_developer_owner(uuid, text, text, text) to service_role;

create or replace function public.grant_developer_admin(
  p_actor_user_id uuid,
  p_actor_email text,
  p_target_user_id uuid,
  p_target_email text,
  p_notes text default null,
  p_request_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_email text := lower(btrim(coalesce(p_actor_email, '')));
  target_email text := lower(btrim(coalesce(p_target_email, '')));
  previous_record public.developer_access_registry%rowtype;
  audit_action text;
begin
  if p_actor_user_id is null
     or p_target_user_id is null
     or char_length(actor_email) < 3
     or char_length(actor_email) > 320
     or position('@' in actor_email) <= 1
     or char_length(target_email) < 3
     or char_length(target_email) > 320
     or position('@' in target_email) <= 1
     or (p_notes is not null and char_length(p_notes) > 500)
     or (p_request_id is not null and char_length(p_request_id) > 128) then
    raise exception using errcode = '22023', message = 'invalid_developer_access_input';
  end if;

  if not exists (
    select 1
    from public.developer_access_registry
    where user_id = p_actor_user_id
      and active = true
      and role = 'owner'
  ) then
    raise exception using errcode = '42501', message = 'developer_owner_required';
  end if;

  if p_target_user_id = p_actor_user_id then
    raise exception using errcode = 'P0001', message = 'cannot_grant_owner_account';
  end if;

  select * into previous_record
  from public.developer_access_registry
  where user_id = p_target_user_id;

  if found and previous_record.role = 'owner' then
    raise exception using errcode = 'P0001', message = 'cannot_change_owner';
  end if;

  if found and previous_record.active = true then
    raise exception using errcode = 'P0001', message = 'developer_already_active';
  end if;

  audit_action := case when found then 'reactivate' else 'grant' end;

  insert into public.developer_access_registry (
    user_id,
    email_snapshot,
    role,
    active,
    granted_by,
    granted_at,
    revoked_by,
    revoked_at,
    notes
  ) values (
    p_target_user_id,
    target_email,
    'admin',
    true,
    p_actor_user_id,
    now(),
    null,
    null,
    p_notes
  )
  on conflict (user_id) do update
  set
    email_snapshot = excluded.email_snapshot,
    role = 'admin',
    active = true,
    granted_by = p_actor_user_id,
    granted_at = now(),
    revoked_by = null,
    revoked_at = null,
    notes = excluded.notes;

  insert into public.developer_access_audit (
    action,
    actor_user_id,
    actor_email_snapshot,
    target_user_id,
    target_email_snapshot,
    previous_role,
    new_role,
    notes,
    request_id
  ) values (
    audit_action,
    p_actor_user_id,
    actor_email,
    p_target_user_id,
    target_email,
    case when previous_record.user_id is null then null else previous_record.role end,
    'admin',
    p_notes,
    p_request_id
  );
end;
$$;

revoke all on function public.grant_developer_admin(uuid, text, uuid, text, text, text) from public;
grant execute on function public.grant_developer_admin(uuid, text, uuid, text, text, text) to service_role;

create or replace function public.revoke_developer_admin(
  p_actor_user_id uuid,
  p_actor_email text,
  p_target_user_id uuid,
  p_notes text default null,
  p_request_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_email text := lower(btrim(coalesce(p_actor_email, '')));
  target_record public.developer_access_registry%rowtype;
begin
  if p_actor_user_id is null
     or p_target_user_id is null
     or char_length(actor_email) < 3
     or char_length(actor_email) > 320
     or position('@' in actor_email) <= 1
     or (p_notes is not null and char_length(p_notes) > 500)
     or (p_request_id is not null and char_length(p_request_id) > 128) then
    raise exception using errcode = '22023', message = 'invalid_developer_access_input';
  end if;

  if not exists (
    select 1
    from public.developer_access_registry
    where user_id = p_actor_user_id
      and active = true
      and role = 'owner'
  ) then
    raise exception using errcode = '42501', message = 'developer_owner_required';
  end if;

  if p_target_user_id = p_actor_user_id then
    raise exception using errcode = 'P0001', message = 'cannot_revoke_self';
  end if;

  select * into target_record
  from public.developer_access_registry
  where user_id = p_target_user_id;

  if not found or target_record.active = false then
    raise exception using errcode = 'P0001', message = 'developer_not_active';
  end if;

  if target_record.role = 'owner' then
    raise exception using errcode = 'P0001', message = 'cannot_revoke_owner';
  end if;

  update public.developer_access_registry
  set
    active = false,
    revoked_by = p_actor_user_id,
    revoked_at = now(),
    notes = coalesce(p_notes, notes)
  where user_id = p_target_user_id;

  insert into public.developer_access_audit (
    action,
    actor_user_id,
    actor_email_snapshot,
    target_user_id,
    target_email_snapshot,
    previous_role,
    new_role,
    notes,
    request_id
  ) values (
    'revoke',
    p_actor_user_id,
    actor_email,
    p_target_user_id,
    target_record.email_snapshot,
    target_record.role,
    null,
    p_notes,
    p_request_id
  );
end;
$$;

revoke all on function public.revoke_developer_admin(uuid, text, uuid, text, text) from public;
grant execute on function public.revoke_developer_admin(uuid, text, uuid, text, text) to service_role;
