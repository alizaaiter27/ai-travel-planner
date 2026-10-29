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
      <p className="mt-1 text-xs text-zinc-500">Saved from this browser.</p>
      <ul className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {trips.map((trip) => (
          <li key={trip.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <Link
              href={`/trips/${trip.id}`}
              className="min-w-0 truncate font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
            >
              {trip.title}
            </Link>
            <div className="flex shrink-0 items-center gap-3 text-xs text-zinc-500">
              <time dateTime={trip.savedAt}>
                {new Date(trip.savedAt).toLocaleDateString("en", { dateStyle: "medium" })}
              </time>
              <button
                type="button"
                onClick={() => forgetSavedTrip(trip.id)}
                aria-label={`Remove ${trip.title} from this list`}
                className="rounded px-1 hover:text-zinc-900 dark:hover:text-zinc-100"
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
