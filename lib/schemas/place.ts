import { z } from "zod";
import { placeCategorySchema } from "@/lib/schemas/trip";

// A real place from Google Places, simplified to only what our app needs.
// The AI will later be allowed to choose ONLY from places like these.
export const placeSchema = z.object({
  id: z.string().min(1), // Google's place ID, stable across requests
  name: z.string().min(1),
  address: z.string(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  category: placeCategorySchema, // "attraction" | "restaurant"
  primaryType: z.string().nullable(), // e.g. "art_museum"; null if Google has none
  googleMapsUri: z.url().nullable(),
});

// What our own POST /api/places endpoint returns on success.
// The browser checks it too: even our own server could have a bug.
export const placesResponseSchema = z.object({
  destinationName: z.string(),
  places: z.array(placeSchema),
});

const googleLatLngSchema =z.object({ latitude: z.number(), longitude: z.number() });

// The rectangle a city/region covers on the map, as Google returns it.
export const googleViewportSchema = z.object({
  low: googleLatLngSchema,
  high: googleLatLngSchema,
});

// The raw shape Google sends back (only the fields we ask for in the field mask).
// Google is an outside service, so we check its data too instead of trusting it.
export const googleTextSearchResponseSchema = z.object({
  places: z
    .array(
      z.object({
        id: z.string(),
        displayName: z.object({ text: z.string() }).optional(),
        formattedAddress: z.string().optional(),
        location: googleLatLngSchema.optional(),
        viewport: googleViewportSchema.optional(),
        primaryType: z.string().optional(),
        googleMapsUri: z.string().optional(),
      }),
    )
    .optional() // Google omits "places" entirely when nothing matches
    .default([]),
});
