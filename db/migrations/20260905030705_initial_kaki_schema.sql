create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.profile_role as enum ('resident', 'helper', 'organiser');
create type public.mission_status as enum ('draft', 'open', 'matched', 'in_progress', 'completed', 'cancelled', 'flagged');
create type public.mission_category as enum ('digital', 'wellbeing', 'repair', 'food', 'skills');
create type public.safety_level as enum ('community', 'review');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  role public.profile_role not null default 'resident',
  age_band text,
  preferred_language text not null default 'English',
  spoken_languages text[] not null default array['English']::text[],
  skills text[] not null default '{}'::text[],
  bio text not null default '' check (char_length(bio) <= 360),
  avatar_url text,
  neighbourhood text not null default 'Pek Kio',
  accessibility_notes text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete restrict,
  helper_id uuid references public.profiles(id) on delete set null,
  organiser_id uuid references public.profiles(id) on delete set null,
  title text not null check (char_length(title) between 3 and 100),
  original_request text not null check (char_length(original_request) between 3 and 1000),
  summary text not null check (char_length(summary) between 3 and 500),
  category public.mission_category not null,
  status public.mission_status not null default 'draft',
  language text not null default 'English',
  duration_minutes integer not null check (duration_minutes between 10 and 180),
  location_label text not null check (char_length(location_label) between 3 and 160),
  scheduled_at timestamptz not null,
  guide jsonb not null default '[]'::jsonb check (jsonb_typeof(guide) = 'array'),
  accessibility_notes text,
  safety_level public.safety_level not null default 'community',
  ai_model text,
  ai_rationale text,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index missions_status_scheduled_idx on public.missions(status, scheduled_at);
create index missions_requester_idx on public.missions(requester_id, created_at desc);
create index missions_helper_idx on public.missions(helper_id, scheduled_at) where helper_id is not null;
create index missions_category_idx on public.missions(category, status);

create table public.mission_messages (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 1200),
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);
create index mission_messages_mission_idx on public.mission_messages(mission_id, created_at);

create table public.mission_events (
  id bigint generated always as identity primary key,
  mission_id uuid not null references public.missions(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (event_type in ('created', 'published', 'matched', 'started', 'completed', 'cancelled', 'flagged', 'reviewed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index mission_events_mission_idx on public.mission_events(mission_id, created_at);

create table public.helper_availability (
  id uuid primary key default gen_random_uuid(),
  helper_id uuid not null references public.profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  categories public.mission_category[] not null default '{}'::public.mission_category[],
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint availability_valid_window check (ends_at > starts_at),
  constraint availability_max_window check (ends_at <= starts_at + interval '12 hours')
);
create index helper_availability_lookup_idx on public.helper_availability(active, starts_at, ends_at);

create table public.blooms (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null unique references public.missions(id) on delete cascade,
  category public.mission_category not null,
  title text not null check (char_length(title) between 3 and 100),
  story text not null check (char_length(story) between 3 and 500),
  participant_names text[] not null default '{}'::text[],
  consent_to_share boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  mission_id uuid references public.missions(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications(recipient_id, read_at, created_at desc);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger missions_set_updated_at before update on public.missions
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, preferred_language)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'New Kaki'),
    coalesce(nullif(new.raw_user_meta_data ->> 'preferred_language', ''), 'English')
  );
  return new;
end;
$$;
revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.is_organiser()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'organiser'
  );
$$;
revoke execute on function private.is_organiser() from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.missions enable row level security;
alter table public.mission_messages enable row level security;
alter table public.mission_events enable row level security;
alter table public.helper_availability enable row level security;
alter table public.blooms enable row level security;
alter table public.notifications enable row level security;

create policy "authenticated users can view community profiles"
on public.profiles for select to authenticated using (true);
create policy "users can update their profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "participants and organisers can view missions"
on public.missions for select to authenticated
using (
  status = 'open'
  or requester_id = (select auth.uid())
  or helper_id = (select auth.uid())
  or (select private.is_organiser())
);
create policy "residents can create their own missions"
on public.missions for insert to authenticated
with check (requester_id = (select auth.uid()) and helper_id is null);
create policy "requesters can update active missions"
on public.missions for update to authenticated
using (requester_id = (select auth.uid()) and status in ('draft', 'open', 'matched', 'flagged'))
with check (requester_id = (select auth.uid()));
create policy "helpers can update assigned missions"
on public.missions for update to authenticated
using (helper_id = (select auth.uid()) and status in ('matched', 'in_progress'))
with check (helper_id = (select auth.uid()));
create policy "helpers can claim open missions"
on public.missions for update to authenticated
using (status = 'open' and helper_id is null and requester_id <> (select auth.uid()))
with check (status = 'matched' and helper_id = (select auth.uid()));
create policy "organisers can manage all missions"
on public.missions for all to authenticated
using ((select private.is_organiser()))
with check ((select private.is_organiser()));

create policy "participants can read mission messages"
on public.mission_messages for select to authenticated
using (exists (select 1 from public.missions m where m.id = mission_id and (m.requester_id = (select auth.uid()) or m.helper_id = (select auth.uid()) or (select private.is_organiser()))));
create policy "participants can send mission messages"
on public.mission_messages for insert to authenticated
with check (sender_id = (select auth.uid()) and exists (select 1 from public.missions m where m.id = mission_id and (m.requester_id = (select auth.uid()) or m.helper_id = (select auth.uid()) or (select private.is_organiser()))));

create policy "participants can read mission history"
on public.mission_events for select to authenticated
using (exists (select 1 from public.missions m where m.id = mission_id and (m.requester_id = (select auth.uid()) or m.helper_id = (select auth.uid()) or (select private.is_organiser()))));
create policy "participants can append mission history"
on public.mission_events for insert to authenticated
with check (actor_id = (select auth.uid()) and exists (select 1 from public.missions m where m.id = mission_id and (m.requester_id = (select auth.uid()) or m.helper_id = (select auth.uid()) or (select private.is_organiser()))));

create policy "helpers manage their availability"
on public.helper_availability for all to authenticated
using (helper_id = (select auth.uid()) or (select private.is_organiser()))
with check (helper_id = (select auth.uid()) or (select private.is_organiser()));

create policy "blooms are public when consented"
on public.blooms for select to anon, authenticated
using (consent_to_share = true or exists (select 1 from public.missions m where m.id = mission_id and (m.requester_id = (select auth.uid()) or m.helper_id = (select auth.uid()) or (select private.is_organiser()))));
create policy "participants can create a bloom"
on public.blooms for insert to authenticated
with check (exists (select 1 from public.missions m where m.id = mission_id and m.status = 'completed' and (m.requester_id = (select auth.uid()) or m.helper_id = (select auth.uid()) or (select private.is_organiser()))));

create policy "users read their notifications"
on public.notifications for select to authenticated using (recipient_id = (select auth.uid()));
create policy "users update their notifications"
on public.notifications for update to authenticated
using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));

grant usage on schema public to anon, authenticated;
grant select on public.blooms to anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.missions to authenticated;
grant select, insert on public.mission_messages to authenticated;
grant select, insert on public.mission_events to authenticated;
grant select, insert, update, delete on public.helper_availability to authenticated;
grant select, insert on public.blooms to authenticated;
grant select, update on public.notifications to authenticated;
grant usage, select on sequence public.mission_events_id_seq to authenticated;
