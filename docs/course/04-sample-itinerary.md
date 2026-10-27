# Module 04 — Sample itinerary and loading state

**Commit:** `bf7b490` · **Time:** ~45 minutes

## Goal

After a valid submit: a short loading state, then a day-by-day plan built from
**fake data** (time slots, places, categories, reasons, durations, costs).

## Why it matters

We can design and polish the results screen before any API exists. When real
data arrives later, only the **data source** changes — not the display.

## Concepts

### Lifting state up

The form and the results both need to know what's happening (loading? done?).
When two components need the same state, it moves to their **closest common
parent**:

```
TripPlanner  (owns: status, itinerary)
├── TripForm        ← receives isLoading, calls onSubmit
├── LoadingState    ← shown while loading
└── ItineraryView   ← receives itinerary
```

### Props: data flows down, events flow up

```tsx
<TripForm onSubmit={handlePlan} isLoading={status === "loading"} />
```

- `isLoading` flows **down** from parent to child.
- `onSubmit` is a function the parent passes down; when the child calls it,
  the request flows **up**.

The form doesn't know what happens to the request. That's why we can later
replace mock data with a real API call without touching the form.

### Status as one value

```ts
type Status = "idle" | "loading" | "success";
```

One value instead of several booleans (`isLoading`, `hasResult`…) makes
impossible combinations impossible. We'll add `"error"` when real network
calls arrive.

### Honest mock data

Every fake place is named "Sample …" and a yellow banner says so. Even
placeholder data must never look like a real, verified place.

## Files

| File | Purpose |
|------|---------|
| `types/trip.ts` | Shapes of `TripRequest`, `ItineraryItem`, `ItineraryDay`, `Itinerary` |
| `lib/mock-itinerary.ts` | Builds a fake itinerary for N days |
| `components/ItineraryView.tsx` | Displays days and stops |
| `components/TripPlanner.tsx` | Owns the flow: form → loading → results |
| `components/TripForm.tsx` | Now calls `onSubmit(request)` instead of showing a preview |
| `app/page.tsx` | Renders `<TripPlanner />` |

## Walkthrough

### Types that follow a list automatically — `types/trip.ts`

```ts
export type Currency = (typeof CURRENCIES)[number]; // "USD" | "EUR" | …
```

"Any one value from the `CURRENCIES` array." Add a currency to the list and
the type updates itself.

### The planner — `components/TripPlanner.tsx`

```tsx
async function handlePlan(request: TripRequest) {
  setStatus("loading");
  setItinerary(null);
  await new Promise((resolve) => setTimeout(resolve, 800)); // pretend network delay
  setItinerary(getMockItinerary(request));
  setStatus("success");
}
```

The fake delay lets us see and style the loading state now.

### Moving focus to results

```tsx
useEffect(() => {
  if (status === "success") resultsRef.current?.focus();
}, [status]);
```

`useEffect` runs after React updates the screen. Focusing the results section
scrolls it into view (important on phones) and tells screen-reader users the
results are ready. The section has `tabIndex={-1}` so it can receive focus.

### Formatting money — `components/ItineraryView.tsx`

```ts
new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 })
  .format(amount); // "€15", "¥15", "$15"
```

`Intl` is built into JavaScript and knows every currency's symbol and format.

### Skeleton loading

Grey blocks shaped like the result, with Tailwind's `animate-pulse`. It feels
faster than a spinner because the user sees the layout coming.

## Run & test

1. Fill the form (e.g. Tokyo, 2 days, 90000 JPY, Food & drink) and submit.
2. The button shows **"Planning…"** and is disabled; grey blocks appear.
3. The page scrolls to **"Your 2-day plan for Tokyo, Japan"** with the
   sample-data banner and costs like `~¥15 (estimate)`.
4. Submit again with 5 days: the old plan disappears during loading.
5. Phone width: no sideways scrolling; long names wrap.

## Common mistakes

**Errors like `submitted is not defined` right after saving.** Hot reload
compiled a file halfway through a multi-file edit. Finish all edits, then
reload the page.

**A huge diff for a small change.** Removing a wrapper element re-indents
everything inside it. Use `git diff -w` to ignore whitespace and see the real
changes.

## Exercises

1. Add a `"Day at the beach"` theme to `THEMES` in `lib/mock-itinerary.ts`.
   Which day shows it for a 6-day trip?
2. Change the fake delay to 3 seconds. Does the disabled button stop you from
   submitting twice?
3. Why does `ItineraryView` not need `"use client"`?
