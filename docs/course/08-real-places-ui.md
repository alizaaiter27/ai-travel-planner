# Module 08 — Real places in the UI: loading, errors, retry, empty

**Commit:** `e544196` · **Time:** ~50 minutes

## Goal

Submitting the form calls `POST /api/places` and shows the real places found,
grouped into "Things to do" and "Places to eat". Every way the call can fail
has a clear, helpful screen.

## Why it matters

Mock data never fails; real networks do. Users judge an app by how it behaves
when things go wrong. This module adds the states every data-fetching UI needs:

| State | When | What the user sees |
|-------|------|--------------------|
| Loading | Waiting for the server | "Finding real places…" + skeleton |
| Success | Places found | The list (and, for now, the sample itinerary) |
| Empty | Destination found, 0 places | Suggestion to change interests |
| Error, retryable | Network down, 5xx, malformed reply | Message + **Try again** |
| Error, not retryable | 404 not found, 400 invalid | Message only — retrying won't help |

## Concepts

### Calling your own API from the browser

```ts
const response = await fetch("/api/places", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(request),
});
```

The URL starts with `/`, so it goes to the same site the page came from. The
API key never appears here — the server adds it (Module 07).

### Two different kinds of failure

1. **`fetch` throws** → no response at all (offline, DNS failure). Catch it
   with `try/catch`.
2. **`fetch` succeeds but `response.ok` is false** → the server answered with
   an error status (400, 404, 502…). `fetch` does **not** throw for these; you
   must check `response.ok` yourself.

### Which errors are worth retrying?

- **4xx** = something about the request. Sending the same request again gives
  the same answer. No retry button.
- **5xx** and network failures = probably temporary. Offer **Try again**.

### Validate your own API's responses too

```ts
const parsed = placesResponseSchema.safeParse(data);
```

Even your own server can have a bug or an old version deployed. The browser
checks the reply's shape before using it — the same schema rules as before.

### `useRef` vs `useState`

```ts
const lastRequest = useRef<TripRequest | null>(null);
```

The last request is remembered so **Try again** can resend it. It's a ref,
not state, because changing it doesn't need to redraw the screen. Rule of
thumb: if the screen shows it, use state; if it's just remembered, use a ref.

## Files

| File | Purpose |
|------|---------|
| `lib/api/places-client.ts` | Browser helper: calls the API, converts every failure into a `PlacesRequestError` with a safe message and `canRetry` |
| `lib/schemas/place.ts` | Adds `placesResponseSchema` |
| `components/PlaceCandidates.tsx` | Lists places in two groups with type, address, Google Maps link |
| `components/TripPlanner.tsx` | Adds `"error"` status, retry, empty state, calls the real API |

## Walkthrough

### The browser helper — `lib/api/places-client.ts`

```ts
try {
  response = await fetch("/api/places", { /* … */ });
} catch {
  throw new PlacesRequestError("We couldn't connect. Check your internet connection and try again.", true);
}

const data: unknown = await response.json().catch(() => null);

if (!response.ok) {
  const canRetry = response.status >= 500;
  throw new PlacesRequestError(readErrorMessage(data), canRetry);
}
```

- `data` is typed `unknown` on purpose: we don't know its shape until we check.
- `.catch(() => null)` handles replies that aren't JSON at all.
- The server's own message (e.g. "We couldn't find …") is shown when present.

### Four statuses — `components/TripPlanner.tsx`

```ts
type Status = "idle" | "loading" | "success" | "error";
```

```tsx
try {
  const { destinationName, places } = await fetchPlaces(request);
  setResult({ destinationName, places, itinerary });
  setStatus("success");
} catch (err) {
  setError(err instanceof PlacesRequestError
    ? { message: err.message, canRetry: err.canRetry }
    : { message: "Something unexpected went wrong. Please try again.", canRetry: true });
  setStatus("error");
}
```

`instanceof` checks whether the error is one we created (with a safe message)
or something unexpected (then we show a generic message instead of leaking
technical details).

### Scrolling results into view

```ts
outcome?.focus({ preventScroll: true });
outcome?.scrollIntoView({ block: "start" });
```

`focus()` alone only scrolls until *part* of a tall element is visible — the
results landed mid-list. Focusing without scrolling, then scrolling the top
into view, fixes it. `scroll-mt-6` on the section leaves a 24px gap above.

### External links

```tsx
<a href={place.googleMapsUri} target="_blank" rel="noopener noreferrer">
  View on Google Maps<span className="sr-only"> (opens in a new tab)</span>
</a>
```

- `rel="noopener noreferrer"` stops the new tab from controlling your page.
- The hidden text warns screen-reader users that a new tab opens.

## Run & test

Real requests:

1. Lisbon, 3 days, Food & drink + Art & museums → **"Things to do (20)"**,
   **"Places to eat (10)"**, real names like Time Out Market.
2. `Qxzvbn Plorkt` → *"We couldn't find …"*, **no** Try again button.

Simulating failures without breaking anything: in the browser DevTools
console, temporarily replace `fetch`:

```js
const realFetch = window.fetch;
window.fetch = async (url, opts) =>
  String(url).includes("/api/places")
    ? new Response(JSON.stringify({ error: "Service down" }), { status: 502 })
    : realFetch(url, opts);
// submit the form → error + Try again
window.fetch = realFetch; // click Try again → places load
```

| Simulated | Expected |
|-----------|----------|
| 502 response, then retry with real fetch | Error + Try again → places load |
| `fetch` throws (`throw new TypeError("Failed to fetch")`) | "We couldn't connect…" + Try again |
| `{ destinationName: "X", places: [] }` | "No matching places found" |
| `{ places: "oops" }` with status 200 | "We got an unexpected response…" + Try again |

Phone width: lists stack; each scrolls inside its own box; no sideways scroll.

## Common mistakes

**Results appear but the page doesn't scroll to them.** `focus()` on a tall
element scrolls minimally. Use `focus({ preventScroll: true })` +
`scrollIntoView({ block: "start" })`.

**`behavior: "smooth"` scrolling does nothing.** Some browsers/settings skip
smooth scrolling (it's also unpleasant for people sensitive to motion). An
instant jump is more reliable.

**Assuming `fetch` throws on 404/500.** It doesn't. Always check
`response.ok`.

## Exercises

1. Make a 429 ("Too Many Requests") response retryable. Which line changes?
2. Show how many places came from each interest. What would the API need to
   return?
3. Why is `lastRequest` a ref and not state? What would go wrong — or not —
   if it were state?
