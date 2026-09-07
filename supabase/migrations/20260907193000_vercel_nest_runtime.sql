-- Rebuild KAKI for the Vercel-hosted NestJS API.
-- Supabase-managed schemas and roles remain untouched.

drop table if exists public.mission_presence cascade;
drop table if exists public.notifications cascade;
drop table if exists public.blooms cascade;
drop table if exists public.helper_availability cascade;
drop table if exists public.mission_events cascade;
drop table if exists public.mission_messages cascade;
drop table if exists public.missions cascade;
drop table if exists public.profiles cascade;
drop table if exists public.demo_settings cascade;
drop function if exists public.is_organiser() cascade;
drop function if exists public.guest_access_allowed() cascade;
drop function if exists public.take_ai_quota() cascade;
drop type if exists public.safety_level cascade;
drop type if exists public.mission_category cascade;
drop type if exists public.mission_status cascade;
drop type if exists public.profile_role cascade;
drop schema if exists private cascade;
drop schema if exists kaki_auth cascade;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'kaki_app') then
    create role kaki_app nologin noinherit;
  end if;
end
$$;
alter role kaki_app nologin noinherit;
grant anon, authenticated to kaki_app;



-- App-owned identity schema. These are local PostgreSQL functions, not Supabase services.
grant anon, authenticated to kaki_app;
create schema kaki_auth;
revoke all on schema kaki_auth from public;
create table kaki_auth.users (
 id uuid primary key default gen_random_uuid(),
 email text unique, password_hash text,
 raw_user_meta_data jsonb not null default '{}',
 is_anonymous boolean not null default false,
 created_at timestamptz not null default now()
);
create function kaki_auth.jwt() returns jsonb language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb
$$;
create function kaki_auth.uid() returns uuid language sql stable as $$ select (kaki_auth.jwt()->>'sub')::uuid $$;
grant usage on schema kaki_auth to anon, authenticated, kaki_app;
revoke all on all functions in schema kaki_auth from public;
grant execute on function kaki_auth.jwt(), kaki_auth.uid() to anon, authenticated;


create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.profile_role as enum ('resident', 'helper', 'organiser');
create type public.mission_status as enum ('draft', 'open', 'matched', 'in_progress', 'completed', 'cancelled', 'flagged');
create type public.mission_category as enum ('digital', 'wellbeing', 'repair', 'food', 'skills');
create type public.safety_level as enum ('community', 'review');

create table public.profiles (
  id uuid primary key references kaki_auth.users(id) on delete cascade,
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
after insert on kaki_auth.users
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


-- Production hardening for KAKI.
-- Keeps direct client access safe while preserving the optimistic UI flows.

-- Every foreign key used for joins, cascades, or RLS lookups needs a covering index.
create index helper_availability_helper_idx
  on public.helper_availability(helper_id);
create index mission_events_actor_idx
  on public.mission_events(actor_id) where actor_id is not null;
create index mission_messages_sender_idx
  on public.mission_messages(sender_id);
create index missions_organiser_idx
  on public.missions(organiser_id) where organiser_id is not null;
create index notifications_mission_idx
  on public.notifications(mission_id) where mission_id is not null;

-- Keep private profile fields and trust controls out of the community directory.
revoke select, update on public.profiles from authenticated;
grant select (
  id,
  full_name,
  role,
  age_band,
  preferred_language,
  spoken_languages,
  skills,
  bio,
  avatar_url,
  neighbourhood,
  verified_at,
  created_at,
  updated_at
) on public.profiles to authenticated;
grant update (
  full_name,
  age_band,
  preferred_language,
  spoken_languages,
  skills,
  bio,
  avatar_url,
  neighbourhood,
  accessibility_notes
) on public.profiles to authenticated;

-- Consolidating permissive policies makes their intent explicit and avoids
-- evaluating several overlapping policy trees for every mission operation.
drop policy "participants and organisers can view missions" on public.missions;
drop policy "residents can create their own missions" on public.missions;
drop policy "requesters can update active missions" on public.missions;
drop policy "helpers can update assigned missions" on public.missions;
drop policy "helpers can claim open missions" on public.missions;
drop policy "organisers can manage all missions" on public.missions;

create policy "community mission visibility"
on public.missions for select to authenticated
using (
  status = 'open'
  or requester_id = (select auth.uid())
  or helper_id = (select auth.uid())
  or (select private.is_organiser())
);

create policy "create a valid community mission"
on public.missions for insert to authenticated
with check (
  (select private.is_organiser())
  or (
    requester_id = (select auth.uid())
    and helper_id is null
    and organiser_id is null
    and status in ('draft', 'open', 'flagged')
    and completed_at is null
    and cancelled_at is null
  )
);

create policy "valid participant mission updates"
on public.missions for update to authenticated
using (
  (select private.is_organiser())
  or requester_id = (select auth.uid())
  or helper_id = (select auth.uid())
  or (
    status = 'open'
    and helper_id is null
    and requester_id <> (select auth.uid())
  )
)
with check (
  (select private.is_organiser())
  or requester_id = (select auth.uid())
  or helper_id = (select auth.uid())
);

-- RLS controls which rows are reachable. This trigger additionally controls
-- allowed OLD -> NEW transitions so ownership and mission state cannot be forged.
create or replace function private.enforce_mission_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  old_payload jsonb := to_jsonb(old) - array['updated_at'];
  new_payload jsonb := to_jsonb(new) - array['updated_at'];
begin
  -- Trusted database maintenance and service-role work has no user JWT.
  if caller is null or (select private.is_organiser()) then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.requester_id is distinct from old.requester_id
    or new.organiser_id is distinct from old.organiser_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Mission ownership fields cannot be changed';
  end if;

  -- A requester may edit an uncompleted request or cancel it, but cannot
  -- assign a helper, complete it, or mutate completion timestamps.
  if old.requester_id = caller then
    if old.status not in ('draft', 'open', 'flagged')
      or new.status not in ('draft', 'open', 'flagged', 'cancelled')
      or new.helper_id is distinct from old.helper_id
      or new.completed_at is distinct from old.completed_at
      or (new.status = 'cancelled' and new.cancelled_at is null)
      or (new.status <> 'cancelled' and new.cancelled_at is distinct from old.cancelled_at) then
      raise exception 'Invalid requester mission transition';
    end if;
    return new;
  end if;

  -- Claiming changes only helper and status.
  if old.status = 'open'
    and old.helper_id is null
    and old.requester_id <> caller
    and new.helper_id = caller
    and new.status = 'matched'
    and (new_payload - array['helper_id', 'status']) = (old_payload - array['helper_id', 'status']) then
    return new;
  end if;

  -- Assigned helpers can only advance the state machine. Mission content and
  -- ownership remain immutable once a helper is matched.
  if old.helper_id = caller
    and new.helper_id = caller
    and (new_payload - array['status', 'completed_at']) = (old_payload - array['status', 'completed_at'])
    and (
      (old.status = 'matched' and new.status = 'in_progress' and new.completed_at is null)
      or (old.status = 'in_progress' and new.status = 'completed' and new.completed_at is not null)
    ) then
    return new;
  end if;

  raise exception 'Invalid mission update';
end;
$$;
revoke execute on function private.enforce_mission_update() from public, anon, authenticated;

create trigger missions_enforce_update
before update on public.missions
for each row execute function private.enforce_mission_update();

-- Audit events are generated by the database, never trusted from the browser.
revoke insert on public.mission_events from authenticated;
drop policy "participants can append mission history" on public.mission_events;

create or replace function private.record_mission_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_name text;
begin
  if tg_op = 'INSERT' then
    event_name := case new.status
      when 'open' then 'published'
      when 'flagged' then 'flagged'
      else 'created'
    end;
  elsif new.status is distinct from old.status then
    event_name := case new.status
      when 'open' then 'published'
      when 'matched' then 'matched'
      when 'in_progress' then 'started'
      when 'completed' then 'completed'
      when 'cancelled' then 'cancelled'
      when 'flagged' then 'flagged'
      else null
    end;
  end if;

  if event_name is not null then
    insert into public.mission_events (mission_id, actor_id, event_type, metadata)
    values (
      new.id,
      (select auth.uid()),
      event_name,
      jsonb_build_object('from_status', case when tg_op = 'UPDATE' then old.status::text else null end,
                         'to_status', new.status::text)
    );
  end if;

  return new;
end;
$$;
revoke execute on function private.record_mission_event() from public, anon, authenticated;

create trigger missions_record_event
after insert or update of status on public.missions
for each row execute function private.record_mission_event();

-- Browser users cannot impersonate system messages.
drop policy "participants can send mission messages" on public.mission_messages;
create policy "participants can send mission messages"
on public.mission_messages for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and is_system = false
  and exists (
    select 1
    from public.missions m
    where m.id = mission_id
      and (
        m.requester_id = (select auth.uid())
        or m.helper_id = (select auth.uid())
        or (select private.is_organiser())
      )
  )
);

-- Useful integrity limits for user-visible notification content.
alter table public.notifications
  add constraint notifications_title_length check (char_length(title) between 1 and 120),
  add constraint notifications_body_length check (char_length(body) between 1 and 500);

-- Realtime powers live mission status, chat, impact blooms, and notifications.
alter table public.missions replica identity full;
alter table public.mission_messages replica identity full;
alter table public.blooms replica identity full;
alter table public.notifications replica identity full;

do $$
begin
  null;
exception when duplicate_object then null;
end $$;
do $$
begin
  null;
exception when duplicate_object then null;
end $$;
do $$
begin
  null;
exception when duplicate_object then null;
end $$;
do $$
begin
  null;
exception when duplicate_object then null;
end $$;


-- RLS policies execute as the calling role. Expose only a harmless invoker
-- predicate for policy checks; keep privileged helpers in the private schema.
create or replace function public.is_organiser()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'organiser'
  );
$$;
revoke all on function public.is_organiser() from public;
grant execute on function public.is_organiser() to authenticated;

alter policy "community mission visibility" on public.missions
using (
  status = 'open'
  or requester_id = (select auth.uid())
  or helper_id = (select auth.uid())
  or (select public.is_organiser())
);

alter policy "create a valid community mission" on public.missions
with check (
  (select public.is_organiser())
  or (
    requester_id = (select auth.uid())
    and helper_id is null
    and organiser_id is null
    and status in ('draft', 'open', 'flagged')
    and completed_at is null
    and cancelled_at is null
  )
);

alter policy "valid participant mission updates" on public.missions
using (
  (select public.is_organiser())
  or requester_id = (select auth.uid())
  or helper_id = (select auth.uid())
  or (
    status = 'open'
    and helper_id is null
    and requester_id <> (select auth.uid())
  )
)
with check (
  (select public.is_organiser())
  or requester_id = (select auth.uid())
  or helper_id = (select auth.uid())
);

alter policy "participants can read mission messages" on public.mission_messages
using (
  exists (
    select 1
    from public.missions m
    where m.id = mission_id
      and (
        m.requester_id = (select auth.uid())
        or m.helper_id = (select auth.uid())
        or (select public.is_organiser())
      )
  )
);

alter policy "participants can send mission messages" on public.mission_messages
with check (
  sender_id = (select auth.uid())
  and is_system = false
  and exists (
    select 1
    from public.missions m
    where m.id = mission_id
      and (
        m.requester_id = (select auth.uid())
        or m.helper_id = (select auth.uid())
        or (select public.is_organiser())
      )
  )
);

alter policy "participants can read mission history" on public.mission_events
using (
  exists (
    select 1
    from public.missions m
    where m.id = mission_id
      and (
        m.requester_id = (select auth.uid())
        or m.helper_id = (select auth.uid())
        or (select public.is_organiser())
      )
  )
);

alter policy "helpers manage their availability" on public.helper_availability
using (helper_id = (select auth.uid()) or (select public.is_organiser()))
with check (helper_id = (select auth.uid()) or (select public.is_organiser()));

-- Anonymous users only see stories with explicit sharing consent. Authenticated
-- participants additionally see their own private story before publication.
drop policy "blooms are public when consented" on public.blooms;
create policy "public consented blooms"
on public.blooms for select to anon
using (consent_to_share = true);
create policy "community bloom visibility"
on public.blooms for select to authenticated
using (
  consent_to_share = true
  or exists (
    select 1
    from public.missions m
    where m.id = mission_id
      and (
        m.requester_id = (select auth.uid())
        or m.helper_id = (select auth.uid())
        or (select public.is_organiser())
      )
  )
);

alter policy "participants can create a bloom" on public.blooms
with check (
  exists (
    select 1
    from public.missions m
    where m.id = mission_id
      and m.status = 'completed'
      and (
        m.requester_id = (select auth.uid())
        or m.helper_id = (select auth.uid())
        or (select public.is_organiser())
      )
  )
);


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


-- Distinguish an authenticated account from a resident who has completed the
-- community profile. Product routes use this state to require onboarding.
alter table public.profiles
  add column onboarded_at timestamptz;

grant select (onboarded_at) on public.profiles to authenticated;
grant update (onboarded_at) on public.profiles to authenticated;


-- Turn real mission lifecycle changes into private, account-scoped alerts.
create or replace function private.notify_mission_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  helper_name text;
begin
  if tg_op = 'INSERT' then
    if new.status = 'flagged' then
      insert into public.notifications (recipient_id, mission_id, title, body)
      select p.id, new.id, 'Mission needs review', new.title
      from public.profiles p
      where p.role = 'organiser';
    end if;
    return new;
  end if;

  if old.status = 'open' and new.status = 'matched' then
    select p.full_name into helper_name
    from public.profiles p
    where p.id = new.helper_id;

    insert into public.notifications (recipient_id, mission_id, title, body)
    values (new.requester_id, new.id, 'Your Kaki is ready', coalesce(helper_name, 'A neighbour') || ' accepted “' || new.title || '”.');
  elsif old.status = 'matched' and new.status = 'in_progress' then
    insert into public.notifications (recipient_id, mission_id, title, body)
    values (new.requester_id, new.id, 'Your mission has started', 'Your Kaki started “' || new.title || '”.');
  elsif old.status = 'in_progress' and new.status = 'completed' then
    insert into public.notifications (recipient_id, mission_id, title, body)
    values (new.requester_id, new.id, 'A neighbour moment bloomed', '“' || new.title || '” is complete. Thank you for growing the kampung.');
  end if;

  return new;
end;
$$;

revoke all on function private.notify_mission_change() from public;

create trigger missions_notify_after_insert
after insert on public.missions
for each row execute function private.notify_mission_change();

create trigger missions_notify_after_status_update
after update of status on public.missions
for each row execute function private.notify_mission_change();


-- One cloud switch restores normal account-only access, including existing JWTs.
create table public.demo_settings (
  id boolean primary key default true check (id),
  guest_enabled boolean not null default false
);
alter table public.demo_settings enable row level security;
insert into public.demo_settings (guest_enabled) values (true);
grant select on public.demo_settings to anon, authenticated;
create policy "read demo switch" on public.demo_settings for select to anon, authenticated using (true);

create function public.guest_access_allowed() returns boolean
language sql stable security invoker set search_path = '' as $$
  select not coalesce((auth.jwt()->>'is_anonymous')::boolean, false)
    or exists(select 1 from public.demo_settings where guest_enabled);
$$;
revoke all on function public.guest_access_allowed() from public;
grant execute on function public.guest_access_allowed() to authenticated;

do $$ declare t text; begin
  foreach t in array array['profiles','missions','mission_messages','mission_events','helper_availability','blooms','notifications'] loop
    execute format('create policy "guest event access" on public.%I as restrictive for all to authenticated using ((select public.guest_access_allowed())) with check ((select public.guest_access_allowed()))', t);
  end loop;
end $$;

alter table public.profiles add column is_guest boolean not null default false;
grant select (is_guest) on public.profiles to authenticated;
create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.is_anonymous and not exists(select 1 from public.demo_settings where guest_enabled) then
    raise exception 'Guest event has ended';
  end if;
  insert into public.profiles(id,full_name,preferred_language,spoken_languages,is_guest,onboarded_at)
  values(new.id,
    case when new.is_anonymous then 'Kaki ' || upper(left(new.id::text, 6))
      else coalesce(nullif(new.raw_user_meta_data->>'full_name',''),'New Kaki') end,
    case when new.is_anonymous then 'Not specified' else 'English' end,
    case when new.is_anonymous then array[]::text[] else array['English'] end,
    coalesce(new.is_anonymous,false), case when new.is_anonymous then now() else null end);
  return new;
end $$;

alter table public.missions add column is_demo boolean not null default false;
create function private.guard_mission_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return new; end if;
  new.is_demo := coalesce((auth.jwt()->>'is_anonymous')::boolean,false);
  new.created_at := now();
  if new.is_demo then
    perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
    if (select count(*) from public.missions where requester_id=auth.uid() and created_at > now()-interval '15 minutes') >= 3 then
      raise exception 'Please wait: guests can publish three requests every 15 minutes';
    end if;
  end if;
  return new;
end $$;
revoke all on function private.guard_mission_insert() from public, anon, authenticated;
create trigger missions_guard_insert before insert on public.missions for each row execute function private.guard_mission_insert();

-- Each person can attest only their own arrival and sharing consent.
create table public.mission_presence (
  mission_id uuid not null references public.missions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  on_way_at timestamptz,
  arrived_at timestamptz,
  consent_to_share boolean not null default false,
  reflection text not null default '' check (char_length(reflection)=0 or char_length(reflection) between 3 and 500),
  primary key(mission_id,user_id)
);
create index mission_presence_user_idx on public.mission_presence(user_id);
alter table public.mission_presence enable row level security;
grant select,insert,update on public.mission_presence to authenticated;
create policy "participants see arrival" on public.mission_presence for select to authenticated using (
  exists(select 1 from public.missions m where m.id=mission_id and (m.requester_id=(select auth.uid()) or m.helper_id=(select auth.uid()) or (select public.is_organiser())))
);
create policy "own arrival insert" on public.mission_presence for insert to authenticated with check (
  user_id=(select auth.uid()) and exists(select 1 from public.missions m where m.id=mission_id and m.status in ('matched','in_progress') and (m.requester_id=(select auth.uid()) or m.helper_id=(select auth.uid())))
);
create policy "own arrival update" on public.mission_presence for update to authenticated using (user_id=(select auth.uid())) with check (
  user_id=(select auth.uid()) and exists(select 1 from public.missions m where m.id=mission_id and m.status in ('matched','in_progress') and (m.requester_id=(select auth.uid()) or m.helper_id=(select auth.uid())))
);
create policy "guest event access" on public.mission_presence as restrictive for all to authenticated using ((select public.guest_access_allowed())) with check ((select public.guest_access_allowed()));

create function private.guard_presence() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Lock the mission too: completion cannot race a participant's consent update.
  perform 1 from public.missions where id=new.mission_id and status in ('matched','in_progress') for update;
  if not found then raise exception 'This mission is not awaiting check-in'; end if;
  if tg_op='UPDATE' then
    if new.mission_id<>old.mission_id or new.user_id<>old.user_id then raise exception 'Cannot move a check-in'; end if;
    new.on_way_at := coalesce(old.on_way_at,case when new.on_way_at is not null then now() end);
    new.arrived_at := coalesce(old.arrived_at,case when new.arrived_at is not null then now() end);
  else
    new.on_way_at := case when new.on_way_at is not null then now() end;
    new.arrived_at := case when new.arrived_at is not null then now() end;
  end if;
  return new;
end $$;
revoke all on function private.guard_presence() from public, anon, authenticated;
create trigger presence_guard before insert or update on public.mission_presence for each row execute function private.guard_presence();

create function private.require_two_checkins() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and new.is_demo is distinct from old.is_demo then
    raise exception 'The demo marker cannot be changed';
  end if;
  if old.status='matched' and new.status='in_progress' and
    (select count(*) from public.mission_presence where mission_id=new.id and user_id in (new.requester_id,new.helper_id) and arrived_at is not null) <> 2 then
    raise exception 'Both neighbours need to check in before starting';
  end if;
  return new;
end $$;
revoke all on function private.require_two_checkins() from public, anon, authenticated;
create trigger missions_require_checkins before update on public.missions for each row execute function private.require_two_checkins();

-- Completion and Bloom creation are one transaction, even for direct API callers.
revoke insert on public.blooms from authenticated;
create function private.grow_bloom() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.status<>'completed' and new.status='completed' then
    insert into public.blooms(mission_id,category,title,story,participant_names,consent_to_share)
    values(new.id,new.category,new.title,coalesce((select nullif(reflection,'') from public.mission_presence where mission_id=new.id and user_id=new.helper_id),'Two neighbours shared one small, meaningful moment.'),
      array(select case when is_guest and full_name ~ '^Kaki [A-F0-9]{6}$' then full_name else split_part(full_name,' ',1) end from public.profiles where id in (new.requester_id,new.helper_id) order by id),
      (select count(*)=2 and bool_and(consent_to_share) from public.mission_presence where mission_id=new.id and user_id in (new.requester_id,new.helper_id)));
  end if;
  return new;
end $$;
revoke all on function private.grow_bloom() from public, anon, authenticated;
create trigger missions_grow_bloom after update of status on public.missions for each row execute function private.grow_bloom();

-- Shared, atomic AI quota works across Vercel instances. No client-supplied limits.
create table private.ai_usage (bucket text primary key, window_start timestamptz not null, used integer not null);
alter table private.ai_usage enable row level security;
create function private.take_ai_quota() returns boolean
language plpgsql security definer set search_path = '' as $$
declare n integer; k text;
begin
  if auth.uid() is null or not public.guest_access_allowed() then return false; end if;
  -- Check per-user first: one exhausted guest must not drain the shared quota.
  foreach k in array array[auth.uid()::text,'global'] loop
    insert into private.ai_usage values(k,date_trunc('hour',now()),1)
    on conflict(bucket) do update set window_start=date_trunc('hour',now()),
      used=case when ai_usage.window_start=date_trunc('hour',now()) then ai_usage.used+1 else 1 end
    returning used into n;
    if n > (case when k='global' then 1000 else 60 end) then return false; end if;
  end loop;
  return true;
end $$;
revoke all on function private.take_ai_quota() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.take_ai_quota() to authenticated;
create function public.take_ai_quota() returns boolean language sql security invoker set search_path='' as $$ select private.take_ai_quota(); $$;
revoke all on function public.take_ai_quota() from public, anon;
grant execute on function public.take_ai_quota() to authenticated;


-- Preserve ownership, history and participant privacy when plans change.
create or replace function private.enforce_mission_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  old_payload jsonb := to_jsonb(old) - array['updated_at'];
  new_payload jsonb := to_jsonb(new) - array['updated_at'];
begin
  -- Trusted database maintenance and service-role work has no user JWT.
  if caller is null or (select private.is_organiser()) then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.requester_id is distinct from old.requester_id
    or new.organiser_id is distinct from old.organiser_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Mission ownership fields cannot be changed';
  end if;

  -- Cancellation is an atomic, participant-only terminal transition.
  if new.status = 'cancelled' then
    if old.status not in ('draft','open','flagged','matched','in_progress')
      or (caller is distinct from old.requester_id and caller is distinct from old.helper_id)
      or (new_payload - array['status','cancelled_at']) <> (old_payload - array['status','cancelled_at']) then
      raise exception 'Only participants can leave an active request';
    end if;
    new.cancelled_at := now();
    return new;
  end if;

  -- A requester may edit an uncompleted request or cancel it, but cannot
  -- assign a helper, complete it, or mutate completion timestamps.
  if old.requester_id = caller then
    if old.status not in ('draft', 'open', 'flagged')
      or new.status not in ('draft', 'open', 'flagged', 'cancelled')
      or new.helper_id is distinct from old.helper_id
      or new.completed_at is distinct from old.completed_at
      or (new.status = 'cancelled' and new.cancelled_at is null)
      or (new.status <> 'cancelled' and new.cancelled_at is distinct from old.cancelled_at) then
      raise exception 'Invalid requester mission transition';
    end if;
    return new;
  end if;

  -- Claiming changes only helper and status.
  if old.status = 'open'
    and old.helper_id is null
    and old.requester_id <> caller
    and new.helper_id = caller
    and new.status = 'matched'
    and (new_payload - array['helper_id', 'status']) = (old_payload - array['helper_id', 'status']) then
    return new;
  end if;

  -- Assigned helpers can only advance the state machine. Mission content and
  -- ownership remain immutable once a helper is matched.
  if old.helper_id = caller
    and new.helper_id = caller
    and (new_payload - array['status', 'completed_at']) = (old_payload - array['status', 'completed_at'])
    and (
      (old.status = 'matched' and new.status = 'in_progress' and new.completed_at is null)
      or (old.status = 'in_progress' and new.status = 'completed' and new.completed_at is not null)
    ) then
    return new;
  end if;

  raise exception 'Invalid mission update';
end;
$$;
revoke execute on function private.enforce_mission_update() from public, anon, authenticated;

create or replace function private.notify_mission_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  helper_name text;
begin
  if tg_op = 'INSERT' then
    if new.status = 'flagged' then
      insert into public.notifications (recipient_id, mission_id, title, body)
      select p.id, new.id, 'Mission needs review', new.title
      from public.profiles p
      where p.role = 'organiser';
    end if;
    return new;
  end if;

  if old.status = 'open' and new.status = 'matched' then
    select p.full_name into helper_name
    from public.profiles p
    where p.id = new.helper_id;

    insert into public.notifications (recipient_id, mission_id, title, body)
    values (new.requester_id, new.id, 'Your Kaki is ready', coalesce(helper_name, 'A neighbour') || ' accepted “' || new.title || '”.');
  elsif old.status <> 'cancelled' and new.status = 'cancelled' then
    insert into public.notifications (recipient_id, mission_id, title, body)
    select participant, new.id, 'Plans changed — no worries',
      '“' || new.title || '” has been cancelled. Your neighbour cannot continue. No need to travel; you can connect again another time.'
    from unnest(array[new.requester_id,new.helper_id]) as participant
    where participant is not null and participant is distinct from (select auth.uid());
  elsif old.status = 'matched' and new.status = 'in_progress' then
    insert into public.notifications (recipient_id, mission_id, title, body)
    values (new.requester_id, new.id, 'Your mission has started', 'Your Kaki started “' || new.title || '”.');
  elsif old.status = 'in_progress' and new.status = 'completed' then
    insert into public.notifications (recipient_id, mission_id, title, body)
    values (new.requester_id, new.id, 'A neighbour moment bloomed', '“' || new.title || '” is complete. Thank you for growing the kampung.');
  end if;

  return new;
end;
$$;

revoke all on function private.notify_mission_change() from public;


create table kaki_auth.sessions (
 token_hash text primary key, user_id uuid not null references kaki_auth.users(id) on delete cascade,
 expires_at timestamptz not null, created_at timestamptz not null default now()
);
create index sessions_expiry_idx on kaki_auth.sessions(expires_at);
create table kaki_auth.rate_limits (bucket text primary key, window_start timestamptz not null, used integer not null);
create function kaki_auth.account(email_arg text) returns table(id uuid,password_hash text)
language sql security definer set search_path='' as $$
 select id,password_hash from kaki_auth.users where email=lower(email_arg) and not is_anonymous
$$;
create function kaki_auth.register(email_arg text, password_arg text, name_arg text, guest_arg boolean) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 insert into kaki_auth.users(email,password_hash,raw_user_meta_data,is_anonymous)
 values(case when guest_arg then null else lower(email_arg) end,case when guest_arg then null else password_arg end,
 jsonb_build_object('full_name',name_arg),guest_arg) returning id into result;
 return result;
end $$;
create function kaki_auth.issue_session(hash_arg text, user_arg uuid) returns void
language sql security definer set search_path='' as $$
 insert into kaki_auth.sessions(token_hash,user_id,expires_at) values(hash_arg,user_arg,now()+interval '7 days')
$$;
create function kaki_auth.resolve_session(hash_arg text) returns table(sub uuid,is_anonymous boolean)
language sql security definer set search_path='' as $$
 select u.id,u.is_anonymous from kaki_auth.sessions s join kaki_auth.users u on u.id=s.user_id
 where s.token_hash=hash_arg and s.expires_at>now()
 and (not u.is_anonymous or exists(select 1 from public.demo_settings where guest_enabled))
$$;
create function kaki_auth.revoke_session(hash_arg text) returns void
language sql security definer set search_path='' as $$ delete from kaki_auth.sessions where token_hash=hash_arg $$;
create function kaki_auth.take_rate_limit(bucket_arg text, limit_arg integer) returns boolean
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 insert into kaki_auth.rate_limits values(bucket_arg,date_trunc('hour',now()),1)
 on conflict(bucket) do update set window_start=date_trunc('hour',now()),
 used=case when rate_limits.window_start=date_trunc('hour',now()) then rate_limits.used+1 else 1 end
 returning used into n;
 return n<=limit_arg;
end $$;
revoke all on all tables in schema kaki_auth from public,anon,authenticated,kaki_app;
revoke all on all functions in schema kaki_auth from public,anon,authenticated;
grant execute on function kaki_auth.jwt(),kaki_auth.uid() to anon,authenticated;
grant execute on function kaki_auth.account(text),kaki_auth.register(text,text,text,boolean),kaki_auth.issue_session(text,uuid),kaki_auth.resolve_session(text),kaki_auth.revoke_session(text),kaki_auth.take_rate_limit(text,integer) to kaki_app;
-- All identity data and rate counters are reachable only through server-side functions.
