begin;

create schema visitor_stats;
revoke all on schema visitor_stats from public;

create table visitor_stats.home_visitors (
  browser_id uuid primary key,
  last_visit_date date not null
);
alter table visitor_stats.home_visitors enable row level security;
revoke all on visitor_stats.home_visitors from public, anon, authenticated;

create function visitor_stats.record_home_visit(browser_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  seoul_today date := (pg_catalog.now() at time zone 'Asia/Seoul')::date;
begin
  if $1 is not null then
    insert into visitor_stats.home_visitors as visitors (browser_id, last_visit_date)
    values ($1, seoul_today)
    on conflict on constraint home_visitors_pkey do update
    set last_visit_date = excluded.last_visit_date
    where visitors.last_visit_date < excluded.last_visit_date;
  end if;

  return (
    select pg_catalog.jsonb_build_object(
      'today', count(*) filter (where last_visit_date = seoul_today),
      'total', count(*)
    )
    from visitor_stats.home_visitors
  );
end;
$$;

revoke all on function visitor_stats.record_home_visit(uuid) from public, anon, authenticated;
grant usage on schema visitor_stats to anon, authenticated;
grant execute on function visitor_stats.record_home_visit(uuid) to anon, authenticated;

create function public.record_home_visit(browser_id uuid)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select visitor_stats.record_home_visit($1);
$$;

revoke all on function public.record_home_visit(uuid) from public, anon, authenticated;
grant execute on function public.record_home_visit(uuid) to anon, authenticated;

commit;
