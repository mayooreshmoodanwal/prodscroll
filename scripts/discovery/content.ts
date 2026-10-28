import type { NormalizedCandidate } from "./types.js";

export function generatePostCaption(candidate: NormalizedCandidate): string {
  const parts: string[] = [];

  // Authentic product pitch
  if (candidate.pitch) {
    parts.push(candidate.pitch);
  }

  // Authentic product overview
  if (candidate.description && candidate.description !== candidate.pitch) {
    const cleanDesc = candidate.description.replace(/\r?\n+/g, " ").trim();
    parts.push(cleanDesc.slice(0, 320) + (cleanDesc.length > 320 ? "…" : ""));
  }

  // Destination link
  if (candidate.canonicalUrl) {
    parts.push(`Official link: ${candidate.canonicalUrl}`);
  }

  return parts.join("\n\n");
}

export function generateReelCaption(candidate: NormalizedCandidate): string {
  if (candidate.pitch && candidate.pitch.length > 20) {
    return candidate.pitch;
  }
  return `${candidate.productName} — ${candidate.description ? candidate.description.slice(0, 140) : "Open source product built for modern developers."}`;
}
