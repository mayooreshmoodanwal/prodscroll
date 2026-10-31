import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { FastifyInstance, InjectOptions } from "fastify";
import { buildApp } from "../../apps/api/src/app";
import { db } from "../../packages/database/src/index";
import { token, hash } from "../../apps/api/src/lib/core";
let app: FastifyInstance;
const suffix = Date.now().toString(36);
const ids: string[] = [];
let a: { id: string; accessToken: string; refreshToken: string };
let b: { id: string; accessToken: string; refreshToken: string };
let postId: string, conversationId: string, startupId: string;
const call = (
  method: InjectOptions["method"],
  url: string,
  body?: unknown,
  access?: string,
) =>
  app.inject({
    method,
    url: `/api${url}`,
    headers: { ...(access ? { authorization: `Bearer ${access}` } : {}) },
    ...(body !== undefined
      ? {
          payload: JSON.stringify(body),
          headers: {
            "content-type": "application/json",
            ...(access ? { authorization: `Bearer ${access}` } : {}),
          },
        }
      : {}),
  });
beforeAll(async () => {
  app = await buildApp({
    logger: false,
    rateLimitNamespace: `productscroll:test:${suffix}:`,
  });
  await app.ready();
  for (const [index, role] of ["FOUNDER", "USER"].entries()) {
    const response = await call("POST", "/auth/register", {
      email: `qa_${suffix}_${index}@example.com`,
      username: `qa_${suffix}_${index}`,
      displayName: `QA Builder ${index}`,
      password: "CorrectHorseBattery42!",
      role,
    });
    expect(response.statusCode).toBe(201);
    const result = response.json();
    ids.push(result.user.id);
    const verify = token();
    await db.authToken.create({
      data: {
        userId: result.user.id,
        tokenHash: hash(verify),
        purpose: "VERIFY",
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    expect(
      (await call("POST", "/auth/verify-email", { token: verify })).statusCode,
    ).toBe(200);

    const loginRes = await call("POST", "/auth/login", {
      email: `qa_${suffix}_${index}@example.com`,
      password: "CorrectHorseBattery42!",
    });
    expect(loginRes.statusCode).toBe(200);
    const loginData = loginRes.json();

    const identity = {
      id: result.user.id,
      accessToken: loginData.accessToken,
      refreshToken: loginData.refreshToken,
    };
    if (index === 0) a = identity;
    else b = identity;
  }
});
afterAll(async () => {
  await db.startup.deleteMany({ where: { ownerId: { in: ids } } });
  await db.conversation.deleteMany({
    where: { members: { some: { userId: { in: ids } } } },
  });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await app.close();
});
describe.sequential(
  "persisted platform journeys and security boundaries",
  () => {
    it("streams ten ready reels per batch, avoids recent repeats and reranks live feedback", async () => {
      const history: string[] = [];
      for (let batch = 0; batch < 7; batch++) {
        const recent = history.slice(-40);
        const response = await call(
          "GET",
          `/reels?seen=${recent.join(",")}`.replace(/\?seen=$/, ""),
          undefined,
          a.accessToken,
        );
        expect(response.statusCode).toBe(200);
        const result = response.json();
        expect(result.items).toHaveLength(10);
        expect(result.hasMore).toBe(true);
        expect(result.nextCursor).toBeNull();
        const batchIds = result.items.map((post: { id: string }) => post.id);
        expect(new Set(batchIds).size).toBe(10);
        expect(batchIds.some((id: string) => recent.includes(id))).toBe(false);
        for (const post of result.items) {
          expect(post.kind).toBe("REEL");
          expect(
            post.media.some(
              (m: { mediaType: string; processingStatus: string }) =>
                m.mediaType === "VIDEO" && m.processingStatus === "READY",
            ),
          ).toBe(true);
        }
        history.push(...batchIds);
      }
      expect(history).toHaveLength(70);
      const first = (
        await call("GET", "/reels", undefined, a.accessToken)
      ).json().items[0].id;
      await db.engagementEvent.createMany({
        data: Array.from({ length: 20 }, () => ({
          userId: a.id,
          postId: first,
          type: "NOT_INTERESTED" as const,
        })),
      });
      const reranked = (
        await call("GET", "/reels", undefined, a.accessToken)
      ).json();
      expect(reranked.items[0].id).not.toBe(first);
      expect(
        (
          await call(
            "GET",
            `/reels?seen=${Array.from({ length: 61 }, (_, i) => `id-${i}`).join(",")}`,
          )
        ).statusCode,
      ).toBe(400);
    });
    it("enforces onboarding selection and never exposes private auth columns", async () => {
      expect(
        (
          await call(
            "PUT",
            "/users/me/onboarding",
            { interests: ["AI"] },
            a.accessToken,
          )
        ).statusCode,
      ).toBe(400);
      expect(
        (
          await call(
            "PUT",
            "/users/me/onboarding",
            { interests: ["AI", "Robotics", "Climate"] },
            a.accessToken,
          )
        ).statusCode,
      ).toBe(200);
      const profile = await call("GET", `/users/qa_${suffix}_0`);
      expect(profile.statusCode).toBe(200);
      expect(profile.body).not.toContain("passwordHash");
      expect(profile.body).not.toContain("@example.com");
    });
    it("creates founder startup, product, post and retrieves from real feed", async () => {
      const startup = await call(
        "POST",
        "/startups",
        {
          name: "QA Workshop",
          slug: `qa-${suffix}`,
          pitch: "Tools for thoughtful builders",
          description: "A persisted integration test startup.",
          category: "Robotics",
        },
        a.accessToken,
      );
      expect(startup.statusCode).toBe(201);
      startupId = startup.json().startup.id;
      const product = await call(
        "POST",
        `/startups/${startupId}/products`,
        {
          name: "QA Arm",
          slug: `qa-arm-${suffix}`,
          description: "A modular tool for this integration journey.",
          category: "Robotics",
          status: "PROTOTYPE",
        },
        a.accessToken,
      );
      expect(product.statusCode).toBe(201);
      const post = await call(
        "POST",
        "/posts",
        {
          caption: "We are building a thoughtful robot.",
          startupId,
          productId: product.json().product.id,
          kind: "POST",
          tags: ["Robotics"],
        },
        a.accessToken,
      );
      expect(post.statusCode).toBe(201);
      postId = post.json().post.id;
      const feed = await call("GET", "/feed", undefined, a.accessToken);
      expect(feed.statusCode).toBe(200);
      expect(feed.json().items.length).toBeGreaterThan(0);
      expect(feed.body).not.toContain("passwordHash");
    });
    it("maintains follower counters under concurrent idempotent writes", async () => {
      const replies = await Promise.all(
        Array.from({ length: 6 }, () =>
          call(
            "PUT",
            `/startups/${startupId}/follow`,
            { following: true },
            b.accessToken,
          ),
        ),
      );
      expect(replies.every((r) => r.statusCode === 200)).toBe(true);
      expect(
        (await db.startup.findUniqueOrThrow({ where: { id: startupId } }))
          .followerCount,
      ).toBe(1);
      await Promise.all(
        Array.from({ length: 3 }, () =>
          call(
            "PUT",
            `/startups/${startupId}/follow`,
            { following: false },
            b.accessToken,
          ),
        ),
      );
      expect(
        (await db.startup.findUniqueOrThrow({ where: { id: startupId } }))
          .followerCount,
      ).toBe(0);
    });
    it("serializes concurrent upload reservations at the daily quota", async () => {
      await db.mediaAsset.createMany({
        data: Array.from({ length: 11 }, (_, i) => ({
          ownerId: b.id,
          storageKey: `quota-${suffix}-${i}`,
          mimeType: "video/mp4",
          mediaType: "VIDEO",
          fileSizeBytes: (i < 10 ? 100 : 9) * 1024 * 1024,
        })),
      });
      try {
        const replies = await Promise.all(
          Array.from({ length: 2 }, () =>
            call(
              "POST",
              "/media/upload-url",
              {
                filename: "quota.mp4",
                mimeType: "video/mp4",
                size: 10 * 1024 * 1024,
              },
              b.accessToken,
            ),
          ),
        );
        expect(replies.map((r) => r.statusCode).sort()).toEqual([200, 429]);
        const total = await db.mediaAsset.aggregate({
          where: { ownerId: b.id },
          _sum: { fileSizeBytes: true },
        });
        expect(total._sum.fileSizeBytes).toBeLessThanOrEqual(
          1024 * 1024 * 1024,
        );
      } finally {
        await db.mediaAsset.deleteMany({
          where: {
            ownerId: b.id,
            processingStatus: "PENDING",
          },
        });
      }
    });
    it("requires current visibility when refreshing a private playback URL", async () => {
      const asset = await db.mediaAsset.create({
        data: {
          ownerId: a.id,
          storageKey: `private-${suffix}`,
          mimeType: "video/mp4",
          mediaType: "VIDEO",
          fileSizeBytes: 10,
          processingStatus: "READY",
          processedUrl: "http://localhost:4180/media/test/master.m3u8",
          posts: { create: { postId, position: 0 } },
        },
      });
      try {
        await db.user.update({
          where: { id: a.id },
          data: { privateAccount: true },
        });
        expect(
          (await call("GET", `/media/${asset.id}/playback`)).statusCode,
        ).toBe(404);
        expect(
          (
            await call(
              "GET",
              `/media/${asset.id}/playback`,
              undefined,
              b.accessToken,
            )
          ).statusCode,
        ).toBe(404);
        expect(
          (
            await call(
              "GET",
              `/media/${asset.id}/playback`,
              undefined,
              a.accessToken,
            )
          ).statusCode,
        ).toBe(200);
        await db.userFollow.create({
          data: { followerId: b.id, followingId: a.id, accepted: true },
        });
        expect(
          (
            await call(
              "GET",
              `/media/${asset.id}/playback`,
              undefined,
              b.accessToken,
            )
          ).statusCode,
        ).toBe(200);
        await db.block.create({ data: { blockerId: a.id, blockedId: b.id } });
        expect(
          (
            await call(
              "GET",
              `/media/${asset.id}/playback`,
              undefined,
              b.accessToken,
            )
          ).statusCode,
        ).toBe(404);
      } finally {
        await db.block.deleteMany({
          where: { blockerId: a.id, blockedId: b.id },
        });
        await db.userFollow.deleteMany({
          where: { followerId: b.id, followingId: a.id },
        });
        await db.user.update({
          where: { id: a.id },
          data: { privateAccount: false },
        });
        await db.mediaAsset.delete({ where: { id: asset.id } });
      }
    });
    it("streams a complete multi-page account export with nested collection items", async () => {
      const extraIds = Array.from(
        { length: 205 },
        (_, i) => `export-${suffix}-${i}`,
      );
      await db.post.createMany({
        data: extraIds.map((id) => ({
          id,
          authorId: a.id,
          kind: "POST",
          caption: "Export fixture",
          draft: true,
        })),
      });
      await db.save.createMany({
        data: extraIds.map((postId, i) => ({
          id: `export-save-${suffix}-${i}`,
          userId: a.id,
          postId,
        })),
      });
      const collection = await db.collection.create({
        data: {
          userId: a.id,
          name: "Export fixture",
          items: {
            create: extraIds.map((_, i) => ({
              saveId: `export-save-${suffix}-${i}`,
            })),
          },
        },
      });
      try {
        const result = await call(
          "GET",
          "/users/me/export",
          undefined,
          a.accessToken,
        );
        expect(result.statusCode).toBe(200);
        expect(result.headers["content-disposition"]).toContain("attachment");
        const data = result.json();
        expect(
          data.posts.filter((p: { id: string }) => extraIds.includes(p.id)),
        ).toHaveLength(205);
        expect(
          data.collections.find((c: { id: string }) => c.id === collection.id)
            .items,
        ).toHaveLength(205);
        expect(data.user.id).toBe(a.id);
        expect(result.body).not.toContain("passwordHash");
      } finally {
        await db.collection.delete({ where: { id: collection.id } });
        await db.post.deleteMany({ where: { id: { in: extraIds } } });
      }
    });
    it("rejects unauthorized startup changes and admin access", async () => {
      expect(
        (
          await call(
            "PATCH",
            `/startups/${startupId}`,
            { pitch: "Stolen ownership" },
            b.accessToken,
          )
        ).statusCode,
      ).toBe(403);
      expect(
        (await call("GET", "/admin/stats", undefined, b.accessToken))
          .statusCode,
      ).toBe(403);
      expect(
        (
          await call(
            "POST",
            "/posts",
            { caption: "x", authorId: a.id },
            b.accessToken,
          )
        ).statusCode,
      ).toBe(400);
    });
    it("keeps like/save operations idempotent and collections private", async () => {
      const likes = await Promise.all(
        Array.from({ length: 5 }, () =>
          call("PUT", `/posts/${postId}/like`, { liked: true }, b.accessToken),
        ),
      );
      expect(likes.every((r) => r.statusCode === 200)).toBe(true);
      expect(await db.like.count({ where: { postId } })).toBe(1);
      expect(
        (await db.post.findUniqueOrThrow({ where: { id: postId } })).likeCount,
      ).toBe(1);
      await call(
        "PUT",
        `/posts/${postId}/save`,
        { saved: true },
        b.accessToken,
      );
      await call(
        "PUT",
        `/posts/${postId}/save`,
        { saved: true },
        b.accessToken,
      );
      const saves = await call("GET", "/saves", undefined, b.accessToken);
      expect(
        saves.json().items.some((p: { id: string }) => p.id === postId),
      ).toBe(true);
      const collection = await call(
        "POST",
        "/collections",
        { name: "Private workshop" },
        b.accessToken,
      );
      const id = collection.json().collection.id;
      expect(
        (
          await call(
            "PUT",
            `/collections/${id}/items`,
            { postId, saved: true },
            b.accessToken,
          )
        ).statusCode,
      ).toBe(200);
      expect(
        (await call("GET", `/collections/${id}`, undefined, a.accessToken))
          .statusCode,
      ).toBe(404);
    });
    it("supports follows, chronological feed and threaded replies", async () => {
      await call(
        "PUT",
        `/users/${a.id}/follow`,
        { following: true },
        b.accessToken,
      );
      await call(
        "PUT",
        `/startups/${startupId}/follow`,
        { following: true },
        b.accessToken,
      );
      const feed = await call(
        "GET",
        "/feed?mode=following",
        undefined,
        b.accessToken,
      );
      expect(
        feed.json().items.some((p: { id: string }) => p.id === postId),
      ).toBe(true);
      const comment = await call(
        "POST",
        `/posts/${postId}/comments`,
        { body: "How did you build this?" },
        b.accessToken,
      );
      expect(comment.statusCode).toBe(201);
      const reply = await call(
        "POST",
        `/posts/${postId}/comments`,
        { body: "Here is our process.", parentId: comment.json().comment.id },
        a.accessToken,
      );
      expect(reply.statusCode).toBe(201);
      await call(
        "PUT",
        `/comments/${comment.json().comment.id}/like`,
        { liked: true },
        a.accessToken,
      );
      const top = await call(
        "GET",
        `/posts/${postId}/comments?sort=top&limit=1`,
        undefined,
        a.accessToken,
      );
      expect(top.json().items[0].id).toBe(comment.json().comment.id);
      const next = await call(
        "GET",
        `/posts/${postId}/comments?sort=top&limit=1&cursor=${top.json().nextCursor}`,
        undefined,
        a.accessToken,
      );
      expect(next.json().items[0].id).toBe(reply.json().comment.id);
      expect(
        (await db.post.findUniqueOrThrow({ where: { id: postId } }))
          .commentCount,
      ).toBe(2);
      const notifications = await call(
        "GET",
        "/notifications",
        undefined,
        a.accessToken,
      );
      expect(notifications.json().items.length).toBeGreaterThan(0);
    });
    it("persists message requests and read receipts with membership checks", async () => {
      const conversation = await call(
        "POST",
        "/conversations",
        { memberIds: [b.id] },
        a.accessToken,
      );
      expect(conversation.statusCode).toBe(201);
      conversationId = conversation.json().conversation.id;
      const message = await call(
        "POST",
        `/conversations/${conversationId}/messages`,
        { body: "Let’s compare notes." },
        a.accessToken,
      );
      expect(message.statusCode).toBe(201);
      expect(
        (
          await call(
            "POST",
            `/conversations/${conversationId}/messages`,
            { body: "Extra unsolicited message" },
            a.accessToken,
          )
        ).statusCode,
      ).toBe(403);
      expect(
        (await call("GET", `/conversations/${conversationId}/messages`))
          .statusCode,
      ).toBe(401);
      await call(
        "POST",
        `/conversations/${conversationId}/accept`,
        {},
        b.accessToken,
      );
      await call(
        "POST",
        `/conversations/${conversationId}/read`,
        {},
        b.accessToken,
      );
      const history = await call(
        "GET",
        `/conversations/${conversationId}/messages`,
        undefined,
        a.accessToken,
      );
      expect(history.json().items[0].readBy).toContain(b.id);
      expect(
        (
          await call(
            "POST",
            `/conversations/${conversationId}/messages`,
            { body: "Thanks for reaching out." },
            b.accessToken,
          )
        ).statusCode,
      ).toBe(201);
    });
    it("blocks content and messaging in both directions", async () => {
      await call("POST", `/users/${a.id}/block`, {}, b.accessToken);
      expect(
        (await call("GET", `/posts/${postId}`, undefined, b.accessToken))
          .statusCode,
      ).toBe(404);
      expect(
        (
          await call(
            "POST",
            `/conversations/${conversationId}/messages`,
            { body: "Blocked message" },
            a.accessToken,
          )
        ).statusCode,
      ).toBe(403);
      await call("DELETE", `/users/${a.id}/block`, undefined, b.accessToken);
    });
    it("rejects cross-origin cookie mutations", async () => {
      const result = await app.inject({
        method: "POST",
        url: "/api/auth/logout",
        headers: {
          origin: "https://attacker.example",
          cookie: "ps_session=arbitrary",
        },
        payload: {},
      });
      expect(result.statusCode).toBe(403);
    });
    it("rotates refresh tokens and revokes sessions on token reuse", async () => {
      const first = await call("POST", "/auth/refresh", {
        refreshToken: b.refreshToken,
      });
      expect(first.statusCode).toBe(200);
      expect(first.json().refreshToken).not.toBe(b.refreshToken);
      expect(
        (await call("POST", "/auth/refresh", { refreshToken: b.refreshToken }))
          .statusCode,
      ).toBe(401);
      expect(
        (await call("GET", "/auth/me", undefined, first.json().accessToken))
          .statusCode,
      ).toBe(401);
    });
  },
);
