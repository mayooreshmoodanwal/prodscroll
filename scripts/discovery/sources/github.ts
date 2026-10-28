import type { NormalizedCandidate } from "../types.js";
import { inspectUrl } from "./inspector.js";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  stargazers_count: number;
  language: string | null;
  topics?: string[];
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
    type: string;
  };
  license?: {
    spdx_id: string;
    name: string;
  } | null;
}

function inferCategoryFromRepo(r: GitHubRepo): { category: string; tags: string[] } {
  const content = `${r.name} ${r.description || ""} ${(r.topics || []).join(" ")}`.toLowerCase();
  const tags: string[] = ["Open Source"];

  if (r.language) tags.push(r.language);

  let category = "Developer Tools";

  if (content.includes("ai") || content.includes("llm") || content.includes("agent") || content.includes("vision")) {
    category = "AI";
    tags.push("AI", "Machine Learning");
  } else if (content.includes("security") || content.includes("auth") || content.includes("encrypt") || content.includes("vpn")) {
    category = "Cybersecurity";
    tags.push("Cybersecurity");
  } else if (content.includes("design") || content.includes("ui") || content.includes("canvas") || content.includes("svg")) {
    category = "Design";
    tags.push("Design");
  } else if (content.includes("database") || content.includes("storage") || content.includes("cache") || content.includes("sql")) {
    category = "Developer Tools";
    tags.push("Database", "Infrastructure");
  } else if (content.includes("note") || content.includes("todo") || content.includes("editor") || content.includes("terminal")) {
    category = "Productivity";
    tags.push("Productivity");
  }

  return { category, tags: Array.from(new Set(tags)).slice(0, 4) };
}

export async function fetchGitHubCandidates(limit = 25): Promise<NormalizedCandidate[]> {
  const candidates: NormalizedCandidate[] = [];
  try {
    const queries = [
      "stars:>500 archived:false topic:developer-tools",
      "stars:>300 archived:false topic:productivity",
      "stars:>300 archived:false topic:cli",
      "stars:>400 archived:false topic:open-source",
    ];

    console.log(`[Discovery] Querying GitHub API for active repositories...`);

    for (const q of queries) {
      if (candidates.length >= limit) break;

      const params = new URLSearchParams({
        q,
        sort: "updated",
        order: "desc",
        per_page: "10",
      });

      const res = await fetch(`https://api.github.com/search/repositories?${params.toString()}`, {
        headers: {
          "User-Agent": "Prodgram-Discovery/1.0",
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!res.ok) {
        console.warn(`[Discovery] GitHub query '${q}' returned ${res.status}`);
        continue;
      }

      const data = await res.json();
      const items: GitHubRepo[] = data.items || [];

      for (const item of items) {
        if (candidates.length >= limit) break;
        if (!item.description || item.description.length < 15) continue;

        const canonicalUrl = item.homepage && item.homepage.startsWith("http") ? item.homepage : item.html_url;

        // Inspect website/homepage if exists
        const inspected = await inspectUrl(canonicalUrl);

        const { category, tags } = inferCategoryFromRepo(item);

        const productName = item.name
          .split(/[-_]/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

        const pitch = (item.description || `${productName} open source project`).slice(0, 160);
        const description = inspected.description || item.description || `${productName} is an active, open-source product built for modern developers.`;

        const founderName = item.owner.type === "User" ? item.owner.login : "Open Source Maintainers";

        candidates.push({
          source: "github",
          sourceId: String(item.id),
          sourceUrl: item.html_url,
          productName,
          companyName: item.owner.login,
          canonicalUrl,
          pitch,
          description: description.slice(0, 1000),
          category,
          tags,
          founderName,
          founderSource: item.owner.html_url,
          founderEmail: inspected.contactEmail || null,
          founderEmailSource: inspected.contactEmail ? canonicalUrl : null,
          founderLinkedIn: inspected.linkedinUrl || null,
          logoUrl: item.owner.avatar_url || inspected.favicon || null,
          imageUrl: inspected.ogImage || null,
          videoUrl: inspected.ogVideo || null,
          demoUrl: item.homepage && item.homepage.startsWith("http") ? item.homepage : null,
          repoUrl: item.html_url,
          docsUrl: inspected.docsUrl || `${item.html_url}#readme`,
          careersUrl: inspected.careersUrl || null,
          pricingUrl: inspected.pricingUrl || null,
          downloadUrl: `${item.html_url}/releases`,
          waitlistUrl: null,
          jobVacancy: null,
          rawMetadata: {
            stars: item.stargazers_count,
            language: item.language,
            license: item.license?.spdx_id,
            owner: item.owner.login,
          },
          discoveredAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error("[Discovery] Error fetching GitHub candidates:", error);
  }

  return candidates;
}
