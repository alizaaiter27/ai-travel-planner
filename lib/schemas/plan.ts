import { z } from "zod";
import { placeSchema } from "@/lib/schemas/place";
import { itinerarySchema } from "@/lib/schemas/trip";

// What POST /api/itinerary returns on success. The browser checks it before
// showing anything: even our own server could have a bug.
export const planResponseSchema = z
  .object({
    destinationName: z.string(),
    places: z.array(placeSchema),
    itinerary: itinerarySchema,
  })
  // Extra safety net for the core rule: every stop must be one of the places.
  .refine(
    ({ places, itinerary }) => {
      const ids = new Set(places.map((p) => p.id));
      return itinerary.days.every((day) => day.items.every((item) => ids.has(item.placeId)));
    },
    { error: "Itinerary contains a place that wasn't in the candidate list." },
  );
