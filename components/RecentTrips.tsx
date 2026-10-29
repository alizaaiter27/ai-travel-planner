"use client";

import Link from "next/link";
import { forgetSavedTrip, useSavedTrips } from "@/lib/trips/saved-list";

// "Your saved trips" on the home page: trips saved from this browser.
export default function RecentTrips() {
  const trips = useSavedTrips();
  if (trips.length === 0) return null;

  return (
    <section aria-labelledby="recent-trips-heading" className="max-w-3xl">
      <h2 id="recent-trips-heading" className="text-lg font-semibold">
        Your saved trips
      </h2>
      <p className="mt-1 text-xs text-ink-muted">Saved from this browser.</p>
      <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-surface">
        {trips.map((trip) => (
          <li key={trip.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <Link
              href={`/trips/${trip.id}`}
              className="block min-w-0 truncate py-1.5 font-medium text-primary underline-offset-2 hover:underline"
            >
              {trip.title}
            </Link>
            <div className="flex shrink-0 items-center gap-3 text-xs text-ink-muted">
              <time dateTime={trip.savedAt}>
                {new Date(trip.savedAt).toLocaleDateString("en", { dateStyle: "medium" })}
              </time>
              <button
                type="button"
                onClick={() => forgetSavedTrip(trip.id)}
                aria-label={`Remove ${trip.title} from this list`}
                className="rounded px-2 py-1.5 hover:text-ink"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
