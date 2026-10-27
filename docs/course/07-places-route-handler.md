# Module 07 — Searching real places on the server

**Commit:** `2dfa746` · **Time:** ~60 minutes

## Goal

A server endpoint, `POST /api/places`, that takes a trip request and returns
real attractions and restaurants **inside the destination**, without ever
exposing the API key.

## Why it matters

This is the app's first real backend code. It's also where the core rule
starts: the AI will later choose **only** from places this endpoint returns.

## Concepts

### Route Handlers are your backend

A `route.ts` file inside `app/` becomes a server URL. Export a function named
after the HTTP method:

```ts
// app/api/places/route.ts  →  POST http://localhost:3000/api/places
export async function POST(request: Request) { … }
```

Other methods automatically get `405 Method Not Allowed`. POST handlers are
never cached.

### `import "server-only"`

```ts
import "server-only";
```

If a Client Component ever imports this file, **the build fails**. It's a
guard rail that keeps secret-using code out of the browser.

### Validate on both ends

```
request body  →  tripRequestSchema (same as the form)  →  our code
Google reply  →  googleTextSearchResponseSchema         →  our code
```

### HTTP status codes we use

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Places found (list may be empty) |
| 400 | Bad Request | Broken JSON or invalid trip request |
| 404 | Not Found | Google doesn't recognise the destination |
| 405 | Method Not Allowed | Anything other than POST |
| 500 | Internal Server Error | Our setup is wrong (e.g. missing key) |
| 502 | Bad Gateway | Google failed or replied unexpectedly |

### Safe error messages

The browser only gets generic messages. Real details go to the **server log**
(`console.error`), because error details can leak how your system works.

## Files

| File | Purpose |
|------|---------|
| `app/api/places/route.ts` | The endpoint: parse → validate → search → respond |
| `lib/google-maps/places.ts` | Talks to Google: destination lookup, searches, simplification |
| `lib/schemas/place.ts` | `placeSchema` (our format) and Google's response schema |
| `types/trip.ts` | Adds `Place` |

## Walkthrough

### The flow

```
POST /api/places
 1. request.json()                  → 400 if broken JSON
 2. tripRequestSchema.safeParse()   → 400 + fieldErrors
 3. searchPlaces()
    a. look up the destination      → 404 if Google doesn't find it
    b. 1 search per interest (max 3) + 1 for restaurants,
       all restricted to the destination's map rectangle, in parallel
    c. remove duplicates by place ID
 4. { destinationName, places }     → 200
    any Google failure              → 502 (details logged on the server)
```

### Step 3a: restrict searches to the destination

```ts
const [area] = await textSearch(apiKey, DESTINATION_FIELDS, {
  textQuery: destination,
  pageSize: 1,
});
const viewport = area?.viewport;
if (!viewport) return { found: false };
```

A **viewport** is the rectangle a place covers on the map (a city, an island,
a country). Every later search passes it as:

```ts
locationRestriction: { rectangle: viewport }
```

so results can't come from anywhere else.

### Step 3b: parallel searches

```ts
const results = await Promise.all(
  queries.map((query) => searchCategory(apiKey, query.text, query.category, viewport)),
);
```

`Promise.all` starts all requests at once and waits for all of them. Four
requests take about as long as the slowest one, not the sum.

### Simplifying Google's format

Google returns `displayName.text`, `location.latitude`… We convert to our own
`Place` shape and **skip** results without a name or coordinates:

```ts
return rawPlaces.flatMap((raw): Place[] => {
  if (!raw.displayName?.text || !raw.location) return [];
  return [{ id: raw.id, name: raw.displayName.text, /* … */ }];
});
```

`flatMap` with `[]` or `[item]` is a neat way to filter and transform in one pass.

### Timeouts

```ts
signal: AbortSignal.timeout(10_000)
```

If Google doesn't answer in 10 seconds, give up instead of hanging forever.

### Cost control

- Only Pro-tier fields (see Module 06).
- At most 3 interest queries + 1 restaurant query + 1 destination lookup =
  **5 requests per plan**. With a 100/day cap, about 20 test plans a day.

## Run & test

Start the dev server, then:

```bash
curl -s -X POST http://localhost:3000/api/places \
  -H 'Content-Type: application/json' \
  -d '{"destination":"Rome","days":2,"budget":500,"currency":"EUR","interests":["Culture & history"],"preferences":""}' \
  | head -c 600
```

Expected: `{"destinationName":"Rome, …, Italy","places":[{"id":"…","name":"…",…`

| Test | Expected |
|------|----------|
| Lisbon, Art & museums + Food & drink | 200, ~30 places, all in Portugal |
| Bali, any interests | 200, all in Indonesia, including restaurants |
| `"Qxzvbn Plorkt"` | 404 "We couldn't find …" |
| `days: 0`, `interests: []`, `currency: "XYZ"` | 400 with an error per field |
| Body `{not json` | 400 "Request body must be valid JSON." |
| `curl http://localhost:3000/api/places` (GET) | 405 |

Check the key never reaches the browser: fetch the home page and every
`/_next/` file it references, and search them for the key. Expected: 0 matches.

## Common mistakes (all hit while building this)

**Results from other countries.** Without a location restriction, Google
ignores an unknown destination and searches the whole world ("gardens in
Qxzvbn" → gardens in the USA). Fix: look up the destination first and restrict
to its viewport; unknown names → 404.

**502 "unexpected shape".** The destination lookup's field mask didn't include
`places.id`, but the response schema required `id`. Zod rejected the reply.
Fix: request `places.id` too (cheapest tier). Lesson: when a request and a
schema disagree, Zod tells you — read the server log.

**Zero results with a location restriction.** Wordy queries like
`"popular local restaurants in Bali"` returned nothing when restricted, while
`"restaurants in Bali"` returned 10. Keep restricted queries short.

**TypeScript forgets a check inside a callback.** After `if (!area?.viewport)
return`, using `area.viewport` inside an arrow function still looks
"possibly undefined". Save it to a `const viewport` first instead of forcing
it with `!`.

## Exercises

1. Add `"Architecture"` as a new interest. Which two files change?
2. What happens if one of the four parallel searches fails? Is that the
   behavior you'd want? How could you keep the others' results?
3. Why do we return 502 (not 500) when Google fails?
4. Call the endpoint with `"destination": "Portugal"`. Are the results still
   useful? What does that suggest about country-sized destinations?
