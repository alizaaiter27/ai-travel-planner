import type { Itinerary, ItineraryItem, Place } from "@/types/trip";

type Props = {
  itinerary: Itinerary;
  // The real places the plan was built from, used to show addresses and links.
  places: Place[];
};

export default function ItineraryView({ itinerary, places }: Props) {
  const dayCount = itinerary.days.length;
  const placesById = new Map(places.map((place) => [place.id, place]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Your {dayCount}-day plan for {itinerary.destination}
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Suggested by AI, using only real places from Google. Costs are rough
          estimates; prices, opening hours, and availability aren&apos;t
          guaranteed, so check before you go.
        </p>
      </div>

      <ol className="space-y-6">
        {itinerary.days.map((day) => (
          <li
            key={day.day}
            className="rounded-xl border border-zinc-200 p-4 sm:p-5 dark:border-zinc-800"
          >
            <h3 className="font-semibold">
              Day {day.day}
              <span className="font-normal text-zinc-500"> · {day.theme}</span>
            </h3>
            <ol className="mt-4 space-y-4">
              {day.items.map((item) => (
                <ItineraryStop
                  key={item.placeId}
                  item={item}
                  place={placesById.get(item.placeId)}
                  currency={itinerary.currency}
                />
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ItineraryStop({
  item,
  place,
  currency,
}: {
  item: ItineraryItem;
  place: Place | undefined;
  currency: string;
}) {
  return (
    <li className="flex gap-4">
      <time className="w-12 shrink-0 pt-0.5 font-mono text-sm text-zinc-500">
        {item.time}
      </time>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{item.placeName}</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs capitalize text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {item.category}
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.reason}</p>
        <p className="mt-1 text-xs text-zinc-500">
          {formatDuration(item.durationMinutes)} · {formatCost(item.estimatedCost, currency)}
        </p>
        {place && (
          <p className="mt-1 text-xs text-zinc-500">
            {place.address}
            {place.googleMapsUri && (
              <>
                {" · "}
                <a
                  href={place.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
                >
                  Map<span className="sr-only"> for {item.placeName} (opens in a new tab)</span>
                </a>
              </>
            )}
          </p>
        )}
      </div>
    </li>
  );
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

function formatCost(cost: number | null, currency: string): string {
  if (cost === null) return "No cost estimate";
  if (cost === 0) return "Usually free";
  return `~${formatMoney(cost, currency)} (estimate)`;
}

function formatMoney(amount: number, currency: string): string {
  // Intl.NumberFormat adds the right symbol and format, e.g. "€15" or "¥15".
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
