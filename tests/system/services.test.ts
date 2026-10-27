import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { db } from "../../packages/database/src/index";
const base = process.env.PUBLIC_API_URL || "http://localhost:4000";
const ids: string[] = [];
const tokens: string[] = [];
const sockets: WebSocket[] = [];
const suffix = Date.now().toString(36);
async function call(
  route: string,
  body?: unknown,
  user = 0,
  method = body === undefined ? "GET" : "POST",
) {
  const response = await fetch(`${base}/api${route}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(tokens[user] ? { Authorization: `Bearer ${tokens[user]}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, data: await response.json() };
}
async function eventually<T>(
  read: () => Promise<T>,
  matches: (value: T) => boolean,
  seconds = 60,
): Promise<T> {
  const until = Date.now() + seconds * 1000;
  while (Date.now() < until) {
    const value = await read();
    if (matches(value)) return value;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Timed out waiting for asynchronous service result");
}
beforeAll(async () => {
  for (let i = 0; i < 2; i++) {
    const email = `system_${suffix}_${i}@example.com`;
    const registered = await call("/auth/register", {
      email,
      username: `system_${suffix}_${i}`,
      displayName: `System Journey ${i}`,
      password: "SystemJourney!42",
      role: "FOUNDER",
    });
    expect(registered.status).toBe(201);
    ids.push(registered.data.user.id);
    tokens.push(registered.data.accessToken);
    const mailDir = path.resolve(
      "apps/worker",
      process.env.MAIL_DIR || "../../work/mail",
    );
    const text = await eventually(
      async () => {
        for (const file of await readdir(mailDir).catch(() => [])) {
          const body = await readFile(path.join(mailDir, file), "utf8");
          if (body.includes(`To: ${email}`) && body.includes("/verify?token="))
            return body;
        }
        return "";
      },
      Boolean,
      20,
    );
    const token = text.match(/\/verify\?token=([^\s]+)/)?.[1];
    expect(token).toBeTruthy();
    expect((await call("/auth/verify-email", { token }, i)).status).toBe(200);
  }
});
afterAll(async () => {
  for (const socket of sockets) socket.close();
  await db.conversation.deleteMany({
    where: { members: { some: { userId: { in: ids } } } },
  });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
});
describe.sequential("running API, Redis and background worker", () => {
  it("processes uploaded video into HLS variants and publishes a discoverable reel", async () => {
    const source = await readFile(
      path.resolve("work/media/public/seed/forma.mp4"),
    );
    const upload = await call("/media/upload-url", {
      filename: "journey.mp4",
      mimeType: "video/mp4",
      size: source.byteLength,
    });
    expect(upload.status).toBe(200);
    const id = upload.data.assetId;
    expect(
      (
        await fetch(upload.data.uploadUrl, {
          method: "PUT",
          headers: upload.data.headers,
          body: source,
        })
      ).status,
    ).toBe(200);
    expect(
      (await call(`/media/${id}/complete`, {})).data.media.processingStatus,
    ).toBe("PROCESSING");
    expect((await call(`/media/${id}`, undefined, 1)).status).toBe(404);
    const ready = await eventually(
      () => call(`/media/${id}`),
      (r) => ["READY", "FAILED"].includes(r.data.media?.processingStatus),
    );
    expect(ready.data.media.processingStatus).toBe("READY");
    const manifest = await fetch(ready.data.media.url).then((r) => r.text());
    expect(manifest).toContain("#EXTM3U");
    expect(manifest).toContain("360");
    expect(manifest).toContain("#EXT-X-STREAM-INF");
    expect((await fetch(ready.data.media.thumbnailUrl)).status).toBe(200);
    const post = await call("/posts", {
      kind: "REEL",
      caption: "A processed reel from the system test.",
      mediaIds: [id],
      tags: ["Developer Tools"],
    });
    expect(post.status).toBe(201);
    const publicPost = await fetch(
      `${base}/api/posts/${post.data.post.id}`,
    ).then((r) => r.json());
    expect(publicPost.post.media[0].url).toBe(ready.data.media.url);
  });
  it("delivers persisted messages over two live sockets and sends read receipts", async () => {
    const inboxes: Array<
      Array<{
        type: string;
        message?: { id: string; body: string };
        userId?: string;
      }>
    > = [[], []];
    for (let i = 0; i < 2; i++) {
      const ticket = await call("/auth/ws-ticket", {}, i);
      const socket = new WebSocket(
        `${base.replace(/^http/, "ws")}/api/ws?ticket=${encodeURIComponent(ticket.data.ticket)}`,
      );
      sockets.push(socket);
      socket.addEventListener("message", (event) =>
        inboxes[i]!.push(JSON.parse(String(event.data))),
      );
      await eventually(
        async () => inboxes[i]!,
        (v) => v.some((e) => e.type === "connected"),
        10,
      );
    }
    const conversation = await call("/conversations", { memberIds: [ids[1]] });
    expect(conversation.status).toBe(201);
    const id = conversation.data.conversation.id;
    expect((await call(`/conversations/${id}/accept`, {}, 1)).status).toBe(200);
    const sent = await call(`/conversations/${id}/messages`, {
      body: `Realtime journey ${suffix}`,
    });
    expect(sent.status).toBe(201);
    await eventually(
      async () => inboxes[1]!,
      (v) =>
        v.some(
          (e) =>
            e.type === "message" &&
            e.message?.body === `Realtime journey ${suffix}`,
        ),
      10,
    );
    expect((await call(`/conversations/${id}/read`, {}, 1)).status).toBe(200);
    await eventually(
      async () => inboxes[0]!,
      (v) => v.some((e) => e.type === "read" && e.userId === ids[1]),
      10,
    );
    const persisted = await call(`/conversations/${id}/messages`);
    expect(persisted.data.items[0].readBy).toContain(ids[1]);
    expect((await call("/auth/logout", {}, 1)).status).toBe(200);
    expect(
      (
        await call(`/conversations/${id}/messages`, {
          body: "After session revocation",
        })
      ).status,
    ).toBe(201);
    await eventually(
      async () => sockets[1]!.readyState,
      (state) => state === WebSocket.CLOSED,
      10,
    );
    expect(
      inboxes[1]!.some((e) => e.message?.body === "After session revocation"),
    ).toBe(false);
  });
});
