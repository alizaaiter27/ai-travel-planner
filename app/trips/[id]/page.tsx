import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { ArrowLeftIcon, BookmarkIcon } from "@/components/icons";
import ItineraryView from "@/components/ItineraryView";
import PlaceCandidates from "@/components/PlaceCandidates";
import { getTrip } from "@/lib/trips/store";

// cache() makes getTrip run once per request even though both the metadata
// and the page need the trip.
const loadTrip = cache(getTrip);

export async function generateMetadata({ params }: PageProps<"/trips/[id]">): Promise<Metadata> {
  const trip = await loadTrip((await params).id);
  return {
    title: trip ? `${trip.request.days}-day trip to ${trip.plan.destinationName}` : "Trip not found",
    // Share links are private: keep them out of search engines.
    robots: { index: false, follow: false },
  };
}

// Not async: the trip is loaded inside <Suspense>, so the page frame shows
// right away and the trip streams in when the database answers.
export default function TripPage({ params }: PageProps<"/trips/[id]">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="-ml-1 inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Plan a new trip
      </Link>
      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-ink-muted">Loading trip…</p>}>
          {params.then(({ id }) => (
            <SavedTrip id={id} />
          ))}
        </Suspense>
      </div>
    </main>
  );
}

async function SavedTrip({ id }: { id: string }) {
  const trip = await loadTrip(id);
  if (!trip) notFound(); // shows not-found.tsx

  const saved = new Date(trip.createdAt).toLocaleDateString("en", { dateStyle: "medium" });

  return (
    <div className="space-y-6">
      <p className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
        <BookmarkIcon className="h-3.5 w-3.5" />
        Saved trip · {saved}
      </p>
      <ItineraryView
        titleAs="h1"
        itinerary={trip.plan.itinerary}
        places={trip.plan.places}
        budget={trip.request.budget}
      />
      <PlaceCandidates destinationName={trip.plan.destinationName} places={trip.plan.places} />
    </div>
  );
}
