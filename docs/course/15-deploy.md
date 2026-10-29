# Module 15 — README, screenshots, and deploying to Vercel

**Commits:** `471ec5a` (README + `maxDuration`), and the commit adding this module · **Time:** ~60 minutes

## Goal

A public, working app at a real URL, with a README that explains it to a
recruiter or reviewer in two minutes.

## Why it matters

A portfolio project is judged by its live demo and its README. Deploying also
surfaces a new class of bugs: configuration that works on your laptop but not
in production.

## Part A — The README

A good project README answers, in order:

1. **What is it?** One paragraph + a screenshot at the top.
2. **What problem does it solve?** Ours: AI itineraries that invent places.
3. **Features** — short, honest, tested.
4. **Tech stack and architecture** — a table and one diagram.
5. **Security** — what's protected and how.
6. **Getting started** — clone, install, environment variables (names only!).
7. **Testing**, **deployment**, **limitations** (shows judgment), **license**.

Screenshots live in `docs/screenshots/`. Take them from **real data** (we
generated and saved a real 3-day Lisbon trip) and check them — one form
screenshot was taken mid-update and showed no selected interests.

## Part B — Preparing for serverless

```ts
// app/api/itinerary/route.ts
export const maxDuration = 200; // seconds
```

On Vercel each Route Handler runs as a serverless function with a time limit.
Our worst case is ~10 s of Google searches + a 90 s AI call + one 90 s retry,
so the limit is set explicitly above that.

## Part C — Deploying

1. Push everything to GitHub (Vercel deploys from the repository).
2. <https://vercel.com> → sign in with GitHub → **Add New → Project** →
   import the repository. Vercel detects Next.js; keep the defaults.
3. **Environment Variables** — add all of them, each with **Production**
   ticked:

   | Variable | Notes |
   |---|---|
   | `GOOGLE_MAPS_API_KEY` | Server Places key — **not** the `NEXT_PUBLIC_` one |
   | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Browser Maps key (built into the page) |
   | `OPENAI_API_KEY` | |
   | `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | |
   | `TRIP_SIGNING_SECRET` | |

4. **Deploy.** You get `https://<name>.vercel.app`.
5. **Google Cloud → Credentials → `maps-browser` → Websites**: add
   `https://<name>.vercel.app/*`. Changes can take up to 5 minutes.
6. Every later push to `main` deploys automatically. Changing an environment
   variable needs a **Redeploy**.

## Part D — Verify the live site

Don't assume — test the real URL:

| Check | How | Result here |
|---|---|---|
| It's our app | Fetch `/`, look for our description text | ✅ |
| Security headers | `curl -I` | ✅ all present, no `X-Powered-By` |
| No secrets shipped | Fetch the page + every `/_next/` file, search for each secret | ✅ 0; public Maps key in 1 file |
| Plan → save → open → tampered save | Script against the live API | ✅ 200 → 201 → 200 (`noindex`) → 403 |
| Rate limiter connected | New hashed rows in `rate_limits` | ✅ |
| Map | Open a saved trip in a browser | Needs the Vercel domain on the browser key |

## Debugging production: read the logs

The first live plan returned **500** "Something went wrong on our side". The
generic message is deliberate (no internals leak), so the cause is in the
**server log**: Vercel → project → **Logs** → filter `api/itinerary`:

```
[api/itinerary] Error [PlacesSearchError]: GOOGLE_MAPS_API_KEY is not set { kind: "config" }
```

Only the `NEXT_PUBLIC_` Maps key had been added; the similarly named server
key was missing. Fix: add it for **Production**, redeploy. This is exactly why
errors were given a `kind` (config / upstream / output) and logged with context
in earlier modules.

Lessons:

- A **500** from our endpoints means configuration; **502** means a service we
  depend on failed.
- "I fixed it" isn't verified until the live test passes again.
- Similar variable names are a classic trap — compare the Vercel list with
  `.env.example` line by line.

## A bug only production revealed: silent map key failures

With the Vercel domain not yet allowed on the browser key, Google showed its
own "Oops! Something went wrong" box — and **our** friendly fallback never
appeared. Google reports key problems by calling a global function, not
through the loader's `onError`:

```ts
useEffect(() => {
  const w = window as Window & { gm_authFailure?: () => void };
  w.gm_authFailure = () => setLoadFailed(true);
  return () => { delete w.gm_authFailure; };
}, []);
```

Now any key problem shows "The map isn't available right now. The itinerary
and its Google Maps links still work."

### Why it was hard to test locally

- `http://127.0.0.1:3000` is a *different website* from `localhost` for the
  key — useful for reproducing the error.
- But the **dev server** refuses to serve its scripts to origins other than
  `localhost` unless listed in `allowedDevOrigins`, so the page never
  hydrated. And the browser had cached the dev version of the page.
- The reliable place to verify was the deployed site itself.

## Common mistakes

- Adding variables only for Preview/Development, not **Production**.
- Forgetting to **redeploy** after changing a variable.
- Forgetting the Vercel domain on the browser key's website restrictions.
- Testing once, early, and declaring victory — a map error can appear seconds
  after the page looks fine.

## Exercises

1. Add a custom domain in Vercel. What else must change in Google Cloud?
2. Set up a Vercel spending/usage alert, and note which limits now protect
   you (Google quotas, OpenAI budget, our rate limits).
3. Add `https://*.vercel.app` preview URLs to the browser key — or decide not
   to, and explain why that might be safer.
