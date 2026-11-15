alter table public.now_guild_members
  add column rank_slot integer
    constraint now_guild_valid_slot check (rank_slot between 1 and 20)
    constraint now_guild_unique_slot unique;

create or replace function guild_roster.list_nicknames()
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
  join public.board_profiles as p on p.user_id = m.user_id
  where m.rank_slot is null;
$$;

create function guild_roster.lineup()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('nickname', p.nickname, 'slot', m.rank_slot)
      order by m.rank_slot nulls last, m.joined_at, p.nickname, m.user_id
    ),
    '[]'::jsonb
  )
  from public.now_guild_members as m
  join public.board_profiles as p on p.user_id = m.user_id;
$$;

create function guild_roster.admin_members()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.board_admin_code_authorized() then
    raise exception '운영자 인증이 필요합니다.' using errcode = '42501';
  end if;

  return (
    select coalesce(
      pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'id', m.user_id, 'nickname', p.nickname, 'slot', m.rank_slot, 'joined_at', m.joined_at
        )
        order by m.rank_slot nulls last, m.joined_at, p.nickname, m.user_id
      ),
      '[]'::jsonb
    )
    from public.now_guild_members as m
    join public.board_profiles as p on p.user_id = m.user_id
  );
end;
$$;

create function guild_roster.manage_member(
  p_member_id uuid, p_joined_at timestamptz, p_expected_slot integer, p_new_slot integer, p_remove boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.board_admin_code_authorized() then
    raise exception '운영자 인증이 필요합니다.' using errcode = '42501';
  end if;

  if p_remove then
    delete from public.now_guild_members
    where user_id = p_member_id and joined_at = p_joined_at
      and rank_slot is not distinct from p_expected_slot;
  else
    update public.now_guild_members
    set rank_slot = p_new_slot
    where user_id = p_member_id and joined_at = p_joined_at
      and rank_slot is not distinct from p_expected_slot;
  end if;

  if not found then
    raise exception '길드원 정보가 바뀌었어요. 명단을 새로고침해 주세요.';
  end if;
end;
$$;

create function public.now_guild_lineup()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select guild_roster.lineup();
$$;

create function public.now_guild_admin_members()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select guild_roster.admin_members();
$$;

create function public.now_guild_manage_member(
  p_member_id uuid, p_joined_at timestamptz, p_expected_slot integer, p_new_slot integer, p_remove boolean
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select guild_roster.manage_member($1, $2, $3, $4, $5);
$$;

revoke all on function guild_roster.lineup(), public.now_guild_lineup() from public, anon, authenticated;
grant execute on function guild_roster.lineup(), public.now_guild_lineup() to anon, authenticated;

revoke all on function guild_roster.admin_members(), public.now_guild_admin_members(),
  guild_roster.manage_member(uuid, timestamptz, integer, integer, boolean),
  public.now_guild_manage_member(uuid, timestamptz, integer, integer, boolean)
  from public, anon, authenticated;
grant execute on function guild_roster.admin_members(), public.now_guild_admin_members(),
  guild_roster.manage_member(uuid, timestamptz, integer, integer, boolean),
  public.now_guild_manage_member(uuid, timestamptz, integer, integer, boolean)
  to authenticated;
