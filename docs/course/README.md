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

### Coming next

| # | Module | What you'll build |
|---|--------|-------------------|
| 09b | Show the AI itinerary in the UI | Replace the sample plan with the real one |
| 10 | Budget calculations | Daily/total estimates computed in code |
| 11 | Interactive map | Google Maps with markers linked to the itinerary |
| 12 | Saving trips | Supabase database, save and reopen trips |
| 13 | Testing & hardening | Failure cases, security checks, mobile |
| 14 | Polish & deploy | README, screenshots, deploy to Vercel |

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

Later modules add Google Maps JavaScript API and Supabase.

## A note on secrets

This course never shows real API keys. Keys live in `.env.local`, which Git
ignores. If you ever see a real key in a commit, screenshot, or chat message,
treat it as leaked: delete it in the provider's dashboard and create a new one.
