import type { z } from "zod";
import { planResponseSchema } from "@/lib/schemas/plan";
import type { TripRequest } from "@/types/trip";

// Browser-side helper for calling our POST /api/itinerary endpoint.
// It turns every kind of failure into a PlanRequestError with a message
// that's safe to show to the user.

export class PlanRequestError extends Error {
  constructor(
    message: string,
    // Retrying only makes sense for temporary problems (network, server down),
    // not for "destination not found" or "not enough places".
    readonly canRetry: boolean,
  ) {
    super(message);
    this.name = "PlanRequestError";
  }
}

// destinationName, places, itinerary, and the server's signature (for saving).
export type Plan = z.infer<typeof planResponseSchema>;

export async function fetchPlan(request: TripRequest): Promise<Plan> {
  let response: Response;
  try {
    response = await fetch("/api/itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    // fetch only throws when there's no response at all (offline, DNS, etc.).
    throw new PlanRequestError(
      "We couldn't connect. Check your internet connection and try again.",
      true,
    );
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    // 4xx = something about the request (won't fix itself); 5xx = temporary.
    const canRetry = response.status >= 500;
    throw new PlanRequestError(readErrorMessage(data), canRetry);
  }

  const parsed = planResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new PlanRequestError("We got an unexpected response. Please try again.", true);
  }
  return parsed.data;
}

function readErrorMessage(data: unknown): string {
  if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
    return data.error;
  }
  return "Something went wrong. Please try again.";
}
