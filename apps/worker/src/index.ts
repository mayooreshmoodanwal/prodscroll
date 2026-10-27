import { Worker, Queue, type Job } from "bullmq";
import { db, Prisma } from "@productscroll/database";
import { Redis } from "ioredis";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";
import { processMedia, removeIncoming } from "./media.js";
const connection = { url: process.env.REDIS_URL || "redis://localhost:6379" };
const redis = new Redis(connection.url, { maxRetriesPerRequest: null });
const deadLetter = new Queue("productscroll-dead-letter", {
  connection,
  defaultJobOptions: { removeOnComplete: 2000, removeOnFail: 2000 },
});
const queueNames = [
  "productscroll",
  "productscroll-media",
  "productscroll-events",
  "productscroll-fanout",
];
const queues = new Map(
  queueNames.map((name) => [
    name,
    new Queue(name, {
      connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 1000,
        removeOnFail: 2000,
      },
    }),
  ]),
);
const fanoutQueue = queues.get("productscroll-fanout")!;
interface Event {
  type: string;
  postId?: string;
  startupId?: string;
  value?: number;
}
export interface EmailProvider {
  send(to: string, subject: string, text: string, id: string): Promise<void>;
}
export interface PushProvider {
  send(userId: string, title: string, body: string, id: string): Promise<void>;
}
class LocalEmailProvider implements EmailProvider {
  async send(to: string, subject: string, text: string, id: string) {
    const dir = path.resolve(process.env.MAIL_DIR || "../../work/mail");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, `${id}.txt`),
      `To: ${to}\nSubject: ${subject}\n\n${text}`,
    );
  }
}
class SmtpEmailProvider implements EmailProvider {
  async send(to: string, subject: string, text: string) {
    await nodemailer
      .createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 1025),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
          : undefined,
      })
      .sendMail({ from: process.env.SMTP_FROM, to, subject, text });
  }
}
class LocalPushProvider implements PushProvider {
  async send(userId: string, title: string, body: string, id: string) {
    const dir = path.resolve(process.env.PUSH_DIR || "../../work/push");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, `${id}.json`),
      JSON.stringify({ userId, title, body }),
    );
  }
}
export const emailProvider: EmailProvider =
  process.env.EMAIL_DRIVER === "smtp"
    ? new SmtpEmailProvider()
    : new LocalEmailProvider();
export const pushProvider: PushProvider = new LocalPushProvider();
async function processJob(job: Job, queueName: string) {
  const marker = `job:done:${queueName}:${job.id}`;
  // Event inserts have deterministic database IDs; avoid one Redis key per analytics batch.
  const needsMarker = job.name !== "events";
  if (needsMarker && (await redis.exists(marker))) return;
  switch (job.name) {
    case "media":
      await processMedia((job.data as { assetId: string }).assetId);
      break;
    case "email": {
      const { to, subject, text } = job.data as {
        to: string;
        subject: string;
        text: string;
      };
      await emailProvider.send(to, subject, text, String(job.id));
      break;
    }
    case "deliver-notification": {
      const { notificationId } = job.data as { notificationId: string };
      const notification = await db.notification.findUnique({
        where: { id: notificationId },
        include: { user: true },
      });
      if (!notification) break;
      const preference = await db.notificationPreference.findUnique({
        where: { userId: notification.userId },
      });
      if (preference?.email)
        await emailProvider.send(
          notification.user.email,
          "Your ProductScroll community",
          notification.body,
          String(job.id),
        );
      if (preference?.push)
        await pushProvider.send(
          notification.userId,
          "ProductScroll",
          notification.body,
          String(job.id),
        );
      break;
    }
    case "events": {
      const { userId, events } = job.data as {
        userId: string;
        events: Event[];
      };
      if (!(await db.user.findUnique({ where: { id: userId } }))) return;
      const ids = [
        ...new Set(events.flatMap((e) => (e.postId ? [e.postId] : []))),
      ];
      const existing = new Set(
        (
          await db.post.findMany({
            where: { id: { in: ids } },
            select: { id: true },
          })
        ).map((p) => p.id),
      );
      const valid = events.filter((e) => !e.postId || existing.has(e.postId));
      await db.$transaction([
        db.engagementEvent.createMany({
          data: valid.map((e, index) => ({
            id: `job-${queueName}-${job.id}-event-${index}`,
            userId,
            ...e,
          })),
          skipDuplicates: true,
        }),
        db.feedImpression.createMany({
          data: valid
            .filter((e) => e.type === "FEED_IMPRESSION" && e.postId)
            .map((e, index) => ({
              id: `job-${queueName}-${job.id}-impression-${index}`,
              userId,
              postId: e.postId!,
            })),
          skipDuplicates: true,
        }),
      ]);
      break;
    }
    case "post-notifications": {
      const { postId, after } = job.data as { postId: string; after?: string };
      const post = await db.post.findUnique({
        where: { id: postId },
        include: { author: true, startup: true },
      });
      if (
        !post ||
        post.draft ||
        post.removedAt ||
        !post.startupId ||
        post.author.suspended ||
        post.author.deactivatedAt
      )
        break;
      const followers = await db.startupFollow.findMany({
        where: {
          startupId: post.startupId,
          userId: after ? { gt: after } : undefined,
          user: {
            suspended: false,
            deactivatedAt: null,
            blocked: { none: { blockedId: post.authorId } },
            blockedBy: { none: { blockerId: post.authorId } },
            mutes: { none: { mutedId: post.authorId } },
            ...(post.author.privateAccount
              ? {
                  following: {
                    some: { followingId: post.authorId, accepted: true },
                  },
                }
              : {}),
          },
        },
        include: { user: { select: { notificationPreference: true } } },
        orderBy: { userId: "asc" },
        take: 250,
      });
      const targets = followers.filter(
        (f) =>
          f.userId !== post.authorId &&
          f.user.notificationPreference?.inApp !== false,
      );
      const data = targets.map((f) => ({
        id: `launch-${postId}-${f.userId}`,
        userId: f.userId,
        actorId: post.authorId,
        type: "STARTUP_POST",
        postId,
        startupId: post.startupId,
        body: `${post.startup?.name} shared a new update.`,
      }));
      if (data.length) {
        await db.notification.createMany({ data, skipDuplicates: true });
        const notifications = await db.notification.findMany({
          where: { id: { in: data.map((n) => n.id) } },
        });
        const pipeline = redis.pipeline();
        for (const notification of notifications)
          pipeline.publish(
            `productscroll:realtime:${notification.userId}`,
            JSON.stringify({
              userIds: [notification.userId],
              event: { type: "notification", notification },
            }),
          );
        await pipeline.exec();
        await queues.get("productscroll")!.addBulk(
          targets
            .filter(
              (f) =>
                f.user.notificationPreference?.push ||
                f.user.notificationPreference?.email,
            )
            .map((f) => ({
              name: "deliver-notification",
              data: { notificationId: `launch-${postId}-${f.userId}` },
              opts: { jobId: `push-${postId}-${f.userId}` },
            })),
        );
      }
      // One bounded page per job prevents a celebrity launch monopolizing a worker.
      if (followers.length === 250) {
        const next = followers.at(-1)!.userId;
        await fanoutQueue.add(
          "post-notifications",
          { postId, after: next },
          { jobId: `fanout-${postId}-${next}` },
        );
      }
      break;
    }
    case "reconcile": {
      const { after } = job.data as { after?: string };
      const rows = await db.post.findMany({
        where: { id: after ? { gt: after } : undefined },
        select: { id: true },
        orderBy: { id: "asc" },
        take: 250,
      });
      if (rows.length)
        await db.$executeRaw(
          Prisma.sql`UPDATE "Post" p SET "likeCount"=(SELECT COUNT(*)::integer FROM "Like" l WHERE l."postId"=p.id), "saveCount"=(SELECT COUNT(*)::integer FROM "Save" s WHERE s."postId"=p.id), "commentCount"=(SELECT COUNT(*)::integer FROM "Comment" c WHERE c."postId"=p.id) WHERE p.id IN (${Prisma.join(rows.map((row) => row.id))})`,
        );
      if (rows.length === 250)
        await fanoutQueue.add("reconcile", { after: rows.at(-1)!.id });
      break;
    }
    case "cleanup": {
      const expired = await db.mediaAsset.findMany({
        where: {
          processingStatus: { in: ["PENDING", "FAILED"] },
          createdAt: { lt: new Date(Date.now() - 86400000) },
          posts: { none: {} },
          messages: { none: {} },
        },
        take: 500,
      });
      for (const asset of expired) {
        await removeIncoming(asset.storageKey);
        await db.mediaAsset.delete({ where: { id: asset.id } });
      }
      if (expired.length === 500) await fanoutQueue.add("cleanup", {});
      break;
    }
    default:
      throw new Error(`Unknown job type ${job.name}`);
  }
  if (needsMarker) await redis.set(marker, "1", "EX", 7 * 86400);
}
const enabled = new Set(
  (process.env.WORKER_QUEUES || "default,media,events,fanout").split(","),
);
const workers: Worker[] = [];
for (const [index, group] of [
  "default",
  "media",
  "events",
  "fanout",
].entries()) {
  if (!enabled.has(group)) continue;
  const queueName = queueNames[index];
  const defaults = [8, 1, 4, 1];
  const concurrency = Number(
    process.env[`WORKER_${group.toUpperCase()}_CONCURRENCY`] || defaults[index],
  );
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 64)
    throw new Error(`Invalid ${group} worker concurrency`);
  const worker = new Worker(queueName, (job) => processJob(job, queueName), {
    connection,
    concurrency,
    lockDuration: 120000,
  });
  workers.push(worker);
  worker.on("completed", (job) =>
    console.log(
      JSON.stringify({
        level: "info",
        event: "job.completed",
        id: job.id,
        name: job.name,
      }),
    ),
  );
  worker.on("failed", (job, error) => {
    void (async () => {
      console.error(
        JSON.stringify({
          level: "error",
          event: "job.failed",
          jobId: job?.id,
          name: job?.name,
          attempt: job?.attemptsMade,
        }),
      );
      if (!job || job.attemptsMade < (job.opts.attempts || 1)) return;
      if (job.name === "media")
        await db.mediaAsset.updateMany({
          where: { id: (job.data as { assetId: string }).assetId },
          data: {
            processingStatus: "FAILED",
            failureReason: "Processing failed validation or exhausted retries.",
          },
        });
      await db.jobFailure.upsert({
        where: { queue_jobId: { queue: queueName, jobId: String(job.id) } },
        create: {
          queue: queueName,
          jobId: String(job.id),
          reason: error.message.slice(0, 500),
          attempts: job.attemptsMade,
        },
        update: {
          reason: error.message.slice(0, 500),
          attempts: job.attemptsMade,
        },
      });
      await deadLetter.add(
        job.name,
        {
          originalJobId: job.id,
          queue: queueName,
          reason: "Retries exhausted",
        },
        { jobId: `dead-${queueName}-${job.id}` },
      );
    })().catch(() => console.error("Could not persist job failure"));
  });
}
const queue = fanoutQueue;
// Remove schedules left by the previous single-queue deployment.
await queues.get("productscroll")!.removeJobScheduler("hourly-reconcile");
await queues.get("productscroll")!.removeJobScheduler("daily-cleanup");
if (process.env.ENABLE_COUNTER_RECONCILIATION === "true")
  await queue.upsertJobScheduler(
    "hourly-reconcile",
    { every: 3600000 },
    {
      name: "reconcile",
      data: {},
      opts: { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
    },
  );
else await queue.removeJobScheduler("hourly-reconcile");
await queue.upsertJobScheduler(
  "daily-cleanup",
  { every: 86400000 },
  {
    name: "cleanup",
    data: {},
    opts: { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
  },
);
console.log(JSON.stringify({ level: "info", event: "worker.ready" }));
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    void (async () => {
      await Promise.all(workers.map((worker) => worker.close()));
      await Promise.all([...queues.values()].map((queue) => queue.close()));
      await deadLetter.close();
      await redis.quit();
      await db.$disconnect();
      process.exit(0);
    })();
  });
