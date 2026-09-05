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
