import { AiItineraryError, generateItinerary } from "@/lib/ai/itinerary";
import { readTripRequest } from "@/lib/api/read-trip-request";
import { PlacesSearchError, searchPlaces } from "@/lib/google-maps/places";
import { checkRateLimits, tooManyRequests } from "@/lib/rate-limit";
import { signPayload } from "@/lib/trips/signature";

// The AI needs some choice: at least this many real places per trip day.
const MIN_PLACES_PER_DAY = 2;

// POST /api/itinerary
// Body: a trip request.
// Returns: { destinationName, places, itinerary, signature } where every
// itinerary stop is one of the real `places` from Google, and `signature`
// lets the plan be saved later (see /api/trips).
export async function POST(request: Request) {
  const input = await readTripRequest(request);
  if ("errorResponse" in input) return input.errorResponse;
  const trip = input.data;

  // Each plan costs real money (≈5 Google requests + 1 AI call), so limit
  // per visitor and for the whole app (a cap on the worst-case daily bill).
  const limited = await checkRateLimits(request, [
    { name: "itinerary", limit: 10, windowSeconds: 3600, scope: "ip" },
    { name: "itinerary", limit: 200, windowSeconds: 86400, scope: "global" },
  ]);
  if (!limited.ok) return tooManyRequests(limited.retryAfterSeconds);

  try {
    // 1. Real candidate places.
    const result = await searchPlaces(trip);
    if (!result.found) {
      return Response.json(
        { error: `We couldn't find "${trip.destination}". Check the spelling or try a nearby city.` },
        { status: 404 },
      );
    }

    // 2. Not enough real places? Say so instead of letting anything be made up.
    const needed = trip.days * MIN_PLACES_PER_DAY;
    if (result.places.length < needed) {
      return Response.json(
        {
          error: `We only found ${result.places.length} places in ${result.destinationName}, not enough for a ${trip.days}-day trip. Try fewer days or more interests.`,
        },
        { status: 422 }, // 422 = valid request we can't fulfil as asked
      );
    }

    // 3. AI organizes the real places into days; our code checks the result.
    const itinerary = await generateItinerary(trip, result.places);
    const plan = { destinationName: result.destinationName, places: result.places, itinerary };

    // 4. Sign the plan so POST /api/trips can check it really came from us.
    const signature = signPayload({ request: trip, plan });

    return Response.json({ ...plan, signature });
  } catch (error) {
    console.error("[api/itinerary]", error);

    const upstream =
      (error instanceof PlacesSearchError && error.kind === "upstream") ||
      (error instanceof AiItineraryError && error.kind === "upstream");
    if (upstream) {
      return Response.json(
        { error: "A service we rely on isn't responding. Please try again in a moment." },
        { status: 502 },
      );
    }
    if (error instanceof AiItineraryError && error.kind === "output") {
      return Response.json(
        { error: "The planner couldn't produce a complete plan this time. Please try again." },
        { status: 502 },
      );
    }
    return Response.json(
      { error: "Something went wrong on our side. Please try again later." },
      { status: 500 },
    );
  }
}
