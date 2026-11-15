begin;

create table private.board_nickname_change_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  old_nickname text not null,
  new_nickname text not null check (char_length(new_nickname) between 2 and 30),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);
create unique index board_nickname_one_pending
  on private.board_nickname_change_requests (user_id) where status='pending';
create index board_nickname_request_history
  on private.board_nickname_change_requests (user_id, created_at desc);
alter table private.board_nickname_change_requests enable row level security;
revoke all on private.board_nickname_change_requests from public, anon, authenticated;

-- Preserve the approval requirement if someone deletes only their nickname.
create table private.board_removed_nicknames (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null
);
alter table private.board_removed_nicknames enable row level security;
revoke all on private.board_removed_nicknames from public, anon, authenticated;

create function private.board_guard_nickname_registration()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  account_id uuid := case when tg_op='DELETE' then old.user_id else new.user_id end;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('board-nickname:' || account_id, 0));
  if tg_op='DELETE' then
    if exists (select 1 from auth.users where id=account_id) then
      insert into private.board_removed_nicknames (user_id,nickname)
      values (account_id,old.nickname)
      on conflict (user_id) do update set nickname=excluded.nickname;
    end if;
    return old;
  end if;
  if exists (select 1 from private.board_removed_nicknames where user_id=account_id) then
    raise exception '새 고유이름은 관리자 승인을 받아야 합니다.';
  end if;
  return new;
end;
$$;
revoke all on function private.board_guard_nickname_registration() from public, anon, authenticated;
create trigger board_nickname_registration_guard
before insert or delete on public.board_profiles
for each row execute function private.board_guard_nickname_registration();

create function private.board_nickname_change_status()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  account_id uuid := public.board_canonical_user_id();
begin
  if account_id is null then raise exception '인증이 필요합니다.'; end if;
  return jsonb_build_object(
    'removed_nickname', (select nickname from private.board_removed_nicknames where user_id=account_id),
    'request', (
      select jsonb_build_object('new_nickname',new_nickname,'status',status)
      from private.board_nickname_change_requests
      where user_id=account_id order by created_at desc,id desc limit 1
    )
  );
end;
$$;

create function private.board_request_nickname_change(p_nickname text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  account_id uuid := public.board_canonical_user_id();
  previous_name text;
  requested_name text := btrim(p_nickname);
begin
  if account_id is null then raise exception '인증이 필요합니다.'; end if;
  if requested_name is null or char_length(requested_name) not between 2 and 30 then
    raise exception '새 고유이름을 2~30자로 입력해 주세요.';
  end if;
  select nickname into previous_name from public.board_profiles where user_id=account_id for no key update;
  if previous_name is null then
    select nickname into previous_name from private.board_removed_nicknames where user_id=account_id;
  elsif previous_name=requested_name then
    raise exception '현재 고유이름과 다르게 입력해 주세요.';
  end if;
  if previous_name is null then raise exception '등록한 고유이름이 없습니다.'; end if;
  if exists (select 1 from public.board_profiles where lower(nickname)=lower(requested_name) and user_id<>account_id) then
    raise exception '이미 사용 중인 고유이름입니다.';
  end if;
  insert into private.board_nickname_change_requests (user_id,old_nickname,new_nickname)
  values (account_id,previous_name,requested_name)
  on conflict (user_id) where status='pending' do nothing;
  if not found then raise exception '이미 승인 대기 중인 신청이 있습니다.'; end if;
end;
$$;

create function private.board_admin_nickname_change_requests()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.board_admin_code_authorized() then
    raise exception '운영자 권한이 없습니다.' using errcode='42501';
  end if;
  return (
    select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at,r.id),'[]'::jsonb)
    from (select id,old_nickname,new_nickname,created_at from private.board_nickname_change_requests
          where status='pending' order by created_at,id limit 100) r
  );
end;
$$;

create function private.board_admin_review_nickname_change(p_id uuid,p_approve boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  reviewer uuid := auth.uid();
  request private.board_nickname_change_requests%rowtype;
begin
  if reviewer is null or not public.board_admin_code_authorized() then
    raise exception '운영자 권한이 없습니다.' using errcode='42501';
  end if;
  if p_approve is null then raise exception '승인 여부를 선택해 주세요.'; end if;
  select * into request from private.board_nickname_change_requests
  where id=p_id and status='pending' for update;
  if not found then raise exception '대기 중인 신청이 없습니다.'; end if;
  if p_approve then
    update public.board_profiles set nickname=request.new_nickname
    where user_id=request.user_id and nickname=request.old_nickname;
    if not found then
      delete from private.board_removed_nicknames
      where user_id=request.user_id and nickname=request.old_nickname;
      if not found then raise exception '현재 고유이름이 신청 내용과 다릅니다.'; end if;
      insert into public.board_profiles (user_id,nickname) values (request.user_id,request.new_nickname);
    end if;
    update public.board_posts set nickname=request.new_nickname
    where author_id=request.user_id and nickname=request.old_nickname;
    update public.board_comments set nickname=request.new_nickname
    where author_id=request.user_id and nickname=request.old_nickname;
  end if;
  update private.board_nickname_change_requests
  set status=case when p_approve then 'approved' else 'rejected' end,
      reviewed_at=now(), reviewed_by=reviewer
  where id=request.id;
exception when unique_violation then
  raise exception '새 고유이름을 다른 사람이 사용 중입니다. 신청을 거절한 뒤 다른 이름으로 신청받아 주세요.';
end;
$$;

create function public.board_nickname_change_status()
returns jsonb language sql set search_path = '' as $$ select private.board_nickname_change_status() $$;
create function public.board_request_nickname_change(p_nickname text)
returns void language sql set search_path = '' as $$ select private.board_request_nickname_change(p_nickname) $$;
create function public.board_admin_nickname_change_requests()
returns jsonb language sql set search_path = '' as $$ select private.board_admin_nickname_change_requests() $$;
create function public.board_admin_review_nickname_change(p_id uuid,p_approve boolean)
returns void language sql set search_path = '' as $$ select private.board_admin_review_nickname_change(p_id,p_approve) $$;

revoke all on function
  private.board_nickname_change_status(), private.board_request_nickname_change(text),
  private.board_admin_nickname_change_requests(), private.board_admin_review_nickname_change(uuid,boolean),
  public.board_nickname_change_status(), public.board_request_nickname_change(text),
  public.board_admin_nickname_change_requests(), public.board_admin_review_nickname_change(uuid,boolean)
from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function
  private.board_nickname_change_status(), private.board_request_nickname_change(text),
  private.board_admin_nickname_change_requests(), private.board_admin_review_nickname_change(uuid,boolean),
  public.board_nickname_change_status(), public.board_request_nickname_change(text),
  public.board_admin_nickname_change_requests(), public.board_admin_review_nickname_change(uuid,boolean)
to authenticated;
commit;
