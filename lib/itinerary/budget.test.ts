import { describe, expect, it } from "vitest";
import { roundMoney, summarizeBudget } from "@/lib/itinerary/budget";
import type { Itinerary, ItineraryItem } from "@/types/trip";

// Builds a stop with only the cost varying; other fields don't affect the math.
function stop(estimatedCost: number | null, placeId: string): ItineraryItem {
  return {
    time: "09:00",
    placeId,
    placeName: placeId,
    category: "attraction",
    reason: "test",
    durationMinutes: 60,
    estimatedCost,
  };
}

function itinerary(days: (number | null)[][]): Itinerary {
  return {
    destination: "Testville",
    currency: "EUR",
    days: days.map((costs, i) => ({
      day: i + 1,
      theme: "test",
      items: costs.map((cost, j) => stop(cost, `p${i}-${j}`)),
    })),
  };
}

describe("summarizeBudget", () => {
  it("adds costs per day and for the whole trip", () => {
    const summary = summarizeBudget(itinerary([[10, 25], [5, 0, 30]]), 200);
    expect(summary.days.map((d) => d.estimatedTotal)).toEqual([35, 35]);
    expect(summary.estimatedTotal).toBe(70);
    expect(summary.remaining).toBe(130);
    expect(summary.usedPercent).toBe(35);
  });

  it("skips unknown costs but counts them", () => {
    const summary = summarizeBudget(itinerary([[null, 20], [null, null]]), 100);
    expect(summary.days).toEqual([
      { day: 1, estimatedTotal: 20, unknownCount: 1 },
      { day: 2, estimatedTotal: 0, unknownCount: 2 },
    ]);
    expect(summary.unknownCount).toBe(3);
    expect(summary.estimatedTotal).toBe(20);
  });

  it("reports a negative remaining amount when over budget", () => {
    const summary = summarizeBudget(itinerary([[80, 50]]), 100);
    expect(summary.remaining).toBe(-30);
    expect(summary.usedPercent).toBe(130);
  });

  it("avoids floating-point noise in money", () => {
    // 0.1 + 0.2 is 0.30000000000000004 in plain JavaScript.
    const summary = summarizeBudget(itinerary([[0.1, 0.2]]), 1);
    expect(summary.estimatedTotal).toBe(0.3);
    expect(summary.remaining).toBe(0.7);
  });

  it("handles a zero budget without dividing by zero", () => {
    expect(summarizeBudget(itinerary([[10]]), 0).usedPercent).toBe(0);
  });
});

describe("roundMoney", () => {
  it("rounds to cents", () => {
    expect(roundMoney(12.345)).toBe(12.35);
    expect(roundMoney(-3.333)).toBe(-3.33);
  });
});
