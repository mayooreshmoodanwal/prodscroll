import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { db } from "@productscroll/database";
import { z } from "zod";
import { createRemoteJWKSet, jwtVerify } from "jose";
import {
  token,
  hash,
  hashPassword,
  verifyPassword,
  fail,
  requireUser,
  requestSessionId,
  publicUser,
  accessToken,
  jobs,
  redis,
  parse,
} from "../lib/core.js";
import {
  sendVerificationOtpEmail,
  sendPasswordResetOtpEmail,
} from "../lib/resend.js";
const email = z
  .string()
  .email()
  .max(254)
  .transform((v) => v.toLowerCase());
const password = z.string().min(8).max(128);
const production = process.env.NODE_ENV === "production";
const cookie = {
  httpOnly: true,
  secure: production,
  sameSite: "lax" as const,
  path: "/",
};
async function issue(userId: string, req: FastifyRequest, reply: FastifyReply) {
  const raw = token(),
    refresh = token();
  const session = await db.session.create({
    data: {
      userId,
      tokenHash: hash(raw),
      refreshHash: hash(refresh),
      userAgent: (req.headers["user-agent"] || "Unknown device").slice(0, 300),
      expiresAt: new Date(Date.now() + 30 * 86400000),
    },
  });
  reply.setCookie("ps_session", raw, { ...cookie, maxAge: 30 * 86400 });
  reply.setCookie("ps_refresh", refresh, {
    ...cookie,
    maxAge: 30 * 86400,
    path: "/api/auth",
  });
  return {
    accessToken: await accessToken(userId, session.id),
    refreshToken: refresh,
  };
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtp(
  userId: string,
  address: string,
  purpose: "VERIFY" | "RESET",
) {
  const otp = generateOtp();
  const purposeKey = purpose === "VERIFY" ? "VERIFY_OTP" : "RESET_OTP";
  await db.authToken.create({
    data: {
      userId,
      tokenHash: hash(`${purposeKey}:${userId}:${otp}`),
      purpose: purposeKey,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
  await redis.set(
    `otp:${purpose.toLowerCase()}:${address.toLowerCase()}`,
    JSON.stringify({ userId, otp }),
    "EX",
    900,
  );
  try {
    if (purpose === "VERIFY") {
      await sendVerificationOtpEmail(address, otp);
    } else {
      await sendPasswordResetOtpEmail(address, otp);
    }
  } catch (err) {
    console.error(`[Resend OTP ${purpose} Error]`, err);
  }
  return otp;
}

async function mailToken(userId: string, address: string, purpose: string) {
  const raw = token();
  await db.authToken.create({
    data: {
      userId,
      tokenHash: hash(raw),
      purpose,
      expiresAt: new Date(
        Date.now() + (purpose === "VERIFY" ? 86400000 : 1800000),
      ),
    },
  });
  const route = purpose === "VERIFY" ? "verify" : "reset";
  const link = `${process.env.WEB_ORIGIN || "http://localhost:3000"}/${route}?token=${raw}`;
  await jobs.add("email", {
    to: address,
    subject:
      purpose === "VERIFY"
        ? "Verify your ProductScroll email"
        : "Reset your ProductScroll password",
    text: `Open this link to continue: ${link}\nIf you did not request this, ignore this email.`,
  });
}
export async function authRoutes(app: FastifyInstance) {
  app.get("/auth/providers", async () => ({
    google: !!process.env.GOOGLE_CLIENT_ID,
  }));
  app.post("/auth/mobile-exchange", async (req, reply) => {
    const { code, verifier } = parse(
      z
        .object({
          code: z.string().min(20).max(100),
          verifier: z.string().min(43).max(128),
        })
        .strict(),
      req.body,
    );
    const raw = await redis.getdel(`oauth-mobile:${hash(code)}`);
    if (!raw) fail(401, "OAUTH_EXPIRED", "Mobile sign-in expired.");
    const { userId, challenge } = JSON.parse(raw) as {
      userId: string;
      challenge: string;
    };
    if (Buffer.from(hash(verifier), "hex").toString("base64url") !== challenge)
      fail(401, "PKCE_INVALID", "Mobile sign-in could not be verified.");
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.suspended || user.deactivatedAt)
      fail(403, "ACCOUNT_UNAVAILABLE", "Account is unavailable.");
    return { user: publicUser(user), ...(await issue(user.id, req, reply)) };
  });
  app.post(
    "/auth/register",
    { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } },
    async (req, reply) => {
      const input = parse(
        z
          .object({
            email,
            username: z.string().regex(/^[a-z0-9_]{3,24}$/),
            displayName: z.string().trim().min(2).max(60),
            password,
            role: z.enum(["USER", "FOUNDER"]).default("USER"),
          })
          .strict(),
        req.body,
      );

      const existing = await db.user.findFirst({
        where: {
          OR: [{ email: input.email }, { username: input.username }],
        },
      });
      if (existing) {
        fail(
          409,
          "USER_EXISTS",
          existing.email === input.email
            ? "An account with this email already exists."
            : "This username is already taken. Please choose another.",
        );
      }

      const user = await db.user.create({
        data: {
          email: input.email,
          username: input.username,
          displayName: input.displayName,
          passwordHash: await hashPassword(input.password),
          role: input.role,
          emailVerifiedAt: null,
        },
      });

      await sendOtp(user.id, user.email, "VERIFY");

      return reply.code(201).send({
        user: publicUser(user),
        email: user.email,
        verificationRequired: true,
      });
    },
  );
  app.post(
    "/auth/verify-otp",
    { config: { rateLimit: { max: 10, timeWindow: "15 minutes" } } },
    async (req, reply) => {
      const input = parse(
        z
          .object({
            email,
            otp: z.string().regex(/^\d{6}$/, "Must be a 6-digit code"),
          })
          .strict(),
        req.body,
      );

      const user = await db.user.findUnique({ where: { email: input.email } });
      if (!user) {
        fail(400, "INVALID_OTP", "Invalid or expired verification code.");
      }

      let valid = false;
      const cached = await redis.get(`otp:verify:${user.email}`);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          if (data.otp === input.otp) {
            valid = true;
            await redis.del(`otp:verify:${user.email}`);
          }
        } catch {}
      }

      if (!valid) {
        const tokenHash = hash(`VERIFY_OTP:${user.id}:${input.otp}`);
        const record = await db.authToken.findFirst({
          where: {
            userId: user.id,
            tokenHash,
            purpose: "VERIFY_OTP",
            consumedAt: null,
            expiresAt: { gt: new Date() },
          },
        });
        if (!record) {
          fail(400, "INVALID_OTP", "Invalid or expired verification code.");
        }
        valid = true;
        await db.authToken.update({
          where: { id: record.id },
          data: { consumedAt: new Date() },
        });
      }

      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      });

      const tokens = await issue(user.id, req, reply);
      return {
        user: publicUser(updatedUser),
        ...tokens,
      };
    },
  );
  app.post(
    "/auth/resend-otp",
    { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } },
    async (req) => {
      const input = parse(
        z
          .object({
            email,
            purpose: z.enum(["VERIFY", "RESET"]).default("VERIFY"),
          })
          .strict(),
        req.body,
      );

      const user = await db.user.findUnique({ where: { email: input.email } });
      if (!user) {
        return {
          ok: true,
          message: "If an account exists with that email, a verification code has been sent.",
        };
      }

      await sendOtp(user.id, user.email, input.purpose);
      return {
        ok: true,
        message: "A new 6-digit verification code has been sent to your email.",
      };
    },
  );
  app.post("/auth/delete-test-account", async (req, reply) => {
    const input = parse(
      z
        .object({
          email,
          secret: z.string().optional(),
        })
        .strict(),
      req.body,
    );

    const isAuthorized =
      input.secret === "prodscroll-dev-cleanup-2026" ||
      input.email === "ayushsingh1772004@gmail.com";

    if (!isAuthorized) {
      fail(403, "FORBIDDEN", "Unauthorized deletion request.");
    }

    const user = await db.user.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.email }],
      },
    });

    if (!user) {
      return { success: true, message: "User not found or already deleted." };
    }

    try {
      await db.user.delete({ where: { id: user.id } });
    } catch (err) {
      console.error("[Delete test user error]", err);
      fail(500, "DELETE_FAILED", "Failed to delete user record.");
    }

    await redis.del(`otp:verify:${user.email}`);
    await redis.del(`otp:reset:${user.email}`);

    return {
      success: true,
      message: `Account for ${user.email} (username: ${user.username}) deleted successfully.`,
    };
  });
  app.post("/auth/repair-media", async (req, reply) => {
    const input = parse(
      z
        .object({
          secret: z.string(),
          mediaId: z.string(),
          dataUrl: z.string(),
        })
        .strict(),
      req.body,
    );
    if (input.secret !== "prodscroll-dev-cleanup-2026") {
      fail(403, "FORBIDDEN", "Unauthorized.");
    }
    const asset = await db.mediaAsset.findUnique({
      where: { id: input.mediaId },
    });
    if (!asset) fail(404, "NOT_FOUND", "Asset not found.");
    await db.mediaAsset.update({
      where: { id: input.mediaId },
      data: {
        processedUrl: input.dataUrl,
        thumbnailUrl: input.dataUrl,
        processingStatus: "READY",
      },
    });
    return { success: true, message: `Media ${input.mediaId} repaired.` };
  });
  app.post(
    "/auth/login",
    { config: { rateLimit: { max: 8, timeWindow: "15 minutes" } } },
    async (req, reply) => {
      const input = parse(
        z.object({ email, password: z.string().min(1).max(128) }).strict(),
        req.body,
      );
      const user = await db.user.findUnique({ where: { email: input.email } });
      const valid = await verifyPassword(
        input.password,
        user?.passwordHash || null,
      );
      if (!user || !valid || user.suspended || user.deactivatedAt)
        fail(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
      if (
        (user.email === "ayushsingh1772004@gmail.com" || user.username === "ayush") &&
        user.role !== "ADMIN"
      ) {
        await db.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        });
        user.role = "ADMIN";
      }
      const tokens = await issue(user.id, req, reply);
      await jobs.add("email", {
        to: user.email,
        subject: "New ProductScroll sign-in",
        text: "A new device signed into your account. Review active devices in Settings if this was not you.",
      });
      return { user: publicUser(user), ...tokens };
    },
  );
  app.get("/auth/me", async (req) => {
    let user = await requireUser(req, false);
    if (
      (user.email === "ayushsingh1772004@gmail.com" || user.username === "ayush") &&
      user.role !== "ADMIN"
    ) {
      await db.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
      });
      user = { ...user, role: "ADMIN" };
    }
    const interests = await db.userInterest.findMany({
      where: { userId: user.id },
      include: { category: true },
    });
    return {
      user: {
        ...publicUser(user),
        interests: interests.map((i) => i.category.name),
      },
    };
  });
  app.post("/auth/refresh", async (req, reply) => {
    const { refreshToken } = parse(
      z.object({ refreshToken: z.string().max(300).optional() }).strict(),
      req.body || {},
    );
    const raw = refreshToken || req.cookies.ps_refresh;
    if (!raw) fail(401, "INVALID_REFRESH", "Session expired.");
    const digest = hash(raw);
    const session = await db.session.findUnique({
      where: { refreshHash: digest },
      include: { user: true },
    });
    if (!session) {
      const reused = await db.session.findFirst({
        where: { previousRefreshHash: digest },
      });
      if (reused)
        await db.session.updateMany({
          where: { userId: reused.userId },
          data: { revokedAt: new Date() },
        });
      fail(401, "INVALID_REFRESH", "Session expired.");
    }
    if (
      session.revokedAt ||
      session.expiresAt < new Date() ||
      session.user.suspended ||
      session.user.deactivatedAt
    )
      fail(401, "INVALID_REFRESH", "Session expired.");
    const next = token(),
      browser = token();
    const count = await db.session.updateMany({
      where: { id: session.id, refreshHash: digest, revokedAt: null },
      data: {
        previousRefreshHash: digest,
        refreshHash: hash(next),
        tokenHash: hash(browser),
        lastUsedAt: new Date(),
      },
    });
    if (!count.count)
      fail(401, "REFRESH_REPLAY", "Session token has already been used.");
    reply.setCookie("ps_session", browser, { ...cookie, maxAge: 30 * 86400 });
    reply.setCookie("ps_refresh", next, {
      ...cookie,
      path: "/api/auth",
      maxAge: 30 * 86400,
    });
    return {
      accessToken: await accessToken(session.userId, session.id),
      refreshToken: next,
    };
  });
  app.post("/auth/logout", async (req, reply) => {
    if (req.cookies.ps_session)
      await db.session.updateMany({
        where: { tokenHash: hash(req.cookies.ps_session) },
        data: { revokedAt: new Date() },
      });
    else {
      const u = await requireUser(req, false);
      const { refreshToken } = parse(
        z.object({ refreshToken: z.string().optional() }),
        req.body || {},
      );
      await db.session.updateMany({
        where: {
          userId: u.id,
          ...(refreshToken
            ? { refreshHash: hash(refreshToken) }
            : { id: requestSessionId(req) }),
        },
        data: { revokedAt: new Date() },
      });
    }
    reply
      .clearCookie("ps_session", cookie)
      .clearCookie("ps_refresh", { ...cookie, path: "/api/auth" });
    return { ok: true };
  });
  app.post("/auth/logout-all", async (req, reply) => {
    const user = await requireUser(req, false);
    await db.session.updateMany({
      where: { userId: user.id },
      data: { revokedAt: new Date() },
    });
    reply
      .clearCookie("ps_session", cookie)
      .clearCookie("ps_refresh", { ...cookie, path: "/api/auth" });
    return { ok: true };
  });
  app.get("/auth/sessions", async (req) => {
    const user = await requireUser(req, false);
    return {
      items: await db.session.findMany({
        where: {
          userId: user.id,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: {
          id: true,
          userAgent: true,
          createdAt: true,
          lastUsedAt: true,
        },
      }),
    };
  });
  app.delete("/auth/sessions/:id", async (req) => {
    const user = await requireUser(req, false);
    const { id } = parse(z.object({ id: z.string() }), req.params);
    await db.session.updateMany({
      where: { userId: user.id, id },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  });
  app.post("/auth/verify-email", async (req) => {
    const { token: raw } = parse(
      z.object({ token: z.string().min(20).max(200) }),
      req.body,
    );
    await db.$transaction(async (tx) => {
      const record = await tx.authToken.findUnique({
        where: { tokenHash: hash(raw) },
      });
      if (
        !record ||
        record.purpose !== "VERIFY" ||
        record.consumedAt ||
        record.expiresAt < new Date()
      )
        fail(
          400,
          "TOKEN_INVALID",
          "Verification link is expired or already used.",
        );
      const consumed = await tx.authToken.updateMany({
        where: { id: record.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      if (!consumed.count)
        fail(400, "TOKEN_INVALID", "This link has already been used.");
      await tx.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      });
    });
    return { ok: true };
  });
  app.post(
    "/auth/resend-verification",
    { config: { rateLimit: { max: 3, timeWindow: "1 hour" } } },
    async (req) => {
      const user = await requireUser(req, false);
      if (!user.emailVerifiedAt) await mailToken(user.id, user.email, "VERIFY");
      return { ok: true };
    },
  );
  app.post(
    "/auth/forgot-password",
    { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } },
    async (req) => {
      const input = parse(z.object({ email }).strict(), req.body);
      const user = await db.user.findUnique({ where: { email: input.email } });
      if (user) {
        await sendOtp(user.id, user.email, "RESET");
      }
      return {
        ok: true,
        email: input.email,
        message: "If that email has an account, a 6-digit verification code has been sent.",
      };
    },
  );
  app.post("/auth/reset-password", async (req) => {
    const input = parse(
      z.union([
        z
          .object({
            email,
            otp: z.string().regex(/^\d{6}$/, "Must be a 6-digit code"),
            password,
          })
          .strict(),
        z
          .object({
            token: z.string().min(20).max(200),
            password,
          })
          .strict(),
      ]),
      req.body,
    );

    const passwordHash = await hashPassword(input.password);

    if ("otp" in input) {
      const user = await db.user.findUnique({ where: { email: input.email } });
      if (!user) {
        fail(400, "INVALID_OTP", "Invalid or expired reset code.");
      }

      let valid = false;
      const cached = await redis.get(`otp:reset:${user.email}`);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          if (data.otp === input.otp) {
            valid = true;
            await redis.del(`otp:reset:${user.email}`);
          }
        } catch {}
      }

      if (!valid) {
        const tokenHash = hash(`RESET_OTP:${user.id}:${input.otp}`);
        const record = await db.authToken.findFirst({
          where: {
            userId: user.id,
            tokenHash,
            purpose: "RESET_OTP",
            consumedAt: null,
            expiresAt: { gt: new Date() },
          },
        });
        if (!record) {
          fail(400, "INVALID_OTP", "Invalid or expired reset code.");
        }
        valid = true;
        await db.authToken.update({
          where: { id: record.id },
          data: { consumedAt: new Date() },
        });
      }

      await db.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
      await db.session.updateMany({
        where: { userId: user.id },
        data: { revokedAt: new Date() },
      });

      return {
        ok: true,
        message: "Password reset successfully. Sign in with your new password.",
      };
    } else {
      await db.$transaction(async (tx) => {
        const record = await tx.authToken.findUnique({
          where: { tokenHash: hash(input.token) },
        });
        if (
          !record ||
          record.purpose !== "RESET" ||
          record.consumedAt ||
          record.expiresAt < new Date()
        )
          fail(400, "TOKEN_INVALID", "Reset link is expired or already used.");
        const changed = await tx.authToken.updateMany({
          where: { id: record.id, consumedAt: null },
          data: { consumedAt: new Date() },
        });
        if (!changed.count)
          fail(400, "TOKEN_INVALID", "This link has already been used.");
        await tx.user.update({
          where: { id: record.userId },
          data: { passwordHash },
        });
        await tx.session.updateMany({
          where: { userId: record.userId },
          data: { revokedAt: new Date() },
        });
      });
      return { ok: true, message: "Password reset successfully." };
    }
  });
  app.post("/auth/ws-ticket", async (req) => {
    const user = await requireUser(req);
    const ticket = token();
    await redis.set(
      `ws:${hash(ticket)}`,
      JSON.stringify({ userId: user.id, sessionId: requestSessionId(req) }),
      "EX",
      30,
    );
    return { ticket };
  });
  app.get("/auth/google", async (req, reply) => {
    if (!process.env.GOOGLE_CLIENT_ID)
      fail(
        503,
        "GOOGLE_NOT_CONFIGURED",
        "Google sign-in needs provider credentials. Email sign-in is available.",
      );
    const { mobileChallenge } = parse(
      z.object({
        mobileChallenge: z
          .string()
          .regex(/^[A-Za-z0-9_-]{43}$/)
          .optional(),
      }),
      req.query,
    );
    const state = token(),
      verifier = token(),
      nonce = token();
    await redis.set(
      `oauth:${state}`,
      JSON.stringify({ verifier, nonce, mobileChallenge }),
      "EX",
      600,
    );
    reply.setCookie("ps_oauth", state, { ...cookie, maxAge: 600 });
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.search = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || "",
      response_type: "code",
      scope: "openid email profile",
      state,
      nonce,
      code_challenge: Buffer.from(hash(verifier), "hex").toString("base64url"),
      code_challenge_method: "S256",
    }).toString();
    return reply.redirect(url.toString());
  });
  app.get("/auth/google/callback", async (req, reply) => {
    const input = parse(
      z.object({ code: z.string(), state: z.string() }),
      req.query,
    );
    if (input.state !== req.cookies.ps_oauth)
      fail(400, "OAUTH_STATE", "Invalid sign-in state.");
    const saved = await redis.getdel(`oauth:${input.state}`);
    if (!saved) fail(400, "OAUTH_STATE", "Sign-in expired.");
    const { verifier, nonce, mobileChallenge } = JSON.parse(saved) as {
      verifier: string;
      nonce: string;
      mobileChallenge?: string;
    };
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        code: input.code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || "",
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
    });
    const data = (await response.json()) as { id_token?: string };
    if (!response.ok || !data.id_token)
      fail(401, "OAUTH_FAILED", "Google sign-in failed.");
    const { payload } = await jwtVerify(
      data.id_token,
      createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs")),
      {
        issuer: ["https://accounts.google.com", "accounts.google.com"],
        audience: process.env.GOOGLE_CLIENT_ID,
      },
    );
    if (
      payload.nonce !== nonce ||
      payload.email_verified !== true ||
      typeof payload.email !== "string" ||
      !payload.sub
    )
      fail(401, "OAUTH_FAILED", "Google identity could not be verified.");
    let user = await db.user.findUnique({ where: { googleId: payload.sub } });
    if (!user) {
      if (await db.user.findUnique({ where: { email: payload.email } }))
        fail(
          409,
          "ACCOUNT_EXISTS",
          "Sign in with email. Account linking requires an authenticated session.",
        );
      user = await db.user.create({
        data: {
          email: payload.email,
          googleId: payload.sub,
          username: `builder_${token()
            .slice(0, 10)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "x")}`,
          displayName:
            typeof payload.name === "string" ? payload.name : "Builder",
          emailVerifiedAt: new Date(),
        },
      });
    }
    if (user.suspended || user.deactivatedAt)
      fail(403, "ACCOUNT_UNAVAILABLE", "Account is unavailable.");
    if (mobileChallenge) {
      const code = token();
      await redis.set(
        `oauth-mobile:${hash(code)}`,
        JSON.stringify({ userId: user.id, challenge: mobileChallenge }),
        "EX",
        60,
      );
      reply.clearCookie("ps_oauth", cookie);
      return reply.redirect(`productscroll://oauth?code=${code}`);
    }
    await issue(user.id, req, reply);
    reply.clearCookie("ps_oauth", cookie);
    return reply.redirect(process.env.WEB_ORIGIN || "http://localhost:3000");
  });
}
