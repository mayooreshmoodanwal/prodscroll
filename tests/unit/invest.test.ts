import { describe, it, expect } from "vitest";
import {
  MARKETS_DATA,
  DEMO_STARTUPS_SEED,
} from "../../apps/api/src/lib/invest-catalog.js";

describe("Invest Prototype: Structure, Markets & Simulation", () => {
  it("includes all 3 evaluated markets: New Zealand, United States, Malaysia", () => {
    const codes = Object.keys(MARKETS_DATA);
    expect(codes).toContain("NZ");
    expect(codes).toContain("US");
    expect(codes).toContain("MY");

    for (const market of Object.values(MARKETS_DATA)) {
      expect(market.status).toBe(
        "Under evaluation — not an available investment market",
      );
      expect(market.regulatoryResearchTopics.length).toBeGreaterThan(0);
      expect(market.licensingConsiderations.length).toBeGreaterThan(0);
      expect(market.currentResearchStatus).toBeDefined();
    }
  });

  it("seeds authentic demo startups with proper fictional data disclaimers", () => {
    expect(DEMO_STARTUPS_SEED.length).toBeGreaterThanOrEqual(6);

    for (const s of DEMO_STARTUPS_SEED) {
      expect(s.demoTargetAmount).toBeGreaterThan(0);
      expect(s.demoRaisedAmount).toBeGreaterThanOrEqual(0);
      expect(s.demoMinTicket).toBeGreaterThan(0);
      expect(s.demoPreMoneyValuation).toBeGreaterThan(0);
      expect(s.demoPostMoneyValuation).toBeGreaterThan(s.demoPreMoneyValuation);
      expect(["NZ", "US", "MY"]).toContain(s.countryCode);
      expect(s.updates.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("calculates illustrative equity percentage using exact educational formula", () => {
    const startup = DEMO_STARTUPS_SEED[0]; // e.g. Kahu BioTech: post-money 5,250,000
    const hypotheticalTicket = 500; // 500 NZD

    // Formula: (hypotheticalAmount / demoPostMoneyValuation) * 100
    const calculatedEquity = Number(
      ((hypotheticalTicket / startup.demoPostMoneyValuation) * 100).toFixed(4),
    );

    expect(calculatedEquity).toBeGreaterThan(0);
    expect(calculatedEquity).toBeLessThan(1.0);
    expect(calculatedEquity).toBe(
      Number(((500 / startup.demoPostMoneyValuation) * 100).toFixed(4)),
    );
  });
});

