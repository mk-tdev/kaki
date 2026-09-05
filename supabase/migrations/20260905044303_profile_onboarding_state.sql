-- Distinguish an authenticated account from a resident who has completed the
-- community profile. Product routes use this state to require onboarding.
alter table public.profiles
  add column onboarded_at timestamptz;

grant select (onboarded_at) on public.profiles to authenticated;
grant update (onboarded_at) on public.profiles to authenticated;
