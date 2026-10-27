# Module 00 — Project overview

## What we're building

A web app where a traveler enters:

- a **destination** (e.g. "Lisbon, Portugal")
- a **number of days** (1–14)
- a **total budget** and **currency**
- their **interests** (museums, food, nature…)
- optional **preferences** ("vegetarian", "slow mornings")

…and gets back a **day-by-day itinerary**: time slots, real places to visit and
eat, why each place was chosen, how long to stay, and estimated costs. Places
appear on a map, and trips can be saved and reopened later.

## The one rule that shapes everything

> **The AI may only choose from real places we retrieved from Google Places.**

Language models can confidently invent restaurants that don't exist. So the app
works in two stages:

```
1. Google Places  →  a list of REAL candidate places (with IDs and coordinates)
2. OpenAI         →  picks from that list and organizes it into days
```

The AI organizes; it never invents. If Google returns too few places, the app
says so instead of making some up.

Two more rules follow the same spirit:

- **Math happens in code, not in the AI.** Totals and remaining budget are
  calculated by our code, because language models make arithmetic mistakes.
- **Costs are labeled as estimates.** We never claim prices, opening hours, or
  availability are guaranteed.

## Architecture

```
┌──────────────────────────── Browser ────────────────────────────┐
│  Next.js page (React)                                           │
│   TripForm → TripPlanner → ItineraryView / Map                  │
└───────────────┬─────────────────────────────────────────────────┘
                │ fetch("/api/...")   (no secret keys in here!)
┌───────────────▼──────────── Server (same Next.js app) ──────────┐
│  Route Handlers: app/api/*/route.ts                              │
│   - validate input with Zod                                      │
│   - call Google Places / OpenAI with SECRET keys                 │
│   - validate their responses with Zod                            │
│   - save/load trips in Supabase                                  │
└───────┬───────────────────┬───────────────────────┬─────────────┘
        ▼                   ▼                       ▼
  Google Places API     OpenAI API          Supabase (PostgreSQL)
```

Why one Next.js app instead of a separate backend? Next.js lets the same
project contain both the pages (browser code) and **Route Handlers** (server
code). That's enough for this app, and it keeps things simple: one repo, one
deploy, no Express server to maintain.

## Folder structure (where things live)

```
app/                    Pages and server endpoints
  page.tsx              The home page
  layout.tsx            Shared HTML shell (fonts, <html>, <body>)
  api/places/route.ts   Server endpoint: search Google Places
components/             Reusable UI pieces (TripForm, ItineraryView…)
lib/                    Logic that isn't UI
  schemas/              Zod validation rules
  google-maps/          Talking to Google
  trip-options.ts       Lists of currencies, interests, limits
types/                  Shared TypeScript types
docs/course/            This course
.env.example            Names of required environment variables (no real values)
```

## Security principles we follow from day one

1. **Secret keys stay on the server.** Only variables starting with
   `NEXT_PUBLIC_` are sent to the browser, and we never put secrets in those.
2. **Never trust the browser.** Every server endpoint re-validates its input,
   because anyone can call it directly.
3. **Never trust outside services blindly.** Responses from Google and OpenAI
   are validated before we use them.
4. **Never commit secrets.** `.env.local` is git-ignored; `.env.example` holds
   placeholders only.
5. **Limit the blast radius.** API keys are restricted to specific APIs and
   capped with daily quotas and budget alerts.

## How each module is structured

- **Goal** — what you'll have at the end
- **Why it matters** — the reason behind it
- **Concepts** — new ideas, explained simply
- **Files** — what's created or changed
- **Walkthrough** — the important code, explained
- **Run & test** — commands and expected results
- **Common mistakes** — problems we actually hit, and how to fix them
- **Exercises** — check your understanding before moving on
