import { db, Prisma } from "@productscroll/database";
import type { RawBuildDna } from "./ai.js";
import type {
  BuilderRecommendationDTO,
  RelevantProjectDTO,
  RecommendationEvidenceDTO,
} from "@productscroll/types";

export interface CandidateBuilder {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string;
    role: "USER" | "FOUNDER" | "MODERATOR" | "ADMIN";
    emailVerifiedAt: Date | null;
    onboarded: boolean;
    location: string | null;
    website: string | null;
    privateAccount: boolean;
    activityVisible: boolean;
    messageControl: string;
  };
  dnaList: Array<{
    id: string;
    postId: string | null;
    startupId: string | null;
    projectDomains: string[];
    technicalSkills: string[];
    technologies: string[];
    projectStage: string;
    skillsOffered: string[];
    skillsNeeded: string[];
    collaborationInterest: boolean;
    currentBlockers: string[];
    interests: string[];
    projectDescription: string;
    post?: {
      id: string;
      caption: string;
      tags: string[];
      startup?: { name: string } | null;
    } | null;
  }>;
}

export function aggregateDna(
  dnaList: CandidateBuilder["dnaList"],
): RawBuildDna {
  const domains = new Set<string>();
  const techSkills = new Set<string>();
  const techs = new Set<string>();
  const offered = new Set<string>();
  const needed = new Set<string>();
  const blockers = new Set<string>();
  const interests = new Set<string>();
  let collabInterest = false;
  let stage = "Development";
  let description = "";

  for (const item of dnaList) {
    item.projectDomains.forEach((d) => domains.add(d));
    item.technicalSkills.forEach((s) => techSkills.add(s));
    item.technologies.forEach((t) => techs.add(t));
    item.skillsOffered.forEach((s) => offered.add(s));
    item.skillsNeeded.forEach((s) => needed.add(s));
    item.currentBlockers.forEach((b) => blockers.add(b));
    item.interests.forEach((i) => interests.add(i));
    if (item.collaborationInterest) collabInterest = true;
    if (item.projectStage && stage === "Development") stage = item.projectStage;
    if (item.projectDescription && !description) description = item.projectDescription;
  }

  return {
    project_domains: Array.from(domains),
    technical_skills: Array.from(techSkills),
    technologies: Array.from(techs),
    project_stage: stage,
    skills_offered: Array.from(offered),
    skills_needed: Array.from(needed),
    collaboration_interest: collabInterest,
    current_blockers: Array.from(blockers),
    interests: Array.from(interests),
    project_description: description,
  };
}

function caseInsensitiveOverlap(arrA: string[], arrB: string[]): string[] {
  const setB = new Set(arrB.map((s) => s.toLowerCase().trim()));
  const matches: string[] = [];
  for (const a of arrA) {
    const aLower = a.toLowerCase().trim();
    if (setB.has(aLower)) {
      matches.push(a);
    } else {
      // Fuzzy partial word match
      for (const b of arrB) {
        const bLower = b.toLowerCase().trim();
        if (
          (aLower.length > 3 && bLower.includes(aLower)) ||
          (bLower.length > 3 && aLower.includes(bLower))
        ) {
          matches.push(a);
          break;
        }
      }
    }
  }
  return [...new Set(matches)];
}

function jaccardScore(arrA: string[], arrB: string[]): number {
  if (arrA.length === 0 && arrB.length === 0) return 0.5;
  if (arrA.length === 0 || arrB.length === 0) return 0;
  const overlap = caseInsensitiveOverlap(arrA, arrB).length;
  const union = new Set([...arrA.map((s) => s.toLowerCase()), ...arrB.map((s) => s.toLowerCase())]).size;
  return union > 0 ? overlap / union : 0;
}

export function scoreOpportunity(
  viewerDna: RawBuildDna,
  candidateDna: RawBuildDna,
  candidateBuilder: CandidateBuilder,
  category: "COMPLEMENTARY" | "SIMILARITY",
): {
  score: number;
  matchingSkills: string[];
  complementarySkills: string[];
  explanation: string;
  evidence: RecommendationEvidenceDTO;
  relevantProjects: RelevantProjectDTO[];
} {
  // Overlaps
  const matchingSkills = caseInsensitiveOverlap(
    viewerDna.technical_skills,
    candidateDna.technical_skills,
  );
  const sharedDomains = caseInsensitiveOverlap(
    viewerDna.project_domains,
    candidateDna.project_domains,
  );
  const sharedTech = caseInsensitiveOverlap(
    viewerDna.technologies,
    candidateDna.technologies,
  );

  // Complementarity: candidate's offered skills meeting viewer's needs / blockers
  const candidateMeetsViewerNeeds = caseInsensitiveOverlap(
    candidateDna.skills_offered,
    [...viewerDna.skills_needed, ...viewerDna.current_blockers],
  );

  // Vice versa: viewer's offered skills meeting candidate's needs / blockers
  const viewerMeetsCandidateNeeds = caseInsensitiveOverlap(
    viewerDna.skills_offered,
    [...candidateDna.skills_needed, ...candidateDna.current_blockers],
  );

  const offeredMatchesNeeded: Array<{ need: string; matchedBy: string }> = [];
  candidateMeetsViewerNeeds.forEach((m) =>
    offeredMatchesNeeded.push({ need: m, matchedBy: m }),
  );

  const complementarySkills = [
    ...new Set([...candidateMeetsViewerNeeds, ...viewerMeetsCandidateNeeds]),
  ];

  // 1. Skill complementarity / similarity (30%)
  let skillComponent = 0;
  if (category === "COMPLEMENTARY") {
    const directMatches = candidateMeetsViewerNeeds.length * 0.6 + viewerMeetsCandidateNeeds.length * 0.4;
    skillComponent = Math.min(1.0, directMatches > 0 ? 0.6 + directMatches * 0.2 : 0.2);
  } else {
    skillComponent = Math.min(1.0, jaccardScore(viewerDna.technical_skills, candidateDna.technical_skills) * 1.5);
  }

  // 2. Project-domain compatibility (20%)
  const domainScore = sharedDomains.length > 0 ? Math.min(1.0, 0.5 + sharedDomains.length * 0.25) : 0.2;

  // 3. Collaboration requirements (20%)
  let collabScore = 0.3;
  if (viewerDna.collaboration_interest && candidateDna.collaboration_interest) {
    collabScore = 1.0;
  } else if (viewerDna.collaboration_interest || candidateDna.collaboration_interest) {
    collabScore = 0.75;
  } else if (candidateDna.skills_needed.length > 0 || viewerDna.skills_needed.length > 0) {
    collabScore = 0.6;
  }

  // 4. Technology relevance (10%)
  const techScore = sharedTech.length > 0 ? Math.min(1.0, 0.4 + sharedTech.length * 0.3) : 0.2;

  // 5. Project-stage compatibility (10%)
  const stageScore =
    viewerDna.project_stage.toLowerCase() === candidateDna.project_stage.toLowerCase()
      ? 1.0
      : 0.6;

  // 6. Shared interests and activity (10%)
  const interestScore =
    jaccardScore(viewerDna.interests, candidateDna.interests) > 0 ? 0.9 : 0.4;

  // Total weighted score (0 - 100)
  const rawScore =
    (skillComponent * 0.3 +
      domainScore * 0.2 +
      collabScore * 0.2 +
      techScore * 0.1 +
      stageScore * 0.1 +
      interestScore * 0.1) *
    100;

  const score = Math.round(Math.min(99, Math.max(35, rawScore)));

  // Relevant projects from candidate's DNA items
  const relevantProjects: RelevantProjectDTO[] = [];
  for (const item of candidateBuilder.dnaList) {
    if (item.post) {
      relevantProjects.push({
        id: item.post.id,
        title: item.post.startup?.name ? `${item.post.startup.name} Project` : "Builder Project",
        caption: item.post.caption.slice(0, 160) + (item.post.caption.length > 160 ? "…" : ""),
        tags: item.post.tags,
        startupName: item.post.startup?.name,
      });
    }
  }

  // Generate explainable human-readable reason
  let explanation = "";
  if (category === "COMPLEMENTARY" && candidateMeetsViewerNeeds.length > 0) {
    explanation = `${candidateBuilder.user.displayName} specializes in ${candidateMeetsViewerNeeds.join(", ")}, which directly complements your current focus in ${viewerDna.project_domains[0] || "software development"}.`;
  } else if (category === "COMPLEMENTARY" && viewerMeetsCandidateNeeds.length > 0) {
    explanation = `Your background in ${viewerMeetsCandidateNeeds.join(", ")} aligns with needs identified in ${candidateBuilder.user.displayName}'s project.`;
  } else if (sharedDomains.length > 0 && sharedTech.length > 0) {
    explanation = `Both building in ${sharedDomains.join(" and ")} using shared stack (${sharedTech.join(", ")}).`;
  } else if (sharedDomains.length > 0) {
    explanation = `Strong domain alignment in ${sharedDomains.join(", ")} with active public builds.`;
  } else {
    explanation = `Complementary developer capabilities with matching project stage (${candidateDna.project_stage}).`;
  }

  const evidence: RecommendationEvidenceDTO = {
    sharedDomains,
    offeredMatchesNeeded,
    matchingSkills,
    complementarySkills,
    sourcePostId: relevantProjects[0]?.id,
    sourcePostCaption: relevantProjects[0]?.caption,
    quote: candidateDna.project_description || undefined,
  };

  return {
    score,
    matchingSkills,
    complementarySkills,
    explanation,
    evidence,
    relevantProjects,
  };
}

export async function generateRecommendationsForUser(
  targetUserId: string,
): Promise<{
  forYou: BuilderRecommendationDTO[];
  collaborators: BuilderRecommendationDTO[];
  opportunityRadar: BuilderRecommendationDTO[];
}> {
  // 1. Fetch viewer's Build DNA records
  const viewerDnaRecords = await db.buildDna.findMany({
    where: { userId: targetUserId, processingStatus: "READY" },
  });

  // If viewer has no DNA yet, build a base DNA from their user interests / profile
  let viewerDna: RawBuildDna;
  if (viewerDnaRecords.length > 0) {
    viewerDna = aggregateDna(
      viewerDnaRecords.map((r) => ({
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
  } else {
    const user = await db.user.findUnique({
      where: { id: targetUserId },
      include: { interests: { include: { category: true } } },
    });
    const interestNames = user?.interests.map((i) => i.category.name) || [];
    viewerDna = {
      project_domains: interestNames.length > 0 ? interestNames : ["Technology", "SaaS"],
      technical_skills: ["Full-Stack Development"],
      technologies: ["TypeScript", "Next.js"],
      project_stage: "Development",
      skills_offered: ["Full-Stack Development"],
      skills_needed: ["Database & Indexing", "Cloud Infrastructure"],
      collaboration_interest: true,
      current_blockers: ["Scalable Architecture"],
      interests: interestNames,
      project_description: user?.bio || "Active ProductScroll builder",
    };
  }

  // 2. Fetch candidate builders (excluding targetUser, blocked, deactivated, suspended)
  const candidateUsers = await db.user.findMany({
    where: {
      id: { not: targetUserId },
      suspended: false,
      deactivatedAt: null,
      blocked: { none: { blockedId: targetUserId } },
      blockedBy: { none: { blockerId: targetUserId } },
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      role: true,
      emailVerifiedAt: true,
      onboarded: true,
      location: true,
      website: true,
      privateAccount: true,
      activityVisible: true,
      messageControl: true,
      buildDna: {
        where: { processingStatus: "READY" },
        include: {
          post: {
            select: {
              id: true,
              caption: true,
              tags: true,
              startup: { select: { name: true } },
            },
          },
        },
      },
      posts: {
        where: { draft: false, removedAt: null },
        take: 3,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          caption: true,
          tags: true,
          startup: { select: { name: true } },
        },
      },
    },
    take: 50,
  });

  const recommendations: BuilderRecommendationDTO[] = [];

  for (const candidate of candidateUsers) {
    let candidateDnaList = candidate.buildDna.map((d) => ({
      id: d.id,
      postId: d.postId,
      startupId: d.startupId,
      projectDomains: d.projectDomains,
      technicalSkills: d.technicalSkills,
      technologies: d.technologies,
      projectStage: d.projectStage,
      skillsOffered: d.skillsOffered,
      skillsNeeded: d.skillsNeeded,
      collaborationInterest: d.collaborationInterest,
      currentBlockers: d.currentBlockers,
      interests: d.interests,
      projectDescription: d.projectDescription,
      post: d.post,
    }));

    // If candidate has no BuildDNA yet, synthesize a starting candidate DNA from recent public posts
    if (candidateDnaList.length === 0 && candidate.posts.length > 0) {
      const topPost = candidate.posts[0];
      candidateDnaList = [
        {
          id: `virtual-${candidate.id}`,
          postId: topPost.id,
          startupId: null,
          projectDomains: topPost.tags.length > 0 ? topPost.tags : ["Developer Tools"],
          technicalSkills: ["Backend Systems", "Open Source Architecture"],
          technologies: topPost.tags.includes("ai") ? ["Python", "Ollama"] : ["TypeScript", "PostgreSQL"],
          projectStage: "Launched",
          skillsOffered: ["Backend Systems", "Code Indexing", "API Engineering"],
          skillsNeeded: ["Frontend Polish", "Developer Outreach"],
          collaborationInterest: true,
          currentBlockers: [],
          interests: topPost.tags,
          projectDescription: topPost.caption,
          post: topPost,
        },
      ];
    }

    if (candidateDnaList.length === 0) continue;

    const candidateDna = aggregateDna(candidateDnaList);

    // Compute both Complementary and Similarity scores
    const compResult = scoreOpportunity(
      viewerDna,
      candidateDna,
      { user: candidate, dnaList: candidateDnaList },
      "COMPLEMENTARY",
    );

    const simResult = scoreOpportunity(
      viewerDna,
      candidateDna,
      { user: candidate, dnaList: candidateDnaList },
      "SIMILARITY",
    );

    // Complementary recommendation
    if (compResult.score >= 45) {
      recommendations.push({
        id: `rec-comp-${targetUserId}-${candidate.id}`,
        category: "COMPLEMENTARY",
        score: compResult.score,
        matchingSkills: compResult.matchingSkills,
        complementarySkills: compResult.complementarySkills,
        relevantProjects: compResult.relevantProjects,
        explanation: compResult.explanation,
        evidence: compResult.evidence,
        suggestedBuilder: {
          id: candidate.id,
          username: candidate.username,
          displayName: candidate.displayName,
          bio: candidate.bio,
          avatarUrl: candidate.avatarUrl || undefined,
          role: candidate.role,
          verified: !!candidate.emailVerifiedAt,
          onboarded: candidate.onboarded,
          location: candidate.location || undefined,
          website: candidate.website || undefined,
          privateAccount: candidate.privateAccount,
          activityVisible: candidate.activityVisible,
          messageControl: candidate.messageControl,
        },
        createdAt: new Date().toISOString(),
      });
    }

    // Similarity recommendation
    if (simResult.score >= 50) {
      recommendations.push({
        id: `rec-sim-${targetUserId}-${candidate.id}`,
        category: "SIMILARITY",
        score: simResult.score,
        matchingSkills: simResult.matchingSkills,
        complementarySkills: simResult.complementarySkills,
        relevantProjects: simResult.relevantProjects,
        explanation: simResult.explanation,
        evidence: simResult.evidence,
        suggestedBuilder: {
          id: candidate.id,
          username: candidate.username,
          displayName: candidate.displayName,
          bio: candidate.bio,
          avatarUrl: candidate.avatarUrl || undefined,
          role: candidate.role,
          verified: !!candidate.emailVerifiedAt,
          onboarded: candidate.onboarded,
          location: candidate.location || undefined,
          website: candidate.website || undefined,
          privateAccount: candidate.privateAccount,
          activityVisible: candidate.activityVisible,
          messageControl: candidate.messageControl,
        },
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Sort by score descending
  recommendations.sort((a, b) => b.score - a.score);

  const collaborators = recommendations.filter(
    (r) => r.category === "COMPLEMENTARY",
  );
  const similarityMatches = recommendations.filter(
    (r) => r.category === "SIMILARITY",
  );

  return {
    forYou: recommendations.slice(0, 10),
    collaborators: collaborators.slice(0, 8),
    opportunityRadar: recommendations.filter((r) => r.score >= 70).slice(0, 8),
  };
}
