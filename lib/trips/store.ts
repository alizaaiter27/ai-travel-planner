import "server-only";

import type { z } from "zod";
import { savePayloadSchema } from "@/lib/schemas/plan";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type SavePayload = z.infer<typeof savePayloadSchema>;

export type SavedTrip = SavePayload & { id: string; createdAt: string };

export class TripStoreError extends Error {
  constructor(
    message: string,
    // config = Supabase not set up; upstream = the database request failed
    readonly kind: "config" | "upstream",
  ) {
    super(message);
    this.name = "TripStoreError";
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isTripId(value: string): boolean {
  return UUID.test(value);
}

function db() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new TripStoreError("SUPABASE_URL or SUPABASE_SECRET_KEY is not set", "config");
  return supabase;
}

// Saves a trip and returns its new random ID (used in the share link).
export async function saveTrip({ request, plan }: SavePayload): Promise<string> {
  const { data, error } = await db()
    .from("trips")
    .insert({
      destination: request.destination,
      destination_name: plan.destinationName,
      duration_days: request.days,
      budget: request.budget,
      currency: request.currency,
      interests: request.interests,
      preferences: request.preferences,
      itinerary: plan.itinerary,
      places: plan.places,
    })
    .select("id")
    .single();

  if (error || !data) throw new TripStoreError(`Insert failed: ${error?.message}`, "upstream");
  return data.id as string;
}

// Loads one trip by its exact ID. Returns null if it doesn't exist.
export async function getTrip(id: string): Promise<SavedTrip | null> {
  if (!isTripId(id)) return null;

  const { data, error } = await db().from("trips").select("*").eq("id", id).maybeSingle();
  if (error) throw new TripStoreError(`Select failed: ${error.message}`, "upstream");
  if (!data) return null;

  // Data coming back from the database is checked too, e.g. in case an old
  // row was saved before the app's data shape changed.
  const parsed = savePayloadSchema.safeParse({
    request: {
      destination: data.destination,
      days: data.duration_days,
      budget: Number(data.budget), // Postgres numeric arrives as text
      currency: data.currency,
      interests: data.interests,
      preferences: data.preferences,
    },
    plan: {
      destinationName: data.destination_name,
      places: data.places,
      itinerary: data.itinerary,
    },
  });
  if (!parsed.success) {
    throw new TripStoreError(`Stored trip ${id} has an unexpected shape`, "upstream");
  }
  return { id: data.id, createdAt: data.created_at, ...parsed.data };
}
