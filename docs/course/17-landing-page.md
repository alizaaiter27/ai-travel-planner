# Module 17 — The landing page

**Commit:** `3011d47` · **Time:** ~60 minutes

## Goal

Turn the home page from “a form with a title” into a page that explains
the product in five seconds, shows what you'll get, and still puts the
form one click away.

## Why it matters

A visitor (or recruiter) decides very quickly whether to keep reading.
Before this module, the page didn't say what made the app different —
the *real places* rule — or what a result looks like.

## Choosing a structure

We asked UI/UX Pro Max for a landing pattern:

```bash
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "hero how it works tool" --domain landing
```

Its top match, **AI-Driven Dynamic Landing**, says: put the tool near the
top, *show* a generated result instead of describing it, then explain how
it works. Our order:

1. **Hero** — the promise, two buttons, three trust points, and a preview
   of a planned day.
2. **Plan your trip** — the form (the tool itself).
3. **Your saved trips** — for returning visitors.
4. **How it works** — three steps.
5. **Why not just ask a chatbot?** — the problem we solve.

## The hero (`components/HomeHero.tsx`)

- **One main action.** “Start planning” is the only orange button
  (`bg-accent`); “See an example trip” is a quieter outline button. Two
  equally loud buttons make people hesitate.
- **The preview uses real data.** The three stops are copied from a real
  saved Barcelona trip. A marketing mock-up with invented places would
  contradict the app's whole point.
- **The preview is `aria-hidden`.** It's a picture of a result, not
  content; screen-reader users get the real version through the
  “See an example trip” link. It's hidden on phones (`hidden sm:block`) to
  keep the form close to the top.
- **`text-balance`** on the heading avoids a single word alone on the last
  line; **`text-pretty`** does the same for paragraphs.
- Buttons are `min-h-12` (48 px) and stack full-width on phones.

The example trip's address lives in one place, `lib/example-trip.ts`, so it
can be changed without hunting through components.

## The aurora background

```css
.aurora::before {
  content: "";
  position: absolute;
  inset: -20%;
  background:
    radial-gradient(40% 50% at 15% 20%, color-mix(in srgb, var(--primary) 30%, transparent), transparent 70%),
    /* … orange and teal glows … */;
  filter: blur(40px);
  animation: aurora-drift 20s ease-in-out infinite alternate;
}

@media (prefers-reduced-motion: reduce) {
  .aurora::before { animation: none; }
}
```

- `radial-gradient`s make soft coloured glows; `blur` blends them.
- `color-mix(in srgb, var(--primary) 30%, transparent)` makes a see-through
  version of a **token**, so the glow follows dark mode automatically.
- It's drawn on `::before` behind the content, with `inset: -20%` so the
  drift never shows an edge (the section has `overflow-hidden`).
- Motion is slow, it only uses `transform` (cheap for the browser), and it
  stops for people who turn on “Reduce motion” in their OS settings.
- The glow is kept faint: text on top must still pass contrast checks.

## Icons (`components/icons.tsx`)

Small inline SVGs using paths from the Lucide set. They use
`stroke="currentColor"`, so `text-primary` colours them, and
`aria-hidden="true"`, because the words beside them say the same thing.
No emoji as icons: they look different on every device and are read out
by screen readers.

## “How it works” and the comparison table

- The steps are an ordered list (`<ol>`) because the order matters.
- The comparison is a real `<table>` with `scope="col"` / `scope="row"`
  headers, so screen readers can announce “Costs, A general chatbot: …”.
- On phones three columns were too narrow (one word per line). The topic
  column is hidden below the `sm` breakpoint
  (`hidden sm:table-cell`) — each row is still clear from its content.

## How to test

1. Home page at desktop width: hero with the preview card on the right.
2. **Start planning** jumps to the form; **See an example trip** opens the
   Barcelona trip.
3. Phone width (375 px): buttons stacked, no preview card, no sideways
   scrolling, the table readable.
4. Dark mode: glows, cards, and table all switch.
5. macOS: System Settings → Accessibility → Display → **Reduce motion**.
   The glow should stop moving.

## Common mistakes

- Putting the form far below a tall marketing section — returning users
  just want the tool.
- Using fake example content in a product whose promise is “real data”.
- Animating `background-position` or `width` instead of `transform`.
- Forgetting reduced motion for decorative animation.

## Exercises

1. Add a fourth step, “Save and share”, and make the grid 2×2 on tablets.
2. Make the hero preview show **Day 2** from the same saved trip.
3. Add a short FAQ with `<details>` elements (“Is it free?”, “Where do the
   costs come from?”).
