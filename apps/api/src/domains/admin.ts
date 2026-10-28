import type { FastifyInstance } from "fastify";
import { db } from "@productscroll/database";
import { z } from "zod";
import {
  parse,
  requireUser,
  requireRole,
  publicUser,
  visiblePost,
  fail,
  idParams,
  audit,
  redis,
  jobs,
} from "../lib/core.js";
export async function adminRoutes(app: FastifyInstance) {
  app.post("/reports", async (req, reply) => {
    const user = await requireUser(req);
    const input = parse(
      z
        .object({
          reason: z.enum([
            "spam",
            "scam",
            "harassment",
            "hate",
            "nudity",
            "violence",
            "impersonation",
            "misinformation",
            "intellectual property",
            "other",
          ]),
          postId: z.string().optional(),
          userId: z.string().optional(),
          details: z.string().max(3000).default(""),
        })
        .strict()
        .refine(
          (v) => !!v.postId || !!v.userId,
          "Choose content or an account to report.",
        ),
      req.body,
    );
    if (input.postId) await visiblePost(input.postId, user.id);
    const report = await db.report.create({
      data: { ...input, reporterId: user.id },
    });
    return reply.code(201).send({ id: report.id, status: report.status });
  });
  app.get("/admin/stats", async (req) => {
    await requireRole(req, ["ADMIN", "MODERATOR"]);
    const [
      users,
      signups,
      reels,
      reports,
      media,
      failures,
      active,
      verification,
      jobsCount,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({
        where: { createdAt: { gte: new Date(Date.now() - 86400000) } },
      }),
      db.post.count({ where: { kind: "REEL", draft: false } }),
      db.report.count({ where: { status: "OPEN" } }),
      db.mediaAsset.aggregate({ _sum: { fileSizeBytes: true } }),
      db.jobFailure.count(),
      db.session.groupBy({
        by: ["userId"],
        where: {
          revokedAt: null,
          lastUsedAt: { gte: new Date(Date.now() - 86400000) },
        },
      }),
      db.verificationApplication.count({
        where: { status: "APPLICATION_SUBMITTED" },
      }),
      jobs.getJobCounts("active", "waiting", "failed"),
    ]);
    return {
      users,
      signupsToday: signups,
      reels,
      openReports: reports,
      storageBytes: media._sum.fileSizeBytes || 0,
      failedJobs: failures,
      activeUsers: active.length,
      verificationQueue: verification,
      jobs: jobsCount,
    };
  });
  app.get("/admin/reports", async (req) => {
    await requireRole(req, ["ADMIN", "MODERATOR"]);
    return {
      items: (
        await db.report.findMany({
          include: {
            reporter: true,
            user: true,
            post: { select: { id: true, caption: true, authorId: true } },
            actions: true,
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
      ).map((r) => ({
        ...r,
        reporter: publicUser(r.reporter),
        user: r.user ? publicUser(r.user) : null,
      })),
    };
  });
  app.post("/admin/reports/:id/action", async (req) => {
    const user = await requireRole(req, ["ADMIN", "MODERATOR"]);
    const { id } = parse(idParams, req.params);
    const { action, note } = parse(
      z
        .object({
          action: z.enum(["DISMISS", "REMOVE_CONTENT", "SUSPEND_USER", "WARN"]),
          note: z.string().trim().min(5).max(2000),
        })
        .strict(),
      req.body,
    );
    const report = await db.report.findUnique({
      where: { id },
      include: { post: true },
    });
    if (!report) fail(404, "REPORT_NOT_FOUND", "Report not found.");
    const target = report.userId || report.post?.authorId;
    if (action === "SUSPEND_USER" && target) {
      const targetUser = await db.user.findUnique({ where: { id: target } });
      if (targetUser?.role === "ADMIN")
        fail(
          403,
          "ADMIN_PROTECTED",
          "Administrator accounts require a separate operational review.",
        );
    }
    await db.$transaction(async (tx) => {
      if (action === "REMOVE_CONTENT" && report.postId)
        await tx.post.update({
          where: { id: report.postId },
          data: { removedAt: new Date() },
        });
      if (action === "SUSPEND_USER" && target) {
        await tx.user.update({
          where: { id: target },
          data: { suspended: true },
        });
        await tx.session.updateMany({
          where: { userId: target },
          data: { revokedAt: new Date() },
        });
      }
      await tx.report.update({ where: { id }, data: { status: "RESOLVED" } });
      await tx.moderationAction.create({
        data: { reportId: id, moderatorId: user.id, action, note },
      });
      await tx.auditLog.create({
        data: { actorId: user.id, action, targetId: id, detail: note },
      });
    });
    return { ok: true };
  });
  app.get("/admin/users", async (req) => {
    await requireRole(req, ["ADMIN"]);
    const { q } = parse(
      z.object({ q: z.string().max(100).default("") }),
      req.query,
    );
    const users = await db.user.findMany({
      where: q
        ? { OR: [{ username: { startsWith: q } }, { email: { equals: q } }] }
        : {},
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    return {
      items: users.map((u) => ({ ...publicUser(u), suspended: u.suspended })),
    };
  });
  app.patch("/admin/users/:id", async (req) => {
    const actor = await requireRole(req, ["ADMIN"]);
    const { id } = parse(idParams, req.params);
    const data = parse(z.object({ suspended: z.boolean() }).strict(), req.body);
    if (id === actor.id)
      fail(400, "SELF_SUSPEND", "You cannot suspend your own admin account.");
    await db.$transaction([
      db.user.update({ where: { id }, data }),
      db.session.updateMany({
        where: { userId: id },
        data: { revokedAt: new Date() },
      }),
    ]);
    await audit(actor.id, "USER_RESTRICTION", id, JSON.stringify(data));
    return { ok: true };
  });
  app.get("/admin/audit", async (req) => {
    await requireRole(req, ["ADMIN", "MODERATOR"]);
    return {
      items: await db.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    };
  });
  app.get("/admin/flags", async (req) => {
    await requireRole(req, ["ADMIN"]);
    return { items: await db.featureFlag.findMany() };
  });
  app.put("/admin/flags/:key", async (req) => {
    const actor = await requireRole(req, ["ADMIN"]);
    const { key } = parse(
      z.object({ key: z.string().regex(/^[a-z_]{3,60}$/) }),
      req.params,
    );
    const { enabled } = parse(z.object({ enabled: z.boolean() }), req.body);
    if (key === "investment_module" && enabled)
      fail(
        403,
        "MODULE_DISABLED",
        "Investment functionality is unavailable in this version.",
      );
    await db.featureFlag.upsert({
      where: { key },
      create: { key, enabled },
      update: { enabled },
    });
    await audit(actor.id, "FEATURE_FLAG", key, String(enabled));
    return { ok: true };
  });
  app.get("/admin/verifications", async (req) => {
    await requireRole(req, ["ADMIN", "MODERATOR"]);
    return {
      items: await db.verificationApplication.findMany({
        include: { startup: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    };
  });
  app.post("/admin/verifications/:id", async (req) => {
    const actor = await requireRole(req, ["ADMIN", "MODERATOR"]);
    const { id } = parse(idParams, req.params);
    const { approved, note } = parse(
      z.object({ approved: z.boolean(), note: z.string().min(5).max(2000) }),
      req.body,
    );
    const application = await db.verificationApplication.findUnique({
      where: { id },
    });
    if (!application)
      fail(404, "APPLICATION_NOT_FOUND", "Verification application not found.");
    const status = approved ? "VERIFIED" : "REJECTED";
    await db.$transaction([
      db.verificationApplication.update({
        where: { id },
        data: { status, note, reviewedAt: new Date() },
      }),
      db.startup.update({
        where: { id: application.startupId },
        data: { verificationStatus: status },
      }),
      db.auditLog.create({
        data: {
          actorId: actor.id,
          action: "VERIFICATION_REVIEW",
          targetId: id,
          detail: note,
        },
      }),
    ]);
    await redis.del("explore:public");
    return { ok: true };
  });
  app.post("/admin/categories", async (req) => {
    const actor = await requireRole(req, ["ADMIN"]);
    const input = parse(
      z
        .object({
          name: z.string().min(2).max(60),
          slug: z
            .string()
            .regex(/^[a-z0-9-]+$/)
            .max(60),
        })
        .strict(),
      req.body,
    );
    const category = await db.category.create({ data: input });
    await audit(actor.id, "CATEGORY_CREATE", category.id, category.name);
    return { category };
  });
  app.get("/admin/jobs", async (req) => {
    await requireRole(req, ["ADMIN"]);
    return {
      items: await db.jobFailure.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      counts: await jobs.getJobCounts(),
    };
  });
  app.post("/admin/jobs/:id/retry", async (req) => {
    const actor = await requireRole(req, ["ADMIN"]);
    const { id } = parse(idParams, req.params);
    const failure = await db.jobFailure.findUnique({ where: { id } });
    if (!failure) fail(404, "JOB_NOT_FOUND", "Failed job not found.");
    const job = await jobs.getJob(failure.jobId, failure.queue);
    if (!job)
      fail(
        404,
        "JOB_EXPIRED",
        "Job no longer exists; requeue from its source.",
      );
    await job.retry();
    await audit(actor.id, "JOB_RETRY", id, "Manual retry requested.");
    return { ok: true };
  });
  app.get("/admin/discovery/summary", async (req) => {
    await requireRole(req, ["ADMIN", "MODERATOR"]);
    const [products, startups, unclaimedFounders, reels] = await Promise.all([
      db.product.count(),
      db.startup.count(),
      db.user.count({ where: { role: "FOUNDER", emailVerifiedAt: null } }),
      db.post.count({ where: { kind: "REEL" } }),
    ]);
    return {
      products,
      startups,
      unclaimedFounders,
      reels,
      threshold: 75,
      sources: ["Hacker News Show HN", "GitHub Open Source", "Official Websites"],
      productHuntStatus: "Skipped (Commercial API credentials required per terms)",
    };
  });
  app.get("/admin/discovery/unclaimed", async (req) => {
    await requireRole(req, ["ADMIN"]);
    const items = await db.user.findMany({
      where: { role: "FOUNDER", emailVerifiedAt: null },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        createdAt: true,
        startups: { select: { id: true, name: true, slug: true, website: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return { items };
  });
}
