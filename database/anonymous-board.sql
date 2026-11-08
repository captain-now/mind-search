-- mind search public anonymous board — Supabase Postgres
-- Enable Anonymous Sign-ins in Supabase Auth before using this schema.
create table if not exists public.board_posts (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 nickname text not null check (char_length(trim(nickname)) between 1 and 30),
 title text not null check (char_length(trim(title)) between 1 and 100),
 body text not null check (char_length(trim(body)) between 1 and 3000),
 created_at timestamptz not null default now()
);
create table if not exists public.board_comments (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.board_posts(id) on delete cascade,
 author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 nickname text not null check (char_length(trim(nickname)) between 1 and 30),
 body text not null check (char_length(trim(body)) between 1 and 500),
 created_at timestamptz not null default now()
);
create index if not exists board_posts_recent on public.board_posts(created_at desc);
create index if not exists board_comments_post on public.board_comments(post_id,created_at);
alter table public.board_posts enable row level security;
alter table public.board_comments enable row level security;
revoke all on public.board_posts, public.board_comments from anon;
grant select,insert,delete on public.board_posts,public.board_comments to authenticated;
create policy "public read posts" on public.board_posts for select to authenticated using (true);
create policy "author creates posts" on public.board_posts for insert to authenticated with check (author_id = (select auth.uid()));
create policy "author deletes posts" on public.board_posts for delete to authenticated using (author_id = (select auth.uid()));
create policy "public read comments" on public.board_comments for select to authenticated using (true);
create policy "author creates comments" on public.board_comments for insert to authenticated with check (author_id = (select auth.uid()));
create policy "author deletes comments" on public.board_comments for delete to authenticated using (author_id = (select auth.uid()));
-- Never grant UPDATE; author_id and ownership cannot be changed.
-- Configure CAPTCHA, rate limits, moderation, retention and abuse response before public launch.
