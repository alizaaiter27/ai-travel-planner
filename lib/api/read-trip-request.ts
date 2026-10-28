import { z } from "zod";
import { tripRequestSchema } from "@/lib/schemas/trip";
import type { TripRequest } from "@/types/trip";

// Shared by our Route Handlers: reads the JSON body and validates it with the
// same schema the form uses. Returns either the clean data or a ready-made
// 400 response to send back.
export async function readTripRequest(
  request: Request,
): Promise<{ data: TripRequest } | { errorResponse: Response }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      errorResponse: Response.json({ error: "Request body must be valid JSON." }, { status: 400 }),
    };
  }

  // Never trust the browser: someone could call the endpoint with anything.
  const parsed = tripRequestSchema.safeParse(body);
  if (!parsed.success) {
    return {
      errorResponse: Response.json(
        { error: "Invalid trip request.", fieldErrors: z.flattenError(parsed.error).fieldErrors },
        { status: 400 },
      ),
    };
  }
  return { data: parsed.data };
}
