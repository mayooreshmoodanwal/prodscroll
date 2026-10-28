import type {
  NormalizedCandidate,
  CandidateScore,
  ProductAction,
} from "./types.js";

export function scoreCandidate(c: NormalizedCandidate): CandidateScore {
  let authenticity = 0;
  let clarity = 0;
  let workingProduct = 0;
  let completeness = 0;
  let mediaQuality = 0;
  let freshness = 0;

  let rejectionReason: string | null = null;

  // Mandatory checks:
  if (!c.productName || c.productName.length < 2) {
    rejectionReason = "Missing or unidentifiable product name";
  }
  if (!c.canonicalUrl || !/^https?:\/\//i.test(c.canonicalUrl)) {
    rejectionReason = "Invalid or missing canonical URL";
  }
  if (!c.description || c.description.length < 20) {
    rejectionReason = "Description too short or uninformative";
  }

  // 1. Authenticity & official-source verification (Max 25 pts)
  if (c.canonicalUrl && !c.canonicalUrl.includes("example.com")) {
    authenticity += 10;
  }
  if (c.source === "hackernews" || c.source === "github") {
    authenticity += 5;
  }
  if (c.repoUrl || c.docsUrl) {
    authenticity += 5;
  }
  if (c.founderName) {
    authenticity += 5;
  }

  // 2. Clarity and usefulness (Max 20 pts)
  if (c.pitch && c.pitch.length >= 10 && c.pitch.length <= 160) {
    clarity += 10;
  }
  if (c.description && c.description.length >= 50) {
    clarity += 5;
  }
  if (c.category && c.tags && c.tags.length >= 2) {
    clarity += 5;
  }

  // 3. Working product, credible demonstration, or repository (Max 15 pts)
  if (c.repoUrl) {
    workingProduct += 8;
  }
  if (c.demoUrl || c.canonicalUrl) {
    workingProduct += 7;
  }

  // 4. Completeness of verifiable product information (Max 15 pts)
  if (c.logoUrl || c.imageUrl) {
    completeness += 5;
  }
  if (c.docsUrl || c.pricingUrl || c.careersUrl || c.waitlistUrl) {
    completeness += 5;
  }
  if (c.companyName) {
    completeness += 5;
  }

  // 5. Quality of official media (Max 15 pts)
  if (c.videoUrl) {
    mediaQuality += 15;
  } else if (c.imageUrl) {
    mediaQuality += 10;
  } else {
    // Has logo or valid overview layout
    mediaQuality += 8;
  }

  // 6. Freshness and audience relevance (Max 10 pts)
  freshness = 10; // Active recent discoveries

  const totalScore = Math.min(
    100,
    authenticity +
      clarity +
      workingProduct +
      completeness +
      mediaQuality +
      freshness,
  );

  const passed = !rejectionReason && totalScore >= 75;

  // Determine top 2-3 relevant right-swipe actions
  const selectedActions: ProductAction[] = [];

  if (c.demoUrl && selectedActions.length < 3) {
    selectedActions.push({
      type: "demo",
      label: "Watch Demo",
      url: c.demoUrl,
    });
  }

  if (c.repoUrl && selectedActions.length < 3) {
    selectedActions.push({
      type: "github",
      label: "Explore GitHub",
      url: c.repoUrl,
    });
  }

  if (c.waitlistUrl && selectedActions.length < 3) {
    selectedActions.push({
      type: "waitlist",
      label: "Join Waitlist",
      url: c.waitlistUrl,
    });
  } else if (c.canonicalUrl && selectedActions.length < 3) {
    selectedActions.push({
      type: "try_product",
      label: "Try Product",
      url: c.canonicalUrl,
    });
  }

  if (c.docsUrl && selectedActions.length < 3) {
    selectedActions.push({
      type: "documentation",
      label: "Documentation",
      url: c.docsUrl,
    });
  }

  if (c.pricingUrl && selectedActions.length < 3) {
    selectedActions.push({
      type: "pricing",
      label: "View Pricing",
      url: c.pricingUrl,
    });
  }

  if (c.downloadUrl && selectedActions.length < 3) {
    selectedActions.push({
      type: "download",
      label: "Download",
      url: c.downloadUrl,
    });
  }

  if (c.jobVacancy?.applyUrl && selectedActions.length < 3) {
    selectedActions.push({
      type: c.jobVacancy.type === "internship" ? "internship" : "careers",
      label:
        c.jobVacancy.type === "internship"
          ? "Apply for Internship"
          : "Apply for Job",
      url: c.jobVacancy.applyUrl,
    });
  } else if (c.careersUrl && selectedActions.length < 3) {
    selectedActions.push({
      type: "careers",
      label: "View Careers",
      url: c.careersUrl,
    });
  }

  // Fallback to Visit Website if fewer than 2 actions
  if (selectedActions.length === 0 && c.canonicalUrl) {
    selectedActions.push({
      type: "website",
      label: "Visit Website",
      url: c.canonicalUrl,
    });
  }

  return {
    score: totalScore,
    breakdown: {
      authenticity,
      clarity,
      workingProduct,
      completeness,
      mediaQuality,
      freshness,
    },
    passed,
    rejectionReason: passed ? null : rejectionReason || "Quality score below 75",
    selectedActions: selectedActions.slice(0, 3),
  };
}
