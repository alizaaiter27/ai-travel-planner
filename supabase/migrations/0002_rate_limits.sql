-- Rate limiting for the expensive and write endpoints.
-- Run once in the Supabase dashboard: SQL Editor → New query → Run.
--
-- Counts requests per key (e.g. "itinerary:ip:<hash>") per fixed time window.
-- One row per key per window; old rows are cleaned up automatically.

create table if not exists public.rate_limits (
  key          text        not null,
  window_start timestamptz not null,
  count        integer     not null default 0,
  primary key (key, window_start)
);

-- Locked like the trips table: no policies, so only the server can touch it.
alter table public.rate_limits enable row level security;

create index if not exists rate_limits_window_start_idx on public.rate_limits (window_start);

-- Adds one to the counter for this key in the current window and returns the
-- new count. Doing the insert-or-increment in ONE statement makes it safe when
-- many requests arrive at the same moment (no lost updates).
create or replace function public.hit_rate_limit(p_key text, p_window_seconds integer)
returns integer
language plpgsql
security definer           -- runs with the function owner's rights
set search_path = public   -- standard hardening for security definer functions
as $$
declare
  v_window timestamptz :=
    to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count integer;
begin
  insert into public.rate_limits (key, window_start, count)
  values (p_key, v_window, 1)
  on conflict (key, window_start)
  do update set count = public.rate_limits.count + 1
  returning count into v_count;

  -- Housekeeping: forget windows older than two days.
  delete from public.rate_limits where window_start < now() - interval '2 days';

  return v_count;
end;
$$;

-- Only the server (secret key = service_role) may call it.
revoke execute on function public.hit_rate_limit(text, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer) to service_role;
