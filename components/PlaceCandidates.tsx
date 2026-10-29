import type { Place, PlaceCategory } from "@/types/trip";

type Props = {
  destinationName: string;
  places: Place[];
};

const SECTIONS: { category: PlaceCategory; title: string }[] = [
  { category: "attraction", title: "Things to do" },
  { category: "restaurant", title: "Places to eat" },
];

export default function PlaceCandidates({ destinationName, places }: Props) {
  return (
    // <details> is a built-in show/hide control: keyboard and screen-reader
    // friendly with no JavaScript.
    <details className="group rounded-xl border border-line bg-surface p-4">
      <summary className="cursor-pointer list-none">
        <h2 className="inline text-lg font-semibold">
          <span aria-hidden="true" className="mr-2 inline-block transition-transform group-open:rotate-90">
            ›
          </span>
          All {places.length} real places we considered
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          From Google Places in {destinationName}. Your plan uses only places
          from this list.
        </p>
      </summary>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {SECTIONS.map(({ category, title }) => {
          const inSection = places.filter((place) => place.category === category);
          return (
            <section
              key={category}
              aria-labelledby={`places-${category}`}
              className="rounded-xl border border-line bg-surface p-4"
            >
              <h3 id={`places-${category}`} className="font-semibold">
                {title} <span className="font-normal text-ink-muted">({inSection.length})</span>
              </h3>
              {inSection.length === 0 ? (
                <p className="mt-2 text-sm text-ink-muted">None found.</p>
              ) : (
                <ul className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-1">
                  {inSection.map((place) => (
                    <PlaceRow key={place.id} place={place} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </details>
  );
}

function PlaceRow({ place }: { place: Place }) {
  return (
    <li className="text-sm">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-medium">{place.name}</span>
        {place.primaryType && (
          <span className="text-xs text-ink-muted">{formatType(place.primaryType)}</span>
        )}
      </div>
      <p className="text-xs text-ink-muted">{place.address}</p>
      {place.googleMapsUri && (
        <a
          href={place.googleMapsUri}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary underline-offset-2 hover:underline"
        >
          View on Google Maps<span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
    </li>
  );
}

// "art_museum" → "Art museum"
function formatType(type: string): string {
  const words = type.replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
