# Module 05 — Validation with Zod

**Commit:** `442d71a` · **Time:** ~40 minutes

## Goal

Define "a valid trip request" and "a valid itinerary" **once**, as Zod
schemas, and use them in the form now and on the server later.

## Why it matters

The browser's checks can be skipped by anyone. The server must check again —
with **exactly the same rules**. Writing the rules twice means they'll
eventually disagree. A shared schema fixes that.

## Concepts

### A schema describes data and its rules

```ts
destination: z.string().trim().min(2, { error: "Enter a destination (at least 2 characters)." })
```

Read it left to right: "a string, trimmed, at least 2 characters long".

### `z.coerce` converts before checking

```ts
days: z.coerce.number().int().min(1).max(14)
```

The form gives `"4"` (text); `coerce` turns it into `4` before validating.

### `safeParse` never throws

```ts
const result = tripRequestSchema.safeParse(values);
if (!result.success) { /* result.error lists every problem */ }
else { /* result.data is clean: trimmed text, real numbers, fully typed */ }
```

Use `.parse()` when bad data should stop everything (it throws); use
`.safeParse()` when you want to handle problems yourself.

### Types come from schemas

```ts
export type TripRequest = z.output<typeof tripRequestSchema>;
export type Itinerary  = z.infer<typeof itinerarySchema>;
```

Rules and types can no longer drift apart. `z.output` is the shape **after**
validation (`days` is a number).

## Files

| File | Change |
|------|--------|
| `lib/schemas/trip.ts` | New: `tripRequestSchema`, `itinerarySchema` (+ item/day/category) |
| `types/trip.ts` | Types now generated from the schemas |
| `components/TripForm.tsx` | `validate()` replaced by `safeParse` |
| `components/TripPlanner.tsx` | Checks the itinerary with `itinerarySchema.parse()` |
| `package.json` | Adds `zod` |

```bash
npm install zod
```

## Walkthrough

### Turning Zod errors into one message per field

```ts
function toFormErrors(error: z.ZodError<TripRequest>): FormErrors {
  const { fieldErrors } = z.flattenError(error); // { budget: ["msg", …], … }
  const errors: FormErrors = {};
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages?.[0]) errors[field as keyof FormValues] = messages[0];
  }
  return errors;
}
```

The error display from Module 03 didn't need to change.

### Validating data that comes into the app

```ts
setItinerary(itinerarySchema.parse(getMockItinerary(request)));
```

Pointless for mock data — but soon the itinerary comes from an AI, which can
return missing fields, `"9am"` instead of `"09:00"`, or negative costs. This
check is where bad data gets stopped.

### Zod 4 syntax notes

- Custom messages: `{ error: "…" }` (older tutorials use `{ message: "…" }`).
- URLs: `z.url()` (older: `z.string().url()`).
- Flattening errors: `z.flattenError(err)` (older: `err.flatten()`).

## Run & test

| Input | Expected |
|-------|----------|
| Everything empty | Errors on destination, budget, interests |
| Destination `"   "` | "at least 2 characters" (trimmed first) |
| Days `0`, `2.5`, `15` | "whole number of days from 1 to 14" |
| Budget `-5` | "greater than 0" |
| 501-character preferences | "under 500 characters" |
| `"   Rome, Italy   "`, 3 days, 800 | Heading shows "Rome, Italy" — trimmed |

## Common mistakes

**TypeScript: `Type 'number' is not assignable to type 'string'` on a
`ZodError`.** Zod's error is typed with the *validated* shape (`days: number`),
not the form's (`days: string`). Type helpers with `z.ZodError<TripRequest>`.
The type checker caught this before the code ever ran — that's its job.

## Exercises

1. Add a rule: budget must be at least 10. Where do you change it, and does
   the form need any other change?
2. What does `tripRequestSchema.safeParse({ days: "3" })` return? List the
   fields that will have errors.
3. Why is `.parse()` (throwing) acceptable for mock data but not for user
   input?
