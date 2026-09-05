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
