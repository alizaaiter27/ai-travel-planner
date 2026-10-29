import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Server-only Supabase client using the SECRET key, which bypasses Row Level
// Security. That's why it must never reach the browser: the trips table has
// RLS on with no policies, so this server is the only way in.
// Returns null when not configured, so callers can report a clear error.
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) return null;

  client ??= createClient(url, secretKey, {
    // No user sessions on the server: we act as the app, not as a person.
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
