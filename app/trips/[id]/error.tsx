"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

// Shown if loading a saved trip fails unexpectedly (e.g. the database is down).
export default function TripError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
      <div
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
      >
        <p className="font-medium">We couldn&apos;t load this trip</p>
        <p className="mt-1 text-sm">Please try again in a moment.</p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-3 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-100 dark:border-red-800 dark:bg-red-900 dark:text-red-100"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
