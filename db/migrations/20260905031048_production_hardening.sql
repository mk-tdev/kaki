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
