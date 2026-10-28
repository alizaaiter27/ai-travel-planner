"use client";

import { useEffect, useRef, useState } from "react";
import ItineraryView from "@/components/ItineraryView";
import PlaceCandidates from "@/components/PlaceCandidates";
import TripForm from "@/components/TripForm";
import { fetchPlan, PlanRequestError, type Plan } from "@/lib/api/plan-client";
import type { TripRequest } from "@/types/trip";

type Status = "idle" | "loading" | "success" | "error";

type PlanError = {
  message: string;
  canRetry: boolean;
};

// Owns the planning flow: form → loading → itinerary (or an error).
// The form and the results both need this state, so it lives in their parent.
export default function TripPlanner() {
  const [status, setStatus] = useState<Status>("idle");
  // The plan together with the request that produced it (for the budget).
  const [result, setResult] = useState<{ plan: Plan; request: TripRequest } | null>(null);
  const [error, setError] = useState<PlanError | null>(null);
  // The last request, so "Try again" can resend it. A ref (not state) because
  // changing it doesn't need to redraw anything.
  const lastRequest = useRef<TripRequest | null>(null);
  const outcomeRef = useRef<HTMLElement>(null);

  // When results or an error appear, move focus to them and scroll their top
  // into view. (focus() alone only scrolls until *part* of a tall section shows.)
  useEffect(() => {
    if (status !== "success" && status !== "error") return;
    const outcome = outcomeRef.current;
    outcome?.focus({ preventScroll: true });
    outcome?.scrollIntoView({ block: "start" });
  }, [status]);

  async function handlePlan(request: TripRequest) {
    lastRequest.current = request;
    setStatus("loading");
    setResult(null);
    setError(null);

    try {
      setResult({ plan: await fetchPlan(request), request });
      setStatus("success");
    } catch (err) {
      setError(
        err instanceof PlanRequestError
          ? { message: err.message, canRetry: err.canRetry }
          : { message: "Something unexpected went wrong. Please try again.", canRetry: true },
      );
      setStatus("error");
    }
  }

  function handleRetry() {
    if (lastRequest.current) handlePlan(lastRequest.current);
  }

  return (
    <div className="space-y-12">
      <TripForm onSubmit={handlePlan} isLoading={status === "loading"} />

      {status === "loading" && <LoadingState />}

      {status === "error" && error && (
        <section ref={outcomeRef} tabIndex={-1} aria-label="Error" className="focus:outline-none">
          <ErrorState error={error} onRetry={handleRetry} />
        </section>
      )}

      {status === "success" && result && (
        <section
          ref={outcomeRef}
          tabIndex={-1}
          aria-label="Your trip"
          className="space-y-8 scroll-mt-6 focus:outline-none"
        >
          <ItineraryView
            itinerary={result.plan.itinerary}
            places={result.plan.places}
            budget={result.request.budget}
          />
          <PlaceCandidates
            destinationName={result.plan.destinationName}
            places={result.plan.places}
          />
        </section>
      )}
    </div>
  );
}

function LoadingState() {
  // Counts seconds while waiting: a plan takes 15–45 s, and a visible
  // counter shows the page is still working rather than frozen.
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer); // stop counting when loading ends
  }, []);

  return (
    <div className="space-y-4">
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        {/* Only this static line is announced, not every tick of the counter. */}
        <p role="status">
          Finding real places and building your plan. This usually takes 15–45 seconds.
        </p>
        <p aria-hidden="true" className="mt-1 font-mono text-xs text-zinc-500">
          {seconds}s
        </p>
      </div>
      {/* Grey placeholder blocks shaped like the result ("skeleton" loading). */}
      <div className="animate-pulse space-y-4" aria-hidden="true">
        <div className="h-7 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-40 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-40 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: PlanError; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
    >
      <p className="font-medium">We couldn&apos;t plan this trip</p>
      <p className="mt-1 text-sm">{error.message}</p>
      {error.canRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 dark:border-red-800 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800"
        >
          Try again
        </button>
      )}
    </div>
  );
}
