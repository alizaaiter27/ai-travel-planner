"use client";

import { useRef, useState } from "react";
import BudgetSummary from "@/components/BudgetSummary";
import TripMap from "@/components/TripMap";
import { formatCost, formatDuration, formatMoney } from "@/lib/format";
import { summarizeBudget } from "@/lib/itinerary/budget";
import { dayColor } from "@/lib/itinerary/day-colors";
import type { Itinerary, ItineraryItem, Place } from "@/types/trip";

type Props = {
  itinerary: Itinerary;
  // The real places the plan was built from, used for addresses, links, and the map.
  places: Place[];
  // The traveler's total budget, for the budget summary.
  budget: number;
};

export default function ItineraryView({ itinerary, places, budget }: Props) {
  // Shared by the map and the list, so selecting in one highlights the other.
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [visibleDay, setVisibleDay] = useState<number | null>(null); // null = all days
  const mapRef = useRef<HTMLDivElement>(null);

  const dayCount = itinerary.days.length;
  const placesById = new Map(places.map((place) => [place.id, place]));
  // All totals are calculated here in code, not by the AI.
  const summary = summarizeBudget(itinerary, budget);

  // Clicked in the list: highlight it and make sure the map shows it.
  function selectFromList(placeId: string, day: number) {
    setSelectedPlaceId(placeId);
    if (visibleDay !== null && visibleDay !== day) setVisibleDay(day);
    // On narrow screens the map sits above the list, out of view.
    if (!window.matchMedia("(min-width: 1024px)").matches) {
      mapRef.current?.scrollIntoView({ block: "start" });
    }
  }

  // Clicked on the map: highlight the stop and scroll it into view in the list.
  function selectFromMap(placeId: string) {
    setSelectedPlaceId(placeId);
    document
      .querySelector(`[data-place-id="${CSS.escape(placeId)}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-tight">
          Your {dayCount}-day plan for {itinerary.destination}
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Suggested by AI, using only real places from Google. Costs are rough
          estimates; prices, opening hours, and availability aren&apos;t
          guaranteed, so check before you go.
        </p>
      </div>

      <div className="max-w-3xl">
        <BudgetSummary summary={summary} currency={itinerary.currency} />
      </div>

      {/* Two columns on large screens: list left, map right (sticky). */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
        <div ref={mapRef} className="scroll-mt-4 space-y-3 lg:sticky lg:top-4 lg:order-2 lg:self-start">
          <DayFilter
            dayCount={dayCount}
            visibleDay={visibleDay}
            onChange={(day) => {
              setVisibleDay(day);
              setSelectedPlaceId(null);
            }}
          />
          <div className="h-72 sm:h-96 lg:h-[calc(100vh-7rem)]">
            <TripMap
              itinerary={itinerary}
              places={places}
              visibleDay={visibleDay}
              selectedPlaceId={selectedPlaceId}
              onSelect={selectFromMap}
            />
          </div>
        </div>

        <ol className="space-y-6 lg:order-1">
          {itinerary.days.map((day, index) => {
            const dayCost = summary.days[index];
            const dimmed = visibleDay !== null && visibleDay !== day.day;
            return (
              <li
                key={day.day}
                className={
                  "rounded-xl border border-zinc-200 p-4 transition-opacity sm:p-5 dark:border-zinc-800 " +
                  (dimmed ? "opacity-50" : "")
                }
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="font-semibold">
                    <span
                      aria-hidden="true"
                      className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: dayColor(day.day) }}
                    />
                    Day {day.day}
                    <span className="font-normal text-zinc-500"> · {day.theme}</span>
                  </h3>
                  <p className="text-sm text-zinc-500">
                    ~{formatMoney(dayCost.estimatedTotal, itinerary.currency)}
                    <span className="sr-only"> estimated for day {day.day}</span>
                    <span aria-hidden="true"> est.</span>
                  </p>
                </div>
                <ol className="mt-4 space-y-2">
                  {day.items.map((item, itemIndex) => (
                    <ItineraryStop
                      key={item.placeId}
                      item={item}
                      day={day.day}
                      number={itemIndex + 1}
                      place={placesById.get(item.placeId)}
                      currency={itinerary.currency}
                      selected={item.placeId === selectedPlaceId}
                      onSelect={() => selectFromList(item.placeId, day.day)}
                    />
                  ))}
                </ol>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function DayFilter({
  dayCount,
  visibleDay,
  onChange,
}: {
  dayCount: number;
  visibleDay: number | null;
  onChange: (day: number | null) => void;
}) {
  const options: (number | null)[] = [null, ...Array.from({ length: dayCount }, (_, i) => i + 1)];
  return (
    <div role="group" aria-label="Show on map" className="flex flex-wrap gap-1.5">
      {options.map((day) => {
        const active = day === visibleDay;
        return (
          <button
            key={day ?? "all"}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(day)}
            className={
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 " +
              (active
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700")
            }
          >
            {day === null ? "All days" : `Day ${day}`}
          </button>
        );
      })}
    </div>
  );
}

function ItineraryStop({
  item,
  day,
  number,
  place,
  currency,
  selected,
  onSelect,
}: {
  item: ItineraryItem;
  day: number;
  number: number;
  place: Place | undefined;
  currency: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li
      data-place-id={item.placeId}
      className={
        "flex scroll-mt-4 gap-3 rounded-lg p-2 transition-colors " +
        (selected ? "bg-sky-50 ring-2 ring-sky-600 dark:bg-sky-950" : "")
      }
    >
      {/* The numbered badge matches the marker on the map. */}
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`Show ${item.placeName} on the map (day ${day}, stop ${number})`}
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2"
        style={{ backgroundColor: dayColor(day) }}
      >
        {number}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <time className="font-mono text-sm text-zinc-500">{item.time}</time>
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
                  Google Maps<span className="sr-only"> for {item.placeName} (opens in a new tab)</span>
                </a>
              </>
            )}
          </p>
        )}
      </div>
    </li>
  );
}
