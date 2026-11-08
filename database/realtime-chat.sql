-- Mind Search realtime chat schema. No changes to existing board tables.
create table if not exists public.chat_messages (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 nickname text not null check (
   char_length(btrim(nickname)) between 2 and 24
   and lower(btrim(nickname)) not in ('운영자','관리자','admin','administrator','moderator','mind search')
 ),
 body text not null check (char_length(btrim(body)) between 1 and 500),
 created_at timestamptz not null default now()
);
create index if not exists chat_messages_recent_idx on public.chat_messages(created_at desc);
create index if not exists chat_messages_owner_idx on public.chat_messages(user_id,created_at desc);
alter table public.chat_messages enable row level security;
revoke all on public.chat_messages from anon, authenticated;
grant select, insert, delete on public.chat_messages to authenticated;
grant usage, select on sequence public.chat_messages_id_seq to authenticated;
create policy "chat read signed in" on public.chat_messages for select to authenticated using (true);
create policy "chat insert own" on public.chat_messages for insert to authenticated
 with check ((select auth.uid())=user_id and char_length(btrim(body)) between 1 and 500);
create policy "chat delete own or admin" on public.chat_messages for delete to authenticated
 using ((select auth.uid())=user_id or exists(select 1 from public.board_admins a where a.user_id=(select auth.uid())));
create schema if not exists private;
create or replace function private.chat_message_guard() returns trigger language plpgsql
 set search_path = '' as $$
begin
 if new.user_id is distinct from auth.uid() then raise exception 'Invalid chat author'; end if;
 if exists(select 1 from public.chat_messages
   where user_id=new.user_id and created_at > now()-interval '5 seconds') then
   raise exception 'Please wait 5 seconds between messages'; end if;
 if (select count(*) from public.chat_messages
   where user_id=new.user_id and created_at > now()-interval '1 hour') >= 60 then
   raise exception 'Hourly message limit reached'; end if;
 return new;
end $$;
revoke all on function private.chat_message_guard() from public, anon, authenticated;
drop trigger if exists chat_message_guard_trigger on public.chat_messages;
create trigger chat_message_guard_trigger before insert on public.chat_messages
 for each row execute function private.chat_message_guard();
do $$ begin
 if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='chat_messages') then
  alter publication supabase_realtime add table public.chat_messages;
 end if;
end $$;
