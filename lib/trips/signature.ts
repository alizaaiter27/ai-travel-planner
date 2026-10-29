import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { z } from "zod";
import { savePayloadSchema } from "@/lib/schemas/plan";

type SavePayload = z.infer<typeof savePayloadSchema>;

// HMAC = a fingerprint of the content made with a secret key. Anyone can
// read the plan, but without the secret nobody can produce a valid signature
// for a changed or made-up plan.

// Same data must always become the same text before signing. Parsing with
// the schema first fixes the key order and drops any extra fields.
function canonical(payload: SavePayload): string {
  return JSON.stringify(savePayloadSchema.parse(payload));
}

function hmac(text: string, secret: string): string {
  return createHmac("sha256", secret).update(text).digest("hex");
}

// Returns null when TRIP_SIGNING_SECRET isn't set (saving is then disabled).
export function signPayload(payload: SavePayload): string | null {
  const secret = process.env.TRIP_SIGNING_SECRET;
  if (!secret) return null;
  return hmac(canonical(payload), secret);
}

export function verifyPayload(payload: SavePayload, signature: string): boolean {
  const secret = process.env.TRIP_SIGNING_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(hmac(canonical(payload), secret), "hex");
  const given = Buffer.from(signature, "hex");
  // timingSafeEqual takes the same time whether 1 or 64 characters match,
  // so an attacker can't guess the signature by measuring response times.
  return expected.length === given.length && timingSafeEqual(expected, given);
}
