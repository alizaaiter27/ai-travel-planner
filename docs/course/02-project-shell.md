# Module 02 — Project shell & publishing to GitHub

**Commit:** `5a94697` · **Time:** ~25 minutes

## Goal

Replace the starter template with our own title and a placeholder home page,
then publish the repository to GitHub.

## Why it matters

A clean baseline makes every later change easy to see. Publishing early gives
you a backup and a public history of your progress.

## Concepts

### Server Components (the default)

In the App Router, components run **on the server** by default. The server
turns them into HTML and sends that to the browser. Their code is never
downloaded by the browser.

This matters later: code that uses secret API keys must run on the server.
Components that react to clicks and typing need `"use client"` (Module 03).

### Metadata

Metadata is information *about* a page: the tab title, the description shown
by search engines and link previews. In Next.js you export a `metadata` object
from a layout or page.

### Tailwind utility classes

Instead of writing CSS files, you add small classes:

| Class | Meaning |
|-------|---------|
| `mx-auto` | center horizontally |
| `max-w-3xl` | limit width |
| `px-4 sm:px-6` | 16px side padding; 24px from 640px width up |
| `text-3xl font-semibold` | big, semi-bold text |
| `dark:text-zinc-400` | color used when the system is in dark mode |

The `sm:` prefix means "from the `sm` screen size and up". Tailwind is
**mobile-first**: write the phone style first, then add larger-screen variants.

## Files

| File | Change |
|------|--------|
| `app/layout.tsx` | Real title and description |
| `app/page.tsx` | Simple intro instead of the starter page |
| `app/globals.css` | Use the Geist font on `body` |
| `public/*.svg` | Deleted (unused starter images) |

## Walkthrough

### Title template — `app/layout.tsx`

```ts
export const metadata: Metadata = {
  title: {
    default: "AI Travel Planner",
    template: "%s · AI Travel Planner",
  },
  description:
    "Plan a day-by-day trip with real places, suggested times, and estimated costs.",
};
```

- `default` is used when a page doesn't set its own title.
- `template` wraps page titles: a page with `title: "Saved trips"` shows
  **"Saved trips · AI Travel Planner"**. `%s` is replaced by the page's title.

### Font fix — `app/globals.css`

The starter loads the Geist font but then overrides it with Arial:

```css
font-family: var(--font-sans), Arial, Helvetica, sans-serif;
```

`var(--font-sans)` points to Geist; Arial is only a fallback now.

### Apostrophes in JSX

```tsx
Tell us where you&apos;re going…
```

React's linter asks for `&apos;` so apostrophes aren't confused with code.

## Run & test

```bash
npm run lint
npx tsc --noEmit     # TypeScript check without building
npm run dev
```

In the browser: the tab reads **"AI Travel Planner"**, the page shows the intro.

## Publish to GitHub with VS Code

1. **File → Open Folder…** → choose the project folder itself.
2. Open **Source Control** (branch icon, or `⌃⇧G`).
3. Click **Publish Branch**. Sign in to GitHub if asked (first time only).
4. Choose **public** (good for a portfolio) or **private**.
5. Click **Open on GitHub** to check: your files are there, `node_modules/` and
   `.next/` are not.

After that, each time you commit, click **Sync Changes** to upload.

Check from the terminal that you're in sync:

```bash
git fetch origin
git status -sb      # "## main...origin/main" with nothing after = in sync
                    # "[ahead 2]" = 2 local commits not uploaded yet
```

## Common mistakes

**Sync didn't upload anything.** `git status -sb` still says `[ahead N]`.
Make sure VS Code opened the project folder (not a parent folder), then click
**Sync Changes** again.

**Contributor you didn't expect on GitHub.** GitHub lists anyone named in a
`Co-Authored-By:` line in a commit message. To remove one from existing
commits you must rewrite them, which changes their IDs, then force-push:

```bash
git branch backup-before-rewrite                      # safety copy
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch -f \
  --msg-filter 'sed "/^Co-Authored-By:/d" | git stripspace' <first-commit>..HEAD
git push --force-with-lease origin main
```

Only do this on a repo nobody else works on. `--force-with-lease` refuses to
overwrite if someone else pushed in the meantime.

## Exercises

1. Add `export const metadata = { title: "About" }` to a new `app/about/page.tsx`
   with any content. What does the browser tab show at `/about`?
2. What's the difference between `px-4` and `sm:px-6` on a phone?
3. Why will secret API calls go in Server Components or server code, never in
   browser code?
