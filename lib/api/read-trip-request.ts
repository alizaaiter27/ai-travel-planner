import { z } from "zod";
import { readJsonBody } from "@/lib/api/read-json";
import { tripRequestSchema } from "@/lib/schemas/trip";
import type { TripRequest } from "@/types/trip";

// Shared by our Route Handlers: reads the JSON body and validates it with the
// same schema the form uses. Returns either the clean data or a ready-made
// 400 response to send back.
export async function readTripRequest(
  request: Request,
): Promise<{ data: TripRequest } | { errorResponse: Response }> {
  // A trip request is well under 2 KB; 10 KB leaves plenty of room.
  const body = await readJsonBody(request, 10_000);
  if ("errorResponse" in body) return body;

  // Never trust the browser: someone could call the endpoint with anything.
  const parsed = tripRequestSchema.safeParse(body.data);
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
