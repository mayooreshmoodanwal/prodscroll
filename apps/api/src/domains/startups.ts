import type { FastifyInstance } from "fastify";
import { db, Prisma } from "@productscroll/database";
import { z } from "zod";
import {
  parse,
  requireUser,
  sessionUser,
  publicUser,
  visibleWhere,
  startupPermission,
  fail,
  idParams,
  redis,
  notify,
  jobs,
} from "../lib/core.js";
import {
  postInclude,
  presentPost,
  startupInclude,
  presentStartup,
  productInclude,
  presentProduct,
} from "../lib/presenters.js";
const safeUrl = z
  .string()
  .url()
  .max(500)
  .refine((v) => /^https?:\/\//.test(v))
  .optional();
const startupSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(80),
    pitch: z.string().trim().min(5).max(160),
    description: z.string().max(5000).default(""),
    category: z.string().max(80),
    website: safeUrl,
    location: z.string().max(100).optional(),
    foundingYear: z
      .number()
      .int()
      .min(1900)
      .max(new Date().getFullYear())
      .optional(),
    problem: z.string().max(2000).optional(),
    solution: z.string().max(2000).optional(),
  })
  .strict();
export async function startupRoutes(app: FastifyInstance) {
  app.get("/founder/startups", async (req) => {
    const user = await requireUser(req);
    return {
      items: (
        await db.startup.findMany({
          where: { members: { some: { userId: user.id } } },
          include: startupInclude,
        })
      ).map(presentStartup),
    };
  });
  app.post("/startups", async (req, reply) => {
    const user = await requireUser(req);
    if (!["FOUNDER", "ADMIN"].includes(user.role))
      fail(
        403,
        "FOUNDER_REQUIRED",
        "A founder account is required to create a startup.",
      );
    const data = parse(startupSchema, req.body);
    if (!(await db.category.findUnique({ where: { name: data.category } })))
      fail(400, "CATEGORY_INVALID", "Choose an existing category.");
    const startup = await db.startup.create({
      data: {
        ...data,
        ownerId: user.id,
        members: { create: { userId: user.id, role: "OWNER" } },
      },
      include: startupInclude,
    });
    await redis.del("explore:public");
    return reply.code(201).send({ startup: presentStartup(startup) });
  });
  app.get("/startups/:slug", async (req) => {
    const viewer = await sessionUser(req);
    const { slug } = parse(z.object({ slug: z.string().max(80) }), req.params);
    const startup = await db.startup.findUnique({
      where: { slug },
      include: {
        ...startupInclude,
        products: { include: productInclude },
        members: { include: { user: true } },
      },
    });
    if (!startup) fail(404, "STARTUP_NOT_FOUND", "Startup not found.");
    const posts = await db.post.findMany({
      where: {
        AND: [await visibleWhere(viewer?.id), { startupId: startup.id }],
      },
      include: postInclude(viewer?.id),
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    const following = viewer
      ? !!(await db.startupFollow.findUnique({
          where: {
            userId_startupId: { userId: viewer.id, startupId: startup.id },
          },
        }))
      : false;
    return {
      startup: {
        ...presentStartup(startup),
        following,
        products: startup.products.map(presentProduct),
        posts: posts.map(presentPost),
        team: startup.members.map((m) => ({
          ...publicUser(m.user),
          teamRole: m.role,
        })),
      },
    };
  });
  app.patch("/startups/:id", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    await startupPermission(user, id, ["OWNER", "ADMIN"]);
    const data = parse(startupSchema.partial(), req.body);
    const startup = await db.startup.update({
      where: { id },
      data,
      include: startupInclude,
    });
    await redis.del("explore:public");
    return { startup: presentStartup(startup) };
  });
  app.put("/startups/:id/follow", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    const { following } = parse(
      z.object({ following: z.boolean() }).strict(),
      req.body,
    );
    const startup = await db.startup.findUnique({ where: { id } });
    if (!startup) fail(404, "STARTUP_NOT_FOUND", "Startup not found.");
    if (following)
      await db.startupFollow.createMany({
        data: { userId: user.id, startupId: id },
        skipDuplicates: true,
      });
    else
      await db.startupFollow.deleteMany({
        where: { userId: user.id, startupId: id },
      });
    await jobs.add("events", {
      userId: user.id,
      events: [{ type: following ? "FOLLOW" : "UNFOLLOW", startupId: id }],
    });
    if (following)
      await notify(
        startup.ownerId,
        user.id,
        "STARTUP_FOLLOW",
        `${user.displayName} followed ${startup.name}.`,
        undefined,
        id,
      );
    await redis.del("explore:public");
    return {
      following,
      followerCount: (
        await db.startup.findUniqueOrThrow({
          where: { id },
          select: { followerCount: true },
        })
      ).followerCount,
    };
  });
  app.put("/startups/:id/members", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    await startupPermission(user, id, ["OWNER", "ADMIN"]);
    const { userId, role } = parse(
      z
        .object({
          userId: z.string(),
          role: z.enum(["ADMIN", "CONTENT_MANAGER", "ANALYST"]),
        })
        .strict(),
      req.body,
    );
    const existing = await db.startupMember.findUnique({
      where: { startupId_userId: { startupId: id, userId } },
    });
    if (existing?.role === "OWNER")
      fail(
        400,
        "OWNER_PROTECTED",
        "Ownership cannot be changed through member roles.",
      );
    await db.startupMember.upsert({
      where: { startupId_userId: { startupId: id, userId } },
      create: { startupId: id, userId, role },
      update: { role },
    });
    return { ok: true };
  });
  app.post("/startups/:id/products", async (req, reply) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    await startupPermission(user, id);
    const data = parse(
      z
        .object({
          name: z.string().min(2).max(80),
          slug: z
            .string()
            .regex(/^[a-z0-9-]+$/)
            .max(80),
          description: z.string().min(5).max(5000),
          category: z.string().max(80),
          status: z.enum([
            "CONCEPT",
            "PROTOTYPE",
            "BETA",
            "LAUNCHED",
            "DISCONTINUED",
          ]),
          website: safeUrl,
        })
        .strict(),
      req.body,
    );
    const product = await db.product.create({
      data: { ...data, startupId: id },
      include: productInclude,
    });
    await redis.del("explore:public");
    return reply.code(201).send({ product: presentProduct(product) });
  });
  app.get("/products/:slug", async (req) => {
    const user = await sessionUser(req);
    const { slug } = parse(z.object({ slug: z.string().max(80) }), req.params);
    const product = await db.product.findUnique({
      where: { slug },
      include: productInclude,
    });
    if (!product) fail(404, "PRODUCT_NOT_FOUND", "Product not found.");
    const posts = await db.post.findMany({
      where: { AND: [await visibleWhere(user?.id), { productId: product.id }] },
      include: postInclude(user?.id),
      take: 30,
    });
    return { product: presentProduct(product), posts: posts.map(presentPost) };
  });
  app.post("/startups/:id/verification", async (req, reply) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    await startupPermission(user, id, ["OWNER", "ADMIN"]);
    const { evidence } = parse(
      z.object({ evidence: z.string().min(20).max(3000) }).strict(),
      req.body,
    );
    const current = await db.verificationApplication.findFirst({
      where: {
        startupId: id,
        status: { in: ["APPLICATION_SUBMITTED", "UNDER_REVIEW"] },
      },
    });
    if (current)
      fail(
        409,
        "APPLICATION_PENDING",
        "Your verification request is under review.",
      );
    const application = await db.$transaction(async (tx) => {
      await tx.startup.update({
        where: { id },
        data: { verificationStatus: "APPLICATION_SUBMITTED" },
      });
      return tx.verificationApplication.create({
        data: { startupId: id, evidence },
      });
    });
    return reply.code(201).send({ application });
  });
  app.get("/startups/:id/analytics", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    await startupPermission(user, id, ["OWNER", "ADMIN", "ANALYST"]);
    const posts = await db.post.findMany({
      where: { startupId: id, draft: false, removedAt: null },
      select: {
        id: true,
        caption: true,
        likeCount: true,
        saveCount: true,
        commentCount: true,
        kind: true,
      },
    });
    const events = await db.engagementEvent.groupBy({
      by: ["type"],
      where: {
        OR: [{ startupId: id }, { postId: { in: posts.map((p) => p.id) } }],
        createdAt: { gt: new Date(Date.now() - 30 * 86400000) },
      },
      _count: true,
      _avg: { value: true },
    });
    const unique = await db.engagementEvent.groupBy({
      by: ["userId"],
      where: { postId: { in: posts.map((p) => p.id) }, type: "VIDEO_START" },
    });
    const totals = Object.fromEntries(events.map((e) => [e.type, e._count]));
    return {
      period: "30 days",
      posts,
      events: totals,
      uniqueViewers: unique.length,
      followers: await db.startupFollow.count({ where: { startupId: id } }),
      completionRate: totals.VIDEO_START
        ? (totals.VIDEO_COMPLETE || 0) / totals.VIDEO_START
        : 0,
      profileVisits: totals.STARTUP_OPEN || 0,
      websiteClicks: totals.WEBSITE_CLICK || 0,
      saves: posts.reduce((sum, p) => sum + p.saveCount, 0),
    };
  });
  app.get("/search", async (req) => {
    const user = await sessionUser(req);
    const { q, category, type } = parse(
      z.object({
        q: z.string().trim().min(1).max(100),
        category: z.string().max(80).optional(),
        type: z.enum(["all", "startups", "products", "people"]).default("all"),
      }),
      req.query,
    );
    const terms = q
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => `${t}:*`)
      .join(" & ");
    if (!terms) return { startups: [], products: [], users: [] };
    const startupIds =
      type === "all" || type === "startups"
        ? await db.$queryRaw<{ id: string }[]>(
            Prisma.sql`SELECT id FROM "Startup" WHERE (to_tsvector('english', name || ' ' || pitch || ' ' || category) @@ to_tsquery('english', ${terms}) OR name % ${q}) AND (${category || null}::text IS NULL OR category=${category || null}) ORDER BY ts_rank(to_tsvector('english',name || ' ' || pitch || ' ' || category),to_tsquery('english',${terms})) DESC LIMIT 20`,
          )
        : [];
    const productIds =
      type === "all" || type === "products"
        ? await db.$queryRaw<{ id: string }[]>(
            Prisma.sql`SELECT id FROM "Product" WHERE (to_tsvector('english', name || ' ' || description || ' ' || category) @@ to_tsquery('english', ${terms}) OR name % ${q}) AND (${category || null}::text IS NULL OR category=${category || null}) ORDER BY ts_rank(to_tsvector('english',name || ' ' || description || ' ' || category),to_tsquery('english',${terms})) DESC LIMIT 20`,
          )
        : [];
    const userIds =
      type === "all" || type === "people"
        ? await db.$queryRaw<{ id: string }[]>(
            Prisma.sql`SELECT id FROM "User" WHERE "suspended"=false AND "deactivatedAt" IS NULL AND (to_tsvector('simple',username || ' ' || "displayName") @@ to_tsquery('simple',${terms}) OR username % ${q}) ORDER BY similarity(username,${q}) DESC LIMIT 20`,
          )
        : [];
    const [startups, products, users] = await Promise.all([
      db.startup.findMany({
        where: { id: { in: startupIds.map((i) => i.id) } },
        include: startupInclude,
      }),
      db.product.findMany({
        where: { id: { in: productIds.map((i) => i.id) } },
        include: productInclude,
      }),
      db.user.findMany({
        where: {
          id: { in: userIds.map((i) => i.id) },
          blocked: { none: { blockedId: user?.id || "__guest__" } },
          blockedBy: { none: { blockerId: user?.id || "__guest__" } },
        },
      }),
    ]);
    if (user)
      await db.searchHistory.upsert({
        where: { userId_query: { userId: user.id, query: q } },
        create: { userId: user.id, query: q },
        update: { createdAt: new Date() },
      });
    const ordered = <T extends { id: string }>(
      list: T[],
      ids: { id: string }[],
    ) =>
      list.sort(
        (a, b) =>
          ids.findIndex((i) => i.id === a.id) -
          ids.findIndex((i) => i.id === b.id),
      );
    return {
      startups: ordered(startups, startupIds).map(presentStartup),
      products: ordered(products, productIds).map(presentProduct),
      users: ordered(users, userIds).map(publicUser),
    };
  });
  app.get("/search/history", async (req) => {
    const user = await requireUser(req);
    return {
      items: await db.searchHistory.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { id: true, query: true },
      }),
    };
  });
  app.delete("/search/history", async (req) => {
    const user = await requireUser(req);
    await db.searchHistory.deleteMany({ where: { userId: user.id } });
    return { ok: true };
  });
}
