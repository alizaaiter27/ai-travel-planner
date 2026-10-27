# Module 03 — The trip form

**Commit:** `d9a2890` · **Time:** ~45 minutes

## Goal

A form for destination, days, budget, currency, interests, and optional
preferences. Invalid input shows a clear message under the field.

## Why it matters

The form is the app's front door. It teaches the core of React: **state**,
**events**, and re-rendering. Good validation messages and keyboard support
also make the app usable for everyone.

## Concepts

### Client Components — `"use client"`

Server Components (Module 02) can't respond to typing or clicks. A form needs
JavaScript running **in the browser**, so the file starts with:

```tsx
"use client";
```

This tells Next.js to send this component's code to the browser too. A Server
Component (like `app/page.tsx`) can still render it.

### State — `useState`

State is data React remembers between renders. When it changes, React redraws
the parts of the screen that use it.

```tsx
const [values, setValues] = useState<FormValues>(initialValues);
//      ↑ current value   ↑ function to change it
```

### Controlled inputs

```tsx
<input
  value={values.destination}
  onChange={(e) => updateField("destination", e.target.value)}
/>
```

The input always shows what's in state, and every keystroke updates state.
State is the **single source of truth**, so validation always sees exactly
what's on screen.

### Client-side validation is for convenience only

Checking input in the browser gives instant feedback, but anyone can bypass it
by calling the server directly. **The server must validate again** (Module 07).

## Files

| File | Purpose |
|------|---------|
| `lib/trip-options.ts` | Lists of currencies and interests, plus limits (1–14 days, 500 characters) |
| `components/TripForm.tsx` | The form: state, validation, error display |
| `app/page.tsx` | Renders `<TripForm />` |

Why a separate `trip-options.ts`? The form and, later, the server validation
must use the **same lists**. One file = one source of truth.

## Walkthrough

### Form values are strings

```ts
type FormValues = {
  destination: string;
  days: string;      // <input> always gives text, even type="number"
  budget: string;
  currency: string;
  interests: string[];
  preferences: string;
};
```

We convert to numbers when validating.

### Validation returns one message per field

```ts
function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (values.destination.trim().length < 2) {
    errors.destination = "Enter a destination (at least 2 characters).";
  }
  // …days, budget, interests, preferences…
  return errors; // empty object = everything is valid
}
```

(Module 05 replaces this function with a Zod schema.)

### Submitting

```tsx
function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();          // don't reload the page
  const nextErrors = validate(values);
  setErrors(nextErrors);
  if (Object.keys(nextErrors).length > 0) {
    document.getElementById(Object.keys(nextErrors)[0])?.focus();
    return;
  }
  // …valid: continue
}
```

- `preventDefault()` stops the browser's old-style form submission (a full
  page reload).
- `noValidate` on `<form>` turns off the browser's built-in popups so our
  messages look the same in every browser.
- Focus moves to the first invalid field.

### Accessibility details

| Technique | Why |
|-----------|-----|
| `<label htmlFor="destination">` + `id="destination"` | Clicking the label focuses the input; screen readers read the label |
| `aria-invalid` on invalid fields | Screen readers announce "invalid" |
| `aria-describedby="destination-error"` | Screen readers read the error with the field |
| `role="alert"` on error messages | Errors are announced as they appear |
| Interests are real checkboxes, visually hidden with `sr-only`, wrapped in styled labels | Keyboard works: Tab to reach, Space to toggle |

## Run & test

```bash
npm run lint && npx tsc --noEmit
npm run dev
```

1. Submit the empty form → 3 errors (destination, budget, interests), focus
   jumps to Destination.
2. Budget `0` → "Enter a total budget greater than 0."
3. Fill everything correctly → a preview of the request appears.
4. Keyboard only: Tab through fields, Space on an interest, Enter to submit.
5. Narrow the window to phone width: fields stack, nothing scrolls sideways.

## Common mistakes

**The page reloads and the URL ends in `/?`.** The form submitted before React
finished loading ("hydrating") in the browser, so `preventDefault()` never ran.
It can happen if you click within a split second of page load. Server-side
validation (Module 07) makes sure such requests are still checked.

**Typing does nothing in an input.** You set `value` but forgot `onChange` (or
`onChange` doesn't update state). A controlled input only changes when state
changes.

## Exercises

1. Where would you add a new currency like `"CHF"`? Does the form need any
   other change for it to appear in the dropdown?
2. Make the destination error say "Destination is required" when the field is
   completely empty, but keep the current message for one character.
3. Why do we keep `days` as a string in state instead of a number?
