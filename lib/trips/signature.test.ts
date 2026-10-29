import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { signPayload, verifyPayload } from "@/lib/trips/signature";

const payload = {
  request: {
    destination: "Lisbon",
    days: 1,
    budget: 100,
    currency: "EUR" as const,
    interests: ["Food & drink" as const],
    preferences: "",
  },
  plan: {
    destinationName: "Lisbon, Portugal",
    places: [
      {
        id: "place-1",
        name: "Time Out Market",
        address: "Lisboa",
        location: { lat: 38.7, lng: -9.1 },
        category: "restaurant" as const,
        primaryType: null,
        googleMapsUri: null,
      },
    ],
    itinerary: {
      destination: "Lisbon",
      currency: "EUR" as const,
      days: [
        {
          day: 1,
          theme: "Food",
          items: [
            {
              time: "12:00",
              placeId: "place-1",
              placeName: "Time Out Market",
              category: "restaurant" as const,
              reason: "Lunch.",
              durationMinutes: 60,
              estimatedCost: 20,
            },
          ],
        },
      ],
    },
  },
};

describe("plan signatures", () => {
  beforeEach(() => {
    process.env.TRIP_SIGNING_SECRET = "test-secret";
  });
  afterEach(() => {
    delete process.env.TRIP_SIGNING_SECRET;
  });

  it("accepts an unchanged plan", () => {
    const signature = signPayload(payload)!;
    expect(signature).toMatch(/^[0-9a-f]{64}$/);
    expect(verifyPayload(payload, signature)).toBe(true);
  });

  it("rejects a plan changed after signing", () => {
    const signature = signPayload(payload)!;
    const tampered = structuredClone(payload);
    tampered.plan.places[0].name = "Totally Real Restaurant";
    expect(verifyPayload(tampered, signature)).toBe(false);
  });

  it("rejects a changed budget", () => {
    const signature = signPayload(payload)!;
    expect(verifyPayload({ ...payload, request: { ...payload.request, budget: 1 } }, signature)).toBe(false);
  });

  it("rejects a signature made with a different secret", () => {
    const signature = signPayload(payload)!;
    process.env.TRIP_SIGNING_SECRET = "another-secret";
    expect(verifyPayload(payload, signature)).toBe(false);
  });

  it("ignores key order and extra fields (canonical form)", () => {
    const signature = signPayload(payload)!;
    const reordered = { plan: payload.plan, request: { ...payload.request, extra: "ignored" } };
    expect(verifyPayload(reordered, signature)).toBe(true);
  });

  it("disables signing when no secret is configured", () => {
    delete process.env.TRIP_SIGNING_SECRET;
    expect(signPayload(payload)).toBeNull();
    expect(verifyPayload(payload, "a".repeat(64))).toBe(false);
  });
});
