import { mediaUrl } from "./media-access.js";
import type { FastifyRequest } from "fastify";
import { db, Prisma, type User } from "@productscroll/database";
import { z } from "zod";
import { Redis } from "ioredis";
import { jobs } from "./queues.js";
export { jobs } from "./queues.js";
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { jwtVerify, SignJWT } from "jose";
export const redis = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  { maxRetriesPerRequest: 1, commandTimeout: 3000, connectTimeout: 3000 },
);
export const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "local-development-secret-not-for-production",
);
export const token = () => randomBytes(32).toString("base64url");
export const hash = (text: string) =>
  createHash("sha256").update(text).digest("hex");
const scrypt = promisify(scryptCallback);
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(password: string, encoded: string | null) {
  const [, salt, expected] = (encoded || "").split(":");
  const result = (await scrypt(
    password,
    salt || "dummy-password-salt",
    64,
  )) as Buffer;
  return (
    !!expected &&
    result.length === Buffer.from(expected, "hex").length &&
    timingSafeEqual(result, Buffer.from(expected, "hex"))
  );
}
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function fail(status: number, code: string, message: string): never {
  throw new AppError(status, code, message);
}
export { idParams, pageQuery } from "@productscroll/validation";
export function parse<T extends z.ZodTypeAny>(
  schema: T,
  input: unknown,
): z.output<T> {
  return schema.parse(input);
}
export const publicUser = (u: User) => ({
  id: u.id,
  username: u.username,
  displayName: u.displayName,
  bio: u.bio,
  avatarUrl: mediaUrl(u.avatarUrl),
  role: u.role,
  onboarded: u.onboarded,
  verified: !!u.emailVerifiedAt,
  location: u.location,
  website: u.website,
  privateAccount: u.privateAccount,
  activityVisible: u.activityVisible,
  messageControl: u.messageControl,
});
const authenticatedSessions = new WeakMap<FastifyRequest, string>();
export const requestSessionId = (req: FastifyRequest) =>
  authenticatedSessions.get(req);
const userPromises = new WeakMap<FastifyRequest, Promise<User | null>>();
export function sessionUser(req: FastifyRequest): Promise<User | null> {
  let promise = userPromises.get(req);
  if (!promise) {
    promise = resolveSessionUser(req);
    userPromises.set(req, promise);
  }
  return promise;
}
async function resolveSessionUser(req: FastifyRequest): Promise<User | null> {
  let sessionId: string | undefined;
  const authorization = req.headers.authorization;
  if (authorization?.startsWith("Bearer ")) {
    try {
      const { payload } = await jwtVerify(authorization.slice(7), secret, {
        issuer: "productscroll",
        audience: "productscroll-client",
      });
      sessionId = typeof payload.sid === "string" ? payload.sid : undefined;
    } catch {
      return null;
    }
  }
  const session = sessionId
    ? await db.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
      })
    : req.cookies.ps_session
      ? await db.session.findUnique({
          where: { tokenHash: hash(req.cookies.ps_session) },
          include: { user: true },
        })
      : null;
  if (
    !session ||
    session.revokedAt ||
    session.expiresAt < new Date() ||
    session.user.suspended ||
    session.user.deactivatedAt
  )
    return null;
  authenticatedSessions.set(req, session.id);
  return session.user;
}
export async function requireUser(req: FastifyRequest, verified = true) {
  const user = await sessionUser(req);
  if (!user) fail(401, "AUTH_REQUIRED", "Sign in to continue.");
  if (verified && !user.emailVerifiedAt)
    fail(403, "EMAIL_NOT_VERIFIED", "Verify your email first.");
  return user;
}
export async function requireRole(req: FastifyRequest, roles: User["role"][]) {
  const user = await requireUser(req);
  if (!roles.includes(user.role))
    fail(403, "FORBIDDEN", "You do not have permission for this action.");
  return user;
}
export const accessToken = (userId: string, sid: string) =>
  new SignJWT({ sid })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer("productscroll")
    .setAudience("productscroll-client")
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
export async function blocked(a: string, b: string) {
  return !!(await db.block.findFirst({
    where: {
      OR: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    },
  }));
}
export async function startupPermission(
  user: User,
  startupId: string,
  roles = ["OWNER", "ADMIN", "CONTENT_MANAGER"],
) {
  const member = await db.startupMember.findUnique({
    where: { startupId_userId: { startupId, userId: user.id } },
  });
  if (user.role !== "ADMIN" && (!member || !roles.includes(member.role)))
    fail(403, "STARTUP_PERMISSION", "You cannot manage this startup.");
}
export async function visibleWhere(
  userId?: string,
): Promise<Prisma.PostWhereInput> {
  return {
    draft: false,
    removedAt: null,
    author: {
      suspended: false,
      deactivatedAt: null,
      ...(userId
        ? {
            blocked: { none: { blockedId: userId } },
            blockedBy: { none: { blockerId: userId } },
            mutedBy: { none: { muterId: userId } },
          }
        : {}),
      OR: [
        { privateAccount: false },
        ...(userId
          ? [
              { id: userId },
              { followers: { some: { followerId: userId, accepted: true } } },
            ]
          : []),
      ],
    },
  };
}
export async function visiblePost(id: string, userId?: string) {
  const post = await db.post.findFirst({
    where: { id, ...(await visibleWhere(userId)) },
  });
  if (!post) fail(404, "POST_NOT_FOUND", "Post not found.");
  return post;
}
export function encodeCursor(date: Date, id: string) {
  return Buffer.from(JSON.stringify({ date: date.toISOString(), id })).toString(
    "base64url",
  );
}
export function decodeCursor(value?: string) {
  if (!value) return undefined;
  try {
    const parsed = z
      .object({ date: z.string().datetime(), id: z.string().min(1) })
      .parse(JSON.parse(Buffer.from(value, "base64url").toString()));
    return {
      OR: [
        { createdAt: { lt: new Date(parsed.date) } },
        { createdAt: new Date(parsed.date), id: { lt: parsed.id } },
      ],
    };
  } catch {
    return fail(400, "INVALID_CURSOR", "Invalid cursor.");
  }
}
export function page<T extends { id: string; createdAt: Date }>(
  items: T[],
  limit: number,
) {
  const more = items.length > limit;
  const slice = items.slice(0, limit);
  const last = slice.at(-1);
  return {
    items: slice,
    nextCursor: more && last ? encodeCursor(last.createdAt, last.id) : null,
    hasMore: more,
  };
}
export async function emit(userIds: string[], event: unknown) {
  const pipeline = redis.pipeline();
  for (const id of new Set(userIds))
    pipeline.publish(
      `productscroll:realtime:${id}`,
      JSON.stringify({ userIds: [id], event }),
    );
  await pipeline.exec();
}
export async function notify(
  userId: string,
  actorId: string,
  type: string,
  body: string,
  postId?: string,
  startupId?: string,
) {
  if (userId === actorId) return;
  const preference = await db.notificationPreference.findUnique({
    where: { userId },
  });
  if (preference?.inApp === false) return;
  const groupKey = `${type}:${postId || startupId || actorId}`;
  const recent = await db.notification.findFirst({
    where: {
      userId,
      groupKey,
      readAt: null,
      createdAt: { gt: new Date(Date.now() - 3600000) },
    },
  });
  const notification = recent
    ? await db.notification.update({
        where: { id: recent.id },
        data: { body, actorId, createdAt: new Date() },
      })
    : await db.notification.create({
        data: { userId, actorId, type, body, postId, startupId, groupKey },
      });
  await emit([userId], { type: "notification", notification });
  if (preference?.email || preference?.push)
    await jobs.add(
      "deliver-notification",
      { notificationId: notification.id },
      { jobId: `notify-${notification.id}` },
    );
}
export async function audit(
  actorId: string,
  action: string,
  targetId: string,
  detail: string,
) {
  return db.auditLog.create({ data: { actorId, action, targetId, detail } });
}
