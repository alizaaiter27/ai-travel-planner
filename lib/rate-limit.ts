import "server-only";

import { createHmac } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";

// Rate limits protect the endpoints that cost money (Google + OpenAI) or
// write data. Counters live in Supabase (see 0002_rate_limits.sql) so they
// work across serverless instances, which don't share memory.

export type RateLimitRule = {
  name: string; // e.g. "itinerary"
  limit: number; // max requests…
  windowSeconds: number; // …per this many seconds
  scope: "ip" | "global"; // per visitor, or for the whole app
};

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

// Visitor IP from the proxy headers (Vercel sets x-forwarded-for).
function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}

// IPs are personal data, so we store a keyed hash instead of the address.
function hashIp(ip: string): string {
  const secret = process.env.TRIP_SIGNING_SECRET ?? "";
  return createHmac("sha256", secret).update(`rate-limit:${ip}`).digest("hex").slice(0, 32);
}

// Checks every rule; the first one that's exceeded wins.
export async function checkRateLimits(
  request: Request,
  rules: RateLimitRule[],
): Promise<RateLimitResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    // Fail open: availability over protection. Provider-side quotas and
    // budgets (Google daily caps, OpenAI project budget) remain as a backstop.
    console.warn("[rate-limit] Supabase not configured; skipping rate limits");
    return { ok: true };
  }

  for (const rule of rules) {
    const who = rule.scope === "global" ? "global" : `ip:${hashIp(clientIp(request))}`;
    const { data, error } = await supabase.rpc("hit_rate_limit", {
      p_key: `${rule.name}:${who}`,
      p_window_seconds: rule.windowSeconds,
    });
    if (error) {
      console.error("[rate-limit] check failed; allowing request", error.message);
      return { ok: true };
    }
    if (typeof data === "number" && data > rule.limit) {
      const nowSeconds = Math.floor(Date.now() / 1000);
      return { ok: false, retryAfterSeconds: rule.windowSeconds - (nowSeconds % rule.windowSeconds) };
    }
  }
  return { ok: true };
}

export function tooManyRequests(retryAfterSeconds: number): Response {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return Response.json(
    {
      error: `You've reached the limit for now. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
