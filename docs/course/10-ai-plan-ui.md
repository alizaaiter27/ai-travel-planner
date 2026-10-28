# Module 10 — The real AI plan in the UI

**Commit:** `ac1ad0b` · **Time:** ~40 minutes

## Goal

The page calls `POST /api/itinerary` and shows the real AI plan: days, times,
real places with addresses and map links, cost estimates. The sample data is
gone for good.

## Why it matters

This is where the app becomes real. It's also a lesson in **replacing a
data source** cleanly: because Modules 04 and 08 separated "where data comes
from" (`TripPlanner`) from "how it looks" (`ItineraryView`), the switch mostly
touches one component.

## Concepts

### Removing code is part of the job

Mock data, the sample banner, the empty state, and an unused schema were all
deleted. Dead code confuses future readers (including you) and can hide bugs.
Search before deleting:

```bash
grep -rn -E "mock-itinerary|getMockItinerary" app components lib types
```

### Renaming with history: `git mv`

```bash
git mv lib/api/places-client.ts lib/api/plan-client.ts
```

Git records a rename, so `git log --follow lib/api/plan-client.ts` still shows
the file's earlier history.

### Validating relationships, not just shapes — `.refine()`

```ts
export const planResponseSchema = z
  .object({ destinationName: z.string(), places: z.array(placeSchema), itinerary: itinerarySchema })
  .refine(
    ({ places, itinerary }) => {
      const ids = new Set(places.map((p) => p.id));
      return itinerary.days.every((day) => day.items.every((item) => ids.has(item.placeId)));
    },
    { error: "Itinerary contains a place that wasn't in the candidate list." },
  );
```

A plain schema checks each field on its own. `.refine()` adds a custom rule
across fields — here, the core rule of the app. The server already guarantees
it; checking again in the browser is **defense in depth**.

### Honest loading for slow requests

A plan takes 15–45 seconds. A spinner with no information makes people think
the page froze. So the loading state:

- says what's happening and how long it usually takes;
- shows a live seconds counter;
- announces only the static sentence to screen readers (`role="status"`),
  while the counter is `aria-hidden` so it isn't read out every second.

### Cleaning up effects

```ts
useEffect(() => {
  const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
  return () => clearInterval(timer);
}, []);
```

The function returned from `useEffect` runs when the component disappears.
Without it, the timer would keep running (and trying to update a component
that no longer exists) after loading ends.

### `<details>` for secondary information

```tsx
<details>
  <summary>All 30 real places we considered</summary>
  …
</details>
```

A built-in, accessible show/hide control: works with keyboard and screen
readers, no JavaScript. Tailwind's `group-open:` variant styles children when
it's open (the arrow rotates).

## Files

| File | Change |
|------|--------|
| `lib/schemas/plan.ts` | New: `planResponseSchema` with the `.refine()` rule |
| `lib/api/plan-client.ts` | Renamed from `places-client.ts`; calls `/api/itinerary`, returns a `Plan` |
| `components/TripPlanner.tsx` | Uses `fetchPlan`; plan first, places below; new loading state |
| `components/ItineraryView.tsx` | Takes `places`; shows address + Map link per stop; "Usually free" for 0 |
| `components/PlaceCandidates.tsx` | Now a collapsed `<details>` |
| `lib/mock-itinerary.ts` | Deleted |
| `lib/schemas/place.ts` | Removed the unused `placesResponseSchema` |

## Walkthrough

### Looking up a stop's real place

```tsx
const placesById = new Map(places.map((place) => [place.id, place]));
// …
<ItineraryStop item={item} place={placesById.get(item.placeId)} />
```

A `Map` gives instant lookup by ID instead of searching the array for every
stop. Addresses and links come from Google's data, not from the AI.

### Cost wording

```ts
function formatCost(cost: number | null, currency: string): string {
  if (cost === null) return "No cost estimate";
  if (cost === 0) return "Usually free";
  return `~${formatMoney(cost, currency)} (estimate)`;
}
```

"~€0 (estimate)" reads oddly; "Usually free" is honest without promising.

## Run & test

1. Lisbon, 2 days, Culture & history + Food & drink, preferences
   "love viewpoints".
2. During loading: "Finding real places and building your plan. This usually
   takes 15–45 seconds.", a ticking counter, the button disabled ("Planning…").
3. After ~10–25 s: **"Your 2-day plan for Lisbon, Portugal"**, themed days,
   each stop with reason, duration, cost, address, and **Map** link; reasons
   mention viewpoints.
4. Below: collapsed **"All 30 real places we considered"**.
5. Error paths (no AI call, free):
   - `Qxzvbn Plorkt` → "We couldn't find…", no Try again.
   - Simulated 422 → "We only found 13 places…", no Try again.
   - Simulated response containing a place not in `places` → rejected by the
     browser: "We got an unexpected response…" + Try again.
6. Phone width: no sideways scrolling.

## Common mistakes

**"Module not found" right after renaming a file.** Hot reload compiled the
importing file before it was updated. Finish all edits, then reload. If the
page still behaves oddly (e.g. the form reloads the page with `/?`), reload
once more — the browser may be holding the broken version.

**Testing an edge case with different inputs than before.** A 14-day trip to
a small village returned 422 with one interest, but a full plan with two —
more interests mean more places. When a test "fails", first check whether the
input really is the case you meant to test.

## Exercises

1. Add a **"Copy plan"** button that copies the itinerary as plain text.
   Which component should own it?
2. Show the total number of stops and the number of free stops above Day 1.
3. The 422 threshold is 2 places per day. A 14-day plan for a tiny village
   passed with ~30 places. Would you raise it? What trade-off does that make?
