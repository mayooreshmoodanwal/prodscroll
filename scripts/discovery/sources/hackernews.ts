import type { NormalizedCandidate } from "../types.js";
import { inspectUrl } from "./inspector.js";

interface HNItem {
  id: number;
  by?: string;
  score?: number;
  time?: number;
  title?: string;
  text?: string;
  url?: string;
  type?: string;
}

function cleanTitle(title: string): { name: string; pitch: string } {
  let cleaned = title.replace(/^Show HN:\s*/i, "").trim();
  // Handle separators like " - ", " – ", " — ", ": "
  const splitParts = cleaned.split(/\s*[-–—:]\s*/);
  if (splitParts.length > 1 && splitParts[0].length <= 35) {
    const name = splitParts[0].trim();
    const pitch = splitParts.slice(1).join(" - ").trim();
    return { name, pitch: pitch || name };
  }
  // If no clear separator, take first 2-3 words as name if reasonable
  const words = cleaned.split(" ");
  if (words.length <= 4) {
    return { name: cleaned, pitch: cleaned };
  }
  const name = words.slice(0, 2).join(" ");
  return { name, pitch: cleaned };
}

function inferCategory(title: string, text: string, url: string): { category: string; tags: string[] } {
  const content = `${title} ${text} ${url}`.toLowerCase();
  const tags: string[] = [];

  let category = "Developer Tools";

  if (content.includes("ai") || content.includes("llm") || content.includes("agent") || content.includes("gpt")) {
    category = "AI";
    tags.push("AI", "Machine Learning");
  } else if (content.includes("design") || content.includes("figma") || content.includes("css") || content.includes("ui")) {
    category = "Design";
    tags.push("Design", "Creative");
  } else if (content.includes("database") || content.includes("postgres") || content.includes("infra") || content.includes("docker") || content.includes("cloud")) {
    category = "Developer Tools";
    tags.push("Developer Tools", "Infrastructure");
  } else if (content.includes("security") || content.includes("privacy") || content.includes("auth") || content.includes("encrypt")) {
    category = "Cybersecurity";
    tags.push("Cybersecurity", "Privacy");
  } else if (content.includes("productivity") || content.includes("note") || content.includes("task") || content.includes("calendar")) {
    category = "Productivity";
    tags.push("Productivity", "Workflow");
  } else if (content.includes("education") || content.includes("learn") || content.includes("student")) {
    category = "Education";
    tags.push("Education", "Learning");
  } else if (content.includes("finance") || content.includes("payment") || content.includes("crypto") || content.includes("bill")) {
    category = "Fintech";
    tags.push("Fintech", "Finance");
  } else {
    category = "Developer Tools";
    tags.push("Developer Tools", "Open Source");
  }

  if (content.includes("open-source") || content.includes("open source") || url.includes("github.com")) {
    tags.push("Open Source");
  }

  return { category, tags: Array.from(new Set(tags)).slice(0, 4) };
}

export async function fetchHackerNewsCandidates(limit = 40): Promise<NormalizedCandidate[]> {
  const candidates: NormalizedCandidate[] = [];
  try {
    const listRes = await fetch("https://hacker-news.firebaseio.com/v0/showstories.json");
    if (!listRes.ok) return candidates;

    const ids: number[] = await listRes.json();
    const targetIds = ids.slice(0, limit);

    console.log(`[Discovery] Fetching ${targetIds.length} Show HN candidates...`);

    for (const id of targetIds) {
      try {
        const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        if (!itemRes.ok) continue;

        const item: HNItem = await itemRes.json();
        if (!item || !item.title || !item.url) continue;

        const { name, pitch } = cleanTitle(item.title);
        const canonicalUrl = item.url;
        const sourceUrl = `https://news.ycombinator.com/item?id=${id}`;

        // Verify page accessibility & extract metadata
        const inspected = await inspectUrl(canonicalUrl);
        if (!inspected.isReachable) continue;

        const { category, tags } = inferCategory(item.title, item.text || "", canonicalUrl);

        const description = inspected.description || pitch || item.text?.slice(0, 300) || `${name} — modern software discovered on Hacker News.`;

        // Founder name extraction from HN author or page
        const founderName = item.by ? item.by : "Tech Founder";

        candidates.push({
          source: "hackernews",
          sourceId: String(id),
          sourceUrl,
          productName: name,
          companyName: name,
          canonicalUrl,
          pitch: pitch.slice(0, 160),
          description: description.slice(0, 1000),
          category,
          tags,
          founderName,
          founderSource: sourceUrl,
          founderEmail: inspected.contactEmail || null,
          founderEmailSource: inspected.contactEmail ? canonicalUrl : null,
          founderLinkedIn: inspected.linkedinUrl || null,
          logoUrl: inspected.favicon || null,
          imageUrl: inspected.ogImage || null,
          videoUrl: inspected.ogVideo || null,
          demoUrl: inspected.demoUrl || canonicalUrl,
          repoUrl: inspected.repoUrl || (canonicalUrl.includes("github.com") ? canonicalUrl : null),
          docsUrl: inspected.docsUrl || null,
          careersUrl: inspected.careersUrl || null,
          pricingUrl: inspected.pricingUrl || null,
          downloadUrl: null,
          waitlistUrl: canonicalUrl.includes("waitlist") ? canonicalUrl : null,
          jobVacancy: null,
          rawMetadata: {
            hnScore: item.score || 0,
            hnTime: item.time,
            hnUser: item.by,
          },
          discoveredAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn(`[Discovery] Error inspecting HN item ${id}:`, err);
      }
    }
  } catch (error) {
    console.error("[Discovery] Error fetching Hacker News stories:", error);
  }

  return candidates;
}
