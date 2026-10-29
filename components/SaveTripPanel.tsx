"use client";

import { useState } from "react";
import { BookmarkIcon, CheckIcon, CopyIcon, SpinnerIcon } from "@/components/icons";
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
    <div className="max-w-3xl rounded-2xl border border-line bg-surface p-4 sm:p-6">
      {state.status !== "saved" ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={state.status === "saving"}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-ink px-5 text-sm font-medium text-canvas hover:bg-ink/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-60"
          >
            {state.status === "saving" ? (
              <SpinnerIcon className="h-4 w-4" />
            ) : (
              <BookmarkIcon className="h-4 w-4" />
            )}
            {state.status === "saving" ? "Saving…" : "Save trip"}
          </button>
          <p className="text-sm text-ink-muted">
            Get a private link to open this plan later or share it.
          </p>
          {state.status === "error" && (
            <p role="alert" className="w-full text-sm text-red-700 dark:text-red-400">
              {state.message}
            </p>
          )}
        </div>
      ) : (
        <div role="status" className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <CheckIcon className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
            Trip saved. Anyone with this link can view it:
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              readOnly
              value={state.url}
              aria-label="Link to your saved trip"
              onFocus={(e) => e.currentTarget.select()}
              className="min-h-11 min-w-0 flex-1 basis-56 rounded-lg border border-line-strong bg-surface px-3 font-mono text-xs text-ink"
            />
            <button
              type="button"
              onClick={() => handleCopy(state.url)}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line-strong px-4 text-sm font-medium hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              {copied ? "Copied" : "Copy link"}
            </button>
            <a
              href={state.url}
              className="inline-flex min-h-11 items-center rounded-lg border border-line-strong px-4 text-sm font-medium hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Open
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
