-- High Style Match notification outbox
-- Run after schema.sql and production.sql.

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  event_type text not null,
  recipient_email text not null,
  subject text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','sent','failed','cancelled')),
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists notification_outbox_pending_idx on public.notification_outbox(status,created_at);
alter table public.notification_outbox enable row level security;
drop policy if exists "notification_outbox_admin_select" on public.notification_outbox;
create policy "notification_outbox_admin_select" on public.notification_outbox for select to authenticated using (public.is_admin());

create or replace function public.queue_review_notification()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  owner_id uuid;
  owner_email text;
  project_name text;
  allowed boolean := true;
begin
  select p.owner_id,p.name into owner_id,project_name from public.projects p where p.id=new.project_id;
  select pr.email into owner_email from public.profiles pr where pr.id=owner_id;
  if owner_email is null then return new; end if;

  if new.decision='approve' then
    select coalesce(np.customer_approval,true) into allowed from public.notification_preferences np where np.user_id=owner_id;
    if allowed is null then allowed:=true; end if;
    if allowed then
      insert into public.notification_outbox(user_id,project_id,event_type,recipient_email,subject,payload)
      values(owner_id,new.project_id,'customer_approval',owner_email,'High Style Match — customer approval',jsonb_build_object('project',project_name,'review_id',new.id));
    end if;
  elsif new.decision in ('change','comment') then
    select coalesce(np.customer_changes,true) into allowed from public.notification_preferences np where np.user_id=owner_id;
    if allowed is null then allowed:=true; end if;
    if allowed then
      insert into public.notification_outbox(user_id,project_id,event_type,recipient_email,subject,payload)
      values(owner_id,new.project_id,'customer_change',owner_email,'High Style Match — customer feedback',jsonb_build_object('project',project_name,'review_id',new.id,'decision',new.decision,'comment',new.comment));
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists project_reviews_queue_notification on public.project_reviews;
create trigger project_reviews_queue_notification after insert on public.project_reviews
for each row execute function public.queue_review_notification();
