# Module 11 — Budget calculations (and your first unit tests)

**Commit:** `277be1f` · **Time:** ~45 minutes

## Goal

Show what the plan costs per day and in total, how that compares with the
traveler's budget, and what's left — all calculated **in code**, clearly
labeled as estimates. Add automated tests for the math.

## Why it matters

Language models are unreliable at arithmetic: they can add 35 + 48 and say 73.
The AI only supplies a rough cost **per stop**; our code does every sum. And
because money math is easy to get subtly wrong, it gets **unit tests**.

## Concepts

### Pure functions

```ts
export function summarizeBudget(itinerary: Itinerary, budget: number): BudgetSummary
```

Same input → same output, no side effects (no fetching, no state, no DOM).
Pure functions are the easiest code to test and reason about. Keep important
logic in pure functions and let components just display results.

### Floating-point money

```js
0.1 + 0.2 // 0.30000000000000004
```

Computers store decimals in binary, which can't represent 0.1 exactly. Round
to cents after each sum:

```ts
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
```

(Big financial systems store money as whole cents — integers — instead. For
rough travel estimates, rounding is enough.)

### Unknown is not zero

A stop with `estimatedCost: null` ("no idea") is **not** free. The summary
skips it in the total but counts it, and the UI says *"1 stop has no cost
estimate and isn't counted."* Hiding that would make the plan look cheaper
than it is.

### Unit tests with Vitest

A unit test runs a small piece of code with known input and checks the output:

```ts
it("reports a negative remaining amount when over budget", () => {
  const summary = summarizeBudget(itinerary([[80, 50]]), 100);
  expect(summary.remaining).toBe(-30);
  expect(summary.usedPercent).toBe(130);
});
```

Run all tests:

```bash
npm test
```

Tests run in milliseconds, cost nothing (no API calls), and catch it
immediately if a later change breaks the math.

### Accessible progress bars — `role="meter"`

```tsx
<div role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={barWidth}
     aria-valuetext={`${summary.usedPercent}% of your budget`}>
```

The visual bar stops at 100%, but `aria-valuetext` tells screen-reader users
the real number ("106% of your budget"). Over budget is shown in **words and
color** ("Over by", red) — never by color alone.

## Files

| File | Purpose |
|------|---------|
| `lib/itinerary/budget.ts` | `summarizeBudget()` and `roundMoney()` — all the math |
| `lib/itinerary/budget.test.ts` | 6 unit tests |
| `vitest.config.mts` | Test config, including the `@/` import alias |
| `components/BudgetSummary.tsx` | The budget card |
| `components/ItineraryView.tsx` | Shows the card and a subtotal per day |
| `components/TripPlanner.tsx` | Keeps the request with the plan (for the budget) |
| `lib/format.ts` | Shared `formatMoney`, `formatCost`, `formatDuration` |
| `package.json` | `vitest`, `"test": "vitest run"`, `@types/node` → `^22` |

## Setup

```bash
npm install -D "@types/node@^22" vitest
npm pkg set scripts.test="vitest run"
```

`vitest.config.mts`:

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname) } },
  test: { include: ["**/*.test.ts"], exclude: ["node_modules", ".next"] },
});
```

## What's labeled, and why

| Label | Reason |
|-------|--------|
| "~" before every amount | Estimates, not prices |
| "for one person" | The AI estimates per person; the budget may be for a group |
| "Accommodation and transport aren't included" | The plan only covers stops |
| "N stops have no cost estimate" | Unknown ≠ free |

## Run & test

```bash
npm test          # 6 passed
```

In the browser, a real plan shows the **Budget estimate** card above Day 1
and "~€X est." next to each day. To check the math without an AI call,
replace `fetch` in the DevTools console with a fake plan (see Module 08) using
known numbers — e.g. budget 100, costs `[10, null, 0]` and `[50, 45.5]`:

| Shown | Expected |
|-------|----------|
| Day 1 | ~€10 |
| Day 2 | ~€96 |
| Plan estimate | ~€106 |
| Over by | ~€6 (red), bar full |
| Note | "1 stop has no cost estimate and isn't counted." |

## Common mistakes

**`npm install vitest` fails with "Conflicting peer dependency: @types/node".**
The starter template pins `@types/node@^20`; Vitest 5 needs `^22` or newer.
Your Node runtime is 22, so update the types to match. Don't reach for
`--legacy-peer-deps` — it hides real mismatches.

**Vite warns about "ESM syntax in a file loaded as CommonJS".** Name the
config `vitest.config.mts` so Node knows it's an ES module.

**Treating `null` as `0`.** `null + 10` is `10` in JavaScript, so a missing
check silently counts "unknown" as free.

## Exercises

1. Add a test: a 3-day plan where every cost is `null`. What should
   `estimatedTotal`, `unknownCount`, and `usedPercent` be?
2. Show the average estimated cost per day in the budget card. Write the test
   first, then the code.
3. Add a "Travelers" field (1–10) to the form and multiply estimates by it.
   Which files change? What new tests would you write?
