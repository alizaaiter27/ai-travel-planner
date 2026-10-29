import { z } from "zod";
import { placeSchema } from "@/lib/schemas/place";
import { itinerarySchema, tripRequestSchema } from "@/lib/schemas/trip";

const planFields = z.object({
  destinationName: z.string().min(1).max(300),
  places: z.array(placeSchema).max(100),
  itinerary: itinerarySchema,
});

// The core rule as a check: every itinerary stop must be one of the places.
function stopsAreKnownPlaces(plan: z.infer<typeof planFields>): boolean {
  const ids = new Set(plan.places.map((p) => p.id));
  return plan.itinerary.days.every((day) => day.items.every((item) => ids.has(item.placeId)));
}
const unknownPlaceError = { error: "Itinerary contains a place that wasn't in the candidate list." };

// A generated plan: real places + the itinerary built from them.
export const planSchema = planFields.refine(stopsAreKnownPlaces, unknownPlaceError);

// What POST /api/itinerary returns. `signature` proves our server produced
// this exact plan (null if signing isn't configured, which disables saving).
export const planResponseSchema = planFields
  .extend({ signature: z.string().nullable() })
  .refine(stopsAreKnownPlaces, unknownPlaceError);

// What gets signed, saved, and loaded: the request and the plan together.
export const savePayloadSchema = z.object({
  request: tripRequestSchema,
  plan: planSchema,
});

// The body of POST /api/trips.
export const saveTripBodySchema = savePayloadSchema.extend({
  signature: z.string().regex(/^[0-9a-f]{64}$/),
});
