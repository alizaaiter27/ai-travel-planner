// Choices offered in the trip form. Kept in one place so the form and
// (later) the server-side validation use exactly the same lists.

export const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AED", "CAD", "AUD"] as const;

export const INTERESTS = [
  "Culture & history",
  "Food & drink",
  "Nature & outdoors",
  "Art & museums",
  "Nightlife",
  "Shopping",
  "Family-friendly",
  "Relaxation",
] as const;

export const MIN_DAYS = 1;
export const MAX_DAYS = 14;
export const MAX_PREFERENCES_LENGTH = 500;
