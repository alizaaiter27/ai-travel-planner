import { useSyncExternalStore } from "react";
import { z } from "zod";

// A list of trips saved from THIS browser, kept in localStorage so the home
// page can show "Your saved trips". It's only a convenience: the trips
// themselves live in the database, and the link is what really matters.

const STORAGE_KEY = "savedTrips";
const CHANGE_EVENT = "saved-trips-change";
const MAX_ITEMS = 20;

const savedTripRefSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  savedAt: z.string(),
});
export type SavedTripRef = z.infer<typeof savedTripRefSchema>;

const EMPTY: SavedTripRef[] = [];

// localStorage can throw (private mode, blocked storage), so every access is
// wrapped, and data read back is validated like any outside input.
function read(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

let cachedRaw: string | null = null;
let cachedList: SavedTripRef[] = EMPTY;

function getSnapshot(): SavedTripRef[] {
  const raw = read();
  // Return the same array until the stored text changes; React compares
  // snapshots with ===, and a new array every time would loop forever.
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    let parsed: unknown = null;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      // Corrupted storage: treat as empty.
    }
    const result = z.array(savedTripRefSchema).safeParse(parsed);
    cachedList = result.success ? result.data : EMPTY;
  }
  return cachedList;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange); // changes from other tabs
  window.addEventListener(CHANGE_EVENT, onChange); // changes from this tab
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

// On the server there's no localStorage, so the list starts empty and fills
// in after the page loads in the browser (no hydration mismatch).
export function useSavedTrips(): SavedTripRef[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

export function rememberSavedTrip(trip: SavedTripRef): void {
  const next = [trip, ...getSnapshot().filter((t) => t.id !== trip.id)].slice(0, MAX_ITEMS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Storage unavailable: the trip is still saved; only the local list is skipped.
  }
}

export function forgetSavedTrip(id: string): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(getSnapshot().filter((t) => t.id !== id)),
    );
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // ignore
  }
}
