# Module 06 — Google Places API key, safely

**Commit:** `d37a2ee` · **Time:** ~30 minutes (mostly in Google Cloud)

## Goal

A Google Places API key that works, is stored safely on your computer, and is
locked down so a leak can't cost you much.

## Why it matters

An API key is like a password that **bills your account** for every request.
A leaked, unrestricted key can run up charges for anyone who finds it.

## Concepts

### Environment variables

Values the app reads at runtime from the environment instead of from code:

```ts
process.env.GOOGLE_MAPS_API_KEY
```

Locally they live in `.env.local`. On Vercel you set them in the dashboard.
Code stays the same everywhere; secrets never enter the code.

### Public vs. server-only variables in Next.js

| Name | Sent to the browser? | Use for |
|------|---------------------|---------|
| `GOOGLE_MAPS_API_KEY` | **No** — server only | Secret keys |
| `NEXT_PUBLIC_SOMETHING` | **Yes** — anyone can read it | Values that are safe to be public |

**Never put a secret in a `NEXT_PUBLIC_` variable.**

### `.env.example`

A committed template listing the variable **names** with fake values, so
anyone cloning the repo knows what to set up.

## Files

| File | Purpose |
|------|---------|
| `.env.example` | Committed. Placeholder: `GOOGLE_MAPS_API_KEY=your-google-places-server-key` |
| `.env.local` | **Not committed.** Your real key. |
| `.gitignore` | Adds `!.env.example` |

### The `.gitignore` gotcha

The default rule `.env*` also matches `.env.example`, so it would never be
committed. Add an exception:

```gitignore
.env*
# ...except the example, which only has placeholders
!.env.example
```

Check both files:

```bash
git check-ignore -q .env.example && echo "ignored (bad)" || echo "tracked (good)"
git check-ignore -q .env.local   && echo "ignored (good)" || echo "tracked (bad)"
```

## Google Cloud setup

1. **Create a project** at <https://console.cloud.google.com> → project
   picker → **New Project** → `ai-travel-planner`. Select it.
2. **Billing** → link a billing account. A card is required; each Places
   request type has a free monthly allowance (Pro-tier Text Search: about
   5,000/month at the time of writing).
3. **APIs & Services → Library** → enable **Places API (New)**. Not the
   legacy "Places API".
4. **APIs & Services → Credentials → + Create credentials → API key.** Edit it:
   - Name: `places-server`
   - **Application restrictions: None.** "Websites" only works for browser
     keys; "IP addresses" needs a fixed server IP, which Vercel doesn't have.
     Google shows a yellow warning about this — expected for this setup.
   - **API restrictions: Restrict key → Places API (New)** only. **Save.**
     (Changes can take up to 5 minutes.)
5. **Cap usage.** APIs & Services → Places API (New) → Quotas → set **Text
   Search requests per day** to **100**. Billing → **Budgets & alerts** → a
   **$5** budget with email alerts.
6. **Save the key locally.** In `.env.local`:
   ```
   GOOGLE_MAPS_API_KEY=AIza...your-key...
   ```
   No quotes, no spaces around `=`. **Never paste a key into chat, issues, or
   screenshots.**

Defense in depth — four protections that work together:

1. Restricted to one API
2. Used only on the server, never in the browser
3. Daily request cap
4. Budget alert

## Run & test (without printing the key)

```bash
KEY="$(grep '^GOOGLE_MAPS_API_KEY=' .env.local | cut -d= -f2-)"
curl -s -X POST 'https://places.googleapis.com/v1/places:searchText' \
  -H 'Content-Type: application/json' \
  -H "X-Goog-Api-Key: $KEY" \
  -H 'X-Goog-FieldMask: places.displayName,places.formattedAddress' \
  -d '{"textQuery":"museums in Lisbon","pageSize":5}'
```

Expected: JSON with real museums (Calouste Gulbenkian Museum, MAAT, …).

### Field masks decide the price

`X-Goog-FieldMask` lists the fields you want. **Google bills each request at
the tier of the most expensive field requested:**

| Tier | Example fields |
|------|----------------|
| Essentials | `places.id` |
| Pro | `displayName`, `formattedAddress`, `location`, `types`, `primaryType`, `googleMapsUri`, `viewport` |
| Enterprise | `rating`, `userRatingCount`, `priceLevel`, `priceRange` |

We stay in **Pro**. Check Google's current pricing page before relying on
these numbers.

## Common mistakes

**`.env.local` changes don't take effect.** Next.js reads it at startup —
restart `npm run dev`.

**Testing the restriction with another API gives a misleading result.** If
that other API isn't enabled in your project, Google refuses with "API not
activated", which says nothing about your key's restriction. Verify in the
Console instead: the key's page should list only **Places API (New)**.

## Exercises

1. Why would a `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` for Places be a bad idea?
2. You accidentally committed a key. Is deleting the file in a new commit
   enough? What must you do in Google Cloud?
3. Which field-mask change would move every request to the Enterprise tier?
