import { accountExport } from "../lib/account-export.js";
import type { FastifyInstance } from "fastify";
import { db, Prisma } from "@productscroll/database";
import { z } from "zod";
import {
  parse,
  requireUser,
  sessionUser,
  publicUser,
  blocked,
  visibleWhere,
  visiblePost,
  fail,
  idParams,
  pageQuery,
  page,
  decodeCursor,
  notify,
  verifyPassword,
  audit,
  redis,
} from "../lib/core.js";
import {
  postInclude,
  presentPost,
  startupInclude,
  presentStartup,
} from "../lib/presenters.js";
const url = z
  .string()
  .url()
  .max(500)
  .refine((v) => /^https?:\/\//.test(v), "Use an HTTP or HTTPS URL.");
export async function socialRoutes(app: FastifyInstance) {
  app.get("/categories", async () => ({
    items: (await db.category.findMany({ orderBy: { name: "asc" } })).map(
      (c) => c.name,
    ),
  }));
  app.put("/users/me/onboarding", async (req) => {
    const user = await requireUser(req, false);
    const { interests } = parse(
      z.object({ interests: z.array(z.string()).min(3).max(10) }).strict(),
      req.body,
    );
    const categories = await db.category.findMany({
      where: { name: { in: interests } },
    });
    if (categories.length !== new Set(interests).size)
      fail(400, "INVALID_INTERESTS", "Select available categories.");
    await db.$transaction([
      db.userInterest.deleteMany({ where: { userId: user.id } }),
      db.userInterest.createMany({
        data: categories.map((c) => ({ categoryId: c.id, userId: user.id })),
        skipDuplicates: true,
      }),
      db.user.update({ where: { id: user.id }, data: { onboarded: true } }),
    ]);
    return { user: { ...publicUser({ ...user, onboarded: true }), interests } };
  });
  app.patch("/users/me", async (req) => {
    const user = await requireUser(req);
    const input = parse(
      z
        .object({
          displayName: z.string().trim().min(2).max(60).optional(),
          bio: z.string().max(300).optional(),
          location: z.string().max(100).optional(),
          website: url.or(z.literal("")).optional(),
          privateAccount: z.boolean().optional(),
          activityVisible: z.boolean().optional(),
          messageControl: z
            .enum(["EVERYONE", "FOLLOWING", "NOBODY"])
            .optional(),
        })
        .strict(),
      req.body,
    );
    const updated = await db.user.update({
      where: { id: user.id },
      data: input,
    });
    await redis.del("explore:public");
    return { user: publicUser(updated) };
  });
  app.get(
    "/users/me/export",
    { config: { rateLimit: { max: 2, timeWindow: "1 hour" } } },
    async (req, reply) => {
      const user = await requireUser(req);
      return reply
        .type("application/json")
        .header(
          "Content-Disposition",
          'attachment; filename="productscroll-account.json"',
        )
        .header("Cache-Control", "private, no-store")
        .send(
          accountExport(user.id, { ...publicUser(user), email: user.email }),
        );
    },
  );
  app.post("/users/me/deactivate", async (req) => {
    const user = await requireUser(req);
    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { deactivatedAt: new Date() },
      }),
      db.session.updateMany({
        where: { userId: user.id },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { ok: true };
  });
  app.delete("/users/me", async (req) => {
    const user = await requireUser(req);
    const { password } = parse(
      z.object({ password: z.string().max(128) }),
      req.body,
    );
    if (!(await verifyPassword(password, user.passwordHash)))
      fail(
        401,
        "INVALID_CREDENTIALS",
        "Confirm your password to delete your account.",
      );
    if (await db.startup.count({ where: { ownerId: user.id } }))
      fail(
        409,
        "TRANSFER_STARTUPS",
        "Transfer or delete your startups before deleting your account.",
      );
    await audit(
      user.id,
      "ACCOUNT_DELETE",
      user.id,
      "User requested account deletion.",
    );
    await db.user.delete({ where: { id: user.id } });
    return { ok: true };
  });
  app.get("/users/:username", async (req) => {
    const viewer = await sessionUser(req);
    const { username } = parse(
      z.object({ username: z.string().max(30) }),
      req.params,
    );
    const user = await db.user.findUnique({
      where: { username },
      include: {
        _count: {
          select: {
            posts: { where: { draft: false, removedAt: null } },
            followers: { where: { accepted: true } },
            following: { where: { accepted: true } },
          },
        },
      },
    });
    if (
      !user ||
      user.suspended ||
      user.deactivatedAt ||
      (viewer && (await blocked(viewer.id, user.id)))
    )
      fail(404, "USER_NOT_FOUND", "Profile not found.");
    const follow = viewer
      ? await db.userFollow.findUnique({
          where: {
            followerId_followingId: {
              followerId: viewer.id,
              followingId: user.id,
            },
          },
        })
      : null;
    const canView =
      !user.privateAccount || viewer?.id === user.id || follow?.accepted;
    const posts = canView
      ? await db.post.findMany({
          where: {
            AND: [await visibleWhere(viewer?.id), { authorId: user.id }],
          },
          include: postInclude(viewer?.id),
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : [];
    const startups = canView
      ? await db.startup.findMany({
          where: { ownerId: user.id },
          include: startupInclude,
        })
      : [];
    return {
      user: {
        ...publicUser(user),
        postCount: canView ? user._count.posts : 0,
        followerCount: user._count.followers,
        followingCount: user._count.following,
        following: !!follow?.accepted,
        followRequested: !!follow && !follow.accepted,
      },
      posts: posts.map(presentPost),
      startups: startups.map(presentStartup),
    };
  });
  app.put("/users/:id/follow", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    const { following } = parse(
      z.object({ following: z.boolean() }).strict(),
      req.body,
    );
    if (id === user.id) fail(400, "SELF_FOLLOW", "You cannot follow yourself.");
    const target = await db.user.findUnique({ where: { id } });
    if (
      !target ||
      target.suspended ||
      target.deactivatedAt ||
      (await blocked(user.id, id))
    )
      fail(404, "USER_NOT_FOUND", "Profile not found.");
    if (following)
      await db.userFollow.createMany({
        data: {
          followerId: user.id,
          followingId: id,
          accepted: !target.privateAccount,
        },
        skipDuplicates: true,
      });
    else
      await db.userFollow.deleteMany({
        where: { followerId: user.id, followingId: id },
      });
    if (following)
      await notify(
        id,
        user.id,
        "FOLLOW",
        target.privateAccount
          ? `${user.displayName} requested to follow you.`
          : `${user.displayName} followed you.`,
      );
    return {
      following: following && !target.privateAccount,
      requested: following && target.privateAccount,
    };
  });
  app.get("/users/me/follow-requests", async (req) => {
    const u = await requireUser(req);
    const rows = await db.userFollow.findMany({
      where: { followingId: u.id, accepted: false },
      include: { follower: true },
    });
    return { items: rows.map((r) => publicUser(r.follower)) };
  });
  app.put("/users/:id/follow-request", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    const { accepted } = parse(z.object({ accepted: z.boolean() }), req.body);
    if (accepted)
      await db.userFollow.updateMany({
        where: { followerId: id, followingId: user.id },
        data: { accepted: true },
      });
    else
      await db.userFollow.deleteMany({
        where: { followerId: id, followingId: user.id },
      });
    return { ok: true };
  });
  app.delete("/users/:id/follower", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    await db.userFollow.deleteMany({
      where: { followingId: user.id, followerId: id },
    });
    return { ok: true };
  });
  app.post("/users/:id/block", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    if (id === user.id) fail(400, "SELF_BLOCK", "You cannot block yourself.");
    await db.$transaction([
      db.block.createMany({
        data: { blockerId: user.id, blockedId: id },
        skipDuplicates: true,
      }),
      db.userFollow.deleteMany({
        where: {
          OR: [
            { followerId: user.id, followingId: id },
            { followerId: id, followingId: user.id },
          ],
        },
      }),
    ]);
    return { ok: true };
  });
  app.delete("/users/:id/block", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    await db.block.deleteMany({ where: { blockerId: user.id, blockedId: id } });
    return { ok: true };
  });
  app.put("/users/:id/mute", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    const { muted } = parse(z.object({ muted: z.boolean() }), req.body);
    if (muted)
      await db.mute.createMany({
        data: { muterId: user.id, mutedId: id },
        skipDuplicates: true,
      });
    else await db.mute.deleteMany({ where: { muterId: user.id, mutedId: id } });
    return { ok: true };
  });
  app.get("/posts/:id/comments", async (req) => {
    const user = await sessionUser(req);
    const { id } = parse(idParams, req.params);
    const { cursor, limit, sort } = parse(
      pageQuery.extend({ sort: z.enum(["new", "top"]).default("new") }),
      req.query,
    );
    await visiblePost(id, user?.id);
    if (sort === "top") {
      let position: { likes: number; date: string; id: string } | undefined;
      if (cursor) {
        try {
          position = z
            .object({
              likes: z.number().int().nonnegative(),
              date: z.string().datetime(),
              id: z.string().min(1),
            })
            .parse(JSON.parse(Buffer.from(cursor, "base64url").toString()));
        } catch {
          fail(400, "INVALID_CURSOR", "Invalid comment cursor.");
        }
      }
      const boundary = position
        ? Prisma.sql`WHERE (ranked.likes, ranked."createdAt", ranked.id) < (${position.likes}, ${position.date}::timestamp(3), ${position.id})`
        : Prisma.empty;
      const ranked = await db.$queryRaw<
        Array<{ id: string; createdAt: Date; likes: number }>
      >(Prisma.sql`
        WITH ranked AS (
          SELECT c.id, c."createdAt", COUNT(l."userId")::integer AS likes
          FROM "Comment" c LEFT JOIN "CommentLike" l ON l."commentId" = c.id
          WHERE c."postId" = ${id} GROUP BY c.id
        ) SELECT * FROM ranked ${boundary} ORDER BY likes DESC, "createdAt" DESC, id DESC LIMIT ${limit + 1}`);
      const selection = ranked.slice(0, limit);
      const records = await db.comment.findMany({
        where: { id: { in: selection.map((c) => c.id) } },
        include: { author: true },
      });
      const lookup = new Map(records.map((c) => [c.id, c]));
      const last = selection.at(-1),
        hasMore = ranked.length > limit;
      return {
        items: selection.flatMap((c) => {
          const record = lookup.get(c.id);
          return record
            ? [
                {
                  id: record.id,
                  body: record.body,
                  parentId: record.parentId,
                  createdAt: record.createdAt,
                  author: publicUser(record.author),
                  likeCount: c.likes,
                },
              ]
            : [];
        }),
        hasMore,
        nextCursor:
          hasMore && last
            ? Buffer.from(
                JSON.stringify({
                  likes: last.likes,
                  date: last.createdAt.toISOString(),
                  id: last.id,
                }),
              ).toString("base64url")
            : null,
      };
    }
    const result = page(
      await db.comment.findMany({
        where: { postId: id, ...decodeCursor(cursor) },
        include: { author: true, _count: { select: { likes: true } } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
      }),
      limit,
    );
    const items = result.items.map((c) => ({
      id: c.id,
      body: c.body,
      parentId: c.parentId,
      createdAt: c.createdAt,
      author: publicUser(c.author),
      likeCount: c._count.likes,
    }));
    return { ...result, items };
  });
  app.post("/posts/:id/comments", async (req, reply) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    const input = parse(
      z
        .object({
          body: z.string().trim().min(1).max(2000),
          parentId: z.string().optional(),
        })
        .strict(),
      req.body,
    );
    const post = await visiblePost(id, user.id);
    if (input.parentId) {
      const parent = await db.comment.findUnique({
        where: { id: input.parentId },
      });
      if (!parent || parent.postId !== id)
        fail(400, "COMMENT_PARENT", "Reply must belong to this post.");
      if (parent.parentId) input.parentId = parent.parentId;
    }
    const comment = await db.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: { ...input, postId: id, authorId: user.id },
      });
      await tx.post.update({
        where: { id },
        data: { commentCount: { increment: 1 } },
      });
      return comment;
    });
    await notify(
      post.authorId,
      user.id,
      "COMMENT",
      `${user.displayName} commented on your post.`,
      id,
    );
    if (input.parentId) {
      const p = await db.comment.findUnique({ where: { id: input.parentId } });
      if (p)
        await notify(
          p.authorId,
          user.id,
          "REPLY",
          `${user.displayName} replied to your comment.`,
          id,
        );
    }
    const mentions = [...input.body.matchAll(/@([a-z0-9_]{3,24})/g)]
      .map((m) => m[1])
      .slice(0, 10);
    const mentioned = await db.user.findMany({
      where: { username: { in: mentions } },
    });
    for (const target of mentioned)
      if (!(await blocked(user.id, target.id)))
        await notify(
          target.id,
          user.id,
          "MENTION",
          `${user.displayName} mentioned you in a comment.`,
          id,
        );
    return reply.code(201).send({
      comment: { ...comment, author: publicUser(user), likeCount: 0 },
    });
  });
  app.patch("/comments/:id", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    const { body } = parse(
      z.object({ body: z.string().trim().min(1).max(2000) }).strict(),
      req.body,
    );
    const comment = await db.comment.findFirst({
      where: {
        id,
        authorId: user.id,
        createdAt: { gt: new Date(Date.now() - 15 * 60000) },
      },
    });
    if (!comment)
      fail(403, "EDIT_WINDOW_CLOSED", "Comments can be edited for 15 minutes.");
    await visiblePost(comment.postId, user.id);
    return {
      comment: await db.comment.update({ where: { id }, data: { body } }),
    };
  });
  app.delete("/comments/:id", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    const comment = await db.comment.findFirst({
      where: { id, authorId: user.id },
    });
    if (!comment) fail(404, "COMMENT_NOT_FOUND", "Comment not found.");
    await db.$transaction(async (tx) => {
      const count = await tx.comment.count({
        where: { OR: [{ id }, { parentId: id }] },
      });
      await tx.comment.delete({ where: { id } });
      await tx.post.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: count } },
      });
    });
    return { ok: true };
  });
  app.put("/comments/:id/like", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    const { liked } = parse(z.object({ liked: z.boolean() }), req.body);
    const c = await db.comment.findUnique({ where: { id } });
    if (!c) fail(404, "COMMENT_NOT_FOUND", "Comment not found.");
    await visiblePost(c.postId, user.id);
    if (liked)
      await db.commentLike.createMany({
        data: { userId: user.id, commentId: id },
        skipDuplicates: true,
      });
    else
      await db.commentLike.deleteMany({
        where: { userId: user.id, commentId: id },
      });
    return {
      liked,
      likeCount: await db.commentLike.count({ where: { commentId: id } }),
    };
  });
  app.get("/notifications", async (req) => {
    const user = await requireUser(req);
    const { cursor, limit } = parse(pageQuery, req.query);
    const result = page(
      await db.notification.findMany({
        where: { userId: user.id, ...decodeCursor(cursor) },
        include: { actor: true },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
      }),
      limit,
    );
    return {
      ...result,
      items: result.items.map((n) => ({
        ...n,
        actor: n.actor ? publicUser(n.actor) : null,
      })),
    };
  });
  app.put("/notifications/read", async (req) => {
    const user = await requireUser(req);
    const { ids } = parse(
      z.object({ ids: z.array(z.string()).max(100).optional() }),
      req.body || {},
    );
    await db.notification.updateMany({
      where: { userId: user.id, id: ids ? { in: ids } : undefined },
      data: { readAt: new Date() },
    });
    return { ok: true };
  });
  app.get("/notifications/preferences", async (req) => {
    const user = await requireUser(req);
    return (
      (await db.notificationPreference.findUnique({
        where: { userId: user.id },
      })) || { inApp: true, push: false, email: false }
    );
  });
  app.put("/notifications/preferences", async (req) => {
    const user = await requireUser(req);
    const data = parse(
      z
        .object({ inApp: z.boolean(), push: z.boolean(), email: z.boolean() })
        .strict(),
      req.body,
    );
    return db.notificationPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    });
  });
}
