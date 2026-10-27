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
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Real places we found
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {places.length} places in {destinationName}, from Google Places. Your
          itinerary will be built only from these.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map(({ category, title }) => {
          const inSection = places.filter((place) => place.category === category);
          return (
            <section
              key={category}
              aria-labelledby={`places-${category}`}
              className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <h3 id={`places-${category}`} className="font-semibold">
                {title} <span className="font-normal text-zinc-500">({inSection.length})</span>
              </h3>
              {inSection.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">None found.</p>
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
    </div>
  );
}

function PlaceRow({ place }: { place: Place }) {
  return (
    <li className="text-sm">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-medium">{place.name}</span>
        {place.primaryType && (
          <span className="text-xs text-zinc-500">{formatType(place.primaryType)}</span>
        )}
      </div>
      <p className="text-xs text-zinc-500">{place.address}</p>
      {place.googleMapsUri && (
        <a
          href={place.googleMapsUri}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
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
