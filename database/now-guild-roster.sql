alter policy "Members can read their own membership"
  on public.now_guild_members
  using (user_id = (select public.board_canonical_user_id()));

alter policy "Users can enroll their own profile"
  on public.now_guild_members
  with check (user_id = (select public.board_canonical_user_id()));

create function public.now_guild_join()
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.now_guild_members (user_id)
  values (public.board_canonical_user_id())
  on conflict (user_id) do nothing;
$$;

revoke all on function public.now_guild_join() from public, anon, authenticated;
grant execute on function public.now_guild_join() to authenticated;

create schema guild_roster;
revoke all on schema guild_roster from public;
grant usage on schema guild_roster to anon, authenticated;

create function guild_roster.list_nicknames()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    pg_catalog.jsonb_agg(p.nickname order by m.joined_at, p.nickname, m.user_id),
    '[]'::jsonb
  )
  from public.now_guild_members as m
  join public.board_profiles as p on p.user_id = m.user_id;
$$;

revoke all on function guild_roster.list_nicknames() from public, anon, authenticated;
grant execute on function guild_roster.list_nicknames() to anon, authenticated;

create function public.now_guild_roster()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select guild_roster.list_nicknames();
$$;

revoke all on function public.now_guild_roster() from public, anon, authenticated;
grant execute on function public.now_guild_roster() to anon, authenticated;
