"use client";

import { useState } from "react";
import type { Plan } from "@/lib/api/plan-client";
import { saveTripRequest } from "@/lib/api/trips-client";
import { rememberSavedTrip } from "@/lib/trips/saved-list";
import type { TripRequest } from "@/types/trip";

type Props = {
  request: TripRequest;
  plan: Plan;
};

type State =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; url: string }
  | { status: "error"; message: string };

export default function SaveTripPanel({ request, plan }: Props) {
  const [state, setState] = useState<State>({ status: "idle" });
  const [copied, setCopied] = useState(false);

  if (!plan.signature) return null; // saving isn't configured on the server

  async function handleSave() {
    setState({ status: "saving" });
    try {
      const id = await saveTripRequest(request, plan);
      const url = `${window.location.origin}/trips/${id}`;
      rememberSavedTrip({
        id,
        title: `${request.days}-day trip to ${plan.destinationName}`,
        savedAt: new Date().toISOString(),
      });
      setState({ status: "saved", url });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "Please try again." });
    }
  }

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the link is selectable in the box anyway.
    }
  }

  return (
    <div className="max-w-3xl rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      {state.status !== "saved" ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={state.status === "saving"}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {state.status === "saving" ? "Saving…" : "Save trip"}
          </button>
          <p className="text-sm text-zinc-500">
            Get a private link to open this plan later or share it.
          </p>
          {state.status === "error" && (
            <p role="alert" className="w-full text-sm text-red-700 dark:text-red-400">
              {state.message}
            </p>
          )}
        </div>
      ) : (
        <div role="status" className="space-y-2">
          <p className="text-sm font-medium">Trip saved. Anyone with this link can view it:</p>
          <div className="flex flex-wrap gap-2">
            <input
              readOnly
              value={state.url}
              aria-label="Link to your saved trip"
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={() => handleCopy(state.url)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
            <a
              href={state.url}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Open
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
