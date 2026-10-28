import { queues } from "../lib/queues.js";
import { mediaUrl } from "../lib/media-access.js";
import { limits, storageConfig } from "@productscroll/config";
import type { FastifyInstance } from "fastify";
import { db } from "@productscroll/database";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  parse,
  requireUser,
  fail,
  idParams,
  jobs,
  token,
  sessionUser,
  visibleWhere,
} from "../lib/core.js";
export const mediaRoot = path.resolve(
  process.env.MEDIA_DIR || "../../work/media",
);
const sign = (data: string) =>
  createHmac("sha256", process.env.SESSION_SECRET || "development-media-secret")
    .update(data)
    .digest("base64url");
const allowed = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;
const config = storageConfig();
const storage =
  config.driver === "r2"
    ? new S3Client({
        endpoint: config.endpoint,
        region: "auto",
        credentials: config.credentials,
        requestChecksumCalculation: "WHEN_REQUIRED",
        responseChecksumValidation: "WHEN_REQUIRED",
        maxAttempts: 3,
        requestHandler: { connectionTimeout: 5000, requestTimeout: 120000 },
      })
    : null;
export async function mediaRoutes(app: FastifyInstance) {
  if (config.driver === "local")
    app.addContentTypeParser(
      [...allowed, "application/octet-stream"],
      { parseAs: "buffer", bodyLimit: limits.videoBytes },
      (_req, body, done) => done(null, body),
    );
  app.post("/media/upload-url", async (req) => {
    const user = await requireUser(req);
    const input = parse(
      z
        .object({
          filename: z.string().min(1).max(200),
          mimeType: z.enum(allowed),
          size: z.number().int().positive().max(limits.videoBytes),
        })
        .strict(),
      req.body,
    );
    if (input.mimeType.startsWith("image/") && input.size > limits.imageBytes)
      fail(400, "FILE_TOO_LARGE", "Images must be smaller than 15 MB.");
    const backlog = await queues
      .get("productscroll-media")!
      .getJobCounts("waiting", "active", "delayed");
    if (
      Object.values(backlog).reduce((sum, count) => sum + count, 0) >=
      Number(process.env.MEDIA_QUEUE_MAX_BACKLOG || 200)
    )
      fail(
        503,
        "UPLOAD_BUSY",
        "Video processing is busy. Please try again shortly.",
      );
    const asset = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${user.id}, 0))::text`;
      const recent = await tx.mediaAsset.aggregate({
        where: {
          ownerId: user.id,
          createdAt: { gt: new Date(Date.now() - 86400000) },
        },
        _sum: { fileSizeBytes: true },
      });
      if (
        (recent._sum.fileSizeBytes || 0) + input.size >
        limits.dailyUploadBytes
      )
        fail(429, "UPLOAD_QUOTA", "Daily upload limit reached.");
      return await tx.mediaAsset.create({
        data: {
          ownerId: user.id,
          storageKey: `incoming/${token()}`,
          mimeType: input.mimeType,
          fileSizeBytes: input.size,
          mediaType: input.mimeType.startsWith("video/") ? "VIDEO" : "IMAGE",
        },
      });
    });
    let uploadUrl: string;
    if (config.driver === "r2")
      uploadUrl = await getSignedUrl(
        storage!,
        new PutObjectCommand({
          Bucket: config.driver === "r2" ? config.uploadBucket : "",
          Key: asset.storageKey,
          ContentType: input.mimeType,
          ContentLength: input.size,
        }),
        { expiresIn: 600 },
      );
    else {
      const expires = Date.now() + 600000;
      const payload = `${asset.id}.${expires}`;
      const base = process.env.PUBLIC_API_URL
        ? process.env.PUBLIC_API_URL.replace(/\/api\/?$/, "")
        : "";
      uploadUrl = `${base}/api/uploads/${asset.id}?expires=${expires}&signature=${sign(payload)}`;
    }
    return {
      assetId: asset.id,
      uploadUrl,
      method: "PUT",
      headers: { "Content-Type": input.mimeType },
    };
  });
  if (config.driver === "local")
    app.put("/uploads/:id", { bodyLimit: limits.videoBytes }, async (req) => {
      if (config.driver !== "local")
        fail(404, "NOT_FOUND", "Local uploads are disabled.");
      const { id } = parse(idParams, req.params);
      const { expires, signature } = parse(
        z.object({
          expires: z.coerce.number(),
          signature: z.string().max(100),
        }),
        req.query,
      );
      const expected = sign(`${id}.${expires}`);
      if (
        expires < Date.now() ||
        Buffer.byteLength(expected) !== Buffer.byteLength(signature) ||
        !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
      )
        fail(403, "UPLOAD_SIGNATURE", "Upload authorization expired.");
      const asset = await db.mediaAsset.findUnique({ where: { id } });
      if (!asset || asset.processingStatus !== "PENDING")
        fail(400, "UPLOAD_STATE", "This upload is not pending.");
      if (
        !Buffer.isBuffer(req.body) ||
        req.body.length !== asset.fileSizeBytes ||
        req.headers["content-type"] !== asset.mimeType
      )
        fail(400, "UPLOAD_MISMATCH", "Upload type or size does not match.");
      await mkdir(path.join(mediaRoot, "incoming"), { recursive: true });
      await writeFile(path.join(mediaRoot, asset.storageKey), req.body, {
        flag: "wx",
      }).catch((error: NodeJS.ErrnoException) => {
        if (error.code === "EEXIST")
          fail(409, "UPLOAD_EXISTS", "This file has already been uploaded.");
        throw error;
      });
      return { ok: true };
    });
  app.post("/media/:id/complete", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    const asset = await db.mediaAsset.findFirst({
      where: { id, ownerId: user.id },
    });
    if (!asset) fail(404, "MEDIA_NOT_FOUND", "Media not found.");
    if (asset.processingStatus === "READY")
      return {
        media: {
          id: asset.id,
          processingStatus: "READY",
          url: mediaUrl(asset.processedUrl),
        },
      };
    if (asset.processingStatus === "PROCESSING")
      return { media: { id: asset.id, processingStatus: "PROCESSING" } };
    if (config.driver === "r2") {
      const object = await storage!.send(
        new HeadObjectCommand({
          Bucket: config.driver === "r2" ? config.uploadBucket : "",
          Key: asset.storageKey,
        }),
      );
      if (
        object.ContentLength !== asset.fileSizeBytes ||
        object.ContentType !== asset.mimeType
      )
        fail(400, "UPLOAD_INCOMPLETE", "Upload is incomplete.");
    } else {
      const file = await stat(path.join(mediaRoot, asset.storageKey)).catch(
        () => null,
      );
      if (!file || file.size !== asset.fileSizeBytes)
        fail(400, "UPLOAD_INCOMPLETE", "Upload is incomplete.");
    }
    await db.mediaAsset.update({
      where: { id },
      data: { processingStatus: "PROCESSING", failureReason: null },
    });
    await jobs.add("media", { assetId: id }, { jobId: `media-${id}` });
    return { media: { id, processingStatus: "PROCESSING" } };
  });
  app.get("/media/:id/playback", async (req) => {
    const user = await sessionUser(req);
    const { id } = parse(idParams, req.params);
    const visible = await visibleWhere(user?.id);
    const asset = await db.mediaAsset.findFirst({
      where: {
        id,
        processingStatus: "READY",
        OR: [
          ...(user
            ? [
                { ownerId: user.id },
                {
                  messages: {
                    some: {
                      message: {
                        conversation: {
                          members: { some: { userId: user.id } },
                        },
                        unsentAt: null,
                        hiddenFor: { none: { userId: user.id } },
                      },
                    },
                  },
                },
              ]
            : []),
          { posts: { some: { post: visible } } },
        ],
      },
    });
    if (!asset) fail(404, "MEDIA_NOT_FOUND", "Media not found.");
    return {
      url: mediaUrl(asset.processedUrl),
      thumbnailUrl: mediaUrl(asset.thumbnailUrl),
    };
  });
  app.get("/media/:id", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    const asset = await db.mediaAsset.findFirst({
      where: { id, ownerId: user.id },
    });
    if (!asset) fail(404, "MEDIA_NOT_FOUND", "Media not found.");
    return {
      media: {
        id,
        mediaType: asset.mediaType,
        processingStatus: asset.processingStatus,
        url: mediaUrl(asset.processedUrl),
        thumbnailUrl: mediaUrl(asset.thumbnailUrl),
        width: asset.width,
        height: asset.height,
        durationMs: asset.durationMs,
        error:
          asset.processingStatus === "FAILED"
            ? "This media could not be processed. Please use another file."
            : undefined,
      },
    };
  });
}
