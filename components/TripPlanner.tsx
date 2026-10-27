"use client";

import { useEffect, useRef, useState } from "react";
import ItineraryView from "@/components/ItineraryView";
import PlaceCandidates from "@/components/PlaceCandidates";
import TripForm from "@/components/TripForm";
import { fetchPlaces, PlacesRequestError } from "@/lib/api/places-client";
import { getMockItinerary } from "@/lib/mock-itinerary";
import { itinerarySchema } from "@/lib/schemas/trip";
import type { Itinerary, Place, TripRequest } from "@/types/trip";

type Status = "idle" | "loading" | "success" | "error";

type PlanResult = {
  destinationName: string;
  places: Place[];
  itinerary: Itinerary;
};

type PlanError = {
  message: string;
  canRetry: boolean;
};

// Owns the planning flow: form → loading → places + itinerary (or an error).
// The form and the results both need this state, so it lives in their parent.
export default function TripPlanner() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<PlanResult | null>(null);
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
      const { destinationName, places } = await fetchPlaces(request);
      // The itinerary is still sample data; Step 6 builds it from `places`.
      const itinerary = itinerarySchema.parse(getMockItinerary(request));
      setResult({ destinationName, places, itinerary });
      setStatus("success");
    } catch (err) {
      setError(
        err instanceof PlacesRequestError
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
          className="space-y-12 scroll-mt-6 focus:outline-none"
        >
          {result.places.length === 0 ? (
            <EmptyState destinationName={result.destinationName} />
          ) : (
            <>
              <PlaceCandidates destinationName={result.destinationName} places={result.places} />
              <ItineraryView itinerary={result.itinerary} isSample />
            </>
          )}
        </section>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div role="status" className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Finding real places…</p>
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

function EmptyState({ destinationName }: { destinationName: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="font-medium">No matching places found</p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        We found {destinationName}, but no places matched your interests. Try
        choosing different interests, or a larger nearby city.
      </p>
    </div>
  );
}
