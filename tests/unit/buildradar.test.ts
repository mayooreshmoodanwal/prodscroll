import { describe, it, expect } from "vitest";
import {
  extractDeterministicBuildDna,
  BuildDnaSchema,
  computeContentHash,
  AiService,
} from "../../apps/api/src/lib/ai.js";
import {
  scoreOpportunity,
  aggregateDna,
  type CandidateBuilder,
} from "../../apps/api/src/lib/opportunity-engine.js";

describe("BuildRadar: Build DNA & AI Service", () => {
  it("extracts structured Build DNA matching prompt specification", () => {
    const input =
      "I'm building a Next.js SaaS application. Authentication and the dashboard are complete. I'm struggling with scalable search and would like to collaborate with someone experienced in backend infrastructure.";

    const dna = extractDeterministicBuildDna(input, "NextSaaS Search Engine");

    // Validate with Zod schema
    const validated = BuildDnaSchema.parse(dna);

    expect(validated.project_domains).toContain("SaaS");
    expect(validated.technologies).toContain("Next.js");
    expect(validated.project_stage).toBe("Development");
    expect(validated.skills_needed).toContain("Scalable Search");
    expect(validated.skills_needed).toContain("Backend Infrastructure");
    expect(validated.collaboration_interest).toBe(true);
    expect(validated.current_blockers).toContain("Scalable Search");
  });

  it("computes deterministic content hash to avoid duplicate processing", () => {
    const text = "Open source code indexer for TypeScript and Python.";
    const hash1 = computeContentHash(text);
    const hash2 = computeContentHash(text);
    const hash3 = computeContentHash(text + " modified");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });

  it("gracefully falls back to heuristic engine when Ollama is offline or model unavailable", async () => {
    const customService = new AiService({
      provider: "heuristic",
      model: "gemma4",
    });

    const health = await customService.checkHealth();
    expect(health.status).toBe("online");
    expect(health.model).toBe("deterministic-dna-v1");

    const result = await customService.extractBuildDna({
      text: "Building an AI agent with Python and FastAPI.",
      tags: ["ai", "python"],
    });

    expect(result.method).toBe("heuristic");
    expect(result.dna.technologies).toContain("Python");
    expect(result.dna.project_domains).toContain("AI / ML");
  });
});

describe("BuildRadar: Opportunity Recommendation Engine", () => {
  const builderA_Dna = {
    project_domains: ["SaaS", "Developer Tools"],
    technical_skills: ["Frontend Engineering", "UI/UX Design"],
    technologies: ["Next.js", "TypeScript"],
    project_stage: "Development",
    skills_offered: ["Frontend Engineering", "UI/UX Design"],
    skills_needed: ["Scalable Search", "Database & Indexing"],
    collaboration_interest: true,
    current_blockers: ["Scalable Search"],
    interests: ["SaaS", "Developer Tools"],
    project_description: "Building an AI assistant UI needing scalable search.",
  };

  const builderB_Candidate: CandidateBuilder = {
    user: {
      id: "builder-b",
      username: "indexmaster",
      displayName: "Index Master",
      avatarUrl: null,
      bio: "Creator of fast open source indexing engines.",
      role: "USER",
      emailVerifiedAt: new Date(),
      onboarded: true,
      location: "San Francisco",
      website: "https://indexer.example.com",
      privateAccount: false,
      activityVisible: true,
      messageControl: "EVERYONE",
    },
    dnaList: [
      {
        id: "dna-b-1",
        postId: "post-b-1",
        startupId: null,
        projectDomains: ["Developer Tools", "Infrastructure & Cloud"],
        technicalSkills: ["Database & Indexing", "Backend Architecture"],
        technologies: ["TypeScript", "PostgreSQL", "Rust"],
        projectStage: "Development",
        skillsOffered: ["Database & Indexing", "Scalable Search", "Backend Architecture"],
        skillsNeeded: ["Frontend Engineering", "UI/UX Design"],
        collaborationInterest: true,
        currentBlockers: ["UI Polish"],
        interests: ["Developer Tools"],
        projectDescription: "Open-source code search engine looking for real-world applications.",
        post: {
          id: "post-b-1",
          caption: "Fast code search engine built in Rust and TypeScript.",
          tags: ["devtools", "search"],
        },
      },
    ],
  };

  it("identifies complementary opportunities where Builder B solves Builder A blockers", () => {
    const builderB_Dna = aggregateDna(builderB_Candidate.dnaList);

    const compScore = scoreOpportunity(
      builderA_Dna,
      builderB_Dna,
      builderB_Candidate,
      "COMPLEMENTARY",
    );

    expect(compScore.score).toBeGreaterThanOrEqual(75);
    expect(compScore.complementarySkills.length).toBeGreaterThan(0);
    expect(compScore.explanation).toContain("specializes in");
    expect(compScore.evidence.offeredMatchesNeeded.length).toBeGreaterThan(0);
  });

  it("distinguishes similarity from complementarity", () => {
    // Builder C has the exact same skills as Builder A (no complementary offer for needed skills)
    const builderC_Candidate: CandidateBuilder = {
      user: {
        id: "builder-c",
        username: "frontend_dev",
        displayName: "Frontend Dev",
        avatarUrl: null,
        bio: "Frontend dev building Next.js apps.",
        role: "USER",
        emailVerifiedAt: new Date(),
        onboarded: true,
        location: "Berlin",
        website: null,
        privateAccount: false,
        activityVisible: true,
        messageControl: "EVERYONE",
      },
      dnaList: [
        {
          id: "dna-c-1",
          postId: "post-c-1",
          startupId: null,
          projectDomains: ["SaaS"],
          technicalSkills: ["Frontend Engineering", "UI/UX Design"],
          technologies: ["Next.js", "TypeScript"],
          projectStage: "Development",
          skillsOffered: ["Frontend Engineering"],
          skillsNeeded: ["Backend Architecture"],
          collaborationInterest: true,
          currentBlockers: ["Backend Architecture"],
          interests: ["SaaS"],
          projectDescription: "Building landing pages in Next.js.",
          post: {
            id: "post-c-1",
            caption: "New UI kit released.",
            tags: ["nextjs"],
          },
        },
      ],
    };

    const builderC_Dna = aggregateDna(builderC_Candidate.dnaList);

    const simScore = scoreOpportunity(
      builderA_Dna,
      builderC_Dna,
      builderC_Candidate,
      "SIMILARITY",
    );

    const compScore = scoreOpportunity(
      builderA_Dna,
      builderC_Dna,
      builderC_Candidate,
      "COMPLEMENTARY",
    );

    // High similarity because both are Frontend + Next.js
    expect(simScore.score).toBeGreaterThanOrEqual(60);
    expect(simScore.matchingSkills).toContain("Frontend Engineering");

    // But lower complementarity because Builder C does NOT offer Scalable Search or Database & Indexing!
    expect(compScore.score).toBeLessThan(simScore.score);
  });
});

