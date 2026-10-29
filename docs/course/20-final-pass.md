# Module 20 — Final pass: audit, keyboard, motion, screenshots

**Commit:** the commit adding this module · **Time:** ~60 minutes

## Goal

Check the redesign (Modules 16–19) the way a careful reviewer would, and
fix what that turns up. Then refresh the README so it shows the real app.

## 1. An automated accessibility audit with axe-core

[axe-core](https://github.com/dequelabs/axe-core) is the engine behind many
accessibility checkers. You can run it on any page from the browser
console:

```js
const s = document.createElement("script");
s.src = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js";
document.head.appendChild(s);
// once it has loaded:
const r = await axe.run(document, {
  runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"],
});
r.violations;
```

We ran it on the home page (empty and with validation errors), a saved trip
(with the places list open), and “Trip not found”, in **light and dark**.
The map was excluded: it's Google's widget, not our markup.

### What it found

**Heading order.** On the saved-trip page the plan title is an `h1`, but the
budget and day headings were `h3` — skipping `h2`. Fixed by deriving the
level from the title:

```tsx
const Subheading = titleAs === "h1" ? "h2" : "h3";
```

`BudgetSummary` takes a `headingAs` prop for the same reason. Component
headings shouldn't hard-code their level when the component is used in
different places.

**A CSS specificity surprise.** Those headings became `h2`s, and our global
rule `h1, h2 { font-family: Playfair }` beat their `font-sans` class.
Tailwind 4 puts utilities in a *cascade layer*, and **unlayered CSS always
beats layered CSS**, whatever the specificity. The fix is to put our base
styles in a layer too:

```css
@layer base {
  h1, h2 { font-family: var(--font-display), Georgia, serif; }
}
```

After the fixes: **0 violations** on every page, in both modes.

### Two false alarms worth knowing

- **Contrast “1.09 : 1” right after switching to dark mode.** axe ran
  while the `transition-colors` animation was halfway between light and
  dark. Reload, then audit.
- **“Page has no `h1`” on the saved trip.** The trip is streamed in with
  Suspense: React first sends “Loading trip…”, then the real content in a
  hidden `<div>`, and moves it into place on the **next animation frame**.
  The test browser was a background tab, where frames don't run, so the
  content sat hidden. A production build sent the full trip in 0.4 s; the
  real browser shows it immediately. Lesson: when a tool says something odd,
  find out *why* before “fixing” the app.

## 2. Keyboard check

Press **Tab** from the top of the home page and watch focus move: header
logo → “Plan a trip” → Start planning → See an example trip → destination
→ days → budget → currency → each interest. We logged every stop with a
`focusin` listener: all 16 matched `:focus-visible` **and** had a visible
ring. The order follows the visual order, so no `tabindex` was needed.

## 3. Reduced motion

The browser pane can't switch on “Reduce motion”, so we checked the CSS
directly by listing the `@media (prefers-reduced-motion…)` rules in the
loaded stylesheets. All three animations are covered:

| Animation | How it's guarded |
|---|---|
| Hero aurora drift | `@media (prefers-reduced-motion: reduce) { animation: none }` |
| Spinners | `motion-safe:animate-spin` |
| Loading skeleton | `motion-safe:animate-pulse` |

To see it yourself on a Mac: System Settings → Accessibility → Display →
**Reduce motion**.

## 4. Leftover pages

“Trip not found” and the trip error page still had small buttons without
focus rings. Both now use 44–48 px buttons with `focus-visible` rings like
the rest of the app.

## 5. README screenshots

Old screenshots showing the old design are worse than none. New ones, all
from **real data** (a real 3-day Lisbon plan, saved):

| File | Shows |
|---|---|
| `home-hero.jpg` | The landing hero (top of the README) |
| `trip-form.jpg` | Form filled in, three interests picked |
| `loading.jpg` | Step 2 of the loading progress |
| `plan-and-budget.jpg` | Title, budget card, first stop, map |
| `itinerary-and-map.jpg` | Timeline with a selected stop and its marker |
| `mobile.jpg` | Phone layout: day filter, map, first day |

Tips: hide the Next.js dev badge before capturing, and don't run
`next build` while `next dev` is running — they share `.next/`, and the dev
server started serving stale CSS until it was restarted.

## How to test

1. Run the axe snippet on each page, light and dark.
2. Tab through the home page; every stop should show a ring.
3. Turn on Reduce motion; the hero glow and spinners stop.
4. Open the README on GitHub; all six screenshots show the new design.

## Exercises

1. Add axe to the test suite with Playwright and `@axe-core/playwright`, so
   a failing audit fails CI.
2. Add a “Skip to main content” link as the first focusable element.
3. Audit the map's custom markers: are their names announced? (Hint: check
   the `title`/`aria-label` on `AdvancedMarker`.)
