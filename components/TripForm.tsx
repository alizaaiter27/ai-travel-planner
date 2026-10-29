"use client";

import { useState } from "react";
import { z } from "zod";
import { tripRequestSchema } from "@/lib/schemas/trip";
import {
  CURRENCIES,
  INTERESTS,
  MAX_DAYS,
  MAX_PREFERENCES_LENGTH,
  MIN_DAYS,
} from "@/lib/trip-options";
import {
  AlertCircleIcon,
  CheckIcon,
  LandmarkIcon,
  MapPinIcon,
  MoonIcon,
  MountainIcon,
  PaletteIcon,
  ShoppingBagIcon,
  SpinnerIcon,
  SunIcon,
  UsersIcon,
  UtensilsIcon,
} from "@/components/icons";
import type { Currency, Interest, TripRequest } from "@/types/trip";

// What the user has typed so far. Number fields are kept as strings
// because that's what <input> gives us; we convert them when validating.
type FormValues = {
  destination: string;
  days: string;
  budget: string;
  currency: Currency;
  interests: Interest[];
  preferences: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  destination: "",
  days: "3",
  budget: "",
  currency: "USD",
  interests: [],
  preferences: "",
};

// Turns Zod's error list into one message per field, e.g.
// { budget: "Enter a total budget greater than 0." }
function toFormErrors(error: z.ZodError<TripRequest>): FormErrors {
  const { fieldErrors } = z.flattenError(error);
  const errors: FormErrors = {};
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages?.[0]) errors[field as keyof FormValues] = messages[0];
  }
  return errors;
}

const inputClass =
  "mt-1.5 block min-h-11 rounded-lg border border-line-strong bg-surface px-3 py-2 text-base text-ink " +
  "placeholder:text-ink-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 " +
  "aria-[invalid=true]:border-red-600 dark:aria-[invalid=true]:border-red-400";

const labelClass = "block text-sm font-medium";
const hintClass = "mt-1 text-xs text-ink-muted";

// Google Places is searched for the first few interests only (see
// MAX_INTEREST_QUERIES in lib/google-maps/places.ts), so the form says so
// and stops more being picked, instead of silently ignoring them.
const MAX_INTERESTS = 3;

const INTEREST_ICONS: Record<Interest, (props: { className?: string }) => React.ReactNode> = {
  "Culture & history": LandmarkIcon,
  "Food & drink": UtensilsIcon,
  "Nature & outdoors": MountainIcon,
  "Art & museums": PaletteIcon,
  Nightlife: MoonIcon,
  Shopping: ShoppingBagIcon,
  "Family-friendly": UsersIcon,
  Relaxation: SunIcon,
};

type Props = {
  onSubmit: (request: TripRequest) => void;
  isLoading: boolean;
};

export default function TripForm({ onSubmit, isLoading }: Props) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});

  function updateField<K extends keyof FormValues>(
    field: K,
    value: FormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function toggleInterest(interest: Interest) {
    setValues((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // stop the browser from reloading the page
    // safeParse never throws: it returns either { success: true, data }
    // or { success: false, error }.
    const result = tripRequestSchema.safeParse(values);

    if (!result.success) {
      const nextErrors = toFormErrors(result.error);
      setErrors(nextErrors);
      // Move keyboard focus to the first invalid field.
      const firstField = Object.keys(nextErrors)[0];
      if (firstField) document.getElementById(firstField)?.focus();
      return;
    }

    setErrors({});
    // result.data is already cleaned up: text trimmed, numbers converted.
    onSubmit(result.data);
  }

  const interestsFull = values.interests.length >= MAX_INTERESTS;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-8"
    >
      <div>
        <label htmlFor="destination" className={labelClass}>
          Where are you going?
        </label>
        <div className="relative">
          <MapPinIcon className="pointer-events-none absolute top-1/2 left-3 mt-[3px] h-5 w-5 -translate-y-1/2 text-ink-muted" />
          <input
            id="destination"
            type="text"
            placeholder="e.g. Lisbon, Portugal"
            autoComplete="off"
            value={values.destination}
            onChange={(e) => updateField("destination", e.target.value)}
            aria-invalid={Boolean(errors.destination)}
            aria-describedby={
              errors.destination ? "destination-error" : undefined
            }
            className={`${inputClass} w-full pl-10`}
          />
        </div>
        <FieldError id="destination-error" message={errors.destination} />
      </div>

      <div className="grid gap-6 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
        <div>
          <label htmlFor="days" className={labelClass}>
            Number of days
          </label>
          <input
            id="days"
            type="number"
            inputMode="numeric"
            min={MIN_DAYS}
            max={MAX_DAYS}
            value={values.days}
            onChange={(e) => updateField("days", e.target.value)}
            aria-invalid={Boolean(errors.days)}
            aria-describedby={errors.days ? "days-error days-hint" : "days-hint"}
            className={`${inputClass} w-full`}
          />
          <p id="days-hint" className={hintClass}>
            {MIN_DAYS}–{MAX_DAYS} days
          </p>
          <FieldError id="days-error" message={errors.days} />
        </div>

        <div>
          <label htmlFor="budget" className={labelClass}>
            Total budget
          </label>
          <div className="flex gap-2">
            <input
              id="budget"
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="e.g. 1200"
              value={values.budget}
              onChange={(e) => updateField("budget", e.target.value)}
              aria-invalid={Boolean(errors.budget)}
              aria-describedby={
                errors.budget ? "budget-error budget-hint" : "budget-hint"
              }
              className={`${inputClass} min-w-0 flex-1`}
            />
            <label htmlFor="currency" className="sr-only">
              Currency
            </label>
            <select
              id="currency"
              value={values.currency}
              // The options come from CURRENCIES, so the value is always a Currency.
              onChange={(e) =>
                updateField("currency", e.target.value as Currency)
              }
              className={`${inputClass} w-auto shrink-0`}
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
          <p id="budget-hint" className={hintClass}>
            For activities and meals. Hotels and travel aren&apos;t included.
          </p>
          <FieldError id="budget-error" message={errors.budget} />
        </div>
      </div>

      <fieldset
        aria-describedby={
          errors.interests ? "interests-error interests-hint" : "interests-hint"
        }
      >
        <legend className={labelClass}>What do you enjoy?</legend>
        <p id="interests-hint" className={hintClass}>
          Pick up to {MAX_INTERESTS} ({values.interests.length} chosen).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {INTERESTS.map((interest, index) => {
            const checked = values.interests.includes(interest);
            const disabled = !checked && interestsFull;
            const InterestIcon = INTEREST_ICONS[interest];
            return (
              <label
                key={interest}
                className={
                  "flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors " +
                  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40 " +
                  (checked
                    ? "cursor-pointer border-primary bg-primary text-on-primary"
                    : disabled
                      ? "cursor-not-allowed border-line text-ink-muted opacity-60"
                      : "cursor-pointer border-line-strong hover:border-primary hover:bg-primary-soft")
                }
              >
                <input
                  // The first checkbox gets id="interests" so focus() can find the group.
                  id={index === 0 ? "interests" : undefined}
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleInterest(interest)}
                />
                {checked ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <InterestIcon className="h-4 w-4" />
                )}
                {interest}
              </label>
            );
          })}
        </div>
        <FieldError id="interests-error" message={errors.interests} />
      </fieldset>

      <div>
        <label htmlFor="preferences" className={labelClass}>
          Anything else?{" "}
          <span className="font-normal text-ink-muted">(optional)</span>
        </label>
        <textarea
          id="preferences"
          rows={3}
          placeholder="e.g. vegetarian food, slow mornings, avoid long walks"
          value={values.preferences}
          onChange={(e) => updateField("preferences", e.target.value)}
          aria-invalid={Boolean(errors.preferences)}
          aria-describedby={
            errors.preferences ? "preferences-error" : undefined
          }
          className={`${inputClass} w-full`}
        />
        <p className="mt-1 text-right text-xs text-ink-muted">
          {values.preferences.length}/{MAX_PREFERENCES_LENGTH}
        </p>
        <FieldError id="preferences-error" message={errors.preferences} />
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 font-medium text-on-accent transition-colors hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          {isLoading && <SpinnerIcon className="h-4 w-4" />}
          {isLoading ? "Planning your trip…" : "Plan my trip"}
        </button>
        <p className="text-sm text-ink-muted">Usually takes 15–45 seconds.</p>
      </div>
    </form>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400"
    >
      <AlertCircleIcon className="h-4 w-4 shrink-0" />
      {message}
    </p>
  );
}
