-- High Style Match production extension
-- Run AFTER schema.sql in Supabase SQL Editor.
-- Adds cloud sync IDs, audit/error logging, delivery events, subscriptions, privacy requests and admin visibility.

alter table public.shot_items add column if not exists local_shot_id text;
alter table public.project_photos add column if not exists local_photo_id text;
alter table public.project_photos add column if not exists local_shot_id text;

-- Required by browser upserts. PostgreSQL UNIQUE permits multiple NULL values.
do $$ begin
  alter table public.projects add constraint projects_owner_local_unique unique (owner_id, local_project_id);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.shot_items add constraint shot_items_project_local_unique unique (project_id, local_shot_id);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.project_photos add constraint project_photos_project_local_unique unique (project_id, local_photo_id);
exception when duplicate_object then null; end $$;

create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  label text,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  project_id uuid references public.projects(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.app_errors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  message text not null,
  page_url text,
  user_agent text,
  details jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  customer_approval boolean not null default true,
  customer_changes boolean not null default true,
  delivery_expiry boolean not null default true,
  sync_failure boolean not null default true,
  capture_disconnect boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_events (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('created','opened','downloaded','expired','replaced')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'stripe',
  provider_customer_id text,
  provider_subscription_id text,
  plan text,
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, provider)
);

create table if not exists public.account_data_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('export','delete')),
  status text not null default 'requested' check (status in ('requested','processing','completed','rejected')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists audit_events_project_idx on public.audit_events(project_id, created_at desc);
create index if not exists app_errors_created_idx on public.app_errors(created_at desc);
create index if not exists delivery_events_project_idx on public.delivery_events(project_id, created_at desc);
create index if not exists versions_project_idx on public.project_versions(project_id, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin');
$$;
grant execute on function public.is_admin() to authenticated;

create or replace function public.touch_subscription_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at before update on public.subscriptions
for each row execute function public.touch_subscription_updated_at();

create or replace function public.touch_notification_preferences_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
drop trigger if exists notification_preferences_touch_updated_at on public.notification_preferences;
create trigger notification_preferences_touch_updated_at before update on public.notification_preferences
for each row execute function public.touch_notification_preferences_updated_at();

alter table public.project_versions enable row level security;
alter table public.audit_events enable row level security;
alter table public.app_errors enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.delivery_events enable row level security;
alter table public.subscriptions enable row level security;
alter table public.account_data_requests enable row level security;

-- Project versions are photographer backup metadata, not customer-facing.
drop policy if exists "project_versions_owner" on public.project_versions;
create policy "project_versions_owner" on public.project_versions
for all to authenticated using (public.can_manage_project(project_id) or public.is_admin())
with check (public.can_manage_project(project_id) or public.is_admin());

-- Audit events can be written by the current user. Owners can inspect project activity.
drop policy if exists "audit_events_insert_self" on public.audit_events;
create policy "audit_events_insert_self" on public.audit_events
for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "audit_events_select_authorized" on public.audit_events;
create policy "audit_events_select_authorized" on public.audit_events
for select to authenticated using (user_id=auth.uid() or (project_id is not null and public.can_manage_project(project_id)) or public.is_admin());

-- Authenticated client error reports. Admins can inspect them.
drop policy if exists "app_errors_insert_self" on public.app_errors;
create policy "app_errors_insert_self" on public.app_errors
for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "app_errors_select_admin" on public.app_errors;
create policy "app_errors_select_admin" on public.app_errors
for select to authenticated using (public.is_admin());
drop policy if exists "app_errors_update_admin" on public.app_errors;
create policy "app_errors_update_admin" on public.app_errors
for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Notification settings belong to the signed-in user.
drop policy if exists "notification_preferences_self" on public.notification_preferences;
create policy "notification_preferences_self" on public.notification_preferences
for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

-- Delivery activity is visible to anyone allowed to view the project; writes are server/owner driven.
drop policy if exists "delivery_events_select_project" on public.delivery_events;
create policy "delivery_events_select_project" on public.delivery_events
for select to authenticated using (public.can_view_project(project_id) or public.is_admin());
drop policy if exists "delivery_events_insert_owner" on public.delivery_events;
create policy "delivery_events_insert_owner" on public.delivery_events
for insert to authenticated with check (public.can_manage_project(project_id) or public.is_admin());

-- Billing records are private to the account and admins. Server functions use service role for updates.
drop policy if exists "subscriptions_select_self" on public.subscriptions;
create policy "subscriptions_select_self" on public.subscriptions
for select to authenticated using (user_id=auth.uid() or public.is_admin());

-- GDPR-style export/delete request log.
drop policy if exists "account_data_requests_self" on public.account_data_requests;
create policy "account_data_requests_self" on public.account_data_requests
for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "account_data_requests_select_self" on public.account_data_requests;
create policy "account_data_requests_select_self" on public.account_data_requests
for select to authenticated using (user_id=auth.uid() or public.is_admin());

-- Admin read visibility over existing production tables. Normal user policies remain in force too.
drop policy if exists "profiles_admin_select" on public.profiles;
create policy "profiles_admin_select" on public.profiles for select to authenticated using (public.is_admin());
drop policy if exists "projects_admin_select" on public.projects;
create policy "projects_admin_select" on public.projects for select to authenticated using (public.is_admin());
drop policy if exists "customer_accounts_admin_select" on public.customer_accounts;
create policy "customer_accounts_admin_select" on public.customer_accounts for select to authenticated using (public.is_admin());
drop policy if exists "project_access_admin_select" on public.project_access;
create policy "project_access_admin_select" on public.project_access for select to authenticated using (public.is_admin());
drop policy if exists "shot_items_admin_select" on public.shot_items;
create policy "shot_items_admin_select" on public.shot_items for select to authenticated using (public.is_admin());
drop policy if exists "project_photos_admin_select" on public.project_photos;
create policy "project_photos_admin_select" on public.project_photos for select to authenticated using (public.is_admin());
drop policy if exists "project_reviews_admin_select" on public.project_reviews;
create policy "project_reviews_admin_select" on public.project_reviews for select to authenticated using (public.is_admin());
drop policy if exists "deliveries_admin_select" on public.deliveries;
create policy "deliveries_admin_select" on public.deliveries for select to authenticated using (public.is_admin());
drop policy if exists "invitations_admin_select" on public.invitations;
create policy "invitations_admin_select" on public.invitations for select to authenticated using (public.is_admin());
