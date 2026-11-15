begin;

alter table public.chat_messages add column guild_title text;

alter table public.chat_messages
  drop constraint chat_messages_nickname_check,
  add constraint chat_messages_nickname_check check (
    char_length(btrim(nickname)) between 2 and 30
    and lower(btrim(nickname)) not in ('운영자','관리자','admin','administrator','moderator','mind search')
  );

create or replace function private.chat_message_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  canonical_id uuid := public.board_canonical_user_id();
  guild_nickname text;
begin
  if canonical_id is null or new.user_id is distinct from canonical_id then
    raise exception 'Invalid chat author';
  end if;
  if exists (select 1 from public.chat_messages
    where user_id=new.user_id and created_at > now()-interval '5 seconds') then
    raise exception 'Please wait 5 seconds between messages';
  end if;
  if (select count(*) from public.chat_messages
    where user_id=new.user_id and created_at > now()-interval '1 hour') >= 60 then
    raise exception 'Hourly message limit reached';
  end if;

  -- Snapshot the member's current title and registered nickname for this message.
  select coalesce((array[
    '길드장','부길드장','부길드장','장로','장로','장로',
    '청룡','백호','주작','현무',
    '지혜제일','신통제일','두타제일','천안제일','해공제일',
    '설법제일','논의제일','지계제일','밀행제일','다문제일'
  ])[m.rank_slot], '길드원'), p.nickname
  into new.guild_title, guild_nickname
  from public.now_guild_members m
  join public.board_profiles p on p.user_id=m.user_id
  where m.user_id=canonical_id;

  if new.guild_title is not null then
    new.nickname := guild_nickname;
  end if;
  return new;
end;
$$;

commit;
