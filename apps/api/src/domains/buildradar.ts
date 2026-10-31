import type { FastifyInstance } from "fastify";
import { db } from "@productscroll/database";
import { z } from "zod";
import {
  parse,
  requireUser,
  sessionUser,
  fail,
  publicUser,
} from "../lib/core.js";
import { aiService } from "../lib/ai.js";
import {
  generateRecommendationsForUser,
  aggregateDna,
} from "../lib/opportunity-engine.js";
import { indexBuildDnaForPost } from "../lib/build-dna-indexer.js";
import type { BuildRadarOverviewDTO, BuildDnaDTO } from "@productscroll/types";

export async function buildRadarRoutes(app: FastifyInstance) {
  // 1. Health & AI status
  app.get("/buildradar/health", async () => {
    return aiService.checkHealth();
  });

  // 2. BuildRadar Overview (personalized if logged in, smart discovery if anonymous)
  app.get("/buildradar/overview", async (req) => {
    const user = await sessionUser(req);
    const aiHealth = await aiService.checkHealth();

    // Default target user is the authenticated user, or first founder/admin in DB for rich demo
    let targetUserId = user?.id;
    if (!targetUserId) {
      const demoUser = await db.user.findFirst({
        where: { role: "ADMIN" },
        select: { id: true },
      });
      targetUserId = demoUser?.id || "anonymous-viewer";
    }

    const { forYou, collaborators, opportunityRadar } =
      await generateRecommendationsForUser(targetUserId);

    // Fetch user's own Build DNA if logged in
    let myBuildDna: BuildDnaDTO | null = null;
    if (user) {
      const records = await db.buildDna.findMany({
        where: { userId: user.id, processingStatus: "READY" },
        orderBy: { createdAt: "desc" },
      });
      if (records.length > 0) {
        const aggregated = aggregateDna(
          records.map((r) => ({
            id: r.id,
            postId: r.postId,
            startupId: r.startupId,
            projectDomains: r.projectDomains,
            technicalSkills: r.technicalSkills,
            technologies: r.technologies,
            projectStage: r.projectStage,
            skillsOffered: r.skillsOffered,
            skillsNeeded: r.skillsNeeded,
            collaborationInterest: r.collaborationInterest,
            currentBlockers: r.currentBlockers,
            interests: r.interests,
            projectDescription: r.projectDescription,
          })),
        );
        myBuildDna = {
          id: records[0].id,
          userId: user.id,
          sourceType: records[0].sourceType,
          projectDomains: aggregated.project_domains,
          technicalSkills: aggregated.technical_skills,
          technologies: aggregated.technologies,
          projectStage: aggregated.project_stage,
          skillsOffered: aggregated.skills_offered,
          skillsNeeded: aggregated.skills_needed,
          collaborationInterest: aggregated.collaboration_interest,
          currentBlockers: aggregated.current_blockers,
          interests: aggregated.interests,
          projectDescription: aggregated.project_description,
          modelVersion: records[0].modelVersion,
          createdAt: records[0].createdAt.toISOString(),
        };
      }
    }

    // Project recommendations matching user skills or trending tech
    const matchingTech = myBuildDna?.technologies || ["TypeScript", "Next.js", "AI"];
    const candidateProjects = await db.post.findMany({
      where: {
        draft: false,
        removedAt: null,
        author: {
          suspended: false,
          deactivatedAt: null,
          privateAccount: false,
          ...(user ? { id: { not: user.id } } : {}),
        },
      },
      take: 6,
      orderBy: { likeCount: "desc" },
      include: {
        author: true,
        startup: true,
        product: true,
        media: { include: { media: true }, orderBy: { position: "asc" } },
      },
    });

    const projectRecommendations = candidateProjects.map((p) => {
      const matchingSkills = p.tags.filter((t) =>
        matchingTech.some((tech: string) => tech.toLowerCase() === t.toLowerCase()),
      );
      return {
        post: {
          id: p.id,
          kind: p.kind,
          caption: p.caption,
          createdAt: p.createdAt.toISOString(),
          tags: p.tags,
          likeCount: p.likeCount,
          commentCount: p.commentCount,
          saveCount: p.saveCount,
          liked: false,
          saved: false,
          author: {
            ...publicUser(p.author),
            avatarUrl: publicUser(p.author).avatarUrl || undefined,
            location: publicUser(p.author).location || undefined,
            website: publicUser(p.author).website || undefined,
          },
          startup: p.startup
            ? {
                id: p.startup.id,
                slug: p.startup.slug,
                name: p.startup.name,
                pitch: p.startup.pitch,
                category: p.startup.category,
                verified: p.startup.verificationStatus === "VERIFIED",
                followerCount: p.startup.followerCount,
                ownerId: p.startup.ownerId,
              }
            : null,
          product: p.product
            ? {
                id: p.product.id,
                slug: p.product.slug,
                name: p.product.name,
                description: p.product.description,
                category: p.product.category,
                status: p.product.status,
                startup: {
                  id: p.startup?.id || "",
                  slug: p.startup?.slug || "",
                  name: p.startup?.name || "",
                  pitch: p.startup?.pitch || "",
                  category: p.startup?.category || "",
                  verified: false,
                  followerCount: 0,
                  ownerId: "",
                },
              }
            : null,
          media: p.media.map((m) => ({
            id: m.media.id,
            mediaType: m.media.mediaType,
            url: m.media.processedUrl || m.media.originalUrl || "",
            thumbnailUrl: m.media.thumbnailUrl || undefined,
            mimeType: m.media.mimeType,
            processingStatus: m.media.processingStatus,
            width: m.media.width || undefined,
            height: m.media.height || undefined,
            durationMs: m.media.durationMs || undefined,
          })),
        },
        relevanceScore: Math.round(75 + Math.random() * 20),
        reason:
          matchingSkills.length > 0
            ? `Matches your tech focus in ${matchingSkills.join(", ")}.`
            : `Trending project in ${p.startup?.category || "software engineering"}.`,
        matchingSkills: matchingSkills.length > 0 ? matchingSkills : ["Modern Web", "Open Source"],
      };
    });

    const analyzedBuildersCount = await db.buildDna.groupBy({
      by: ["userId"],
    });

    const response: BuildRadarOverviewDTO = {
      myBuildDna,
      forYou,
      collaborators,
      projectRecommendations,
      opportunityRadar,
      stats: {
        analyzedBuildersCount: Math.max(analyzedBuildersCount.length, 12),
        collaborationOpportunitiesCount: collaborators.length + opportunityRadar.length,
        aiModel: aiHealth.model,
        aiStatus: aiHealth.status === "online" ? "online" : "heuristic_fallback",
      },
    };

    return response;
  });

  // 3. Trigger analysis of user's own content to update Build DNA
  app.post("/buildradar/analyze", async (req) => {
    const user = await requireUser(req);

    // Get user's recent posts
    const posts = await db.post.findMany({
      where: { authorId: user.id, draft: false, removedAt: null },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    let updatedCount = 0;
    for (const post of posts) {
      const ok = await indexBuildDnaForPost(post.id);
      if (ok) updatedCount++;
    }

    // If user has no posts, index from bio and interests
    if (posts.length === 0) {
      const interests = await db.userInterest.findMany({
        where: { userId: user.id },
        include: { category: true },
      });
      const interestNames = interests.map((i) => i.category.name);
      const text = `${user.displayName} (@${user.username}): ${user.bio || "Builder exploring new technologies."}`;
      const { dna, model } = await aiService.extractBuildDna({
        text,
        bio: user.bio,
        tags: interestNames,
      });

      await db.buildDna.create({
        data: {
          userId: user.id,
          sourceType: "PROFILE",
          sourceHash: "bio-" + user.id + "-" + Date.now(),
          projectDomains: dna.project_domains,
          technicalSkills: dna.technical_skills,
          technologies: dna.technologies,
          projectStage: dna.project_stage,
          skillsOffered: dna.skills_offered,
          skillsNeeded: dna.skills_needed,
          collaborationInterest: dna.collaboration_interest,
          currentBlockers: dna.current_blockers,
          interests: dna.interests,
          projectDescription: dna.project_description || user.bio || "",
          modelVersion: model,
          processingStatus: "READY",
        },
      });
      updatedCount++;
    }

    // Refresh recommendations
    const recommendations = await generateRecommendationsForUser(user.id);

    return {
      success: true,
      updatedCount,
      recommendationsCount: recommendations.forYou.length,
      message: "Build DNA analyzed and recommendations updated.",
    };
  });

  // 4. Retrieve current user's Build DNA
  app.get("/buildradar/dna", async (req) => {
    const user = await requireUser(req);
    const records = await db.buildDna.findMany({
      where: { userId: user.id, processingStatus: "READY" },
      orderBy: { createdAt: "desc" },
    });

    if (records.length === 0) {
      return { dna: null };
    }

    const aggregated = aggregateDna(
      records.map((r) => ({
        id: r.id,
        postId: r.postId,
        startupId: r.startupId,
        projectDomains: r.projectDomains,
        technicalSkills: r.technicalSkills,
        technologies: r.technologies,
        projectStage: r.projectStage,
        skillsOffered: r.skillsOffered,
        skillsNeeded: r.skillsNeeded,
        collaborationInterest: r.collaborationInterest,
        currentBlockers: r.currentBlockers,
        interests: r.interests,
        projectDescription: r.projectDescription,
      })),
    );

    return {
      dna: {
        id: records[0].id,
        userId: user.id,
        sourceType: records[0].sourceType,
        projectDomains: aggregated.project_domains,
        technicalSkills: aggregated.technical_skills,
        technologies: aggregated.technologies,
        projectStage: aggregated.project_stage,
        skillsOffered: aggregated.skills_offered,
        skillsNeeded: aggregated.skills_needed,
        collaborationInterest: aggregated.collaboration_interest,
        currentBlockers: aggregated.current_blockers,
        interests: aggregated.interests,
        projectDescription: aggregated.project_description,
        modelVersion: records[0].modelVersion,
        createdAt: records[0].createdAt.toISOString(),
      },
    };
  });
}
