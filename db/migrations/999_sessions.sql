create table auth.sessions (
 token_hash text primary key, user_id uuid not null references auth.users(id) on delete cascade,
 expires_at timestamptz not null, created_at timestamptz not null default now()
);
create index sessions_expiry_idx on auth.sessions(expires_at);
create table auth.rate_limits (bucket text primary key, window_start timestamptz not null, used integer not null);
create function auth.account(email_arg text) returns table(id uuid,password_hash text)
language sql security definer set search_path='' as $$
 select id,password_hash from auth.users where email=lower(email_arg) and not is_anonymous
$$;
create function auth.register(email_arg text, password_arg text, name_arg text, guest_arg boolean) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 insert into auth.users(email,password_hash,raw_user_meta_data,is_anonymous)
 values(case when guest_arg then null else lower(email_arg) end,case when guest_arg then null else password_arg end,
 jsonb_build_object('full_name',name_arg),guest_arg) returning id into result;
 return result;
end $$;
create function auth.issue_session(hash_arg text, user_arg uuid) returns void
language sql security definer set search_path='' as $$
 insert into auth.sessions(token_hash,user_id,expires_at) values(hash_arg,user_arg,now()+interval '7 days')
$$;
create function auth.resolve_session(hash_arg text) returns table(sub uuid,is_anonymous boolean)
language sql security definer set search_path='' as $$
 select u.id,u.is_anonymous from auth.sessions s join auth.users u on u.id=s.user_id
 where s.token_hash=hash_arg and s.expires_at>now()
 and (not u.is_anonymous or exists(select 1 from public.demo_settings where guest_enabled))
$$;
create function auth.revoke_session(hash_arg text) returns void
language sql security definer set search_path='' as $$ delete from auth.sessions where token_hash=hash_arg $$;
create function auth.take_rate_limit(bucket_arg text, limit_arg integer) returns boolean
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 insert into auth.rate_limits values(bucket_arg,date_trunc('hour',now()),1)
 on conflict(bucket) do update set window_start=date_trunc('hour',now()),
 used=case when rate_limits.window_start=date_trunc('hour',now()) then rate_limits.used+1 else 1 end
 returning used into n;
 return n<=limit_arg;
end $$;
revoke all on all tables in schema auth from public,anon,authenticated,kaki_app;
revoke all on all functions in schema auth from public,anon,authenticated;
grant execute on function auth.jwt(),auth.uid() to anon,authenticated;
grant execute on function auth.account(text),auth.register(text,text,text,boolean),auth.issue_session(text,uuid),auth.resolve_session(text),auth.revoke_session(text),auth.take_rate_limit(text,integer) to kaki_app;
-- All identity data and rate counters are reachable only through server-side functions.
