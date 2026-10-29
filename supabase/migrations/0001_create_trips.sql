-- Saved trips. Run this once in the Supabase dashboard: SQL Editor → New query → Run.
--
-- Access model ("private share links"):
--   * Each trip has a random, unguessable UUID; whoever has the link can view it.
--   * Row Level Security is ON with NO policies, so the public (publishable/anon)
--     key can't read or write anything.
--   * Only our server, using the secret key (which bypasses RLS), saves and
--     loads trips, and it only ever loads one trip by its exact ID.

create table if not exists public.trips (
  id               uuid primary key default gen_random_uuid(),
  destination      text not null check (char_length(destination) between 2 and 100),
  destination_name text not null check (char_length(destination_name) <= 300),
  duration_days    integer not null check (duration_days between 1 and 14),
  budget           numeric(12, 2) not null check (budget > 0),
  currency         text not null check (currency ~ '^[A-Z]{3}$'),
  interests        text[] not null default '{}',
  preferences      text not null default '' check (char_length(preferences) <= 500),
  itinerary        jsonb not null, -- days → stops, validated by the app before saving
  places           jsonb not null, -- the real Google places the plan was built from
  created_at       timestamptz not null default now()
);

alter table public.trips enable row level security;

-- Deliberately no policies: deny everything to anon/authenticated roles.
-- (If accounts are added later: add a user_id column and owner-only policies.)

-- Useful later for listing or cleaning up old trips.
create index if not exists trips_created_at_idx on public.trips (created_at desc);
