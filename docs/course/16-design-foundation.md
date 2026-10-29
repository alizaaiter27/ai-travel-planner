# Module 16 — Design foundation: tokens, fonts, header & footer

**Commit:** the commit adding this module · **Time:** ~60 minutes

## Goal

Give the app its own look — a travel palette, editorial headings, a header
and footer — in a way that lets us restyle the whole app (and dark mode)
from **one file**.

## Why it matters

Until now every component used raw Tailwind colours with a dark-mode twin:

```tsx
className="text-zinc-600 dark:text-zinc-400"
```

That's 70+ colour classes spread over 12 files. Changing the brand colour
would mean editing all of them, and it's easy to forget a `dark:` twin. Real
design systems solve this with **design tokens**: named roles (“muted
text”, “main action”) instead of specific colours.

## Choosing a direction with UI/UX Pro Max

We installed the [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
skill (a searchable database of styles, palettes, and font pairings) into
`~/.claude/skills/`, and asked it for a design system:

```bash
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py \
  "travel planner itinerary AI tool" --design-system -p "AI Travel Planner"
```

It suggested a **Travel/Tourism** palette: sky blue + adventure orange on a
pale blue background. Its font pick, though, was *Noto Sans Thai* — meant
for Thai-language sites. Tools give suggestions, not answers: a second,
narrower search (`"editorial travel magazine elegant" --domain typography`)
gave **Playfair Display + Inter**, which fits a travel-magazine feel.

## Step 1 — Tokens in `app/globals.css`

```css
:root {
  --canvas: #f0f9ff;      /* page background */
  --surface: #ffffff;     /* cards, inputs */
  --ink: #0b2540;         /* main text */
  --ink-muted: #475569;   /* secondary text */
  --primary: #0369a1;     /* links, focus, selection */
  --accent: #c2410c;      /* main call to action */
  /* … */
}

@media (prefers-color-scheme: dark) {
  :root { --canvas: #0a1422; --ink: #e7eef6; /* … */ }
}

@theme inline {
  --color-canvas: var(--canvas);
  --color-ink-muted: var(--ink-muted);
  /* … */
}
```

`@theme` is Tailwind 4's way to add your own utilities: `--color-ink-muted`
creates `text-ink-muted`, `bg-ink-muted`, `border-ink-muted`, and so on.
Because the values point at CSS variables that change in dark mode, one
class now works in both modes:

```tsx
className="text-ink-muted"   // was: text-zinc-600 dark:text-zinc-400
```

`color-scheme: light` / `dark` also tells the browser to draw native parts
(the `<select>` arrow, scrollbars) in the matching mode.

## Step 2 — Contrast is checked, not eyeballed

The palette's suggested sky blue `#0EA5E9` with white text is only
**2.8 : 1** — below the WCAG minimum of 4.5 : 1 for text. Same for white on
`#EA580C` orange (3.6 : 1). So the *roles* changed:

| Token | Light | Why |
|---|---|---|
| `primary` | `#0369A1` (darker sky) | 5.9 : 1 with white, and as link text |
| `accent` | `#C2410C` (darker orange) | 5.2 : 1 with white button text |
| `line-strong` | `#71849B` | Input borders need **3 : 1** to be visible |

In dark mode the colours flip: light sky blue and light orange with
*dark* text on top. We checked every pair with a small Node script using
the WCAG relative-luminance formula; all pass.

## Step 3 — Moving components to tokens

The replacement was mechanical, so we did it with an ordered list of
search-and-replace rules (pairs first, then single classes):

```
text-zinc-600 dark:text-zinc-400  →  text-ink-muted
border-zinc-200 … dark:border-zinc-800  →  border-line
bg-sky-600 … text-white … hover:bg-sky-700  →  bg-accent text-on-accent hover:bg-accent-hover
```

Then `grep` for leftover `zinc|sky-` classes and fix the few the rules
missed. Error (red) and budget (green) colours stay as they are: they carry
meaning, not brand.

Two details:

- Focus rings with `ring-offset-2` draw a white gap by default — wrong in
  dark mode. Adding `ring-offset-canvas` makes the gap match the page.
- Cards got `bg-surface` so they stand out from the pale blue page.

## Step 4 — Fonts with `next/font`

```tsx
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });
```

`next/font` downloads the fonts at build time and serves them from our own
domain — visitors' browsers never contact Google, and there's no layout
jump when the font loads. In CSS, `h1, h2` use `--font-display`
(Playfair); everything else uses Inter.

## Step 5 — Header and footer

`components/SiteHeader.tsx` and `components/SiteFooter.tsx` are added once
in `app/layout.tsx`, so every page gets them.

- The logo is an inline SVG coloured with token classes (`fill-primary`),
  so it follows dark mode too. It has `aria-hidden="true"` because the text
  next to it already says the site name.
- Every link is at least **44 px tall** (`min-h-11`) — the recommended
  touch-target size on phones.
- The home page heading changed from the app name (now in the header) to
  what you can *do*: “Plan a trip with real places”.

## How to test

1. `npm run dev`, open <http://localhost:3000>.
2. Switch your OS to dark mode (or DevTools → Rendering → *Emulate
   prefers-color-scheme*). Every part of the page should switch, including
   the form controls.
3. Tab through the page: focus rings should be visible in both modes.
4. Phone width (375 px): no sideways scrolling; header links easy to tap.
5. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`.

## Common mistakes

- Using a palette's colours as-is without checking text contrast.
- Defining dark colours in `@theme` directly — `@theme` values are fixed;
  point them at CSS variables that change instead (`@theme inline`).
- Forgetting the ring offset colour, leaving white halos in dark mode.

## Exercises

1. Add a `--danger` token and move the red error styles onto it.
2. Add a manual light/dark toggle. Hint: a `data-theme` attribute on
   `<html>` and a script that runs *before* the page paints, to avoid a
   flash of the wrong theme.
3. Change `--accent` to a teal of your choice and re-run the contrast check.
