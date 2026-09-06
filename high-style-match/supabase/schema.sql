-- High Style Match: Supabase production foundation
-- Run in a NEW Supabase project's SQL editor before enabling real customer accounts.
-- Never expose a service-role key in the browser. The frontend should use only the public anon key.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'customer' check (role in ('photographer','customer','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_members (
  customer_account_id uuid not null references public.customer_accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  created_at timestamptz not null default now(),
  primary key (customer_account_id, user_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  customer_account_id uuid references public.customer_accounts(id) on delete set null,
  name text not null,
  client_name text,
  shoot_date date,
  status text not null default 'draft' check (status in ('draft','planned','shooting','review','approved','delivered','archived')),
  notes text,
  local_project_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_access (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  permission text not null default 'review' check (permission in ('view','review','approve')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.shot_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  subject text not null,
  variant text,
  notes text,
  sort_order integer not null default 0,
  state text not null default 'missing' check (state in ('missing','captured','needs_another','skipped','approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  shot_item_id uuid references public.shot_items(id) on delete set null,
  original_filename text not null,
  preview_path text,
  delivery_path text,
  orientation text,
  width integer,
  height integer,
  capture_at timestamptz,
  status text not null default 'captured' check (status in ('captured','pick','review','approved','rejected','delivered')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  photo_id uuid references public.project_photos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  decision text not null check (decision in ('approve','favourite','change','comment')),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'link',
  delivery_url text,
  version text,
  delivered_at timestamptz,
  expires_at timestamptz,
  opened_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  customer_account_id uuid references public.customer_accounts(id) on delete cascade,
  email text not null,
  permission text not null default 'review' check (permission in ('view','review','approve')),
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  invited_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists projects_owner_idx on public.projects(owner_id);
create index if not exists projects_customer_idx on public.projects(customer_account_id);
create index if not exists access_user_idx on public.project_access(user_id);
create index if not exists shots_project_idx on public.shot_items(project_id);
create index if not exists photos_project_idx on public.project_photos(project_id);
create index if not exists reviews_project_idx on public.project_reviews(project_id);
create index if not exists deliveries_project_idx on public.deliveries(project_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists customer_accounts_touch_updated_at on public.customer_accounts;
create trigger customer_accounts_touch_updated_at before update on public.customer_accounts
for each row execute function public.touch_updated_at();

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at before update on public.projects
for each row execute function public.touch_updated_at();

drop trigger if exists shot_items_touch_updated_at on public.shot_items;
create trigger shot_items_touch_updated_at before update on public.shot_items
for each row execute function public.touch_updated_at();

drop trigger if exists project_photos_touch_updated_at on public.project_photos;
create trigger project_photos_touch_updated_at before update on public.project_photos
for each row execute function public.touch_updated_at();

drop trigger if exists project_reviews_touch_updated_at on public.project_reviews;
create trigger project_reviews_touch_updated_at before update on public.project_reviews
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.can_view_project(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = pid and p.owner_id = auth.uid()
  ) or exists (
    select 1 from public.project_access pa
    where pa.project_id = pid and pa.user_id = auth.uid()
  );
$$;

create or replace function public.can_manage_project(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = pid and p.owner_id = auth.uid()
  );
$$;

grant execute on function public.can_view_project(uuid) to authenticated;
grant execute on function public.can_manage_project(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.customer_accounts enable row level security;
alter table public.customer_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_access enable row level security;
alter table public.shot_items enable row level security;
alter table public.project_photos enable row level security;
alter table public.project_reviews enable row level security;
alter table public.deliveries enable row level security;
alter table public.invitations enable row level security;

-- Profiles
create policy "profiles_select_self" on public.profiles
for select to authenticated using (id = auth.uid());
create policy "profiles_update_self" on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Customer accounts
create policy "customer_accounts_select_member_or_creator" on public.customer_accounts
for select to authenticated using (
  created_by = auth.uid() or exists (
    select 1 from public.customer_members cm
    where cm.customer_account_id = id and cm.user_id = auth.uid()
  )
);
create policy "customer_accounts_insert_creator" on public.customer_accounts
for insert to authenticated with check (created_by = auth.uid());
create policy "customer_accounts_update_creator" on public.customer_accounts
for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "customer_accounts_delete_creator" on public.customer_accounts
for delete to authenticated using (created_by = auth.uid());

-- Customer members
create policy "customer_members_select_self_or_creator" on public.customer_members
for select to authenticated using (
  user_id = auth.uid() or exists (
    select 1 from public.customer_accounts ca
    where ca.id = customer_account_id and ca.created_by = auth.uid()
  )
);
create policy "customer_members_manage_creator" on public.customer_members
for all to authenticated using (
  exists (select 1 from public.customer_accounts ca where ca.id = customer_account_id and ca.created_by = auth.uid())
) with check (
  exists (select 1 from public.customer_accounts ca where ca.id = customer_account_id and ca.created_by = auth.uid())
);

-- Projects
create policy "projects_select_authorized" on public.projects
for select to authenticated using (public.can_view_project(id));
create policy "projects_insert_owner" on public.projects
for insert to authenticated with check (owner_id = auth.uid());
create policy "projects_update_owner" on public.projects
for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "projects_delete_owner" on public.projects
for delete to authenticated using (owner_id = auth.uid());

-- Project access
create policy "project_access_select_self_or_owner" on public.project_access
for select to authenticated using (user_id = auth.uid() or public.can_manage_project(project_id));
create policy "project_access_manage_owner" on public.project_access
for all to authenticated using (public.can_manage_project(project_id)) with check (public.can_manage_project(project_id));

-- Shot items
create policy "shot_items_select_project" on public.shot_items
for select to authenticated using (public.can_view_project(project_id));
create policy "shot_items_manage_owner" on public.shot_items
for all to authenticated using (public.can_manage_project(project_id)) with check (public.can_manage_project(project_id));

-- Photos
create policy "project_photos_select_project" on public.project_photos
for select to authenticated using (public.can_view_project(project_id));
create policy "project_photos_manage_owner" on public.project_photos
for all to authenticated using (public.can_manage_project(project_id)) with check (public.can_manage_project(project_id));

-- Reviews: customers can review only projects they can access; owners can also see them.
create policy "project_reviews_select_project" on public.project_reviews
for select to authenticated using (public.can_view_project(project_id));
create policy "project_reviews_insert_authorized" on public.project_reviews
for insert to authenticated with check (user_id = auth.uid() and public.can_view_project(project_id));
create policy "project_reviews_update_own" on public.project_reviews
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "project_reviews_delete_own_or_owner" on public.project_reviews
for delete to authenticated using (user_id = auth.uid() or public.can_manage_project(project_id));

-- Deliveries
create policy "deliveries_select_project" on public.deliveries
for select to authenticated using (public.can_view_project(project_id));
create policy "deliveries_manage_owner" on public.deliveries
for all to authenticated using (public.can_manage_project(project_id)) with check (public.can_manage_project(project_id) and created_by = auth.uid());

-- Invitations stay photographer-only from the browser. Sending invitation emails should be done by a trusted server/Edge Function.
create policy "invitations_manage_owner" on public.invitations
for all to authenticated using (
  project_id is not null and public.can_manage_project(project_id)
) with check (
  project_id is not null and public.can_manage_project(project_id) and invited_by = auth.uid()
);

-- Private preview bucket. Originals/RAWs should remain local by default.
insert into storage.buckets (id, name, public)
values ('project-previews','project-previews',false)
on conflict (id) do update set public = false;

-- Expected object path: <project_uuid>/<filename>
create policy "preview_select_authorized" on storage.objects
for select to authenticated using (
  bucket_id = 'project-previews'
  and public.can_view_project(((storage.foldername(name))[1])::uuid)
);
create policy "preview_insert_owner" on storage.objects
for insert to authenticated with check (
  bucket_id = 'project-previews'
  and public.can_manage_project(((storage.foldername(name))[1])::uuid)
);
create policy "preview_update_owner" on storage.objects
for update to authenticated using (
  bucket_id = 'project-previews'
  and public.can_manage_project(((storage.foldername(name))[1])::uuid)
) with check (
  bucket_id = 'project-previews'
  and public.can_manage_project(((storage.foldername(name))[1])::uuid)
);
create policy "preview_delete_owner" on storage.objects
for delete to authenticated using (
  bucket_id = 'project-previews'
  and public.can_manage_project(((storage.foldername(name))[1])::uuid)
);
