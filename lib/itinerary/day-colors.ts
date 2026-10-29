// One color per day, used by both the map markers and the itinerary so a
// marker's color tells you which day it belongs to. Repeats after 7 days.
const DAY_COLORS = ["#0284c7", "#db2777", "#16a34a", "#d97706", "#7c3aed", "#dc2626", "#0d9488"];

export function dayColor(day: number): string {
  return DAY_COLORS[(day - 1) % DAY_COLORS.length];
}
