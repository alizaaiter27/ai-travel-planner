// One color per day, used by both the map markers and the itinerary so a
// marker's color tells you which day it belongs to. Repeats after 7 days.
// Each is dark enough for white numbers on top (at least 4.5:1 contrast).
const DAY_COLORS = ["#0369a1", "#be185d", "#15803d", "#b45309", "#7c3aed", "#b91c1c", "#0f766e"];

export function dayColor(day: number): string {
  return DAY_COLORS[(day - 1) % DAY_COLORS.length];
}
