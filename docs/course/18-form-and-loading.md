# Module 18 — A friendlier form and honest loading

**Commit:** `d9622e3` · **Time:** ~60 minutes

## Goal

Make the trip form quicker to understand and easier to tap, and make the
15–45 second wait feel shorter without pretending to know more than we do.

## Guidance we used

From UI/UX Pro Max (`--domain ux`):

- **Input labels:** every field needs a visible label, never a
  placeholder-only label.
- **Submit feedback:** show loading, then success or error.
- **Progress indicators:** for multi-step work, show the steps.

## The form (`components/TripForm.tsx`)

| Before | After | Why |
|---|---|---|
| Plain fields on the page | One card (`bg-surface`, rounded, padded) | Groups the task visually |
| “Destination” | “Where are you going?” plus a pin icon | Plain questions are faster to answer |
| Budget and currency far apart | Side by side in one row | They're one piece of information |
| No hints | “1–14 days”, “For activities and meals…” | Answers questions before they're asked |
| Text-only chips, 30 px tall | Icon chips, 44 px tall, ✓ when picked | Easier to scan and to tap |
| Any number of interests | **Up to 3**, with a live count | See below |
| “Planning…” | Spinner + “Planning your trip…” and “Usually takes 15–45 seconds” | Sets expectations before clicking |

### Hints are linked to their fields

```tsx
<input id="days" aria-describedby={errors.days ? "days-error days-hint" : "days-hint"} />
<p id="days-hint">1–14 days</p>
```

`aria-describedby` makes screen readers read the hint (and the error, when
there is one) after the label.

### The currency label

The currency `<select>` sits next to the budget, without its own visible
label. It still needs a name for screen readers, so it gets a hidden one:
`<label htmlFor="currency" className="sr-only">Currency</label>`.

### A layout bug we caught

The shared `inputClass` included `w-full`. Inside the budget row, the
`<select>` got both `w-full` and `w-auto`, and `w-full` won — the budget box
shrank to a sliver. Lesson: keep shared class strings free of *layout*
(width) and add the width where each field is used.

### Why “up to 3 interests”

The server only searches Google for the **first three** interests
(`MAX_INTEREST_QUERIES` in `lib/google-maps/places.ts`) to keep costs and
waiting time down. Before, a fourth or fifth pick was silently ignored —
a small dishonesty. Now the UI says “Pick up to 3 (2 chosen)” and disables
the other chips once three are picked.

We did **not** add `.max(3)` to the Zod schema: trips saved earlier with
more interests must still load, and the server already copes.

Disabled chips are dimmed (`opacity-60`). WCAG's contrast rules don't
apply to disabled controls, but they must still look clearly unavailable
(`cursor-not-allowed`).

## The loading state (`components/TripPlanner.tsx`)

```ts
const LOADING_STEPS = [
  { label: "Finding real places", startsAt: 0 },
  { label: "Arranging your days with AI", startsAt: 6 },
  { label: "Checking the plan and adding up costs", startsAt: 30 },
];
const activeIndex = LOADING_STEPS.findLastIndex((s) => seconds >= s.startsAt);
```

Each step shows ✓ (done), a spinner (active), or its number (waiting).

### Being honest about progress

The server doesn't report its progress — it answers once, at the end. So
the active step is a **time-based estimate** from the timings we measured
(Google search ~2–5 s, the AI call most of the rest). Two rules keep it
honest:

1. The **last step never shows ✓**. The plan appearing is the real “done”.
2. No percentage bar: “73 %” would be invented precision.

Real progress would need the server to stream updates (e.g. Server-Sent
Events) — a good later exercise.

### Accessibility

- Only the static line “Planning your trip…” has `role="status"`, so a
  screen reader announces it once — not every tick of the counter or step.
- Spinners use `motion-safe:animate-spin`, and the skeleton uses
  `motion-safe:animate-pulse`: both stand still when “Reduce motion” is on.

## The error state

An alert icon, the message, and a 44 px **Try again** button (shown only
for retryable errors such as 5xx). The section scrolls into view with
`scroll-mt-6` so it isn't pressed against the top edge.

## How to test

1. Click **Plan my trip** with an empty form: three errors with icons, and
   focus moves to the destination field.
2. Pick three interests: the count updates and the rest are disabled.
3. Plan a real 1-day trip: the button shows a spinner, the steps advance
   (step 2 at ~6 s), and the plan replaces them.
4. Use a made-up destination: a red “We couldn't find …” box.
5. Phone width and dark mode: chips wrap, the budget row fits, no
   sideways scrolling.

## Exercises

1. Show a “3 of 3 — deselect one to change” message when a disabled chip is
   clicked.
2. Remember the last form values in `sessionStorage` so a refresh doesn't
   lose them.
3. Stream real progress from `/api/itinerary` with Server-Sent Events and
   drive the steps from it.
