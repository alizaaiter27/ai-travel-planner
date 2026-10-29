# Module 14 — Testing and hardening before going public

**Commit:** `0ae40d2` · **Time:** ~90 minutes

## Goal

Make the app safe to put on the internet: limit how often the expensive
endpoints can be called, refuse oversized requests, add security headers,
remove unused attack surface, and **prove** (not assume) that failures are
handled and no secret reaches the browser.

## Why it matters

Once deployed, anyone — or any bot — can call your endpoints. Each plan costs
real money (≈5 Google requests + 1 OpenAI call). Without limits, one script
could empty your OpenAI credit in minutes.

## 1. Rate limiting (without Redis)

Serverless functions don't share memory, so an in-memory counter only limits
one instance. The counter must live somewhere shared — we already have
PostgreSQL in Supabase.

`supabase/migrations/0002_rate_limits.sql` creates a `rate_limits` table and a
function that **adds one and returns the new count in a single statement**:

```sql
insert into rate_limits (key, window_start, count) values (p_key, v_window, 1)
on conflict (key, window_start) do update set count = rate_limits.count + 1
returning count into v_count;
```

Doing it in one statement matters: two requests arriving together can't both
read "9" and both write "10" (a *race condition*). The function is
`security definer` with a fixed `search_path`, and only `service_role` (our
secret key) may execute it.

The rules, in code:

| Endpoint | Per visitor | Whole app |
|---|---|---|
| `POST /api/itinerary` | 10 / hour | 200 / day — a ceiling on the daily bill |
| `POST /api/trips` | 30 / hour | — |

Over the limit → **429 Too Many Requests** with a `Retry-After` header and a
friendly message ("try again in about 12 minutes"). The browser shows it
without a retry button (4xx).

### Privacy: hash the IP

```ts
createHmac("sha256", secret).update(`rate-limit:${ip}`).digest("hex")
```

IP addresses are personal data. A keyed hash still identifies "the same
visitor" for counting, but can't be turned back into an address.

### Fail open or fail closed?

If the rate-limit check itself errors (database down, function missing), we
**allow** the request and log it. That keeps the app usable; the provider-side
limits (Google daily quota, OpenAI project budget) remain as a backstop. A
bank would fail closed; a travel planner can fail open.

## 2. Request size limits

Next.js doesn't cap Route Handler body size. `readJsonBody(request, maxBytes)`
checks `Content-Length` first, then the real byte count (the header can lie),
then parses: **413** if too large. Count **bytes**, not characters — an emoji
is 4 bytes.

## 3. Remove what you don't use

`/api/places` was no longer used by the page — but it was still a public,
paid Google search proxy. Deleted. Every endpoint is attack surface.

## 4. Security headers

```ts
// next.config.ts
poweredByHeader: false,
async headers() {
  return [{ source: "/:path*", headers: [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ]}];
},
```

| Header | Stops |
|---|---|
| `nosniff` | Browsers guessing a file is a script |
| `X-Frame-Options: DENY` | Other sites framing our pages (clickjacking) |
| `Referrer-Policy` | Leaking full private trip URLs to other sites |
| `Permissions-Policy` | Use of camera, mic, location, payments |

(A Content-Security-Policy is the next level, but Google Maps needs a
carefully tuned one — a good follow-up exercise.)

## 5. Verify, don't assume

### Production build

```bash
npm run build
```

Must pass before deploying. It also showed `/trips/[id]` as **◐ Partial
Prerender**: a static shell with the trip streamed in.

### Scan the browser bundle for secrets

For each secret in `.env.local`, search every file in `.next/static` (what
browsers download). Result: all four secrets **0 files**; the public map key
1 file (expected).

### Break things on purpose

Environment variables set in the shell override `.env.local`, so you can test
failures without touching real keys:

```bash
OPENAI_API_KEY=sk-broken npx next start -p 3000
```

| Broken | Expected (verified) |
|---|---|
| Google key | 502 "A service we rely on isn't responding" |
| OpenAI key | 500 "Something went wrong on our side" — details only in the server log |
| Supabase key | Saved trip page: "We couldn't load this trip" + Try again |
| Rate-limit function missing | Requests allowed, warning logged (fail open) |
| 20 KB body | 413 |
| `/api/places` | 404 |

### Development vs. production error details

In `next dev`, the saved-trip HTML contained "Select failed: Invalid API key" —
alarming, until tested with `next start`: production sends only an anonymous
`digest`. **Always test security in a production build.**

### Phone check

Every page at 375px: no sideways scrolling. Tap targets under 24px tall
(the back link, saved-trip links, "Remove") were enlarged with padding.

## Files

| File | Change |
|---|---|
| `supabase/migrations/0002_rate_limits.sql` | Table + `hit_rate_limit()` |
| `lib/rate-limit.ts` | `checkRateLimits()`, `tooManyRequests()` |
| `lib/api/read-json.ts` (+ tests) | Size-limited JSON reading |
| `app/api/itinerary/route.ts`, `app/api/trips/route.ts` | Limits applied |
| `app/api/places/` | Deleted |
| `next.config.ts` | Security headers |

## Run & test

```bash
npm test            # 17 passed
npm run build       # must succeed
```

To see a 429: after running `0002_rate_limits.sql`, temporarily set the
itinerary per-visitor limit to 1, request two plans, then set it back.

## Common mistakes

**Testing security in dev mode only.** Dev shows details on purpose.

**Counting characters instead of bytes** for size limits.

**In-memory rate limits on serverless.** Each instance has its own memory.

**Forgetting `X-Frame-Options` blocks your own iframes too** — our iframe-based
phone test timed out because of it. (Proof the header works.)

## Exercises

1. Add a Content-Security-Policy that still allows Google Maps. Which
   domains does the map need?
2. Make the global daily cap configurable with an environment variable.
3. Should the rate limit count requests that fail validation? Argue both ways.
