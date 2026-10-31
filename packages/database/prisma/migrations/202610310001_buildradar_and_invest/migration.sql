-- CreateEnum
CREATE TYPE "RecommendationCategory" AS ENUM ('COMPLEMENTARY', 'SIMILARITY');

-- CreateTable
CREATE TABLE "BuildDna" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT,
    "startupId" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'PROFILE',
    "sourceHash" TEXT NOT NULL,
    "projectDomains" TEXT[],
    "technicalSkills" TEXT[],
    "technologies" TEXT[],
    "projectStage" TEXT NOT NULL DEFAULT 'DEVELOPMENT',
    "skillsOffered" TEXT[],
    "skillsNeeded" TEXT[],
    "collaborationInterest" BOOLEAN NOT NULL DEFAULT false,
    "currentBlockers" TEXT[],
    "interests" TEXT[],
    "projectDescription" TEXT NOT NULL DEFAULT '',
    "modelVersion" TEXT NOT NULL DEFAULT 'gemma4',
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'READY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildDna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuilderRecommendation" (
    "id" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "suggestedUserId" TEXT NOT NULL,
    "category" "RecommendationCategory" NOT NULL DEFAULT 'COMPLEMENTARY',
    "score" DOUBLE PRECISION NOT NULL,
    "matchingSkills" TEXT[],
    "complementarySkills" TEXT[],
    "relevantProjects" JSONB NOT NULL DEFAULT '[]',
    "explanation" TEXT NOT NULL,
    "evidence" JSONB NOT NULL DEFAULT '{}',
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuilderRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoStartup" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "currencySymbol" TEXT NOT NULL DEFAULT '$',
    "industry" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "businessModel" TEXT NOT NULL,
    "technologies" TEXT[],
    "founderName" TEXT NOT NULL,
    "founderBio" TEXT NOT NULL,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "website" TEXT,
    "targetMarket" TEXT NOT NULL,
    "demoTargetAmount" DOUBLE PRECISION NOT NULL,
    "demoRaisedAmount" DOUBLE PRECISION NOT NULL,
    "demoMinTicket" DOUBLE PRECISION NOT NULL,
    "demoPreMoneyValuation" DOUBLE PRECISION NOT NULL,
    "demoPostMoneyValuation" DOUBLE PRECISION NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemoStartup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoStartupUpdate" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updateType" TEXT NOT NULL DEFAULT 'MILESTONE',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoStartupUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoWatchlist" (
    "userId" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoWatchlist_pkey" PRIMARY KEY ("userId","startupId")
);

-- CreateTable
CREATE TABLE "SimulatedPosition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "hypotheticalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "illustrativeEquityPercent" DOUBLE PRECISION NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulatedPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulatedActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulatedActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BuildDna_userId_createdAt_idx" ON "BuildDna"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "BuildDna_sourceHash_idx" ON "BuildDna"("sourceHash");

-- CreateIndex
CREATE INDEX "BuildDna_collaborationInterest_idx" ON "BuildDna"("collaborationInterest");

-- CreateIndex
CREATE INDEX "BuilderRecommendation_targetUserId_score_idx" ON "BuilderRecommendation"("targetUserId", "score");

-- CreateIndex
CREATE INDEX "BuilderRecommendation_category_score_idx" ON "BuilderRecommendation"("category", "score");

-- CreateIndex
CREATE UNIQUE INDEX "BuilderRecommendation_targetUserId_suggestedUserId_category_key" ON "BuilderRecommendation"("targetUserId", "suggestedUserId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "DemoStartup_slug_key" ON "DemoStartup"("slug");

-- CreateIndex
CREATE INDEX "DemoStartup_countryCode_published_idx" ON "DemoStartup"("countryCode", "published");

-- CreateIndex
CREATE INDEX "DemoStartup_industry_idx" ON "DemoStartup"("industry");

-- CreateIndex
CREATE INDEX "DemoStartup_featured_idx" ON "DemoStartup"("featured");

-- CreateIndex
CREATE INDEX "DemoStartupUpdate_startupId_date_idx" ON "DemoStartupUpdate"("startupId", "date");

-- CreateIndex
CREATE INDEX "DemoWatchlist_userId_createdAt_idx" ON "DemoWatchlist"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SimulatedPosition_userId_createdAt_idx" ON "SimulatedPosition"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SimulatedPosition_userId_startupId_key" ON "SimulatedPosition"("userId", "startupId");

-- CreateIndex
CREATE INDEX "SimulatedActivity_userId_createdAt_idx" ON "SimulatedActivity"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "BuildDna" ADD CONSTRAINT "BuildDna_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildDna" ADD CONSTRAINT "BuildDna_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildDna" ADD CONSTRAINT "BuildDna_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderRecommendation" ADD CONSTRAINT "BuilderRecommendation_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderRecommendation" ADD CONSTRAINT "BuilderRecommendation_suggestedUserId_fkey" FOREIGN KEY ("suggestedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoStartupUpdate" ADD CONSTRAINT "DemoStartupUpdate_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "DemoStartup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoWatchlist" ADD CONSTRAINT "DemoWatchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoWatchlist" ADD CONSTRAINT "DemoWatchlist_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "DemoStartup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulatedPosition" ADD CONSTRAINT "SimulatedPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulatedPosition" ADD CONSTRAINT "SimulatedPosition_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "DemoStartup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulatedActivity" ADD CONSTRAINT "SimulatedActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulatedActivity" ADD CONSTRAINT "SimulatedActivity_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "DemoStartup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

