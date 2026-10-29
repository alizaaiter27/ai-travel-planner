import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
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
      {/* py-2 gives the link a comfortable tap height on phones. */}
      <Link
        href="/"
        className="inline-block py-2 text-sm text-primary underline-offset-2 hover:underline"
      >
        ← Plan a new trip
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
    <div className="space-y-8">
      <p className="text-sm text-ink-muted">Saved trip · {saved}</p>
      <ItineraryView itinerary={trip.plan.itinerary} places={trip.plan.places} budget={trip.request.budget} />
      <PlaceCandidates destinationName={trip.plan.destinationName} places={trip.plan.places} />
    </div>
  );
}
