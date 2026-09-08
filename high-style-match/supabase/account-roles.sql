-- High Style Match account roles migration
-- Run after schema.sql. Photographer self-signup is allowed; client accounts remain invite-led.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare requested text;
begin
  requested := lower(coalesce(new.raw_user_meta_data->>'requested_role','customer'));
  if requested not in ('photographer','customer') then requested := 'customer'; end if;
  insert into public.profiles (id,email,display_name,role)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'display_name',''),new.email),
    requested
  )
  on conflict (id) do update set
    email=excluded.email,
    display_name=coalesce(public.profiles.display_name,excluded.display_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Users may read their own role but may not promote themselves.
revoke update (role) on public.profiles from authenticated;

-- Admin assignment must remain a trusted server/SQL action, never browser metadata.
