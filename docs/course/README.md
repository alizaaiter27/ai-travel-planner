# Build an AI Travel Planner — Course

This folder is a step-by-step course that teaches full-stack web development
by building a real app: an **AI Travel Planner** that turns a destination,
trip length, budget, and interests into a day-by-day plan using **real places**.

Every module matches a real commit in this repository, so you can read the
lesson, then look at (or check out) the exact code it produced.

## Who this is for

You know basic HTML/CSS and a little JavaScript. You don't need to know React,
Next.js, TypeScript, or APIs yet — each module explains the concepts it uses.

## How to use this course

1. Read a module from top to bottom.
2. Type the code yourself instead of copy-pasting; it sticks better.
3. Run the **"How to test"** section and compare with the expected result.
4. Do the **exercises** at the end before moving on.
5. Stuck? Compare with the module's commit:
   ```bash
   git show <commit>            # see exactly what changed
   git checkout <commit>        # browse the project at that point
   git checkout main            # come back to the latest version
   ```

## Modules

| # | Module | What you build | Key concepts | Commit |
|---|--------|----------------|--------------|--------|
| 00 | [Project overview](00-overview.md) | — | Architecture, tech stack, core rules | — |
| 01 | [Setup](01-setup.md) | Empty Next.js app | Node/npm, create-next-app, Git | `823a063` |
| 02 | [Project shell & GitHub](02-project-shell.md) | Title, placeholder page, repo on GitHub | Server Components, metadata, Tailwind, pushing | `5a94697` |
| 03 | [The trip form](03-trip-form.md) | Form with validation | Client Components, state, controlled inputs, accessibility | `d9a2890` |
| 04 | [Sample itinerary](04-sample-itinerary.md) | Loading state + mock day-by-day plan | Lifting state up, props, types, mock data | `bf7b490` |
| 05 | [Validation with Zod](05-zod-validation.md) | Shared validation rules | Schemas, `safeParse`, inferred types | `442d71a` |
| 06 | [Google Places API key](06-google-places-key.md) | A restricted API key | API keys, billing, env variables, secrets | `d37a2ee` |
| 07 | [Places Route Handler](07-places-route-handler.md) | `POST /api/places` | Route Handlers, server-only code, external APIs, error handling | `2dfa746` |
| 08 | [Real places in the UI](08-real-places-ui.md) | Places list; loading, error, retry, empty states | Client `fetch`, `response.ok`, retryable errors, `useRef` | `e544196` |
| 09 | [AI itinerary with OpenAI](09-ai-itinerary.md) | `POST /api/itinerary` | Structured outputs, dynamic enums, prompt injection, AI failure modes, token costs | `3484785` |
| 10 | [The AI plan in the UI](10-ai-plan-ui.md) | Real plan on the page | Replacing a data source, `.refine()`, honest loading, effect cleanup, `<details>` | `ac1ad0b` |
| 11 | [Budget calculations](11-budget.md) | Budget card + daily subtotals | Pure functions, floating-point money, unit tests with Vitest, `role="meter"` | `277be1f` |
| 12 | [Interactive map](12-map.md) | Map with day-colored markers linked to the list | Public vs. secret keys, `useMap`, shared selection state, effect dependencies, sticky layout | `2256e42` |
| 13 | [Saving trips](13-saving-trips.md) | Supabase storage, private share links | RLS, HMAC signatures, random IDs, Suspense + `notFound`, `useSyncExternalStore` | `f2115d5` |
| 14 | [Testing & hardening](14-hardening.md) | Rate limits, size limits, headers | Shared counters, race conditions, fail open vs. closed, bundle scanning, dev vs. prod errors | `0ae40d2` |
| 15 | [README & deploy](15-deploy.md) | Live app on Vercel | README structure, `maxDuration`, env vars in production, reading logs, `gm_authFailure` | `471ec5a` |
| 16 | [Design foundation](16-design-foundation.md) | Travel palette, fonts, header & footer | Design tokens, Tailwind `@theme`, WCAG contrast, `next/font`, touch targets | `2876a0d` |
| 17 | [Landing page](17-landing-page.md) | Hero, example trip, how it works | Landing patterns, one primary action, CSS gradients, reduced motion, accessible tables | `3011d47` |
| 18 | [Form & loading](18-form-and-loading.md) | Card form, icon chips, step-by-step loading | Hints with `aria-describedby`, honest progress, interest limit, reduced motion | `d9622e3` |
| 19 | [Itinerary UI](19-itinerary-ui.md) | Timeline stops, icons, 44 px targets | Label in name, heading levels, contrast of data colours, pure helpers + tests | — |

The live app: <https://ai-travel-planner-beta-six.vercel.app>

## Tech stack (versions used in this course)

| Tool | Version | Used for |
|------|---------|----------|
| Node.js | 22 | Runs JavaScript outside the browser |
| Next.js | 16.4 (App Router) | Pages + server code in one project |
| React | 19.3 | Building the UI from components |
| TypeScript | 5 | Catching mistakes before the code runs |
| Tailwind CSS | 4 | Styling with utility classes |
| Zod | 4.6 | Validating data |
| Google Places API (New) | — | Real attractions and restaurants |
| OpenAI SDK (`openai`) | 7.45 | Itinerary generation with structured outputs (`gpt-6.1-terra`) |
| Vitest | 5.0 | Unit tests (`npm test`) |
| `@vis.gl/react-google-maps` | 1.10 | Google Maps JavaScript API in React |
| Supabase (`@supabase/supabase-js`) | 2.118 | PostgreSQL database for saved trips |

## A note on secrets

This course never shows real API keys. Keys live in `.env.local`, which Git
ignores. If you ever see a real key in a commit, screenshot, or chat message,
treat it as leaked: delete it in the provider's dashboard and create a new one.
