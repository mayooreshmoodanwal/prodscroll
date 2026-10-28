import { describe, it, expect } from "vitest";
import { scoreCandidate } from "../../scripts/discovery/scorer.js";
import {
  generateTempPassword,
  hashPassword,
  generateOutreachDraft,
} from "../../scripts/discovery/identity.js";
import type { NormalizedCandidate } from "../../scripts/discovery/types.js";

const baseCandidate: NormalizedCandidate = {
  source: "hackernews",
  sourceId: "hn-123",
  sourceUrl: "https://news.ycombinator.com/item?id=123",
  productName: "VectorPulse",
  companyName: "VectorPulse AI",
  canonicalUrl: "https://vectorpulse.dev",
  pitch: "Real-time vector index visualization and debugging toolkit",
  description: "VectorPulse is a developer tool for introspecting and visualizing high-dimensional embeddings and index clustering in production databases.",
  category: "Developer Tools",
  tags: ["Developer Tools", "AI", "Database"],
  founderName: "Alex Mercer",
  founderSource: "https://news.ycombinator.com/item?id=123",
  founderEmail: "alex@vectorpulse.dev",
  founderEmailSource: "https://vectorpulse.dev",
  founderLinkedIn: "https://linkedin.com/in/alexmercer-dev",
  logoUrl: "https://vectorpulse.dev/logo.png",
  imageUrl: "https://vectorpulse.dev/og.png",
  videoUrl: null,
  demoUrl: "https://vectorpulse.dev/demo",
  repoUrl: "https://github.com/vectorpulse/vectorpulse",
  docsUrl: "https://vectorpulse.dev/docs",
  careersUrl: "https://vectorpulse.dev/careers",
  pricingUrl: "https://vectorpulse.dev/pricing",
  downloadUrl: null,
  waitlistUrl: null,
  jobVacancy: null,
  rawMetadata: {},
  discoveredAt: new Date().toISOString(),
};

describe("Discovery Engine & Scoring", () => {
  it("scores verified, high-quality candidates above 75 threshold", () => {
    const scored = scoreCandidate(baseCandidate);
    expect(scored.score).toBeGreaterThanOrEqual(75);
    expect(scored.passed).toBe(true);
    expect(scored.rejectionReason).toBeNull();
  });

  it("rejects candidates with invalid canonical URLs", () => {
    const invalid = { ...baseCandidate, canonicalUrl: "not-a-valid-url" };
    const scored = scoreCandidate(invalid);
    expect(scored.passed).toBe(false);
    expect(scored.rejectionReason).toContain("canonical URL");
  });

  it("rejects candidates with uninformative or missing descriptions", () => {
    const emptyDesc = { ...baseCandidate, description: "Too short" };
    const scored = scoreCandidate(emptyDesc);
    expect(scored.passed).toBe(false);
  });

  it("selects top 2-3 relevant right-swipe actions per product", () => {
    const scored = scoreCandidate(baseCandidate);
    expect(scored.selectedActions.length).toBeGreaterThanOrEqual(2);
    expect(scored.selectedActions.length).toBeLessThanOrEqual(3);

    const types = scored.selectedActions.map((a) => a.type);
    expect(types).toContain("demo");
    expect(types).toContain("github");
  });
});

describe("Founder Identity & Security", () => {
  it("generates cryptographically strong temporary passwords of at least 18 characters", () => {
    const p1 = generateTempPassword();
    const p2 = generateTempPassword();
    expect(p1.length).toBeGreaterThanOrEqual(18);
    expect(p1).not.toBe(p2);
  });

  it("hashes passwords securely with scrypt salt format", async () => {
    const password = generateTempPassword();
    const hash = await hashPassword(password);
    expect(hash.startsWith("scrypt:")).toBe(true);
    const parts = hash.split(":");
    expect(parts.length).toBe(3);
    expect(parts[1].length).toBe(32); // 16 bytes hex salt
    expect(parts[2].length).toBe(128); // 64 bytes hex key
  });

  it("generates transparent personalized outreach drafts without false claims", () => {
    const draft = generateOutreachDraft({
      founderName: "Alex Mercer",
      productName: "VectorPulse",
      companyName: "VectorPulse AI",
      username: "alexmercer",
      productSlug: "vectorpulse",
      inviteToken: "inv_12345",
      verifiedEmail: "alex@vectorpulse.dev",
    });

    expect(draft).toContain("Discovered by Prodgram");
    expect(draft).toContain("unclaimed");
    expect(draft).toContain("@alexmercer");
    expect(draft).toContain("https://prodscroll-mayooreshmoodanwals-projects.vercel.app/product/vectorpulse");
    expect(draft).not.toContain("welcome to the team");
  });
});
