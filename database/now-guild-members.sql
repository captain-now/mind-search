create table public.now_guild_members (
  user_id uuid primary key references public.board_profiles (user_id) on delete cascade,
  joined_at timestamptz not null default now()
);

alter table public.now_guild_members enable row level security;

revoke all on table public.now_guild_members from public, anon, authenticated;
grant select, insert (user_id) on public.now_guild_members to authenticated;

create policy "Members can read their own membership"
  on public.now_guild_members for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can enroll their own profile"
  on public.now_guild_members for insert to authenticated
  with check (user_id = (select auth.uid()));

create function public.board_register_nickname_and_join_guild(p_nickname text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  member_id uuid := auth.uid();
begin
  insert into public.board_profiles (user_id, nickname)
  values (member_id, p_nickname);

  insert into public.now_guild_members (user_id)
  values (member_id);
end;
$$;

revoke execute on function public.board_register_nickname_and_join_guild(text)
  from public, anon, authenticated;
grant execute on function public.board_register_nickname_and_join_guild(text)
  to authenticated;
