import Link from "next/link";

export default function TripNotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Trip not found</h1>
      <p className="mt-2 text-ink-muted">
        This link doesn&apos;t match a saved trip. Check that you copied the
        whole link.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-12 items-center rounded-lg bg-accent px-6 font-medium text-on-accent transition-colors hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        Plan a new trip
      </Link>
    </main>
  );
}
