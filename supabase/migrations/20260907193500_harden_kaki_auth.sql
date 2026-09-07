-- Backend identity tables are reachable only through security-definer functions.
-- RLS adds a second barrier if this schema is ever exposed through the Data API.
alter table kaki_auth.users enable row level security;
alter table kaki_auth.sessions enable row level security;
alter table kaki_auth.rate_limits enable row level security;

create index sessions_user_id_idx on kaki_auth.sessions(user_id);

create or replace function kaki_auth.jwt() returns jsonb
language sql stable
set search_path = ''
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;

create or replace function kaki_auth.uid() returns uuid
language sql stable
set search_path = ''
as $$
  select (kaki_auth.jwt() ->> 'sub')::uuid
$$;

revoke all on function kaki_auth.jwt(), kaki_auth.uid() from public;
grant execute on function kaki_auth.jwt(), kaki_auth.uid() to anon, authenticated;
