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
