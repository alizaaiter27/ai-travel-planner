import { readTripRequest } from "@/lib/api/read-trip-request";
import { PlacesSearchError, searchPlaces } from "@/lib/google-maps/places";

// POST /api/places
// Body: a trip request (same shape the form sends).
// Returns: { destinationName, places: Place[] } — real candidates from Google Places,
// or 404 if Google doesn't recognise the destination.
export async function POST(request: Request) {
  // 1–2. Read and validate the body (400 on bad JSON or invalid fields).
  const input = await readTripRequest(request);
  if ("errorResponse" in input) return input.errorResponse;

  // 3. Search Google. Details of failures stay in the server log only.
  try {
    const result = await searchPlaces(input.data);
    if (!result.found) {
      return Response.json(
        {
          error: `We couldn't find "${input.data.destination}". Check the spelling or try a nearby city.`,
        },
        { status: 404 },
      );
    }
    return Response.json({ destinationName: result.destinationName, places: result.places });
  } catch (error) {
    console.error("[api/places]", error);

    if (error instanceof PlacesSearchError && error.kind === "upstream") {
      // 502 = "a service we depend on failed", not the caller's fault.
      return Response.json(
        { error: "We couldn't reach the places service. Please try again." },
        { status: 502 },
      );
    }
    return Response.json(
      { error: "Something went wrong on our side. Please try again later." },
      { status: 500 },
    );
  }
}
