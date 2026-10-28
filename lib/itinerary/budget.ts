import type { Itinerary } from "@/types/trip";

// All budget math lives here, in plain code — never asked of the AI, which
// is unreliable at arithmetic. These are pure functions: same input, same
// output, no side effects, so they're easy to test.

export type DayCost = {
  day: number;
  estimatedTotal: number; // sum of known estimates for the day
  unknownCount: number; // stops with no estimate (null)
};

export type BudgetSummary = {
  days: DayCost[];
  estimatedTotal: number;
  unknownCount: number;
  budget: number;
  remaining: number; // negative = over budget
  usedPercent: number; // 0–100+, rounded
};

export function summarizeBudget(itinerary: Itinerary, budget: number): BudgetSummary {
  const days = itinerary.days.map((day) => {
    let estimatedTotal = 0;
    let unknownCount = 0;
    for (const item of day.items) {
      if (item.estimatedCost === null) unknownCount += 1;
      else estimatedTotal += item.estimatedCost;
    }
    return { day: day.day, estimatedTotal: roundMoney(estimatedTotal), unknownCount };
  });

  const estimatedTotal = roundMoney(days.reduce((sum, d) => sum + d.estimatedTotal, 0));
  const unknownCount = days.reduce((sum, d) => sum + d.unknownCount, 0);

  return {
    days,
    estimatedTotal,
    unknownCount,
    budget,
    remaining: roundMoney(budget - estimatedTotal),
    usedPercent: budget > 0 ? Math.round((estimatedTotal / budget) * 100) : 0,
  };
}

// Computers store decimals in binary, so 0.1 + 0.2 = 0.30000000000000004.
// Rounding to cents after each sum keeps money values clean.
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
