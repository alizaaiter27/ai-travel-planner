"use client";

import { useState } from "react";
import {
  CURRENCIES,
  INTERESTS,
  MAX_DAYS,
  MAX_PREFERENCES_LENGTH,
  MIN_DAYS,
} from "@/lib/trip-options";
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

// Returns an error message for each invalid field (empty object = all good).
// In Step 4 these rules move into a shared Zod schema.
function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  const destination = values.destination.trim();
  if (destination.length < 2) {
    errors.destination = "Enter a destination (at least 2 characters).";
  } else if (destination.length > 100) {
    errors.destination = "Destination must be 100 characters or fewer.";
  }

  const days = Number(values.days);
  if (!Number.isInteger(days) || days < MIN_DAYS || days > MAX_DAYS) {
    errors.days = `Choose a whole number of days from ${MIN_DAYS} to ${MAX_DAYS}.`;
  }

  const budget = Number(values.budget);
  if (values.budget.trim() === "" || !Number.isFinite(budget) || budget <= 0) {
    errors.budget = "Enter a total budget greater than 0.";
  }

  if (values.interests.length === 0) {
    errors.interests = "Pick at least one interest.";
  }

  if (values.preferences.length > MAX_PREFERENCES_LENGTH) {
    errors.preferences = `Keep preferences under ${MAX_PREFERENCES_LENGTH} characters.`;
  }

  return errors;
}

const inputClass =
  "mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 " +
  "focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/30 " +
  "aria-[invalid=true]:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

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
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      // Move keyboard focus to the first invalid field.
      const firstField = Object.keys(nextErrors)[0];
      document.getElementById(firstField)?.focus();
      return;
    }

    // Values are valid: convert text to numbers and hand the request to the parent.
    onSubmit({
      destination: values.destination.trim(),
      days: Number(values.days),
      budget: Number(values.budget),
      currency: values.currency,
      interests: values.interests,
      preferences: values.preferences.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <label htmlFor="destination" className="block text-sm font-medium">
          Destination
        </label>
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
          className={inputClass}
        />
        <FieldError id="destination-error" message={errors.destination} />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <label htmlFor="days" className="block text-sm font-medium">
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
            aria-describedby={errors.days ? "days-error" : undefined}
            className={inputClass}
          />
          <FieldError id="days-error" message={errors.days} />
        </div>

        <div>
          <label htmlFor="budget" className="block text-sm font-medium">
            Total budget
          </label>
          <input
            id="budget"
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="e.g. 1200"
            value={values.budget}
            onChange={(e) => updateField("budget", e.target.value)}
            aria-invalid={Boolean(errors.budget)}
            aria-describedby={errors.budget ? "budget-error" : undefined}
            className={inputClass}
          />
          <FieldError id="budget-error" message={errors.budget} />
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium">
            Currency
          </label>
          <select
            id="currency"
            value={values.currency}
            // The options come from CURRENCIES, so the value is always a Currency.
            onChange={(e) =>
              updateField("currency", e.target.value as Currency)
            }
            className={inputClass}
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset
        aria-describedby={errors.interests ? "interests-error" : undefined}
      >
        <legend className="text-sm font-medium">Interests</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {INTERESTS.map((interest, index) => {
            const checked = values.interests.includes(interest);
            return (
              <label
                key={interest}
                className={
                  "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors " +
                  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky-600/40 " +
                  (checked
                    ? "border-sky-600 bg-sky-600 text-white"
                    : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700")
                }
              >
                <input
                  // The first checkbox gets id="interests" so focus() can find the group.
                  id={index === 0 ? "interests" : undefined}
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => toggleInterest(interest)}
                />
                {interest}
              </label>
            );
          })}
        </div>
        <FieldError id="interests-error" message={errors.interests} />
      </fieldset>

      <div>
        <label htmlFor="preferences" className="block text-sm font-medium">
          Other preferences{" "}
          <span className="font-normal text-zinc-500">(optional)</span>
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
          className={inputClass}
        />
        <p className="mt-1 text-right text-xs text-zinc-500">
          {values.preferences.length}/{MAX_PREFERENCES_LENGTH}
        </p>
        <FieldError id="preferences-error" message={errors.preferences} />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-sky-600 px-5 py-3 font-medium text-white transition-colors hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isLoading ? "Planning…" : "Plan my trip"}
      </button>
    </form>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-1 text-sm text-red-600 dark:text-red-400"
    >
      {message}
    </p>
  );
}
