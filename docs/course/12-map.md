# Module 12 — An interactive map linked to the itinerary

**Commits:** `b86eace` (env example), `2256e42` (map) · **Time:** ~60 minutes

## Goal

A Google Map with a numbered, day-colored marker for every stop. Clicking a
stop in the list highlights its marker; clicking a marker highlights the stop.
A day filter shows one day at a time. On large screens the map stays visible
while you scroll the list.

## Why it matters

Travel plans are spatial. Seeing that Day 2 is all in Belém (and Day 1 isn't)
makes the plan trustworthy at a glance. It also teaches **shared state between
two very different views** and how to work with a third-party map library.

## Part A — A second, *public* Google key

The map runs **in the browser**, so its key is visible to anyone. That's
normal for map keys; it's protected differently from the server key:

| | Server key (Places) | Browser key (Maps) |
|---|---|---|
| Variable | `GOOGLE_MAPS_API_KEY` | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| Visible to visitors? | No | **Yes** |
| Application restriction | None (server has no fixed address) | **Websites:** `http://localhost:3000/*`, later your Vercel domain |
| API restriction | Places API (New) | **Maps JavaScript API** |

Setup in Google Cloud (same project):

1. **APIs & Services → Library → Maps JavaScript API → Enable.**
2. **Credentials → Create credentials → API key**, name `maps-browser`.
3. **Application restrictions → Websites** → add `http://localhost:3000/*`.
4. **API restrictions → Restrict key → Maps JavaScript API**. Save.
5. Optional: a daily quota on Maps JavaScript API map loads.
6. `.env.local`: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...` — then **save
   (⌘S)** and **restart** `npm run dev`.

`NEXT_PUBLIC_` values are copied into the browser code when the dev server
starts (and at build time), so changes need a restart.

## Concepts

### A React wrapper for Google Maps

```bash
npm install @vis.gl/react-google-maps
```

```tsx
<APIProvider apiKey={API_KEY} onError={() => setLoadFailed(true)}>
  <Map mapId="DEMO_MAP_ID" defaultCenter={…} defaultZoom={13}>
    <AdvancedMarker position={…} onClick={…}>
      <div>1</div>   {/* any HTML as the marker */}
    </AdvancedMarker>
  </Map>
</APIProvider>
```

- `APIProvider` loads Google's script once.
- **Advanced markers** need a **Map ID**; `DEMO_MAP_ID` is Google's ready-made
  one for development. (You can create your own under Map Management and set
  `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`.)
- Marker content can be any HTML — we draw our own numbered circles.

### Controlling the map with `useMap()`

Some things aren't props: fitting all markers on screen, panning to one.
Small "helper components" inside `<Map>` get the map object and act on it:

```tsx
function FitToStops({ stops }) {
  const map = useMap();
  useEffect(() => {
    const bounds = new google.maps.LatLngBounds();
    for (const stop of stops) bounds.extend(stop.position);
    map?.fitBounds(bounds, 40);
  }, [map, key]);
  return null; // renders nothing
}
```

### One state, two views

```ts
const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
const [visibleDay, setVisibleDay] = useState<number | null>(null);
```

Both live in `ItineraryView`, the closest common parent of the map and the
list (lifting state up, Module 04). Each view reads them and calls a function
to change them.

### Effect dependencies and object identity

```ts
// ❌ `selected` is a new object on every render → effect runs every render
useEffect(() => map.panTo(selected.position), [map, selected]);

// ✅ depend on plain values that only change when the selection changes
useEffect(() => map.panTo({ lat, lng }), [map, selectedPlaceId, lat, lng]);
```

In the first version, the map would snap back to the selected stop every
time anything re-rendered — fighting the user's dragging. React compares
dependencies with `===`, and two objects with the same content aren't `===`.

### Sticky positioning

```html
<div class="lg:sticky lg:top-4 lg:self-start">…map…</div>
```

On large screens the map sticks 16px from the top while the list scrolls.
`self-start` stops the grid from stretching it. A sticky element can't leave
its container, so with a short list the map scrolls away at the end — that's
expected.

## Files

| File | Purpose |
|------|---------|
| `components/TripMap.tsx` | Map, markers, fit-to-stops, pan-to-selected, fallback |
| `components/ItineraryView.tsx` | Selection + day filter state; two-column layout; clickable numbered badges |
| `lib/itinerary/day-colors.ts` | One color per day, shared by markers and badges |
| `components/TripPlanner.tsx`, `app/page.tsx` | Wider page (`max-w-6xl`), narrow text blocks (`max-w-3xl`) |

## Accessibility notes

- Each marker has a `title`: "Day 2, stop 2: Belém Tower".
- List badges are real `<button>`s with `aria-pressed` and a label like
  "Show Belém Tower on the map (day 2, stop 2)".
- The day filter is a `role="group"` of toggle buttons with `aria-pressed`.
- `gestureHandling="cooperative"`: on phones, one finger scrolls the page; two
  fingers move the map — so the map never traps scrolling.
- Day is shown by color **and** by number/label, never color alone.

## Run & test

Use a fake plan in the DevTools console (Module 08) to test for free, or plan
a real trip.

| Test | Expected |
|------|----------|
| Plan loads | Map fits all stops; markers numbered 1, 2… per day, Day 1 blue, Day 2 pink |
| Click a marker | Its stop is highlighted in the list and scrolled into view |
| Click a stop's number | Its marker grows; the map pans to it (on phones, scrolls up to the map) |
| Filter "Day 1" | Only Day 1's markers; other days dimmed in the list |
| Select a Day 2 stop while filtered to Day 1 | Filter switches to Day 2 |
| 1280px wide, long plan | Map stays 16px from the top while the list scrolls |
| No key / wrong key | "The map isn't available right now…" — the rest still works |
| Key in tracked files | `git grep` finds it nowhere |

## Common mistakes

**The key "doesn't work" after adding it.** The file wasn't saved (VS Code
shows ● on unsaved tabs), or the dev server wasn't restarted.

**"For development purposes only" watermark or a grey map.** The key's website
restriction doesn't include the address you're on, or Maps JavaScript API
isn't enabled. Check both in Google Cloud.

**Markers missing with advanced markers.** No `mapId`. Use `DEMO_MAP_ID` in
development.

**`new Map()` stops working in a file that imports `Map` from the library.**
The import shadows JavaScript's built-in `Map`. Use `globalThis.Map` (or
rename the import).

## Exercises

1. Draw a line connecting each day's stops in order (`Polyline`). Which
   component should own it?
2. Show the selected stop's name in an `InfoWindow` above its marker.
3. Add the Vercel domain to the browser key's website restrictions in
   preparation for deployment. What exact pattern will you use?
