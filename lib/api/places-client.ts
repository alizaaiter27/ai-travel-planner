import { placesResponseSchema } from "@/lib/schemas/place";
import type { Place, TripRequest } from "@/types/trip";

// Browser-side helper for calling our POST /api/places endpoint.
// It turns every kind of failure into a PlacesRequestError with a message
// that's safe to show to the user.

export class PlacesRequestError extends Error {
  constructor(
    message: string,
    // Retrying only makes sense for temporary problems (network, server down),
    // not for "destination not found" or invalid input.
    readonly canRetry: boolean,
  ) {
    super(message);
    this.name = "PlacesRequestError";
  }
}

export async function fetchPlaces(
  request: TripRequest,
): Promise<{ destinationName: string; places: Place[] }> {
  let response: Response;
  try {
    response = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    // fetch only throws when there's no response at all (offline, DNS, etc.).
    throw new PlacesRequestError(
      "We couldn't connect. Check your internet connection and try again.",
      true,
    );
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    // 4xx = something about the request (won't fix itself); 5xx = temporary.
    const canRetry = response.status >= 500;
    throw new PlacesRequestError(readErrorMessage(data), canRetry);
  }

  const parsed = placesResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new PlacesRequestError("We got an unexpected response. Please try again.", true);
  }
  return parsed.data;
}

function readErrorMessage(data: unknown): string {
  if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
    return data.error;
  }
  return "Something went wrong. Please try again.";
}
