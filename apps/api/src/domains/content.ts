import { publicCandidateIds, followedCandidateIds } from "../lib/candidates.js";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { db, Prisma } from "@productscroll/database";
import { z } from "zod";
import {
  parse,
  requireUser,
  sessionUser,
  visibleWhere,
  visiblePost,
  fail,
  idParams,
  pageQuery,
  page,
  decodeCursor,
  startupPermission,
  notify,
  fanoutPostNotifications,
  jobs,
  redis,
  token,
} from "../lib/core.js";
import {
  getPost,
  postInclude,
  presentPost,
  startupInclude,
  presentStartup,
  productInclude,
  presentProduct,
} from "../lib/presenters.js";
import { defaultWeights, rankCandidates } from "./ranking.js";
import { eventTypeSchema as eventTypes } from "@productscroll/validation";
const candidateSelect = {
  id: true,
  authorId: true,
  startupId: true,
  tags: true,
  createdAt: true,
  likeCount: true,
  saveCount: true,
  commentCount: true,
} as const;
export async function contentRoutes(app: FastifyInstance) {
  const feed = async (req: FastifyRequest) => {
    const user = await sessionUser(req);
    const { cursor, limit, mode, seen } = parse(
      pageQuery.extend({
        mode: z.enum(["for-you", "following", "reels"]).default("for-you"),
        seen: z.string().max(6500).optional(),
      }),
      req.query,
    );
    const visibility = await visibleWhere(user?.id);
    let where: Prisma.PostWhereInput = {
      ...visibility,
      media:
        mode === "reels"
          ? {
              some: {
                media: { processingStatus: "READY", mediaType: "VIDEO" },
              },
            }
          : undefined,
    };
    if (mode === "reels") {
      where.kind = "REEL";
      if (seen) {
        const recent = z
          .array(z.string().min(1).max(80))
          .max(60)
          .parse(seen.split(","));
        where.id = { notIn: recent };
        // A finite catalog can cycle, while the newest behavior is reranked each
        // batch. Prefer the rest of the catalog before repeating the last reel.
        if (
          (await db.post.findMany({ where, select: { id: true }, take: limit }))
            .length < limit
        ) {
          delete where.id;
          const available = (
            await db.post.findMany({
              where,
              select: { id: true },
              take: recent.length + limit,
            })
          ).length;
          const keep = Math.max(0, available - limit);
          // Relax the oldest exclusions first so small catalogs still supply
          // ten distinct reels whenever ten eligible reels exist.
          if (keep) where.id = { notIn: recent.slice(-keep) };
        }
      }
    }
    if (mode === "following") {
      if (!user)
        fail(401, "AUTH_REQUIRED", "Sign in to see your following feed.");
      where = {
        ...where,
        OR: [
          {
            author: {
              followers: { some: { followerId: user.id, accepted: true } },
            },
          },
          { startup: { followers: { some: { userId: user.id } } } },
        ],
      };
      const result = page(
        await db.post.findMany({
          where: { AND: [where, decodeCursor(cursor) || {}] },
          include: postInclude(user.id),
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: limit + 1,
        }),
        limit,
      );
      return { ...result, items: result.items.map(presentPost) };
    }
    let snapshot: string;
    let offset = 0;
    let ids: string[];
    if (cursor) {
      let decoded: { snapshot: string; offset: number };
      try {
        decoded = z
          .object({
            snapshot: z.string().max(60),
            offset: z.number().int().min(0).max(1000),
          })
          .parse(JSON.parse(Buffer.from(cursor, "base64url").toString()));
      } catch {
        fail(400, "INVALID_CURSOR", "Invalid cursor.");
      }
      snapshot = decoded.snapshot;
      offset = decoded.offset;
      const cached = await redis.get(
        `feed:${user?.id || "guest"}:${mode}:${snapshot}`,
      );
      if (!cached)
        fail(410, "FEED_EXPIRED", "Refresh your feed to discover more.");
      ids = JSON.parse(cached) as string[];
    } else {
      snapshot = token();
      const [publicIds, followedIds] = await Promise.all([
        publicCandidateIds(mode === "reels"),
        user ? followedCandidateIds(user.id, mode === "reels") : [],
      ]);
      const [publicPosts, followed, interests, events, config] =
        await Promise.all([
          db.post.findMany({
            where: { AND: [where, { id: { in: publicIds } }] },
            select: candidateSelect,
          }),
          followedIds.length
            ? db.post.findMany({
                where: { AND: [where, { id: { in: followedIds } }] },
                select: candidateSelect,
              })
            : [],
          user
            ? db.userInterest.findMany({
                where: { userId: user.id },
                include: { category: true },
              })
            : [],
          user
            ? db.engagementEvent.findMany({
                where: {
                  userId: user.id,
                  createdAt: { gt: new Date(Date.now() - 30 * 86400000) },
                },
                include: {
                  post: {
                    select: {
                      tags: true,
                      startup: { select: { category: true } },
                    },
                  },
                },
                orderBy: { createdAt: "desc" },
                take: 1000,
              })
            : [],
          db.rankingConfig.findUnique({ where: { key: "default" } }),
        ]);
      const affinity = new Map(
        interests.map((i) => [i.category.name, i.affinity]),
      );
      const negatives = new Map<string, number>();
      for (const e of events) {
        const category = e.post?.startup?.category || e.post?.tags[0];
        const negative = ["NOT_INTERESTED", "REPORT", "SKIP"].includes(e.type);
        if (category)
          affinity.set(
            category,
            (affinity.get(category) || 0) +
              (negative
                ? -0.3
                : ["SAVE", "FOLLOW", "VIDEO_COMPLETE"].includes(e.type)
                  ? 0.15
                  : 0.03),
          );
        if (negative && e.postId)
          negatives.set(e.postId, (negatives.get(e.postId) || 0) + 1);
      }
      // A heavily filtered/small pool can still discover eligible older posts.
      const fresh =
        publicPosts.length < limit
          ? await db.post.findMany({
              where,
              select: candidateSelect,
              orderBy: { createdAt: "desc" },
              take: 150,
            })
          : publicPosts;
      const candidates = [
        ...new Map([...fresh, ...followed].map((p) => [p.id, p])).values(),
      ];
      const startupIds = [
        ...new Set(
          candidates.flatMap((p) => (p.startupId ? [p.startupId] : [])),
        ),
      ];
      const startups = await db.startup.findMany({
        where: { id: { in: startupIds } },
        select: { id: true, category: true },
      });
      const categories = new Map(startups.map((s) => [s.id, s.category]));
      const impressions =
        user && candidates.length
          ? await db.feedImpression.groupBy({
              by: ["postId"],
              where: {
                userId: user.id,
                postId: { in: candidates.map((p) => p.id) },
                createdAt: { gt: new Date(Date.now() - 7 * 86400000) },
              },
              _count: true,
            })
          : [];
      const seen = new Map(impressions.map((i) => [i.postId, i._count]));
      const follows = new Set(followed.map((p) => p.id));
      const weights = {
        ...defaultWeights,
        ...((config?.weights as Partial<typeof defaultWeights>) || {}),
      };
      ids = rankCandidates(
        candidates.map((p) => ({
          ...p,
          category:
            categories.get(p.startupId || "") || p.tags[0] || "Technology",
          affinity:
            affinity.get(
              categories.get(p.startupId || "") || p.tags[0] || "",
            ) || 0,
          followed: follows.has(p.id),
          seen: seen.get(p.id) || 0,
          negative: negatives.get(p.id) || 0,
        })),
        weights,
        Date.now(),
        req.routeOptions.url === "/api/reels" ? limit : candidates.length,
      );
      if (req.routeOptions.url !== "/api/reels")
        await redis.set(
          `feed:${user?.id || "guest"}:${mode}:${snapshot}`,
          JSON.stringify(ids),
          "EX",
          600,
        );
    }
    const chunk = ids.slice(offset, offset + limit);
    const posts = await db.post.findMany({
      where: { AND: [where, { id: { in: chunk } }] },
      include: postInclude(user?.id),
    });
    const order = new Map(chunk.map((id, i) => [id, i]));
    posts.sort((a, b) => (order.get(a.id) || 0) - (order.get(b.id) || 0));
    return {
      items: posts.map(presentPost),
      hasMore: offset + limit < ids.length,
      nextCursor:
        offset + limit < ids.length
          ? Buffer.from(
              JSON.stringify({ snapshot, offset: offset + limit }),
            ).toString("base64url")
          : null,
    };
  };
  app.get("/feed", feed);
  app.get("/reels", async (req) => {
    const query = parse(
      z.object({ seen: z.string().max(6500).optional() }),
      req.query,
    );
    req.query = { ...query, mode: "reels", limit: 10 };
    const batch = await feed(req);
    return { ...batch, nextCursor: null, hasMore: batch.items.length > 0 };
  });
  app.get("/explore", async () => {
    const cached = await redis.get("explore:public");
    if (cached) return JSON.parse(cached) as unknown;
    const [startups, products, founders, categories] = await Promise.all([
      db.startup.findMany({
        include: startupInclude,
        orderBy: { followerCount: "desc" },
        take: 12,
      }),
      db.product.findMany({
        include: productInclude,
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      db.user.findMany({
        where: {
          role: "FOUNDER",
          suspended: false,
          deactivatedAt: null,
          privateAccount: false,
        },
        take: 6,
        select: {
          id: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          role: true,
          onboarded: true,
        },
      }),
      db.category.findMany(),
    ]);
    const result = {
      trending: startups.map(presentStartup),
      newProducts: products.map(presentProduct),
      founders,
      categories: categories.map((c) => c.name),
    };
    await redis.set("explore:public", JSON.stringify(result), "EX", 60);
    return result;
  });
  app.post("/events", async (req, reply) => {
    const user = await requireUser(req);
    const { events } = parse(
      z
        .object({
          events: z
            .array(
              z
                .object({
                  type: eventTypes,
                  postId: z.string().optional(),
                  startupId: z.string().optional(),
                  value: z.number().min(0).max(3600000).optional(),
                })
                .strict(),
            )
            .max(50),
        })
        .strict(),
      req.body,
    );
    const ids = events.flatMap((e) => (e.postId ? [e.postId] : []));
    if (ids.length) {
      const count = await db.post.count({
        where: {
          AND: [await visibleWhere(user.id), { id: { in: [...new Set(ids)] } }],
        },
      });
      if (count !== new Set(ids).size)
        fail(400, "EVENT_TARGET", "Invalid event target.");
    }
    await jobs.add("events", { userId: user.id, events });
    return reply.code(202).send({ accepted: events.length });
  });
  app.get("/posts/:id", async (req) => {
    const user = await sessionUser(req);
    const { id } = parse(idParams, req.params);
    await visiblePost(id, user?.id);
    return { post: await getPost(id, user?.id) };
  });
  app.get("/drafts", async (req) => {
    const user = await requireUser(req);
    return {
      items: (
        await db.post.findMany({
          where: { authorId: user.id, draft: true },
          include: postInclude(user.id),
          orderBy: { updatedAt: "desc" },
          take: 50,
        })
      ).map(presentPost),
    };
  });
  app.post("/posts", async (req, reply) => {
    const user = await requireUser(req);
    const input = parse(
      z
        .object({
          caption: z.string().trim().min(1).max(5000),
          kind: z.enum(["POST", "REEL", "UPDATE", "LAUNCH"]).default("POST"),
          startupId: z.string().optional(),
          productId: z.string().optional(),
          mediaIds: z.array(z.string()).max(10).default([]),
          tags: z.array(z.string().max(30)).max(10).default([]),
          draft: z.boolean().default(false),
        })
        .strict(),
      req.body,
    );
    if (input.startupId) await startupPermission(user, input.startupId);
    if (input.productId) {
      const product = await db.product.findUnique({
        where: { id: input.productId },
      });
      if (!product || product.startupId !== input.startupId)
        fail(
          400,
          "PRODUCT_MISMATCH",
          "Product must belong to the selected startup.",
        );
    }
    if (input.kind === "LAUNCH" && !input.startupId)
      fail(
        400,
        "STARTUP_REQUIRED",
        "A launch must be associated with your startup.",
      );
    const assets = await db.mediaAsset.findMany({
      where: {
        id: { in: input.mediaIds },
        ownerId: user.id,
        processingStatus: "READY",
      },
    });
    if (assets.length !== new Set(input.mediaIds).size)
      fail(400, "MEDIA_NOT_READY", "Wait for your media to finish processing.");
    if (input.kind === "REEL" && !assets.some((m) => m.mediaType === "VIDEO"))
      fail(400, "VIDEO_REQUIRED", "A reel needs a processed video.");
    const { mediaIds, ...data } = input;
    const post = await db.post.create({
      data: {
        ...data,
        authorId: user.id,
        media: {
          create: mediaIds.map((mediaId, position) => ({ mediaId, position })),
        },
      },
    });
    if (!input.draft) {
      void fanoutPostNotifications(post.id).catch((err) =>
        console.error("[Post Notification Fanout Error]", err),
      );
      try {
        await jobs.add("post-notifications", { postId: post.id });
      } catch {}
    }
    return reply.code(201).send({ post: await getPost(post.id, user.id) });
  });
  app.post("/posts/:id/publish", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    const post = await db.post.findFirst({
      where: { id, authorId: user.id, draft: true },
    });
    if (!post) fail(404, "DRAFT_NOT_FOUND", "Draft not found.");
    await db.post.update({
      where: { id },
      data: { draft: false, createdAt: new Date() },
    });
    void fanoutPostNotifications(id).catch((err) =>
      console.error("[Post Notification Fanout Error]", err),
    );
    try {
      await jobs.add("post-notifications", { postId: id });
    } catch {}
    return { post: await getPost(id, user.id) };
  });
  app.delete("/posts/:id", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    const result = await db.post.updateMany({
      where: { id, authorId: user.id },
      data: { removedAt: new Date() },
    });
    if (!result.count) fail(404, "POST_NOT_FOUND", "Post not found.");
    return { ok: true };
  });
  app.put("/posts/:id/like", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    const { liked } = parse(
      z.object({ liked: z.boolean() }).strict(),
      req.body,
    );
    const post = await visiblePost(id, user.id);
    const result = await db.$transaction(async (tx) => {
      const changed = liked
        ? await tx.like.createMany({
            data: { userId: user.id, postId: id },
            skipDuplicates: true,
          })
        : await tx.like.deleteMany({ where: { userId: user.id, postId: id } });
      return tx.post.update({
        where: { id },
        data: { likeCount: { increment: changed.count * (liked ? 1 : -1) } },
      });
    });
    if (liked)
      await notify(
        post.authorId,
        user.id,
        "LIKE",
        `${user.displayName} liked your post.`,
        id,
      );
    await jobs.add("events", {
      userId: user.id,
      events: [{ type: liked ? "LIKE" : "UNLIKE", postId: id }],
    });
    return { liked, likeCount: result.likeCount };
  });
  app.put("/posts/:id/save", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    const { saved } = parse(
      z.object({ saved: z.boolean() }).strict(),
      req.body,
    );
    await visiblePost(id, user.id);
    const result = await db.$transaction(async (tx) => {
      const changed = saved
        ? await tx.save.createMany({
            data: { userId: user.id, postId: id },
            skipDuplicates: true,
          })
        : await tx.save.deleteMany({ where: { userId: user.id, postId: id } });
      return tx.post.update({
        where: { id },
        data: { saveCount: { increment: changed.count * (saved ? 1 : -1) } },
      });
    });
    await jobs.add("events", {
      userId: user.id,
      events: [{ type: saved ? "SAVE" : "UNSAVE", postId: id }],
    });
    return { saved, saveCount: result.saveCount };
  });
  app.get("/saves", async (req) => {
    const user = await requireUser(req);
    const { cursor, limit } = parse(pageQuery, req.query);
    const result = page(
      await db.post.findMany({
        where: {
          AND: [
            await visibleWhere(user.id),
            { saves: { some: { userId: user.id } } },
            decodeCursor(cursor) || {},
          ],
        },
        include: postInclude(user.id),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
      }),
      limit,
    );
    return { ...result, items: result.items.map(presentPost) };
  });
  app.get("/collections", async (req) => {
    const user = await requireUser(req);
    return {
      items: (
        await db.collection.findMany({
          where: { userId: user.id },
          include: { _count: { select: { items: true } } },
          orderBy: { createdAt: "desc" },
        })
      ).map((c) => ({ id: c.id, name: c.name, itemCount: c._count.items })),
    };
  });
  app.post("/collections", async (req, reply) => {
    const user = await requireUser(req);
    const input = parse(
      z.object({ name: z.string().trim().min(1).max(80) }).strict(),
      req.body,
    );
    return reply.code(201).send({
      collection: await db.collection.create({
        data: { ...input, userId: user.id },
      }),
    });
  });
  app.get("/collections/:id", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    const c = await db.collection.findFirst({ where: { id, userId: user.id } });
    if (!c) fail(404, "COLLECTION_NOT_FOUND", "Collection not found.");
    const posts = await db.post.findMany({
      where: {
        AND: [
          await visibleWhere(user.id),
          {
            saves: {
              some: { userId: user.id, items: { some: { collectionId: id } } },
            },
          },
        ],
      },
      include: postInclude(user.id),
      take: 100,
    });
    return { collection: { ...c, items: posts.map(presentPost) } };
  });
  app.put("/collections/:id/items", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    const { postId, saved } = parse(
      z.object({ postId: z.string(), saved: z.boolean() }).strict(),
      req.body,
    );
    const collection = await db.collection.findFirst({
      where: { id, userId: user.id },
    });
    if (!collection) fail(404, "COLLECTION_NOT_FOUND", "Collection not found.");
    await visiblePost(postId, user.id);
    await db.$transaction(async (tx) => {
      let save = await tx.save.findUnique({
        where: { userId_postId: { userId: user.id, postId } },
      });
      if (saved && !save) {
        save = await tx.save.create({ data: { userId: user.id, postId } });
        await tx.post.update({
          where: { id: postId },
          data: { saveCount: { increment: 1 } },
        });
      }
      if (save) {
        if (saved)
          await tx.collectionItem.createMany({
            data: { collectionId: id, saveId: save.id },
            skipDuplicates: true,
          });
        else
          await tx.collectionItem.deleteMany({
            where: { collectionId: id, saveId: save.id },
          });
      }
    });
    return { ok: true };
  });
}
