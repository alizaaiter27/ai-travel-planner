import "server-only";

import OpenAI from "openai";

export const DEFAULT_MODEL = "gpt-6.1-terra";

let client: OpenAI | null = null;

// Creates the OpenAI client once and reuses it. Returns null when the key
// is missing so callers can report a clear configuration error.
export function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  client ??= new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    // Give up after 90 s instead of the SDK's 10-minute default. A 14-day plan
    // can take ~45 s; a timeout triggers a retry, which is paid for again.
    timeout: 90_000,
    maxRetries: 1, // retry once on temporary errors (network, 429, 5xx)
  });
  return client;
}

export function getModel(): string {
  return process.env.OPENAI_MODEL || DEFAULT_MODEL;
}
