import Link from "next/link";

// Shown on every page (added in app/layout.tsx).
export default function SiteHeader() {
  return (
    <header className="border-b border-line bg-surface/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="-ml-1 flex min-h-11 items-center gap-2 rounded-lg px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <LogoMark />
          <span className="font-display text-lg font-semibold tracking-tight">
            AI Travel Planner
          </span>
        </Link>
        <Link
          href="/#plan"
          className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-primary hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Plan a trip
        </Link>
      </div>
    </header>
  );
}

// A map pin with a small compass dot. Decorative: the text next to it
// already names the site, so screen readers skip the SVG.
function LogoMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      className="h-8 w-8 shrink-0"
    >
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M16 7a7 7 0 0 0-7 7c0 5.2 7 11 7 11s7-5.8 7-11a7 7 0 0 0-7-7Z"
        className="fill-on-primary"
      />
      <circle cx="16" cy="14" r="2.6" className="fill-accent" />
    </svg>
  );
}
