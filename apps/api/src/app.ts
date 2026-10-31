import { storageConfig } from "@productscroll/config";
import { timingSafeEqual } from "node:crypto";
import {
  metrics,
  requestDuration,
  authFailures,
  captureError,
} from "./lib/observability.js";
import { documentRoute } from "./lib/openapi.js";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import fastifyStatic from "@fastify/static";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { db, Prisma } from "@productscroll/database";
import { ZodError } from "zod";
import { AppError, redis, jobs, sessionUser } from "./lib/core.js";
import { authRoutes } from "./domains/auth.js";
import { contentRoutes } from "./domains/content.js";
import { socialRoutes } from "./domains/social.js";
import { startupRoutes } from "./domains/startups.js";
import { messageRoutes } from "./domains/messages.js";
import { adminRoutes } from "./domains/admin.js";
import { mediaRoutes, mediaRoot } from "./domains/media.js";
import { buildRadarRoutes } from "./domains/buildradar.js";
import { investRoutes } from "./domains/invest.js";
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  const configured = (process.env.WEB_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const normalized = origin.trim().toLowerCase();
  if (configured.includes(normalized)) return true;
  try {
    const { hostname, protocol } = new URL(normalized);
    if (!["http:", "https:"].includes(protocol)) return false;
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    if (hostname.endsWith(".vercel.app")) return true;
    if (hostname === "ayushkumarsingh.in" || hostname.endsWith(".ayushkumarsingh.in")) return true;
    if (hostname === "wishelier.in" || hostname.endsWith(".wishelier.in")) return true;
  } catch {
    return false;
  }
  return false;
}

export async function buildApp(
  options: { logger?: boolean; rateLimitNamespace?: string } = {},
) {
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32 ||
      !process.env.SESSION_SECRET ||
      process.env.SESSION_SECRET.length < 32)
  )
    throw new Error(
      "Production requires strong JWT_SECRET and SESSION_SECRET.",
    );
  if (
    process.env.NODE_ENV === "production" &&
    process.env.MEDIA_DRIVER !== "local" &&
    storageConfig().driver !== "r2"
  )
    throw new Error(
      "Production media delivery requires MEDIA_DRIVER=r2 and the private delivery Worker.",
    );
  const app = Fastify({
    logger:
      options.logger === false
        ? false
        : {
            level: process.env.LOG_LEVEL || "info",
            serializers: {
              req: (req: { method: string; url: string }) => ({
                method: req.method,
                path: req.url.split("?")[0],
              }),
            },
            redact: [
              "req.headers.authorization",
              "req.headers.cookie",
              'res.headers["set-cookie"]',
              "password",
              "token",
              "refreshToken",
            ],
          },
    genReqId: () => randomUUID(),
    bodyLimit: 1024 * 1024,
    trustProxy: process.env.TRUST_PROXY === "true",
  });
  await app.register(cookie);
  await app.register(cors, {
    origin: (origin, cb) => {
      if (isOriginAllowed(origin)) {
        cb(null, true);
      } else {
        cb(new AppError(403, "ORIGIN_REJECTED", "Request origin is not allowed."), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
  await app.register(helmet, {
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  });
  await app.register(rateLimit, {
    max: Number(process.env.API_RATE_LIMIT || 240),
    keyGenerator: async (req) => {
      const user = await sessionUser(req);
      return user ? `user:${user.id}` : `ip:${req.ip}`;
    },
    timeWindow: "1 minute",
    redis,
    skipOnError: false,
    nameSpace: options.rateLimitNamespace || "productscroll:rate:",
    addHeadersOnExceeding: {
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "x-ratelimit-reset": true,
    },
    addHeaders: {
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "x-ratelimit-reset": true,
      "retry-after": true,
    },
  });
  await app.register(websocket, { options: { maxPayload: 4096 } });
  await app.register(swagger, {
    openapi: {
      info: {
        title: "ProductScroll API",
        version: "0.1.0",
        description:
          "Persisted startup discovery and social platform. Authentication uses a secure browser cookie or Bearer access token. All mutations validate input and enforce server ownership.",
      },
      servers: [{ url: "/" }],
      components: {
        securitySchemes: {
          session: { type: "apiKey", in: "cookie", name: "ps_session" },
          bearerAuth: { type: "http", scheme: "bearer" },
        },
      },
    },
  });
  app.addHook("onRoute", documentRoute);
  app.addHook("onResponse", async (req, reply) => {
    const route = req.routeOptions.url || "/unmatched";
    requestDuration.observe(
      { method: req.method, route, status: String(reply.statusCode) },
      reply.elapsedTime / 1000,
    );
    if (route.startsWith("/api/auth/") && reply.statusCode >= 400)
      authFailures.inc();
  });
  await app.register(swaggerUi, { routePrefix: "/api/docs" });
  app.addHook("onRequest", async (req, reply) => {
    reply.header("X-Request-Id", req.id);
    if (req.url.startsWith("/api/") && !req.url.startsWith("/api/docs"))
      reply.header("Cache-Control", "private, no-store");
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.headers.origin;
      if (
        (origin && !isOriginAllowed(origin)) ||
        (req.cookies.ps_session && !origin && !req.headers.authorization)
      )
        throw new AppError(
          403,
          "ORIGIN_REJECTED",
          "Request origin is not allowed.",
        );
    }
  });
  app.setErrorHandler((error, req, reply) => {
    let status = 500,
      code = "INTERNAL_ERROR",
      message = "Something went wrong. Please try again.";
    if (error instanceof AppError) {
      status = error.statusCode;
      code = error.code;
      message = error.message;
    } else if (error instanceof ZodError) {
      status = 400;
      code = "VALIDATION_ERROR";
      message = error.issues
        .map((i) => `${i.path.join(".") || "Request"}: ${i.message}`)
        .join("; ");
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        status = 409;
        code = "ALREADY_EXISTS";
        message = "This username, email, slug or relationship already exists.";
      } else if (["P2025", "P2003"].includes(error.code)) {
        status = 404;
        code = "NOT_FOUND";
        message = "The requested record is unavailable.";
      }
    } else if (
      error instanceof Error &&
      "statusCode" in error &&
      typeof error.statusCode === "number" &&
      error.statusCode < 500
    ) {
      status = error.statusCode;
      code = status === 429 ? "RATE_LIMITED" : "REQUEST_ERROR";
      message = error.message;
    }
    if (status >= 500) {
      req.log.error(
        {
          errorType: error instanceof Error ? error.name : "UnknownError",
          requestId: req.id,
        },
        "Request failed",
      );
      captureError(error, {
        requestId: req.id,
        route: req.routeOptions.url || "/unmatched",
      });
    }
    return reply
      .code(status)
      .send({ error: { code, message, requestId: req.id } });
  });
  const health = async () => {
    await db.$queryRaw`SELECT 1`;
    await redis.ping();
    return { status: "ok", service: "productscroll-api" };
  };
  app.get("/metrics", async (req, reply) => {
    const expected = process.env.METRICS_TOKEN;
    const supplied = req.headers["x-metrics-token"];
    if (
      !expected ||
      typeof supplied !== "string" ||
      Buffer.byteLength(expected) !== Buffer.byteLength(supplied) ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))
    )
      throw new AppError(403, "FORBIDDEN", "Metrics access denied.");
    return reply.type(metrics.contentType).send(await metrics.metrics());
  });
  app.get("/health", health);
  app.get("/api/health", health);
  if (storageConfig().driver === "local") {
    await mkdir(path.join(mediaRoot, "public"), { recursive: true });
    await app.register(fastifyStatic, {
      root: path.join(mediaRoot, "public"),
      prefix: "/media/",
      maxAge: "1d",
      immutable: true,
      dotfiles: "deny",
      setHeaders: (res) => res.header("X-Content-Type-Options", "nosniff"),
    });
  }
  await app.register(
    async (api) => {
      await authRoutes(api);
      await contentRoutes(api);
      await socialRoutes(api);
      await startupRoutes(api);
      await mediaRoutes(api);
      await messageRoutes(api);
      await adminRoutes(api);
      await buildRadarRoutes(api);
      await investRoutes(api);
    },
    { prefix: "/api" },
  );
  await messageRoutes(app);
  app.get("/api/openapi.json", async () => app.swagger());
  app.addHook("onClose", async () => {
    await jobs.close();
    await redis.quit();
    await db.$disconnect();
  });
  return app;
}
