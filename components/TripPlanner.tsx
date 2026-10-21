"use client";

import { useEffect, useRef, useState } from "react";
import ItineraryView from "@/components/ItineraryView";
import TripForm from "@/components/TripForm";
import { getMockItinerary } from "@/lib/mock-itinerary";
import { itinerarySchema } from "@/lib/schemas/trip";
import type { Itinerary, TripRequest } from "@/types/trip";

type Status = "idle" | "loading" | "success";

// Owns the planning flow: form → loading → itinerary.
// The form and the results both need this state, so it lives in their parent.
export default function TripPlanner() {
  const [status, setStatus] = useState<Status>("idle");
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const resultsRef = useRef<HTMLElement>(null);

  // When results appear, move focus (and scroll) to them.
  useEffect(() => {
    if (status === "success") resultsRef.current?.focus();
  }, [status]);

  async function handlePlan(request: TripRequest) {
    setStatus("loading");
    setItinerary(null);

    // Pretend to wait for the server. Later steps replace this with a real API call.
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Check the data has the expected shape before showing it. Real API
    // data will go through the same check; .parse() throws if it's wrong.
    setItinerary(itinerarySchema.parse(getMockItinerary(request)));
    setStatus("success");
  }

  return (
    <div className="space-y-12">
      <TripForm onSubmit={handlePlan} isLoading={status === "loading"} />

      {status === "loading" && <LoadingState />}

      {status === "success" && itinerary && (
        <section
          ref={resultsRef}
          tabIndex={-1}
          aria-label="Your itinerary"
          className="scroll-mt-6 focus:outline-none"
        >
          <ItineraryView itinerary={itinerary} isSample />
        </section>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div role="status" className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Planning your trip…</p>
      {/* Grey placeholder blocks shaped like the result ("skeleton" loading). */}
      <div className="animate-pulse space-y-4" aria-hidden="true">
        <div className="h-7 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-40 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-40 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}
