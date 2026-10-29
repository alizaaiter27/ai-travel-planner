import { z } from "zod";
import type { Plan } from "@/lib/api/plan-client";
import type { TripRequest } from "@/types/trip";

// Browser-side helper for POST /api/trips. Returns the new trip's ID, or
// throws an Error whose message is safe to show to the user.
export async function saveTripRequest(request: TripRequest, plan: Plan): Promise<string> {
  if (!plan.signature) throw new Error("Saving isn't available for this plan.");

  const { signature, ...planData } = plan;
  let response: Response;
  try {
    response = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Send back exactly what the server generated, plus its signature.
      body: JSON.stringify({ request, plan: planData, signature }),
    });
  } catch {
    throw new Error("We couldn't connect. Check your internet connection and try again.");
  }

  const data: unknown = await response.json().catch(() => null);
  const parsed = z.object({ id: z.uuid() }).safeParse(data);
  if (response.ok && parsed.success) return parsed.data.id;

  const message = z.object({ error: z.string() }).safeParse(data);
  throw new Error(message.success ? message.data.error : "We couldn't save your trip. Please try again.");
}
