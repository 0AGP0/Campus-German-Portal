import { describe, expect, it } from "vitest";
import { totalCoursePriceEur, weeklyRateEur } from "./coursePricing";

describe("coursePricing", () => {
  it("örnek dilimler: 2 hafta 380, 8 hafta 1200, 12 hafta 1560, 16 hafta 1920, 25 hafta 2750", () => {
    expect(weeklyRateEur(2)).toBe(190);
    expect(totalCoursePriceEur(2)).toBe(380);

    expect(weeklyRateEur(8)).toBe(150);
    expect(totalCoursePriceEur(8)).toBe(1200);

    expect(weeklyRateEur(12)).toBe(130);
    expect(totalCoursePriceEur(12)).toBe(1560);

    expect(weeklyRateEur(16)).toBe(120);
    expect(totalCoursePriceEur(16)).toBe(1920);

    expect(weeklyRateEur(25)).toBe(110);
    expect(totalCoursePriceEur(25)).toBe(2750);
  });

  it("dilim sınırları: 4 hafta 190, 5 hafta 150", () => {
    expect(weeklyRateEur(4)).toBe(190);
    expect(weeklyRateEur(5)).toBe(150);
  });
});
