"use client";

import { useRef, useState } from "react";
import BudgetSummary from "@/components/BudgetSummary";
import TripMap from "@/components/TripMap";
import {
  ClockIcon,
  ExternalLinkIcon,
  LandmarkIcon,
  MapPinIcon,
  UtensilsIcon,
  WalletIcon,
} from "@/components/icons";
import { formatCost, formatDuration, formatMoney, shortAddress } from "@/lib/format";
import { summarizeBudget } from "@/lib/itinerary/budget";
import { dayColor } from "@/lib/itinerary/day-colors";
import type { Itinerary, ItineraryItem, Place } from "@/types/trip";

type Props = {
  itinerary: Itinerary;
  // The real places the plan was built from, used for addresses, links, and the map.
  places: Place[];
  // The traveler's total budget, for the budget summary.
  budget: number;
  // h2 under the home page's h1; h1 on the saved-trip page, where the
  // plan is the page's main content.
  titleAs?: "h1" | "h2";
};

export default function ItineraryView({ itinerary, places, budget, titleAs = "h2" }: Props) {
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

  const stopCount = itinerary.days.reduce((total, day) => total + day.items.length, 0);
  const Title = titleAs;
  // Section headings sit one level below the title (h1 → h2, h2 → h3).
  const Subheading = titleAs === "h1" ? "h2" : "h3";

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <Title className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Your {dayCount}-day plan for {itinerary.destination}
        </Title>
        <p className="mt-2 text-sm font-medium text-primary">
          {dayCount} {dayCount === 1 ? "day" : "days"} · {stopCount} stops
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          Suggested by AI, using only real places from Google. Costs are rough
          estimates; prices, opening hours, and availability aren&apos;t
          guaranteed, so check before you go.
        </p>
      </div>

      <div className="max-w-3xl">
        <BudgetSummary summary={summary} currency={itinerary.currency} headingAs={Subheading} />
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
          <div className="h-72 sm:h-96 lg:h-[calc(100vh-8rem)]">
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
                  "rounded-2xl border border-line bg-surface p-4 transition-opacity sm:p-6 " +
                  (dimmed ? "opacity-50" : "")
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                  <Subheading className="flex flex-wrap items-center gap-x-3 gap-y-1 font-sans">
                    <span
                      className="rounded-full px-3 py-1 text-sm font-semibold text-white"
                      style={{ backgroundColor: dayColor(day.day) }}
                    >
                      Day {day.day}
                    </span>
                    <span className="font-display text-xl font-semibold">{day.theme}</span>
                  </Subheading>
                  <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                    <WalletIcon className="h-4 w-4" />
                    ~{formatMoney(dayCost.estimatedTotal, itinerary.currency)}
                    <span className="sr-only"> estimated for day {day.day}</span>
                    <span aria-hidden="true"> est.</span>
                  </p>
                </div>
                <ol className="mt-4 space-y-1">
                  {day.items.map((item, itemIndex) => (
                    <ItineraryStop
                      key={item.placeId}
                      item={item}
                      day={day.day}
                      number={itemIndex + 1}
                      isLast={itemIndex === day.items.length - 1}
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
    <div role="group" aria-label="Show on map" className="flex flex-wrap gap-2">
      {options.map((day) => {
        const active = day === visibleDay;
        return (
          <button
            key={day ?? "all"}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(day)}
            className={
              "flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary " +
              (active
                ? "border-ink bg-ink text-canvas"
                : "border-line-strong bg-surface hover:border-primary")
            }
          >
            {day !== null && (
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: dayColor(day) }}
              />
            )}
            {day === null ? "All days" : `Day ${day}`}
          </button>
        );
      })}
    </div>
  );
}

const CATEGORY_LABELS = {
  attraction: { label: "Attraction", icon: LandmarkIcon },
  restaurant: { label: "Restaurant", icon: UtensilsIcon },
} as const;

function ItineraryStop({
  item,
  day,
  number,
  isLast,
  place,
  currency,
  selected,
  onSelect,
}: {
  item: ItineraryItem;
  day: number;
  number: number;
  isLast: boolean;
  place: Place | undefined;
  currency: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const category = CATEGORY_LABELS[item.category];
  const CategoryIcon = category.icon;

  return (
    <li data-place-id={item.placeId} className="relative scroll-mt-4">
      {/* The timeline: a line from this stop's badge down to the next one. */}
      {!isLast && (
        <span
          aria-hidden="true"
          className="absolute top-14 bottom-0 left-[1.875rem] w-0.5 rounded-full bg-line-strong/40"
        />
      )}
      <div
        className={
          "rounded-xl p-3 transition-colors " +
          (selected ? "bg-primary-soft ring-2 ring-primary" : "")
        }
      >
        {/* The badge and name together are one big button; the number
            matches the marker on the map. */}
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          aria-label={`${item.time} ${item.placeName}: show on the map (day ${day}, stop ${number})`}
          className="group flex min-h-11 w-full items-start gap-3 rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: dayColor(day) }}
          >
            {number}
          </span>
          <span className="min-w-0 pt-1">
            <time className="font-mono text-sm text-ink-muted">{item.time}</time>{" "}
            <span className="font-semibold underline-offset-2 group-hover:underline">
              {item.placeName}
            </span>
          </span>
        </button>

        <div className="mt-1 pl-12">
          <p className="text-sm text-pretty">{item.reason}</p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
            <li className="flex items-center gap-1.5">
              <CategoryIcon className="h-3.5 w-3.5" />
              {category.label}
            </li>
            <li className="flex items-center gap-1.5">
              <ClockIcon className="h-3.5 w-3.5" />
              {formatDuration(item.durationMinutes)}
            </li>
            <li className="flex items-center gap-1.5">
              <WalletIcon className="h-3.5 w-3.5" />
              {formatCost(item.estimatedCost, currency)}
            </li>
          </ul>
          {place && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-ink-muted">
              <span className="flex items-center gap-1.5">
                <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                {shortAddress(place.address)}
              </span>
              {place.googleMapsUri && (
                <a
                  href={place.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1 font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Google Maps
                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                  <span className="sr-only"> for {item.placeName} (opens in a new tab)</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
