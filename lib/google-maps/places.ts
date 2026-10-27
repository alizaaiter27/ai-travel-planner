// Makes the build fail if a Client Component ever imports this file,
// so the API key below can never end up in browser code.
import "server-only";

import type { z } from "zod";
import {
  googleTextSearchResponseSchema,
  type googleViewportSchema,
} from "@/lib/schemas/place";
import type { Interest, Place, PlaceCategory, TripRequest } from "@/types/trip";

const TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

// Only fields in Google's "Pro" pricing tier. Adding rating or priceLevel
// would move every request to the more expensive "Enterprise" tier.
const PLACE_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.primaryType",
  "places.googleMapsUri",
].join(",");
const DESTINATION_FIELDS = "places.id,places.displayName,places.formattedAddress,places.viewport";

const RESULTS_PER_QUERY = 10;
// Each query is one billed request, so cap how many one plan can trigger.
const MAX_INTEREST_QUERIES = 3;

// What to search for, per interest. "{d}" is replaced with the destination.
// Keep these short: with a location restriction, long descriptive queries
// often return zero results.
const INTEREST_QUERIES: Record<Interest, string> = {
  "Culture & history": "historic landmarks in {d}",
  "Food & drink": "food markets in {d}",
  "Nature & outdoors": "parks in {d}",
  "Art & museums": "museums in {d}",
  Nightlife: "bars in {d}",
  Shopping: "shopping in {d}",
  "Family-friendly": "family attractions in {d}",
  Relaxation: "gardens in {d}",
};
const RESTAURANT_QUERY = "restaurants in {d}";

type Viewport = z.infer<typeof googleViewportSchema>;

export class PlacesSearchError extends Error {
  constructor(
    message: string,
    // "config" = our setup is wrong (e.g. missing key); "upstream" = Google failed.
    readonly kind: "config" | "upstream",
  ) {
    super(message);
    this.name = "PlacesSearchError";
  }
}

export type PlacesSearchResult =
  | { found: false } // Google doesn't recognise the destination
  | { found: true; destinationName: string; places: Place[] };

type SearchRequest = Pick<TripRequest, "destination" | "interests">;

// Finds real attractions and restaurants inside the destination.
// `places` may be empty if the destination exists but nothing matched.
export async function searchPlaces({
  destination,
  interests,
}: SearchRequest): Promise<PlacesSearchResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new PlacesSearchError("GOOGLE_MAPS_API_KEY is not set", "config");
  }

  // 1. Find the destination itself and the map rectangle it covers.
  //    Without this, Google would happily return places from other countries.
  const [area] = await textSearch(apiKey, DESTINATION_FIELDS, {
    textQuery: destination,
    pageSize: 1,
  });
  const viewport = area?.viewport;
  if (!viewport) return { found: false };

  // 2. Search for each interest + restaurants, restricted to that rectangle.
  const queries: { text: string; category: PlaceCategory }[] = [
    ...interests.slice(0, MAX_INTEREST_QUERIES).map((interest) => ({
      text: INTEREST_QUERIES[interest].replace("{d}", destination),
      category: "attraction" as const,
    })),
    { text: RESTAURANT_QUERY.replace("{d}", destination), category: "restaurant" },
  ];

  // Run all searches at the same time instead of one after another.
  const results = await Promise.all(
    queries.map((query) => searchCategory(apiKey, query.text, query.category, viewport)),
  );

  // 3. The same place can appear in several searches; keep the first copy.
  const byId = new Map<string, Place>();
  for (const place of results.flat()) {
    if (!byId.has(place.id)) byId.set(place.id, place);
  }

  return {
    found: true,
    destinationName: area.formattedAddress ?? area.displayName?.text ?? destination,
    places: [...byId.values()],
  };
}

async function searchCategory(
  apiKey: string,
  textQuery: string,
  category: PlaceCategory,
  viewport: Viewport,
): Promise<Place[]> {
  const rawPlaces = await textSearch(apiKey, PLACE_FIELDS, {
    textQuery,
    pageSize: RESULTS_PER_QUERY,
    locationRestriction: { rectangle: viewport }, // only results inside the area
  });

  // Convert Google's format into our simpler Place format, skipping any
  // result that's missing a name or coordinates (we can't use those).
  return rawPlaces.flatMap((raw): Place[] => {
    if (!raw.displayName?.text || !raw.location) return [];
    return [
      {
        id: raw.id,
        name: raw.displayName.text,
        address: raw.formattedAddress ?? "",
        location: { lat: raw.location.latitude, lng: raw.location.longitude },
        category,
        primaryType: raw.primaryType ?? null,
        googleMapsUri: raw.googleMapsUri ?? null,
      },
    ];
  });
}

// One call to Google's Text Search, with timeout, error handling, and
// validation of the response shape.
async function textSearch(apiKey: string, fieldMask: string, body: Record<string, unknown>) {
  let response: Response;
  try {
    response = await fetch(TEXT_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify({ languageCode: "en", ...body }),
      signal: AbortSignal.timeout(10_000), // give up after 10 seconds
    });
  } catch (error) {
    throw new PlacesSearchError(`Could not reach Google Places: ${String(error)}`, "upstream");
  }

  if (!response.ok) {
    // Keep Google's message for the server log; never send it to the browser.
    const detail = await response.text().catch(() => "");
    throw new PlacesSearchError(
      `Google Places returned ${response.status}: ${detail.slice(0, 300)}`,
      "upstream",
    );
  }

  const parsed = googleTextSearchResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new PlacesSearchError(
      `Google Places returned an unexpected shape: ${parsed.error.message.slice(0, 300)}`,
      "upstream",
    );
  }
  return parsed.data.places;
}
