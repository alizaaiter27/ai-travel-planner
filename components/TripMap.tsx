"use client";

import { AdvancedMarker, APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import { dayColor } from "@/lib/itinerary/day-colors";
import type { Itinerary, Place } from "@/types/trip";

// A public browser key (restricted in Google Cloud to our websites and the
// Maps JavaScript API). NEXT_PUBLIC_ means Next.js puts it in browser code.
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
// Advanced markers need a Map ID. "DEMO_MAP_ID" is Google's ready-made one.
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

export type MapStop = {
  placeId: string;
  day: number;
  number: number; // position within the day: 1, 2, 3…
  name: string;
  position: google.maps.LatLngLiteral;
};

type Props = {
  itinerary: Itinerary;
  places: Place[];
  visibleDay: number | null; // null = all days
  selectedPlaceId: string | null;
  onSelect: (placeId: string) => void;
};

export default function TripMap({ itinerary, places, visibleDay, selectedPlaceId, onSelect }: Props) {
  const [loadFailed, setLoadFailed] = useState(false);

  // Google reports key problems (e.g. this website isn't allowed for the key)
  // by calling a global window.gm_authFailure function, not through the
  // loader's onError, so listen for it too.
  useEffect(() => {
    const w = window as Window & { gm_authFailure?: () => void };
    w.gm_authFailure = () => {
      console.error("[map] Google Maps rejected the browser key for this website");
      setLoadFailed(true);
    };
    return () => {
      delete w.gm_authFailure;
    };
  }, []);

  if (!API_KEY || loadFailed) {
    return (
      <div className="flex h-full min-h-64 items-center justify-center rounded-xl border border-dashed border-line-strong p-6 text-center text-sm text-ink-muted">
        The map isn&apos;t available right now. The itinerary and its Google
        Maps links still work.
      </div>
    );
  }

  const stops = toMapStops(itinerary, places).filter(
    (stop) => visibleDay === null || stop.day === visibleDay,
  );

  return (
    <APIProvider apiKey={API_KEY} onError={() => setLoadFailed(true)}>
      <Map
        mapId={MAP_ID}
        defaultCenter={stops[0]?.position ?? { lat: 0, lng: 0 }}
        defaultZoom={13}
        gestureHandling="cooperative" // on phones, one finger scrolls the page, two move the map
        disableDefaultUI
        zoomControl
        className="h-full min-h-64 w-full overflow-hidden rounded-xl bg-surface-muted"
      >
        {stops.map((stop) => {
          const selected = stop.placeId === selectedPlaceId;
          return (
            <AdvancedMarker
              key={stop.placeId}
              position={stop.position}
              title={`Day ${stop.day}, stop ${stop.number}: ${stop.name}`}
              onClick={() => onSelect(stop.placeId)}
              zIndex={selected ? 1000 : stop.number}
            >
              <div
                className={
                  "flex items-center justify-center rounded-full border-2 border-white font-semibold text-white shadow-md transition-transform " +
                  (selected ? "h-9 w-9 scale-110 text-sm ring-4 ring-black/30" : "h-7 w-7 text-xs")
                }
                style={{ backgroundColor: dayColor(stop.day) }}
              >
                {stop.number}
              </div>
            </AdvancedMarker>
          );
        })}
        <FitToStops stops={stops} />
        <PanToSelected stops={stops} selectedPlaceId={selectedPlaceId} />
      </Map>
    </APIProvider>
  );
}

// Zooms the map so every visible stop fits, whenever the set of stops changes.
function FitToStops({ stops }: { stops: MapStop[] }) {
  const map = useMap();
  const key = stops.map((s) => s.placeId).join(",");

  useEffect(() => {
    if (!map || stops.length === 0) return;
    if (stops.length === 1) {
      map.setCenter(stops[0].position);
      map.setZoom(15);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    for (const stop of stops) bounds.extend(stop.position);
    map.fitBounds(bounds, 40); // 40px padding around the edges
    // `key` changes only when the visible stops change, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);

  return null;
}

// Moves the map to the selected stop (e.g. after clicking it in the list).
function PanToSelected({ stops, selectedPlaceId }: { stops: MapStop[]; selectedPlaceId: string | null }) {
  const map = useMap();
  const selected = stops.find((s) => s.placeId === selectedPlaceId);
  // Depend on plain values, not the `selected` object: `stops` is rebuilt on
  // every render, so the object is always "new" and the map would keep
  // jumping back while the user drags it.
  const lat = selected?.position.lat;
  const lng = selected?.position.lng;

  useEffect(() => {
    if (map && lat !== undefined && lng !== undefined) map.panTo({ lat, lng });
  }, [map, selectedPlaceId, lat, lng]);

  return null;
}

// Joins itinerary stops with their real coordinates from Google's place data.
export function toMapStops(itinerary: Itinerary, places: Place[]): MapStop[] {
  const byId = new globalThis.Map(places.map((p) => [p.id, p]));
  return itinerary.days.flatMap((day) =>
    day.items.flatMap((item, index) => {
      const place = byId.get(item.placeId);
      if (!place) return [];
      return [
        {
          placeId: item.placeId,
          day: day.day,
          number: index + 1,
          name: item.placeName,
          position: place.location,
        },
      ];
    }),
  );
}
