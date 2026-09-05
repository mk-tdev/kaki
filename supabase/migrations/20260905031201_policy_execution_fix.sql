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
