"use client";

import { useEffect, useRef, useState } from "react";
import ItineraryView from "@/components/ItineraryView";
import PlaceCandidates from "@/components/PlaceCandidates";
import SaveTripPanel from "@/components/SaveTripPanel";
import TripForm from "@/components/TripForm";
import { AlertCircleIcon, CheckIcon, SpinnerIcon } from "@/components/icons";
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
      <div className="max-w-3xl">
        <TripForm onSubmit={handlePlan} isLoading={status === "loading"} />
      </div>

      {status === "loading" && (
        <div className="max-w-3xl">
          <LoadingState />
        </div>
      )}

      {status === "error" && error && (
        <section
          ref={outcomeRef}
          tabIndex={-1}
          aria-label="Error"
          className="max-w-3xl scroll-mt-6 focus:outline-none"
        >
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
          <SaveTripPanel request={result.request} plan={result.plan} />
          <PlaceCandidates
            destinationName={result.plan.destinationName}
            places={result.plan.places}
          />
        </section>
      )}
    </div>
  );
}

// What the server does, in order, with roughly when each step starts.
// The server doesn't report progress, so the active step is a time-based
// estimate; the last step is never shown as finished — the plan appearing
// is the real "done".
const LOADING_STEPS = [
  { label: "Finding real places", startsAt: 0 },
  { label: "Arranging your days with AI", startsAt: 6 },
  { label: "Checking the plan and adding up costs", startsAt: 30 },
];

function LoadingState() {
  // Counts seconds while waiting: a plan takes 15–45 s, and a visible
  // counter shows the page is still working rather than frozen.
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer); // stop counting when loading ends
  }, []);

  const activeIndex = LOADING_STEPS.findLastIndex((step) => seconds >= step.startsAt);

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 sm:p-8">
      <div className="flex items-baseline justify-between gap-4">
        {/* Only this static line is announced, not every tick of the counter. */}
        <p role="status" className="font-medium">
          Planning your trip…
        </p>
        <p aria-hidden="true" className="font-mono text-sm text-ink-muted">
          {seconds}s
        </p>
      </div>
      <ol className="mt-5 space-y-3" aria-hidden="true">
        {LOADING_STEPS.map((step, index) => {
          const state = index < activeIndex ? "done" : index === activeIndex ? "active" : "waiting";
          return (
            <li key={step.label} className="flex items-center gap-3 text-sm">
              <span
                className={
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full " +
                  (state === "done"
                    ? "bg-primary text-on-primary"
                    : state === "active"
                      ? "bg-primary-soft text-primary"
                      : "border border-line text-ink-muted")
                }
              >
                {state === "done" ? (
                  <CheckIcon className="h-4 w-4" />
                ) : state === "active" ? (
                  <SpinnerIcon className="h-4 w-4" />
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </span>
              <span className={state === "waiting" ? "text-ink-muted" : "font-medium"}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
      {/* Placeholder blocks shaped like the result ("skeleton" loading). */}
      <div className="mt-8 space-y-4 motion-safe:animate-pulse" aria-hidden="true">
        <div className="h-6 w-2/3 rounded bg-surface-muted" />
        <div className="h-28 rounded-xl bg-surface-muted" />
        <div className="h-28 rounded-xl bg-surface-muted" />
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: PlanError; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-2xl border border-red-300 bg-red-50 p-5 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
    >
      <AlertCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-medium">We couldn&apos;t plan this trip</p>
        <p className="mt-1 text-sm">{error.message}</p>
        {error.canRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 min-h-11 rounded-lg border border-red-300 bg-white px-4 text-sm font-medium text-red-900 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 dark:border-red-800 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
