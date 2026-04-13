import { describe, expect, it } from "vitest";

import { leadFromInboundPayload } from "./inboundLead";

describe("leadFromInboundPayload", () => {
  it("booking formdan isim ve formData üretir", () => {
    const lead = leadFromInboundPayload({
      formType: "booking",
      source: "Test",
      formData: {
        firstName: "Ali",
        lastName: "Veli",
        email: "a@v.com",
        program: "A1",
        formDate: "2026-01-01",
      },
    });
    expect(lead.name).toBe("Ali Veli");
    expect(lead.formType).toBe("booking");
    expect(lead.tags).toEqual([]);
  });
});
