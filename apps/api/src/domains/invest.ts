import type { FastifyInstance } from "fastify";
import { db } from "@productscroll/database";
import { z } from "zod";
import {
  parse,
  requireUser,
  sessionUser,
  requireRole,
  fail,
  idParams,
} from "../lib/core.js";
import {
  MARKETS_DATA,
  ensureDemoStartupsSeeded,
} from "../lib/invest-catalog.js";
import type {
  DemoStartupDTO,
  SimulatedPortfolioDTO,
  SimulatedPositionDTO,
  SimulatedActivityDTO,
} from "@productscroll/types";

const simulateAllocationSchema = z.object({
  startupId: z.string().min(1),
  hypotheticalAmount: z.number().positive(),
  notes: z.string().max(300).optional().default(""),
});

const startupFilterQuery = z.object({
  country: z.string().optional(),
  countryCode: z.string().optional(),
  industry: z.string().optional(),
  stage: z.string().optional(),
  search: z.string().optional(),
  maxMinTicket: z.coerce.number().optional(),
});

export async function investRoutes(app: FastifyInstance) {
  // Ensure seed data is populated
  await ensureDemoStartupsSeeded();

  // 1. Overview
  app.get("/invest/overview", async (req) => {
    const user = await sessionUser(req);

    const featured = await db.demoStartup.findMany({
      where: { published: true, featured: true },
      include: { updates: { take: 2, orderBy: { date: "desc" } } },
      take: 4,
    });

    const recent = await db.demoStartup.findMany({
      where: { published: true },
      include: { updates: { take: 1, orderBy: { date: "desc" } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    // If logged in, fetch simulated portfolio summary
    let portfolioSummary: SimulatedPortfolioDTO | null = null;
    if (user) {
      const positions = await db.simulatedPosition.findMany({
        where: { userId: user.id },
        include: { startup: true },
        orderBy: { createdAt: "desc" },
      });

      const totalSimulatedAllocated = positions.reduce(
        (sum, p) => sum + p.hypotheticalAmount,
        0,
      );

      const distributionByIndustry: Record<string, number> = {};
      const distributionByCountry: Record<string, number> = {};
      for (const p of positions) {
        distributionByIndustry[p.startup.industry] =
          (distributionByIndustry[p.startup.industry] || 0) +
          p.hypotheticalAmount;
        distributionByCountry[p.startup.country] =
          (distributionByCountry[p.startup.country] || 0) +
          p.hypotheticalAmount;
      }

      const watchlistRecords = await db.demoWatchlist.findMany({
        where: { userId: user.id },
        include: { startup: true },
        take: 5,
        orderBy: { createdAt: "desc" },
      });

      const activities = await db.simulatedActivity.findMany({
        where: { userId: user.id },
        include: { startup: true },
        take: 8,
        orderBy: { createdAt: "desc" },
      });

      portfolioSummary = {
        totalSimulatedAllocated,
        positionsCount: positions.length,
        positions: positions.map((p) => ({
          id: p.id,
          userId: p.userId,
          startupId: p.startupId,
          hypotheticalAmount: p.hypotheticalAmount,
          currency: p.currency,
          illustrativeEquityPercent: p.illustrativeEquityPercent,
          notes: p.notes,
          createdAt: p.createdAt.toISOString(),
          startup: {
            id: p.startup.id,
            slug: p.startup.slug,
            name: p.startup.name,
            tagline: p.startup.tagline,
            description: p.startup.description,
            country: p.startup.country,
            countryCode: p.startup.countryCode,
            currency: p.startup.currency,
            currencySymbol: p.startup.currencySymbol,
            industry: p.startup.industry,
            stage: p.startup.stage,
            businessModel: p.startup.businessModel,
            technologies: p.startup.technologies,
            founderName: p.startup.founderName,
            founderBio: p.startup.founderBio,
            logoUrl: p.startup.logoUrl,
            coverUrl: p.startup.coverUrl,
            website: p.startup.website,
            targetMarket: p.startup.targetMarket,
            demoTargetAmount: p.startup.demoTargetAmount,
            demoRaisedAmount: p.startup.demoRaisedAmount,
            demoMinTicket: p.startup.demoMinTicket,
            demoPreMoneyValuation: p.startup.demoPreMoneyValuation,
            demoPostMoneyValuation: p.startup.demoPostMoneyValuation,
            featured: p.startup.featured,
            published: p.startup.published,
            createdAt: p.startup.createdAt.toISOString(),
          },
        })),
        distributionByIndustry,
        distributionByCountry,
        watchlist: watchlistRecords.map((w) => ({
          id: w.startup.id,
          slug: w.startup.slug,
          name: w.startup.name,
          tagline: w.startup.tagline,
          description: w.startup.description,
          country: w.startup.country,
          countryCode: w.startup.countryCode,
          currency: w.startup.currency,
          currencySymbol: w.startup.currencySymbol,
          industry: w.startup.industry,
          stage: w.startup.stage,
          businessModel: w.startup.businessModel,
          technologies: w.startup.technologies,
          founderName: w.startup.founderName,
          founderBio: w.startup.founderBio,
          logoUrl: w.startup.logoUrl,
          coverUrl: w.startup.coverUrl,
          website: w.startup.website,
          targetMarket: w.startup.targetMarket,
          demoTargetAmount: w.startup.demoTargetAmount,
          demoRaisedAmount: w.startup.demoRaisedAmount,
          demoMinTicket: w.startup.demoMinTicket,
          demoPreMoneyValuation: w.startup.demoPreMoneyValuation,
          demoPostMoneyValuation: w.startup.demoPostMoneyValuation,
          featured: w.startup.featured,
          published: w.startup.published,
          createdAt: w.startup.createdAt.toISOString(),
          isWatchlisted: true,
        })),
        recentActivity: activities.map((a) => ({
          id: a.id,
          userId: a.userId,
          startupId: a.startupId,
          startupName: a.startup.name,
          action: a.action,
          amount: a.amount,
          details: a.details,
          createdAt: a.createdAt.toISOString(),
        })),
      };
    }

    const mapStartup = (s: (typeof recent)[0]): DemoStartupDTO => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      tagline: s.tagline,
      description: s.description,
      country: s.country,
      countryCode: s.countryCode,
      currency: s.currency,
      currencySymbol: s.currencySymbol,
      industry: s.industry,
      stage: s.stage,
      businessModel: s.businessModel,
      technologies: s.technologies,
      founderName: s.founderName,
      founderBio: s.founderBio,
      logoUrl: s.logoUrl,
      coverUrl: s.coverUrl,
      website: s.website,
      targetMarket: s.targetMarket,
      demoTargetAmount: s.demoTargetAmount,
      demoRaisedAmount: s.demoRaisedAmount,
      demoMinTicket: s.demoMinTicket,
      demoPreMoneyValuation: s.demoPreMoneyValuation,
      demoPostMoneyValuation: s.demoPostMoneyValuation,
      featured: s.featured,
      published: s.published,
      createdAt: s.createdAt.toISOString(),
      updates: s.updates?.map((u) => ({
        id: u.id,
        startupId: u.startupId,
        title: u.title,
        body: u.body,
        updateType: u.updateType,
        date: u.date.toISOString(),
      })),
    });

    return {
      disclaimer: "PROTOTYPE MODE — No real investments or transactions are available.",
      featured: featured.map(mapStartup),
      recent: recent.map(mapStartup),
      markets: Object.values(MARKETS_DATA),
      portfolioSummary,
    };
  });

  // 2. Discover / List Startups with filters
  app.get("/invest/startups", async (req) => {
    const user = await sessionUser(req);
    const filter = parse(startupFilterQuery, req.query);

    const whereClause: Record<string, unknown> = { published: true };

    if (filter.countryCode) {
      whereClause.countryCode = filter.countryCode.toUpperCase();
    } else if (filter.country) {
      whereClause.country = { contains: filter.country, mode: "insensitive" };
    }

    if (filter.industry) {
      whereClause.industry = { contains: filter.industry, mode: "insensitive" };
    }

    if (filter.stage) {
      whereClause.stage = { equals: filter.stage, mode: "insensitive" };
    }

    if (filter.maxMinTicket) {
      whereClause.demoMinTicket = { lte: filter.maxMinTicket };
    }

    if (filter.search) {
      whereClause.OR = [
        { name: { contains: filter.search, mode: "insensitive" } },
        { tagline: { contains: filter.search, mode: "insensitive" } },
        { description: { contains: filter.search, mode: "insensitive" } },
        { technologies: { has: filter.search } },
      ];
    }

    const items = await db.demoStartup.findMany({
      where: whereClause,
      include: {
        updates: { take: 2, orderBy: { date: "desc" } },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });

    let watchlistedIds = new Set<string>();
    let positionStartupIds = new Set<string>();
    if (user) {
      const watchlists = await db.demoWatchlist.findMany({
        where: { userId: user.id },
        select: { startupId: true },
      });
      watchlistedIds = new Set(watchlists.map((w) => w.startupId));

      const positions = await db.simulatedPosition.findMany({
        where: { userId: user.id },
        select: { startupId: true },
      });
      positionStartupIds = new Set(positions.map((p) => p.startupId));
    }

    const result: DemoStartupDTO[] = items.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      tagline: s.tagline,
      description: s.description,
      country: s.country,
      countryCode: s.countryCode,
      currency: s.currency,
      currencySymbol: s.currencySymbol,
      industry: s.industry,
      stage: s.stage,
      businessModel: s.businessModel,
      technologies: s.technologies,
      founderName: s.founderName,
      founderBio: s.founderBio,
      logoUrl: s.logoUrl,
      coverUrl: s.coverUrl,
      website: s.website,
      targetMarket: s.targetMarket,
      demoTargetAmount: s.demoTargetAmount,
      demoRaisedAmount: s.demoRaisedAmount,
      demoMinTicket: s.demoMinTicket,
      demoPreMoneyValuation: s.demoPreMoneyValuation,
      demoPostMoneyValuation: s.demoPostMoneyValuation,
      featured: s.featured,
      published: s.published,
      createdAt: s.createdAt.toISOString(),
      isWatchlisted: watchlistedIds.has(s.id),
      hasSimulatedPosition: positionStartupIds.has(s.id),
      updates: s.updates.map((u) => ({
        id: u.id,
        startupId: u.startupId,
        title: u.title,
        body: u.body,
        updateType: u.updateType,
        date: u.date.toISOString(),
      })),
    }));

    return {
      disclaimer: "PROTOTYPE MODE — No real investments or transactions are available.",
      startups: result,
      total: result.length,
    };
  });

  // 3. Single Startup Detail
  app.get("/invest/startups/:slug", async (req) => {
    const user = await sessionUser(req);
    const { slug } = req.params as { slug: string };

    const startup = await db.demoStartup.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        published: true,
      },
      include: {
        updates: { orderBy: { date: "desc" } },
      },
    });

    if (!startup) {
      fail(404, "STARTUP_NOT_FOUND", "Demo startup listing not found.");
    }

    let isWatchlisted = false;
    let simulatedPosition: SimulatedPositionDTO | null = null;
    if (user) {
      const wl = await db.demoWatchlist.findUnique({
        where: {
          userId_startupId: { userId: user.id, startupId: startup.id },
        },
      });
      isWatchlisted = !!wl;

      const pos = await db.simulatedPosition.findUnique({
        where: {
          userId_startupId: { userId: user.id, startupId: startup.id },
        },
      });
      if (pos) {
        simulatedPosition = {
          id: pos.id,
          userId: pos.userId,
          startupId: pos.startupId,
          hypotheticalAmount: pos.hypotheticalAmount,
          currency: pos.currency,
          illustrativeEquityPercent: pos.illustrativeEquityPercent,
          notes: pos.notes,
          createdAt: pos.createdAt.toISOString(),
          startup: {
            ...startup,
            createdAt: startup.createdAt.toISOString(),
            updates: startup.updates.map((u) => ({
              id: u.id,
              startupId: u.startupId,
              title: u.title,
              body: u.body,
              updateType: u.updateType,
              date: u.date.toISOString(),
            })),
          },
        };
      }
    }

    const response: DemoStartupDTO = {
      id: startup.id,
      slug: startup.slug,
      name: startup.name,
      tagline: startup.tagline,
      description: startup.description,
      country: startup.country,
      countryCode: startup.countryCode,
      currency: startup.currency,
      currencySymbol: startup.currencySymbol,
      industry: startup.industry,
      stage: startup.stage,
      businessModel: startup.businessModel,
      technologies: startup.technologies,
      founderName: startup.founderName,
      founderBio: startup.founderBio,
      logoUrl: startup.logoUrl,
      coverUrl: startup.coverUrl,
      website: startup.website,
      targetMarket: startup.targetMarket,
      demoTargetAmount: startup.demoTargetAmount,
      demoRaisedAmount: startup.demoRaisedAmount,
      demoMinTicket: startup.demoMinTicket,
      demoPreMoneyValuation: startup.demoPreMoneyValuation,
      demoPostMoneyValuation: startup.demoPostMoneyValuation,
      featured: startup.featured,
      published: startup.published,
      createdAt: startup.createdAt.toISOString(),
      isWatchlisted,
      hasSimulatedPosition: !!simulatedPosition,
      updates: startup.updates.map((u) => ({
        id: u.id,
        startupId: u.startupId,
        title: u.title,
        body: u.body,
        updateType: u.updateType,
        date: u.date.toISOString(),
      })),
    };

    return {
      disclaimer: "PROTOTYPE MODE — No real investments or transactions are available.",
      startup: response,
      simulatedPosition,
      marketEvaluation: MARKETS_DATA[startup.countryCode] || null,
    };
  });

  // 4. Toggle Watchlist
  app.post("/invest/startups/:id/watchlist", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);

    const startup = await db.demoStartup.findUnique({ where: { id } });
    if (!startup) fail(404, "STARTUP_NOT_FOUND", "Demo startup not found.");

    const existing = await db.demoWatchlist.findUnique({
      where: { userId_startupId: { userId: user.id, startupId: id } },
    });

    let watchlisted = false;
    if (existing) {
      await db.demoWatchlist.delete({
        where: { userId_startupId: { userId: user.id, startupId: id } },
      });
      await db.simulatedActivity.create({
        data: {
          userId: user.id,
          startupId: id,
          action: "WATCHLIST_REMOVED",
          details: `Removed ${startup.name} from demo watchlist.`,
        },
      });
    } else {
      await db.demoWatchlist.create({
        data: { userId: user.id, startupId: id },
      });
      watchlisted = true;
      await db.simulatedActivity.create({
        data: {
          userId: user.id,
          startupId: id,
          action: "WATCHLIST_ADDED",
          details: `Added ${startup.name} to demo watchlist.`,
        },
      });
    }

    return {
      success: true,
      watchlisted,
      message: watchlisted
        ? `Added ${startup.name} to your watchlist.`
        : `Removed ${startup.name} from your watchlist.`,
    };
  });

  // 5. User Watchlist
  app.get("/invest/watchlist", async (req) => {
    const user = await requireUser(req);

    const items = await db.demoWatchlist.findMany({
      where: { userId: user.id },
      include: {
        startup: {
          include: { updates: { take: 2, orderBy: { date: "desc" } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const startups: DemoStartupDTO[] = items.map((w) => ({
      id: w.startup.id,
      slug: w.startup.slug,
      name: w.startup.name,
      tagline: w.startup.tagline,
      description: w.startup.description,
      country: w.startup.country,
      countryCode: w.startup.countryCode,
      currency: w.startup.currency,
      currencySymbol: w.startup.currencySymbol,
      industry: w.startup.industry,
      stage: w.startup.stage,
      businessModel: w.startup.businessModel,
      technologies: w.startup.technologies,
      founderName: w.startup.founderName,
      founderBio: w.startup.founderBio,
      logoUrl: w.startup.logoUrl,
      coverUrl: w.startup.coverUrl,
      website: w.startup.website,
      targetMarket: w.startup.targetMarket,
      demoTargetAmount: w.startup.demoTargetAmount,
      demoRaisedAmount: w.startup.demoRaisedAmount,
      demoMinTicket: w.startup.demoMinTicket,
      demoPreMoneyValuation: w.startup.demoPreMoneyValuation,
      demoPostMoneyValuation: w.startup.demoPostMoneyValuation,
      featured: w.startup.featured,
      published: w.startup.published,
      createdAt: w.startup.createdAt.toISOString(),
      isWatchlisted: true,
      updates: w.startup.updates.map((u) => ({
        id: u.id,
        startupId: u.startupId,
        title: u.title,
        body: u.body,
        updateType: u.updateType,
        date: u.date.toISOString(),
      })),
    }));

    return {
      disclaimer: "PROTOTYPE MODE — No real investments or transactions are available.",
      watchlist: startups,
    };
  });

  // 6. Portfolio Simulator: User's Simulated Portfolio
  app.get("/invest/portfolio", async (req) => {
    const user = await requireUser(req);

    const positions = await db.simulatedPosition.findMany({
      where: { userId: user.id },
      include: { startup: true },
      orderBy: { createdAt: "desc" },
    });

    const totalSimulatedAllocated = positions.reduce(
      (sum, p) => sum + p.hypotheticalAmount,
      0,
    );

    const distributionByIndustry: Record<string, number> = {};
    const distributionByCountry: Record<string, number> = {};
    for (const p of positions) {
      distributionByIndustry[p.startup.industry] =
        (distributionByIndustry[p.startup.industry] || 0) + p.hypotheticalAmount;
      distributionByCountry[p.startup.country] =
        (distributionByCountry[p.startup.country] || 0) + p.hypotheticalAmount;
    }

    const watchlist = await db.demoWatchlist.findMany({
      where: { userId: user.id },
      include: { startup: true },
      orderBy: { createdAt: "desc" },
    });

    const activities = await db.simulatedActivity.findMany({
      where: { userId: user.id },
      include: { startup: true },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    const portfolio: SimulatedPortfolioDTO = {
      totalSimulatedAllocated,
      positionsCount: positions.length,
      positions: positions.map((p) => ({
        id: p.id,
        userId: p.userId,
        startupId: p.startupId,
        hypotheticalAmount: p.hypotheticalAmount,
        currency: p.currency,
        illustrativeEquityPercent: p.illustrativeEquityPercent,
        notes: p.notes,
        createdAt: p.createdAt.toISOString(),
        startup: {
          id: p.startup.id,
          slug: p.startup.slug,
          name: p.startup.name,
          tagline: p.startup.tagline,
          description: p.startup.description,
          country: p.startup.country,
          countryCode: p.startup.countryCode,
          currency: p.startup.currency,
          currencySymbol: p.startup.currencySymbol,
          industry: p.startup.industry,
          stage: p.startup.stage,
          businessModel: p.startup.businessModel,
          technologies: p.startup.technologies,
          founderName: p.startup.founderName,
          founderBio: p.startup.founderBio,
          logoUrl: p.startup.logoUrl,
          coverUrl: p.startup.coverUrl,
          website: p.startup.website,
          targetMarket: p.startup.targetMarket,
          demoTargetAmount: p.startup.demoTargetAmount,
          demoRaisedAmount: p.startup.demoRaisedAmount,
          demoMinTicket: p.startup.demoMinTicket,
          demoPreMoneyValuation: p.startup.demoPreMoneyValuation,
          demoPostMoneyValuation: p.startup.demoPostMoneyValuation,
          featured: p.startup.featured,
          published: p.startup.published,
          createdAt: p.startup.createdAt.toISOString(),
        },
      })),
      distributionByIndustry,
      distributionByCountry,
      watchlist: watchlist.map((w) => ({
        id: w.startup.id,
        slug: w.startup.slug,
        name: w.startup.name,
        tagline: w.startup.tagline,
        description: w.startup.description,
        country: w.startup.country,
        countryCode: w.startup.countryCode,
        currency: w.startup.currency,
        currencySymbol: w.startup.currencySymbol,
        industry: w.startup.industry,
        stage: w.startup.stage,
        businessModel: w.startup.businessModel,
        technologies: w.startup.technologies,
        founderName: w.startup.founderName,
        founderBio: w.startup.founderBio,
        logoUrl: w.startup.logoUrl,
        coverUrl: w.startup.coverUrl,
        website: w.startup.website,
        targetMarket: w.startup.targetMarket,
        demoTargetAmount: w.startup.demoTargetAmount,
        demoRaisedAmount: w.startup.demoRaisedAmount,
        demoMinTicket: w.startup.demoMinTicket,
        demoPreMoneyValuation: w.startup.demoPreMoneyValuation,
        demoPostMoneyValuation: w.startup.demoPostMoneyValuation,
        featured: w.startup.featured,
        published: w.startup.published,
        createdAt: w.startup.createdAt.toISOString(),
        isWatchlisted: true,
      })),
      recentActivity: activities.map((a) => ({
        id: a.id,
        userId: a.userId,
        startupId: a.startupId,
        startupName: a.startup.name,
        action: a.action,
        amount: a.amount,
        details: a.details,
        createdAt: a.createdAt.toISOString(),
      })),
    };

    return {
      disclaimer: "PROTOTYPE MODE — No real investments or transactions are available.",
      portfolio,
    };
  });

  // 7. Simulate Allocation (educational prototype mutation)
  app.post("/invest/simulate", async (req) => {
    const user = await requireUser(req);
    const input = parse(simulateAllocationSchema, req.body);

    const startup = await db.demoStartup.findUnique({
      where: { id: input.startupId },
    });

    if (!startup || !startup.published) {
      fail(404, "STARTUP_NOT_FOUND", "Demo startup listing is unavailable.");
    }

    if (input.hypotheticalAmount < startup.demoMinTicket) {
      fail(
        400,
        "BELOW_MINIMUM_TICKET",
        `Hypothetical amount must be at least ${startup.currencySymbol}${startup.demoMinTicket}.`,
      );
    }

    // Mathematical formula explicitly defined in prompt:
    // Hypothetical ownership percentage = hypothetical investment amount / illustrative post-money valuation * 100
    const illustrativeEquityPercent = Number(
      (
        (input.hypotheticalAmount / startup.demoPostMoneyValuation) *
        100
      ).toFixed(4),
    );

    const position = await db.simulatedPosition.upsert({
      where: {
        userId_startupId: {
          userId: user.id,
          startupId: startup.id,
        },
      },
      create: {
        userId: user.id,
        startupId: startup.id,
        hypotheticalAmount: input.hypotheticalAmount,
        currency: startup.currency,
        illustrativeEquityPercent,
        notes: input.notes,
      },
      update: {
        hypotheticalAmount: input.hypotheticalAmount,
        currency: startup.currency,
        illustrativeEquityPercent,
        notes: input.notes,
      },
    });

    await db.simulatedActivity.create({
      data: {
        userId: user.id,
        startupId: startup.id,
        action: "ALLOCATION_SIMULATED",
        amount: input.hypotheticalAmount,
        details: `Simulated ${startup.currencySymbol}${input.hypotheticalAmount.toLocaleString()} allocation (${illustrativeEquityPercent}% illustrative ownership).`,
      },
    });

    return {
      success: true,
      disclaimer: "PROTOTYPE MODE — Educational simulation only. No securities issued or transferred.",
      position: {
        id: position.id,
        startupId: position.startupId,
        hypotheticalAmount: position.hypotheticalAmount,
        currency: position.currency,
        illustrativeEquityPercent: position.illustrativeEquityPercent,
        createdAt: position.createdAt.toISOString(),
      },
      message: `Simulated allocation of ${startup.currencySymbol}${input.hypotheticalAmount.toLocaleString()} added to your demo portfolio.`,
    };
  });

  // 8. Remove Simulated Position
  app.delete("/invest/positions/:id", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);

    const position = await db.simulatedPosition.findUnique({
      where: { id },
      include: { startup: true },
    });

    if (!position || position.userId !== user.id) {
      fail(404, "POSITION_NOT_FOUND", "Simulated position not found.");
    }

    await db.simulatedPosition.delete({ where: { id } });

    await db.simulatedActivity.create({
      data: {
        userId: user.id,
        startupId: position.startupId,
        action: "ALLOCATION_REMOVED",
        amount: position.hypotheticalAmount,
        details: `Removed simulated position in ${position.startup.name}.`,
      },
    });

    return {
      success: true,
      message: `Simulated position in ${position.startup.name} removed.`,
    };
  });

  // 9. Markets Evaluation
  app.get("/invest/markets", async () => {
    return {
      disclaimer: "PROTOTYPE MODE — Markets are under evaluation; not available investment jurisdictions.",
      markets: Object.values(MARKETS_DATA),
    };
  });

  app.get("/invest/markets/:code", async (req) => {
    const { code } = req.params as { code: string };
    const market = MARKETS_DATA[code.toUpperCase()];
    if (!market) {
      fail(404, "MARKET_NOT_FOUND", "Jurisdiction evaluation record not found.");
    }
    return {
      disclaimer: "PROTOTYPE MODE — Market is under evaluation; not an available investment jurisdiction.",
      market,
    };
  });

  // 10. Admin Prototype Management (Restricted to ADMIN)
  app.post("/invest/admin/startups", async (req) => {
    await requireRole(req, ["ADMIN"]);
    const schema = z.object({
      name: z.string().min(2),
      slug: z.string().min(2),
      tagline: z.string().min(5),
      description: z.string().min(10),
      country: z.string(),
      countryCode: z.string().length(2),
      currency: z.string().default("USD"),
      currencySymbol: z.string().default("$"),
      industry: z.string(),
      stage: z.string(),
      businessModel: z.string(),
      technologies: z.array(z.string()).default([]),
      founderName: z.string(),
      founderBio: z.string(),
      targetMarket: z.string(),
      demoTargetAmount: z.number().positive(),
      demoRaisedAmount: z.number().default(0),
      demoMinTicket: z.number().positive(),
      demoPreMoneyValuation: z.number().positive(),
      demoPostMoneyValuation: z.number().positive(),
      featured: z.boolean().default(false),
      published: z.boolean().default(true),
    });

    const data = parse(schema, req.body);
    const created = await db.demoStartup.create({ data });
    return { success: true, startup: created };
  });

  app.patch("/invest/admin/startups/:id", async (req) => {
    await requireRole(req, ["ADMIN"]);
    const { id } = parse(idParams, req.params);
    const schema = z.object({
      name: z.string().optional(),
      tagline: z.string().optional(),
      description: z.string().optional(),
      featured: z.boolean().optional(),
      published: z.boolean().optional(),
      demoRaisedAmount: z.number().optional(),
    });
    const data = parse(schema, req.body);
    const updated = await db.demoStartup.update({ where: { id }, data });
    return { success: true, startup: updated };
  });

  app.delete("/invest/admin/startups/:id", async (req) => {
    await requireRole(req, ["ADMIN"]);
    const { id } = parse(idParams, req.params);
    await db.demoStartup.delete({ where: { id } });
    return { success: true, message: "Demo startup removed." };
  });

  app.post("/invest/admin/startups/:id/updates", async (req) => {
    await requireRole(req, ["ADMIN"]);
    const { id } = parse(idParams, req.params);
    const schema = z.object({
      title: z.string().min(3),
      body: z.string().min(5),
      updateType: z.string().default("MILESTONE"),
    });
    const data = parse(schema, req.body);
    const update = await db.demoStartupUpdate.create({
      data: { startupId: id, ...data },
    });
    return { success: true, update };
  });
}
