import { z } from "zod";
import { saveTripBodySchema } from "@/lib/schemas/plan";
import { verifyPayload } from "@/lib/trips/signature";
import { saveTrip, TripStoreError } from "@/lib/trips/store";

// POST /api/trips
// Body: { request, plan, signature } exactly as received from /api/itinerary.
// Returns: { id } — the new trip's ID for its share link (/trips/<id>).
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = saveTripBodySchema.safeParse(body);
  if (!parsed.success) {
    console.warn("[api/trips] invalid body", z.flattenError(parsed.error).fieldErrors);
    return Response.json({ error: "This trip can't be saved." }, { status: 400 });
  }

  // Only plans our server generated (and that weren't changed since) can be
  // saved, so nobody can store a made-up plan under our website's address.
  const { signature, ...payload } = parsed.data;
  if (!verifyPayload(payload, signature)) {
    return Response.json({ error: "This trip can't be saved." }, { status: 403 });
  }

  try {
    const id = await saveTrip(payload);
    return Response.json({ id }, { status: 201 }); // 201 = created
  } catch (error) {
    console.error("[api/trips]", error);
    const temporary = error instanceof TripStoreError && error.kind === "upstream";
    return Response.json(
      {
        error: temporary
          ? "We couldn't save your trip right now. Please try again."
          : "Saving trips isn't available right now.",
      },
      { status: temporary ? 502 : 500 },
    );
  }
}
