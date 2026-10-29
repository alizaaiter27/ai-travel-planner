import { describe, expect, it } from "vitest";
import { shortAddress } from "@/lib/format";

describe("shortAddress", () => {
  it("keeps the street and number", () => {
    expect(
      shortAddress("Carrer de Montcada, 15-23, Ciutat Vella, 08003 Barcelona, Spain"),
    ).toBe("Carrer de Montcada, 15-23");
  });

  it("leaves short addresses unchanged", () => {
    expect(shortAddress("Praça do Comércio")).toBe("Praça do Comércio");
  });
});
