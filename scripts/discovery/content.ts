import type { NormalizedCandidate } from "./types.js";

export function generatePostCaption(candidate: NormalizedCandidate): string {
  const parts: string[] = [];

  // Opening sentence with clear product identity
  parts.push(`🔍 Discovered by Prodgram: ${candidate.productName}`);

  // What it is and the problem it solves
  if (candidate.pitch && candidate.pitch.toLowerCase() !== candidate.productName.toLowerCase()) {
    parts.push(candidate.pitch);
  }

  // Core verified capability & audience
  if (candidate.description && candidate.description.length > candidate.pitch.length + 10) {
    const cleanDesc = candidate.description.replace(/\r?\n+/g, " ").trim();
    parts.push(cleanDesc.slice(0, 240) + (cleanDesc.length > 240 ? "…" : ""));
  }

  // Canonical destination
  parts.push(`Official link: ${candidate.canonicalUrl}`);

  // Provenance statement
  parts.push(`(Discovered via ${candidate.source === "hackernews" ? "Hacker News Show HN" : candidate.source === "github" ? "GitHub Open Source" : "Official Product Launch"})`);

  return parts.join("\n\n");
}

export function generateReelCaption(candidate: NormalizedCandidate): string {
  // Shorter, punchy caption for reel display
  const pitch = candidate.pitch || `${candidate.productName} in ${candidate.category}`;
  return `🔍 Discovered by Prodgram · ${candidate.productName}: ${pitch}. Swipe right or tap below to explore demo, docs, and direct links.`;
}
