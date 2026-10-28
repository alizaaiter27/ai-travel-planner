// Display helpers shared by several components.

// Intl.NumberFormat adds the right symbol and format, e.g. "€15" or "¥15".
export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCost(cost: number | null, currency: string): string {
  if (cost === null) return "No cost estimate";
  if (cost === 0) return "Usually free";
  return `~${formatMoney(cost, currency)} (estimate)`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
