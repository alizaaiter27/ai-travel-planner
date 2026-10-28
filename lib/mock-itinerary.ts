import type { Itinerary, ItineraryItem, TripRequest } from "@/types/trip";

// Fake data for building the UI before the real APIs are connected.
// Place names are deliberately generic ("Sample …") so they can never be
// mistaken for real, verified places.

const SAMPLE_DAY: Omit<ItineraryItem, "placeId">[] = [
  {
    time: "09:00",
    placeName: "Sample landmark",
    category: "attraction",
    reason: "A well-known sight that's best visited before the crowds arrive.",
    durationMinutes: 120,
    estimatedCost: 15,
  },
  {
    time: "12:30",
    placeName: "Sample local restaurant",
    category: "restaurant",
    reason: "Popular with locals for a relaxed lunch nearby.",
    durationMinutes: 60,
    estimatedCost: 25,
  },
  {
    time: "14:30",
    placeName: "Sample museum",
    category: "attraction",
    reason: "Matches your interests and is a short walk from lunch.",
    durationMinutes: 150,
    estimatedCost: 12,
  },
  {
    time: "19:30",
    placeName: "Sample dinner spot",
    category: "restaurant",
    reason: "Well rated for dinner with a view.",
    durationMinutes: 90,
    estimatedCost: null,
  },
];

const THEMES = [
  "Getting oriented",
  "Art and history",
  "Neighbourhood walks",
  "Food and markets",
  "A slower day",
];

export function getMockItinerary(request: TripRequest): Itinerary {
  return {
    destination: request.destination,
    currency: request.currency,
    days: Array.from({ length: request.days }, (_, index) => ({
      day: index + 1,
      theme: THEMES[index % THEMES.length],
      items: SAMPLE_DAY.map((item, itemIndex) => ({
        ...item,
        placeId: `sample-${index + 1}-${itemIndex + 1}`,
        placeName: `${item.placeName} ${index + 1}`,
      })),
    })),
  };
}
