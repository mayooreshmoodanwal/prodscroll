import { db } from "@productscroll/database";
import { aiService, computeContentHash } from "./ai.js";
import { generateRecommendationsForUser } from "./opportunity-engine.js";

export async function indexBuildDnaForPost(postId: string): Promise<boolean> {
  const post = await db.post.findUnique({
    where: { id: postId },
    include: {
      author: true,
      startup: true,
      product: true,
    },
  });

  if (
    !post ||
    post.draft ||
    post.removedAt ||
    post.author.suspended ||
    post.author.deactivatedAt ||
    post.author.privateAccount
  ) {
    return false;
  }

  const contentText = [
    post.caption,
    post.startup?.pitch ? `Startup: ${post.startup.name} - ${post.startup.pitch}` : "",
    post.product?.description ? `Product: ${post.product.name} - ${post.product.description}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const sourceHash = computeContentHash(contentText + post.tags.join(","));

  const existing = await db.buildDna.findFirst({
    where: { postId: post.id, sourceHash },
  });

  if (existing) {
    return false; // Content unchanged, cached
  }

  const { dna, model } = await aiService.extractBuildDna({
    text: contentText,
    title: post.startup?.name || post.product?.name || undefined,
    bio: post.author.bio || undefined,
    tags: post.tags,
  });

  await db.buildDna.create({
    data: {
      userId: post.authorId,
      postId: post.id,
      startupId: post.startupId,
      sourceType: "POST",
      sourceHash,
      projectDomains: dna.project_domains,
      technicalSkills: dna.technical_skills,
      technologies: dna.technologies,
      projectStage: dna.project_stage,
      skillsOffered: dna.skills_offered,
      skillsNeeded: dna.skills_needed,
      collaborationInterest: dna.collaboration_interest,
      currentBlockers: dna.current_blockers,
      interests: dna.interests,
      projectDescription: dna.project_description || post.caption.slice(0, 240),
      modelVersion: model,
      processingStatus: "READY",
    },
  });

  return true;
}

export async function indexAllEligibleContent(limit = 60): Promise<{
  indexedCount: number;
  skippedCount: number;
}> {
  console.log("[BuildDNA] Scanning eligible public posts for Build DNA extraction...");

  const eligiblePosts = await db.post.findMany({
    where: {
      draft: false,
      removedAt: null,
      author: {
        suspended: false,
        deactivatedAt: null,
        privateAccount: false,
      },
    },
    take: limit,
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  let indexedCount = 0;
  let skippedCount = 0;

  for (const p of eligiblePosts) {
    try {
      const updated = await indexBuildDnaForPost(p.id);
      if (updated) {
        indexedCount++;
      } else {
        skippedCount++;
      }
    } catch (err) {
      console.warn(`[BuildDNA] Skipping post ${p.id} due to extraction error:`, err);
    }
  }

  console.log(`[BuildDNA] Indexed ${indexedCount} new DNA records, skipped ${skippedCount} existing/cached.`);
  return { indexedCount, skippedCount };
}

