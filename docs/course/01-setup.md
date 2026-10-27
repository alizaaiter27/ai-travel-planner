# Module 01 — Setup: create the Next.js project

**Commit:** `823a063` · **Time:** ~20 minutes

## Goal

An empty but working Next.js app, running on your computer, tracked by Git.

## Why it matters

Everything else builds on this foundation. Getting the tools right now avoids
confusing errors later.

## Concepts

- **Node.js** runs JavaScript outside the browser. Next.js, its dev server, and
  all build tools run on Node.
- **npm** (Node Package Manager) downloads libraries ("packages") into
  `node_modules/` and records them in `package.json`.
- **npx** runs a package's command without installing it permanently.
- **Git** records snapshots ("commits") of your project so you can see history
  and undo mistakes.

## 1. Check your tools

```bash
node -v      # need v20.9 or newer (this course used v22.20.0)
npm -v       # this course used 10.9.3
git --version
```

If `node` isn't found, install the LTS version from <https://nodejs.org>.

Make sure Git knows who you are (used as the author of your commits):

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

## 2. Create the project

Pick a folder **of its own** for the project — not inside another project.

```bash
cd ~
npx create-next-app@latest ai-travel-planner --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --yes
```

What each flag means:

| Flag | Meaning | Why we chose it |
|------|---------|-----------------|
| `--ts` | TypeScript: JavaScript with types | Catches mistakes (like a budget stored as text) before the code runs |
| `--tailwind` | Tailwind CSS | Style with small classes like `flex p-4 text-lg`; makes responsive design easy |
| `--eslint` | A code checker | Finds common bugs; run with `npm run lint` |
| `--app` | The **App Router** | Folders in `app/` become pages; server code lives in the same project |
| `--no-src-dir` | Put `app/` at the project root | Shorter paths |
| `--import-alias "@/*"` | Write `@/lib/x` instead of `../../lib/x` | Readable imports as the project grows |
| `--use-npm` | Use npm as the package manager | The default, nothing extra to install |
| `--yes` | Accept defaults for any remaining questions | Non-interactive |

## 3. Tour of the generated files

| File | What it is |
|------|-----------|
| `app/layout.tsx` | The HTML "frame" shared by every page: `<html>`, `<body>`, fonts. `{children}` is where each page's content goes. |
| `app/page.tsx` | The home page (`/`). A React component — a function that returns what to show. |
| `app/globals.css` | Global styles. `@import "tailwindcss"` turns Tailwind on. |
| `package.json` | Project name, dependencies, and scripts. |
| `tsconfig.json` | TypeScript settings, including the `@/*` alias. |
| `next.config.ts` | Next.js settings. |
| `.gitignore` | Files Git should never save: `node_modules/`, `.next/`, and **`.env*`** (where secrets will go). |
| `AGENTS.md` | Written by `next dev`. Notes for AI coding tools: read the docs in `node_modules/next/dist/docs/` because this Next.js version may differ from what they learned. |

The scripts in `package.json`:

| Command | Does |
|---------|------|
| `npm run dev` | Starts the development server with live reload |
| `npm run build` | Builds the optimized production version |
| `npm run start` | Runs the production build |
| `npm run lint` | Checks code with ESLint |

## 4. Run it

```bash
cd ai-travel-planner
npm run dev
```

Open <http://localhost:3000>. You should see the Next.js welcome page. Stop
the server with `Ctrl+C`.

## 5. Check Git

```bash
git log --oneline
```

Expected: `xxxxxxx Initial commit from Create Next App`.

## Common mistakes

**`npm error code EIDLETIMEOUT` / "Idle timeout reached"**
Your network was too slow for npm. The project files are created, but packages
(and the first Git commit) are missing. Fix:

```bash
cd ai-travel-planner
npm install --fetch-timeout=600000 --fetch-retries=5
git init -b main
git add -A
git commit -m "Initial commit from Create Next App"
```

**`sh: eslint: command not found`** — packages weren't installed. Run
`npm install` (with the flags above if your network is slow).

**Project created inside another project's folder** — move it. Stop the dev
server first, then:

```bash
mv ~/some-folder/ai-travel-planner ~/ai-travel-planner
rm -rf ~/ai-travel-planner/.next   # build cache stores old paths; it's rebuilt automatically
```

Git history moves with the folder (it's stored in the hidden `.git/` folder).

**"5 high severity vulnerabilities" after install** — usually from tools used
only during development. Don't run `npm audit fix --force` blindly: it can
install breaking versions. Review with `npm audit` before deploying.

## Exercises

1. Change the text in `app/page.tsx`, save, and watch the browser update
   without a refresh. What is this feature called?
2. Run `npm run lint`. What does no output mean?
3. Open `.gitignore`. Which line will protect your API keys later?
