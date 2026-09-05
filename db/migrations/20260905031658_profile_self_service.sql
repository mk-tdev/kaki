-- Residents can choose between asking and helping. Organiser status and
-- verification remain staff-controlled trust decisions.
grant update (role) on public.profiles to authenticated;

create or replace function private.enforce_profile_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null then
    return new;
  end if;

  if old.id <> caller
    or new.id is distinct from old.id
    or new.verified_at is distinct from old.verified_at
    or new.created_at is distinct from old.created_at then
    raise exception 'Protected profile fields cannot be changed';
  end if;

  if new.role is distinct from old.role
    and (old.role = 'organiser' or new.role = 'organiser') then
    raise exception 'Organiser access requires community staff approval';
  end if;

  return new;
end;
$$;
revoke execute on function private.enforce_profile_update() from public, anon, authenticated;

create trigger profiles_enforce_update
before update on public.profiles
for each row execute function private.enforce_profile_update();
