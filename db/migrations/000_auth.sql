-- App-owned identity schema. These are local PostgreSQL functions, not Supabase services.
create role anon nologin;
create role authenticated nologin;
create role kaki_app nologin noinherit;
grant anon, authenticated to kaki_app;
create schema auth;
revoke all on schema auth from public;
create table auth.users (
 id uuid primary key default gen_random_uuid(),
 email text unique, password_hash text,
 raw_user_meta_data jsonb not null default '{}',
 is_anonymous boolean not null default false,
 created_at timestamptz not null default now()
);
create function auth.jwt() returns jsonb language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb
$$;
create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
grant usage on schema auth to anon, authenticated, kaki_app;
revoke all on all functions in schema auth from public;
grant execute on function auth.jwt(), auth.uid() to anon, authenticated;
