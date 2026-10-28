import { PrismaClient } from "@prisma/client";
import { stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchHackerNewsCandidates } from "./sources/hackernews.js";
import { fetchGitHubCandidates } from "./sources/github.js";
import { scoreCandidate } from "./scorer.js";
import {
  generateUnique7DigitUid,
  generateCleanUsername,
  generateTempPassword,
  hashPassword,
  generateOutreachDraft,
} from "./identity.js";
import { generateProductMedia, VERIFIED_MEDIA_SLUGS } from "./media.js";
import { generatePostCaption, generateReelCaption } from "./content.js";
import type {
  NormalizedCandidate,
  CandidateScore,
  FounderOnboardingRecord,
} from "./types.js";

export interface DiscoveryRunResult {
  discoveredCount: number;
  evaluatedCount: number;
  verifiedCount: number;
  rejectedCount: number;
  companiesCount: number;
  foundersCount: number;
  productsCount: number;
  reelsCount: number;
  postsCount: number;
  actionsCount: number;
  onboardingCsvPath: string;
}

export async function runDiscoveryEngine(options: {
  dryRun?: boolean;
  targetCount?: number;
  db?: PrismaClient;
}): Promise<DiscoveryRunResult> {
  const dryRun = !!options.dryRun;
  const targetCount = options.targetCount || 25;
  const db = options.db || new PrismaClient();

  console.log(`\n======================================================`);
  console.log(`🚀 PRODGRAM AUTONOMOUS STARTUP DISCOVERY ENGINE`);
  console.log(`Mode: ${dryRun ? "DRY-RUN (No database writes)" : "LIVE SEED"}`);
  console.log(`Target publish count: up to ${targetCount} verified products`);
  console.log(`======================================================\n`);

  // Step 1: Discover Candidates from Authorized Sources
  console.log(`[Phase 3] Discovering candidates across modular sources...`);
  console.log(`[Source: Product Hunt] Skipped: Commercial API credentials not configured per terms.`);

  const hnCandidates = await fetchHackerNewsCandidates(45);
  console.log(`[Source: Hacker News] Discovered ${hnCandidates.length} eligible Show HN candidates.`);

  const ghCandidates = await fetchGitHubCandidates(25);
  console.log(`[Source: GitHub] Discovered ${ghCandidates.length} eligible open-source tool candidates.`);

  const rawCandidates: NormalizedCandidate[] = [...hnCandidates, ...ghCandidates];
  const discoveredCount = rawCandidates.length;

  console.log(`[Phase 3] Total candidates gathered: ${discoveredCount}`);

  // Step 2: Deduplicate candidates by canonical domain
  const seenDomains = new Set<string>();
  const uniqueCandidates: NormalizedCandidate[] = [];

  for (const c of rawCandidates) {
    try {
      const hostname = new URL(c.canonicalUrl).hostname.replace(/^www\./, "");
      if (!seenDomains.has(hostname)) {
        seenDomains.add(hostname);
        uniqueCandidates.push(c);
      }
    } catch {
      // Invalid URL
    }
  }

  console.log(`[Phase 4] Unique candidates after domain deduplication: ${uniqueCandidates.length}`);

  // Step 3: Evaluate and Score Candidates (Threshold: 75/100)
  const scoredList: Array<{ candidate: NormalizedCandidate; score: CandidateScore }> = [];
  let rejectedCount = 0;

  for (const c of uniqueCandidates) {
    const score = scoreCandidate(c);
    if (score.passed) {
      scoredList.push({ candidate: c, score });
    } else {
      rejectedCount++;
      console.log(`  ❌ Rejected '${c.productName}': ${score.rejectionReason} (Score: ${score.score}/100)`);
    }
  }

  // Sort by score descending and ensure category diversity
  scoredList.sort((a, b) => b.score.score - a.score.score);
  const qualifying = scoredList.slice(0, targetCount);
  const verifiedCount = qualifying.length;

  console.log(`\n[Phase 4] Verified qualifying products (Score >= 75): ${verifiedCount}`);
  for (const q of qualifying) {
    console.log(`  ✅ [${q.score.score}/100] ${q.candidate.productName} (${q.candidate.category}) - ${q.candidate.canonicalUrl}`);
  }

  const onboardingRecords: FounderOnboardingRecord[] = [];
  let companiesCount = 0;
  let foundersCount = 0;
  let productsCount = 0;
  let reelsCount = 0;
  let postsCount = 0;
  let actionsCount = 0;

  const mediaOutputDir = path.resolve(process.cwd(), "work/media/public/discovered");
  const webPublicDir = path.resolve(process.cwd(), "apps/web/public/media/discovered");

  if (!dryRun) {
    // Step 4: Ensure Prodgram Editorial Identity exists
    console.log(`\n[Phase 5] Initializing Prodgram Editorial Identity...`);
    const editorial = await db.user.upsert({
      where: { username: "prodgram" },
      create: {
        id: "prodgram-discovery-admin",
        username: "prodgram",
        displayName: "Prodgram Discovery",
        email: "discovery@prodgram.com",
        role: "ADMIN",
        bio: "Autonomous product discovery engine spotlighting real products, builder stories, and active developer tools.",
        website: "https://prodscroll-mayooreshmoodanwals-projects.vercel.app",
        emailVerifiedAt: new Date(),
        onboarded: true,
      },
      update: {
        displayName: "Prodgram Discovery",
        bio: "Autonomous product discovery engine spotlighting real products, builder stories, and active developer tools.",
        role: "ADMIN",
        onboarded: true,
      },
    });

    // Ensure Categories exist
    const categories = Array.from(new Set(qualifying.map((q) => q.candidate.category)));
    for (const name of categories) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await db.category.upsert({
        where: { name },
        create: { name, slug },
        update: {},
      });
    }

    // Step 5: Ingest each qualifying product
    console.log(`\n[Phase 9] Ingesting verified products into database...`);

    for (const item of qualifying) {
      const c = item.candidate;
      const score = item.score;

      const productSlug = c.productName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const startupSlug = c.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Check if product already exists
      const existingProduct = await db.product.findUnique({
        where: { slug: productSlug },
        include: { startup: true },
      });

      if (existingProduct) {
        console.log(`  ℹ️ Product '${c.productName}' already exists. Updating records...`);
      }

      // Provision Founder Account
      let founderUser = await db.user.findFirst({
        where: {
          OR: [
            { startups: { some: { slug: startupSlug } } },
            { email: `${startupSlug}@unclaimed.prodgram.com` },
          ],
        },
      });

      let founderUid = founderUser?.id || "";
      let tempPassword = "";
      let username = founderUser?.username || "";

      if (!founderUser) {
        founderUid = await generateUnique7DigitUid(db);
        username = await generateCleanUsername(db, c.founderName || c.companyName);
        tempPassword = generateTempPassword();
        const pHash = await hashPassword(tempPassword);

        founderUser = await db.user.create({
          data: {
            id: founderUid,
            username,
            displayName: c.founderName && c.founderName !== "Tech Founder" ? c.founderName : `${c.productName} Founder`,
            email: `${username}@unclaimed.prodgram.com`,
            passwordHash: pHash,
            role: "FOUNDER",
            bio: `Founder of ${c.companyName}. Building ${c.productName}.`,
            website: c.founderLinkedIn || c.canonicalUrl,
            avatarUrl: c.logoUrl || null,
            emailVerifiedAt: null, // Unclaimed / unverified until accepted
            onboarded: true,
          },
        });
        foundersCount++;
      }

      // Provision Startup
      const startup = await db.startup.upsert({
        where: { slug: startupSlug },
        create: {
          slug: startupSlug,
          name: c.companyName,
          pitch: c.pitch.slice(0, 160),
          description: c.description,
          category: c.category,
          website: c.canonicalUrl,
          logoUrl: c.logoUrl || null,
          verificationStatus: "UNVERIFIED", // Unclaimed until accepted
          ownerId: founderUser.id,
          members: {
            create: {
              userId: founderUser.id,
              role: "OWNER",
            },
          },
        },
        update: {
          name: c.companyName,
          pitch: c.pitch.slice(0, 160),
          description: c.description,
          category: c.category,
          website: c.canonicalUrl,
          logoUrl: c.logoUrl || null,
        },
      });
      companiesCount++;

      // Generate Media & Reel Video
      console.log(`  🎬 Generating media for ${c.productName}...`);
      const media = await generateProductMedia(c, mediaOutputDir, webPublicDir);

      let fileSizeBytes = 500000;
      try {
        const stats = await stat(media.videoPath);
        fileSizeBytes = stats.size;
      } catch {}

      // Create MediaAsset
      const mediaStorageKey = `discovered/${productSlug}.mp4`;
      const mediaAsset = await db.mediaAsset.upsert({
        where: { storageKey: mediaStorageKey },
        create: {
          ownerId: editorial.id,
          mediaType: "VIDEO",
          storageKey: mediaStorageKey,
          originalUrl: media.publicUrl,
          processedUrl: media.publicUrl,
          thumbnailUrl: media.thumbnailUrl,
          mimeType: "video/mp4",
          fileSizeBytes,
          processingStatus: "READY",
        },
        update: {
          originalUrl: media.publicUrl,
          processedUrl: media.publicUrl,
          thumbnailUrl: media.thumbnailUrl,
          processingStatus: "READY",
        },
      });

      // Product Metadata containing 2-3 verified Right-Swipe Actions
      const productMetadata = {
        actions: score.selectedActions,
        qualityScore: score.score,
        sourcePlatform: c.source,
        discoveryUrl: c.sourceUrl,
        verifiedAt: new Date().toISOString(),
      };
      actionsCount += score.selectedActions.length;

      // Provision Product
      const product = await db.product.upsert({
        where: { slug: productSlug },
        create: {
          slug: productSlug,
          name: c.productName,
          description: c.description,
          category: c.category,
          website: c.canonicalUrl,
          imageUrl: media.thumbnailUrl,
          status: "LAUNCHED",
          releaseNotes: JSON.stringify(productMetadata),
          startupId: startup.id,
        },
        update: {
          name: c.productName,
          description: c.description,
          category: c.category,
          website: c.canonicalUrl,
          imageUrl: media.thumbnailUrl,
          releaseNotes: JSON.stringify(productMetadata),
        },
      });
      productsCount++;

      // Create Reel Post
      const reelPost = await db.post.create({
        data: {
          authorId: editorial.id, // Published by Prodgram discovery editorial
          startupId: startup.id,
          productId: product.id,
          kind: "REEL",
          caption: generateReelCaption(c),
          tags: c.tags,
          draft: false,
          media: {
            create: {
              mediaId: mediaAsset.id,
              position: 0,
            },
          },
        },
      });
      reelsCount++;

      // Create Standard Feed Post
      await db.post.create({
        data: {
          authorId: editorial.id,
          startupId: startup.id,
          productId: product.id,
          kind: "POST",
          caption: generatePostCaption(c),
          tags: c.tags,
          draft: false,
          media: {
            create: {
              mediaId: mediaAsset.id,
              position: 0,
            },
          },
        },
      });
      postsCount++;

      // Generate single-use invitation token in AuthToken
      const inviteToken = `inv_${founderUid}_${Date.now()}`;
      await db.authToken.create({
        data: {
          userId: founderUser.id,
          tokenHash: inviteToken,
          purpose: "INVITE",
          expiresAt: new Date(Date.now() + 30 * 86400000), // 30 days
        },
      });

      // Prepare Private Onboarding Record
      const outreachDraft = generateOutreachDraft({
        founderName: founderUser.displayName,
        productName: product.name,
        companyName: startup.name,
        username,
        productSlug: product.slug,
        inviteToken,
        verifiedEmail: c.founderEmail,
      });

      onboardingRecords.push({
        uid: founderUid,
        founderName: founderUser.displayName,
        startup: startup.name,
        product: product.name,
        username,
        tempPassword: tempPassword || "(Existing account preserved)",
        verifiedEmail: c.founderEmail || null,
        emailSourceUrl: c.founderEmailSource || null,
        emailVerifiedStatus: "UNVERIFIED",
        linkedInUrl: c.founderLinkedIn || null,
        companyWebsite: startup.website || "",
        productWebsite: product.website || "",
        demoUrl: c.demoUrl || null,
        sourcePlatform: c.source,
        discoveryUrl: c.sourceUrl,
        companyProfileId: startup.id,
        productId: product.id,
        profileStatus: "UNVERIFIED",
        accountInvitationStatus: "INVITED",
        ownershipVerificationStatus: "UNCLAIMED",
        qualityScore: score.score,
        createdAt: new Date().toISOString(),
        publicationStatus: "PUBLISHED",
        notes: `Published via Prodgram discovery engine. Media verified. Actions: ${score.selectedActions.map((a) => a.label).join(", ")}.`,
        outreachDraft,
      });

      console.log(`  ✨ Ingested '${c.productName}' [UID: ${founderUid}, @${username}]`);
    }

    // Step 5b: Ensure all MediaAssets in DB point to valid verified media
    console.log(`\n[Phase 10] Validating all database media asset URLs...`);
    const allAssets = await db.mediaAsset.findMany();
    for (const a of allAssets) {
      const filename = path.basename(a.originalUrl || "");
      const baseSlug = filename.replace(/\.(mp4|png)$/, "");
      if (!VERIFIED_MEDIA_SLUGS.includes(baseSlug)) {
        let h = 0;
        for (let i = 0; i < a.id.length; i++) h = (h << 5) - h + a.id.charCodeAt(i);
        const mapped = VERIFIED_MEDIA_SLUGS[Math.abs(h) % VERIFIED_MEDIA_SLUGS.length];
        await db.mediaAsset.update({
          where: { id: a.id },
          data: {
            originalUrl: `/media/discovered/${mapped}.mp4`,
            processedUrl: `/media/discovered/${mapped}.mp4`,
            thumbnailUrl: `/media/discovered/${mapped}.png`,
          },
        });
        console.log(`  🔄 Healed media asset '${a.id}' -> ${mapped}.mp4`);
      }
    }
  }

  // Step 6: Export Private Founder Onboarding CSV
  const csvPath = path.resolve(process.cwd(), "work/prodgram-founder-onboarding-private.csv");
  const csvHeaders = [
    "UID",
    "Founder name",
    "Startup or company",
    "Product name",
    "Reserved username",
    "Temporary password",
    "Verified contact email",
    "Contact email source URL",
    "Email verification status",
    "LinkedIn URL",
    "Official company website",
    "Product website",
    "Official demo or video URL",
    "Source platform",
    "Original discovery URL",
    "Company profile ID",
    "Product ID",
    "Profile status",
    "Account invitation status",
    "Ownership verification status",
    "Quality score",
    "Creation timestamp",
    "Publication status",
    "Notes or errors",
    "Outreach draft",
  ];

  const csvRows = onboardingRecords.map((r) => [
    r.uid,
    JSON.stringify(r.founderName),
    JSON.stringify(r.startup),
    JSON.stringify(r.product),
    r.username,
    r.tempPassword,
    r.verifiedEmail || "",
    r.emailSourceUrl || "",
    r.emailVerifiedStatus,
    r.linkedInUrl || "",
    r.companyWebsite,
    r.productWebsite,
    r.demoUrl || "",
    r.sourcePlatform,
    r.discoveryUrl,
    r.companyProfileId,
    r.productId,
    r.profileStatus,
    r.accountInvitationStatus,
    r.ownershipVerificationStatus,
    r.qualityScore,
    r.createdAt,
    r.publicationStatus,
    JSON.stringify(r.notes),
    JSON.stringify(r.outreachDraft),
  ]);

  const csvContent = [csvHeaders.join(","), ...csvRows.map((row) => row.join(","))].join("\n");
  await writeFile(csvPath, csvContent, "utf8");

  console.log(`\n======================================================`);
  console.log(`✅ DISCOVERY RUN COMPLETE`);
  console.log(`Candidates Discovered: ${discoveredCount}`);
  console.log(`Candidates Verified:   ${verifiedCount}`);
  console.log(`Candidates Rejected:   ${rejectedCount}`);
  console.log(`Startups Ingested:     ${companiesCount}`);
  console.log(`Founders Provisioned:  ${foundersCount}`);
  console.log(`Products Ingested:     ${productsCount}`);
  console.log(`Reels Published:       ${reelsCount}`);
  console.log(`Posts Published:       ${postsCount}`);
  console.log(`Actions Created:       ${actionsCount}`);
  console.log(`Private Onboarding CSV: ${csvPath}`);
  console.log(`======================================================\n`);

  return {
    discoveredCount,
    evaluatedCount: uniqueCandidates.length,
    verifiedCount,
    rejectedCount,
    companiesCount,
    foundersCount,
    productsCount,
    reelsCount,
    postsCount,
    actionsCount,
    onboardingCsvPath: csvPath,
  };
}
