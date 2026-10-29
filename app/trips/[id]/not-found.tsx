import Link from "next/link";

export default function TripNotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Trip not found</h1>
      <p className="mt-2 text-ink-muted">
        This link doesn&apos;t match a saved trip. Check that you copied the
        whole link.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-accent px-5 py-3 font-medium text-on-accent hover:bg-accent-hover"
      >
        Plan a new trip
      </Link>
    </main>
  );
}
