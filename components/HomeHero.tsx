import Link from "next/link";
import { ArrowRightIcon, CalculatorIcon, LinkIcon, MapPinIcon } from "@/components/icons";
import { dayColor } from "@/lib/itinerary/day-colors";
import { EXAMPLE_TRIP_PATH } from "@/lib/example-trip";

// Three stops from the real example trip, so the preview shows exactly
// what the app produces (no made-up places, even in marketing).
const PREVIEW_STOPS = [
  { time: "09:30", name: "Mercat de Santa Caterina", type: "Attraction", cost: "Usually free" },
  { time: "10:30", name: "Picasso Museum Barcelona", type: "Attraction", cost: "~€15" },
  { time: "13:00", name: "Fa Patxoca", type: "Restaurant", cost: "~€30" },
];

const HIGHLIGHTS = [
  { icon: MapPinIcon, text: "Only real places from Google" },
  { icon: CalculatorIcon, text: "Budget worked out in code" },
  { icon: LinkIcon, text: "Free, no sign-up, shareable link" },
];

export default function HomeHero() {
  return (
    <section className="aurora relative overflow-hidden border-b border-line">
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            AI itineraries you can trust
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Plan a trip with real places
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-muted text-pretty">
            Tell us where you&apos;re going, for how long, and what you enjoy.
            We find real attractions and restaurants, arrange them into a
            day-by-day plan, and estimate what it will cost.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#plan"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-accent px-6 font-medium text-on-accent transition-colors hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              Start planning
              <ArrowRightIcon className="h-4 w-4" />
            </a>
            <Link
              href={EXAMPLE_TRIP_PATH}
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-line-strong bg-surface px-6 font-medium transition-colors hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              See an example trip
            </Link>
          </div>

          <ul className="mt-8 flex flex-col gap-3 text-sm text-ink-muted sm:flex-row sm:flex-wrap sm:gap-x-6">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <PlanPreview />
      </div>
    </section>
  );
}

// A static picture of one planned day. It's an illustration of the result,
// so it's hidden from screen readers; the "example trip" link above leads
// to the real, accessible version.
function PlanPreview() {
  return (
    <div
      aria-hidden="true"
      className="hidden rounded-2xl border border-line bg-surface p-5 shadow-xl shadow-primary/10 sm:block lg:rotate-1"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold">
          <span className="text-primary">Day 1</span>
          <span className="font-normal text-ink-muted"> · Barcelona</span>
        </p>
        <p className="text-sm text-ink-muted">~€60 est.</p>
      </div>
      <ol className="mt-4 space-y-4">
        {PREVIEW_STOPS.map((stop, index) => (
          <li key={stop.name} className="flex gap-3">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: dayColor(1) }}
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm">
                <span className="font-mono text-ink-muted">{stop.time}</span>{" "}
                <span className="font-medium">{stop.name}</span>
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {stop.type} · {stop.cost}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-5 border-t border-line pt-4">
        <div className="flex justify-between text-xs text-ink-muted">
          <span>Budget €300</span>
          <span>~€172 planned</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full w-[57%] rounded-full bg-emerald-600" />
        </div>
      </div>
    </div>
  );
}
