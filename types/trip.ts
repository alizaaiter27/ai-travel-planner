import type { z } from "zod";
import type {
  itineraryDaySchema,
  itineraryItemSchema,
  itinerarySchema,
  placeCategorySchema,
  tripRequestSchema,
} from "@/lib/schemas/trip";
import type { placeSchema } from "@/lib/schemas/place";
import type { CURRENCIES, INTERESTS } from "@/lib/trip-options";

// Types are generated from the Zod schemas with z.infer, so the
// validation rules and the TypeScript types can never drift apart.

export type Currency = (typeof CURRENCIES)[number];
export type Interest = (typeof INTERESTS)[number];

// z.output = the shape *after* validation (e.g. days is a number, not text).
export type TripRequest = z.output<typeof tripRequestSchema>;

export type PlaceCategory = z.infer<typeof placeCategorySchema>;
export type ItineraryItem = z.infer<typeof itineraryItemSchema>;
export type ItineraryDay = z.infer<typeof itineraryDaySchema>;
export type Itinerary = z.infer<typeof itinerarySchema>;

export type Place = z.infer<typeof placeSchema>;
