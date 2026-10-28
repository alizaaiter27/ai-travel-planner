import { z } from "zod";
import {
  CURRENCIES,
  INTERESTS,
  MAX_DAYS,
  MAX_PREFERENCES_LENGTH,
  MIN_DAYS,
} from "@/lib/trip-options";

// One source of truth for "what is a valid trip request?".
// The form uses it now; the server will use the exact same rules later,
// because anyone can skip the browser and send requests directly.

export const tripRequestSchema = z.object({
  destination: z
    .string()
    .trim()
    .min(2, { error: "Enter a destination (at least 2 characters)." })
    .max(100, { error: "Destination must be 100 characters or fewer." }),

  // z.coerce turns text like "4" into the number 4 before checking it.
  days: z.coerce
    .number({ error: `Choose a whole number of days from ${MIN_DAYS} to ${MAX_DAYS}.` })
    .int({ error: `Choose a whole number of days from ${MIN_DAYS} to ${MAX_DAYS}.` })
    .min(MIN_DAYS, { error: `Choose a whole number of days from ${MIN_DAYS} to ${MAX_DAYS}.` })
    .max(MAX_DAYS, { error: `Choose a whole number of days from ${MIN_DAYS} to ${MAX_DAYS}.` }),

  budget: z.coerce
    .number({ error: "Enter a total budget greater than 0." })
    .positive({ error: "Enter a total budget greater than 0." })
    .max(10_000_000, { error: "That budget looks too large." }),

  currency: z.enum(CURRENCIES, { error: "Choose a currency from the list." }),

  interests: z
    .array(z.enum(INTERESTS))
    .min(1, { error: "Pick at least one interest." }),

  preferences: z
    .string()
    .trim()
    .max(MAX_PREFERENCES_LENGTH, {
      error: `Keep preferences under ${MAX_PREFERENCES_LENGTH} characters.`,
    }),
});

// The shape of a generated itinerary. Later, the AI's answer must match
// this before we show it; for now it checks our mock data.

export const placeCategorySchema = z.enum(["attraction", "restaurant"]);

export const itineraryItemSchema = z.object({
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Time must be HH:MM." }),
  placeId: z.string().min(1), // links the stop to a real Place (and later a map marker)
  placeName: z.string().min(1),
  category: placeCategorySchema,
  reason: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  estimatedCost: z.number().nonnegative().nullable(), // null = no estimate
});

export const itineraryDaySchema = z.object({
  day: z.number().int().min(1),
  theme: z.string(),
  items: z.array(itineraryItemSchema).min(1),
});

export const itinerarySchema = z.object({
  destination: z.string().min(1),
  currency: z.enum(CURRENCIES),
  days: z.array(itineraryDaySchema).min(1),
});
