# Module 13 — Saving trips with Supabase (private share links)

**Commit:** `f2115d5` · **Time:** ~90 minutes

## Goal

A **Save trip** button that stores the plan in a database and gives a private
link (`/trips/<random-id>`) that opens it later — on any device, for anyone
who has the link. The home page lists trips saved from this browser.

## Why it matters

This is the app's first **persistent data**, and with it come new security
questions: who can read the data, who can write it, and can someone store
something we didn't create?

## The decision: links or accounts?

| | Private share links (chosen) | User accounts |
|---|---|---|
| Access | Anyone **with the link** (random, unguessable ID) | Only the signed-in owner |
| "My trips" | Per browser (localStorage) | On every device |
| Work | 1 table, 1 endpoint, 1 page | + sign-in, emails, sessions, ownership policies |

Links are enough for an MVP and safe if done right. Accounts can be added
later with a `user_id` column and owner-only policies.

## Part A — Supabase setup

1. <https://supabase.com> → **New project** `ai-travel-planner` (save the
   database password in a password manager).
2. **Project Settings → API Keys**. In `.env.local`:
   ```
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_SECRET_KEY=sb_secret_...
   ```
   The URL is the **API** address, not the dashboard page address.
3. **SQL Editor → New query** → paste
   `supabase/migrations/0001_create_trips.sql` → **Run**.
4. Generate a signing secret: `openssl rand -hex 32` →
   `TRIP_SIGNING_SECRET=...` in `.env.local`. Restart `npm run dev`.

```bash
npm install @supabase/supabase-js
```

### Supabase key types

| Key | Prefix | Browser-safe? | Bypasses Row Level Security? |
|-----|--------|---------------|------------------------------|
| Publishable | `sb_publishable_` | Yes | No |
| **Secret** (used here) | `sb_secret_` | **No — server only** | **Yes** |
| Legacy `anon` / `service_role` | JWT | as above | being retired end of 2026 |

## Concepts

### Row Level Security (RLS) with no policies

```sql
alter table public.trips enable row level security;
-- deliberately no policies
```

RLS decides, per row, who may read or write. **Enabled with no policies means
"nobody"** — the public key can do nothing. Our server uses the secret key,
which bypasses RLS, and only ever loads one trip by its exact ID. So the
database can't be listed or modified from a browser, even if someone finds
the project URL.

### Constraints in the database, too

```sql
duration_days integer not null check (duration_days between 1 and 14),
currency      text    not null check (currency ~ '^[A-Z]{3}$'),
```

Zod validates in the app; `check` constraints are the database's own last
line of defense if a bug ever lets bad data through.

### Signed plans (HMAC): only save what we generated

Problem: if `/api/trips` stored whatever the browser sent, anyone could save a
made-up plan ("Totally Real Restaurant") and share it from **our** domain.

Solution: `/api/itinerary` signs each plan:

```ts
signature = HMAC_SHA256(secret, canonicalJSON({ request, plan }))
```

`/api/trips` recomputes it and compares. Change a single character and the
signatures no longer match → **403**. Details that matter:

- **Canonical form:** parse through the Zod schema before `JSON.stringify`, so
  key order and extra fields can't change the result.
- **`timingSafeEqual`:** compares in constant time, so response timing doesn't
  leak how many characters matched.
- No secret configured → signing is off and the Save button hides itself.

### Random IDs as access control

```sql
id uuid primary key default gen_random_uuid()
```

A UUID v4 has 122 random bits — guessing one is practically impossible. The
link *is* the permission, like "anyone with the link" sharing. Pages are also
marked `noindex` so search engines don't list them.

### Server rendering + Suspense with Cache Components

```tsx
export default function TripPage({ params }: PageProps<"/trips/[id]">) {
  return (
    <Suspense fallback={<p>Loading trip…</p>}>
      {params.then(({ id }) => <SavedTrip id={id} />)}
    </Suspense>
  );
}
```

With Cache Components on, runtime data (the URL's `id`, the database read)
goes inside `<Suspense>`: the page frame is sent immediately and the trip
streams in. `cache(getTrip)` makes `generateMetadata` and the page share one
database call.

### `notFound()` and `error.tsx`

- `notFound()` renders `not-found.tsx` ("Trip not found").
- `error.tsx` (a Client Component) catches unexpected errors and gets a
  **`retry`** function — this Next.js version renamed it from `reset`. Always
  check the docs bundled in `node_modules/next/dist/docs/`.

### localStorage done safely: `useSyncExternalStore`

"Your saved trips" reads localStorage, which doesn't exist on the server.
`useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)` renders an
empty list on the server and the real list in the browser — no hydration
mismatch. Also: wrap storage access in `try/catch` (it can throw in private
mode), validate what you read (it's outside input), and return the **same
array** until the data changes (React compares snapshots with `===`).

## Files

| File | Purpose |
|------|---------|
| `supabase/migrations/0001_create_trips.sql` | Table, checks, RLS |
| `lib/supabase/server.ts` | Server-only client with the secret key |
| `lib/trips/store.ts` | `saveTrip`, `getTrip` (validates loaded rows) |
| `lib/trips/signature.ts` (+ tests) | HMAC sign / verify |
| `lib/schemas/plan.ts` | `planSchema`, `planResponseSchema`, `savePayloadSchema`, `saveTripBodySchema` |
| `app/api/trips/route.ts` | Save endpoint |
| `app/api/itinerary/route.ts` | Now returns a `signature` |
| `app/trips/[id]/page.tsx`, `not-found.tsx`, `error.tsx` | Saved trip page |
| `components/SaveTripPanel.tsx` | Save, copy link, open |
| `components/RecentTrips.tsx`, `lib/trips/saved-list.ts` | Per-browser list |
| `test/server-only-stub.ts`, `vitest.config.mts` | Lets tests import server code |

## Run & test

```bash
npm test   # 12 passed (6 budget + 6 signature)
```

| Test | Expected |
|------|----------|
| Save a real plan | 201 `{ id }` |
| Change a reason / a place name / the budget, keep the signature | **403** |
| No signature / invalid JSON | 400 |
| Open `/trips/<id>` | Title "1-day trip to Porto, Portugal", `noindex`, plan + map + budget |
| Unknown or malformed ID | "Trip not found" |
| Browser: Plan → Save trip | Link with Copy/Open; "Your saved trips" updates immediately |
| `git grep` for the secret key and signing secret | 0 tracked files |

## Known limitation

A missing trip shows "Trip not found" but returns HTTP **200**, not 404: the
trip is loaded inside `<Suspense>`, and by then the page has started streaming
with status 200. People see the right page and it's `noindex`; making it a
true 404 would mean loading the trip before streaming starts.

## Common mistakes

**Pasting the dashboard URL as `SUPABASE_URL`.** Use
`https://<project-ref>.supabase.co` — the project ref is the part after
`/project/` in the dashboard address.

**Storing whatever the browser sends.** Validation checks the shape, not the
origin. Sign server-generated data if it must come back unchanged.

**Assuming RLS is on.** New tables created with SQL have RLS **off** unless
you enable it. Check under Database → Tables, or Supabase's Security Advisor.

**"X is not defined" right after adding a component.** Using a component
before adding its import, with hot reload running, briefly breaks the page.
Add imports first; reload if the error lingers.

## Not tested here

The RLS block was not tested with the publishable key (we never added it to
the app). To check: copy the **publishable** key from the dashboard and run

```bash
curl "https://<ref>.supabase.co/rest/v1/trips?select=id" -H "apikey: sb_publishable_..."
```

Expected: `[]` — no rows visible, even though trips exist.

## Exercises

1. Add a "Delete this trip" option. Who should be allowed to delete, given
   that anyone with the link can view? (Hint: a second, secret "edit token".)
2. Add an `expires_at` column and hide trips older than 90 days.
3. Sketch the SQL policies you'd need if trips had a `user_id` and only the
   owner could read them.
