import type { CURRENCIES, INTERESTS } from "@/lib/trip-options";

// `(typeof CURRENCIES)[number]` means "any one value from the CURRENCIES list",
// so the type stays in sync with the list automatically.
export type Currency = (typeof CURRENCIES)[number];
export type Interest = (typeof INTERESTS)[number];

// What the form sends to the planner once it's valid.
export type TripRequest = {
  destination: string;
  days: number;
  budget: number;
  currency: Currency;
  interests: Interest[];
  preferences: string;
};

export type PlaceCategory = "attraction" | "restaurant";

export type ItineraryItem = {
  time: string; // "09:00"
  placeName: string;
  category: PlaceCategory;
  reason: string;
  durationMinutes: number;
  estimatedCost: number | null; // null = no estimate available
};

export type ItineraryDay = {
  day: number;
  theme: string;
  items: ItineraryItem[];
};

export type Itinerary = {
  destination: string;
  currency: Currency;
  days: ItineraryDay[];
};
