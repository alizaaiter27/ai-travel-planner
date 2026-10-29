# Module 19 — The itinerary: timeline, icons, and tap targets

**Commit:** `8cd936f` · **Time:** ~60 minutes

## Goal

Make the plan — the thing people came for — easy to scan on a laptop and
easy to use with a thumb on a phone.

## What was wrong

- Each stop was one dense block of grey text: reason, duration, cost, and a
  full 60-character address all looked the same.
- The only way to show a stop on the map was a **28 px** numbered circle.
  Phones need about **44 px**.
- “Google Maps” links were tiny text, and the day filter pills were 26 px.
- Some day colours (amber, green, teal) had white numbers at only
  **3.2 : 1** contrast.
- The saved-trip page had **no `<h1>`** — its main title was an `<h2>`.

## The stop card (`components/ItineraryView.tsx`)

```
 (2)  10:30  Picasso Museum Barcelona        ← one button: badge + name
  │   See Picasso's work in the heart of El Born.
  │   🏛 Attraction   🕑 2 h   👛 ~€15 (estimate)
  │   📍 Carrer de Montcada, 15-23   Google Maps ↗
 (3)  13:00  Fa Patxoca
```

### One big button instead of a small one

The badge **and** the name are inside one `<button>`, at least 44 px tall
(`min-h-11`). Hovering underlines the name, so it's clear the name is
clickable.

The button's accessible name starts with the visible text:

```tsx
aria-label={`${item.time} ${item.placeName}: show on the map (day ${day}, stop ${number})`}
```

WCAG's *label in name* rule: when a button has an `aria-label`, it should
**contain the words people see**, so voice-control users can say
“click Picasso Museum Barcelona”.

### A timeline

A thin line joins each badge to the next one:

```tsx
{!isLast && (
  <span aria-hidden="true"
        className="absolute top-14 bottom-0 left-[1.875rem] w-0.5 bg-line-strong/40" />
)}
```

`left-[1.875rem]` (30 px) is the badge's centre: 12 px card padding + half
of the 36 px badge. The first try used `bg-line`, which was nearly
invisible on white — check decorations in the browser, not just in code.

### Details as an icon row

Category, duration, and cost became a list of small icon + text pairs.
Icons help scanning; the **text** carries the meaning, so the icons stay
`aria-hidden`.

### Shorter addresses

```ts
export function shortAddress(address: string): string {
  return address.split(", ").slice(0, 2).join(", ");
}
// "Carrer de Montcada, 15-23, Ciutat Vella, 08003 Barcelona, Spain"
//   → "Carrer de Montcada, 15-23"
```

The city is already in the page title, and the Google Maps link has the
full address. It's a pure function, so it got two unit tests in
`lib/format.test.ts`.

## Day colours with real contrast

| Day | Before | After | White text |
|---|---|---|---|
| 3 | `#16a34a` | `#15803d` | 3.3 → 5.0 : 1 |
| 4 | `#d97706` | `#b45309` | 3.2 → 5.0 : 1 |
| 7 | `#0d9488` | `#0f766e` | 3.7 → 5.5 : 1 |

(and slightly darker sky, pink, and red). The same colours draw the map
markers, so list and map still match.

## Other pieces

- **Day header:** a coloured “Day 1” pill plus the theme in the serif font,
  and the day's cost with a wallet icon.
- **Day filter:** 44 px pills, each with its day's colour dot.
- **Budget card:** bigger numbers (`text-lg font-semibold`) and an icon.
- **Save panel:** 44 px buttons with icons; “Copy link” swaps to a ✓
  “Copied”.
- **All places list:** a rotating chevron icon instead of a “›” character,
  short addresses, clearer links.
- **Heading levels:** `ItineraryView` takes `titleAs="h1" | "h2"`. On the
  home page the plan title is an `h2` under the page's `h1`; on
  `/trips/[id]` it *is* the main content, so it's the `h1`. Screen-reader
  users jump between headings — a page without an `h1` has no clear start.

## How to test

1. Open a saved trip. Click a stop's name: it highlights and its map
   marker grows. Click a marker: the list scrolls to that stop.
2. Pick “Day 2” in the filter: Day 1 fades, the map shows Day 2.
3. In DevTools, check that stop buttons, Maps links, and filter pills are at
   least 44 px tall.
4. Phone width and dark mode: no sideways scrolling, the timeline visible.
5. `npm test` — 19 tests, including `shortAddress`.

## Exercises

1. Show the walking time between consecutive stops on the timeline line
   (Google's Routes API).
2. Add a “Copy day as text” button for sending a day to a friend.
3. Let users collapse a day's stops on phones.
