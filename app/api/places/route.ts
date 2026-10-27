import { z } from "zod";
import { PlacesSearchError, searchPlaces } from "@/lib/google-maps/places";
import { tripRequestSchema } from "@/lib/schemas/trip";

// POST /api/places
// Body: a trip request (same shape the form sends).
// Returns: { destinationName, places: Place[] } — real candidates from Google Places,
// or 404 if Google doesn't recognise the destination.
export async function POST(request: Request) {
  // 1. Read the body. Bad JSON is the caller's mistake → 400.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  // 2. Validate with the SAME schema the form uses. Never trust the browser:
  //    someone could call this URL directly with anything.
  const parsed = tripRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid trip request.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  // 3. Search Google. Details of failures stay in the server log only.
  try {
    const result = await searchPlaces(parsed.data);
    if (!result.found) {
      return Response.json(
        {
          error: `We couldn't find "${parsed.data.destination}". Check the spelling or try a nearby city.`,
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
