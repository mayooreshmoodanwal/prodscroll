import { mediaUrl } from "../lib/media-access.js";
import { websocketConnections } from "../lib/observability.js";
import type { FastifyInstance } from "fastify";
import { db, Prisma } from "@productscroll/database";
import { z } from "zod";
import {
  parse,
  requireUser,
  publicUser,
  blocked,
  visiblePost,
  fail,
  idParams,
  pageQuery,
  page,
  decodeCursor,
  notify,
  emit,
  redis,
  hash,
} from "../lib/core.js";
const includeMessage = {
  sender: true,
  reads: true,
  media: { include: { media: true } },
  sharedPost: { select: { id: true, caption: true } },
} satisfies Prisma.MessageInclude;
type MessageRecord = Prisma.MessageGetPayload<{
  include: typeof includeMessage;
}>;
const present = (m: MessageRecord) => ({
  id: m.id,
  conversationId: m.conversationId,
  sender: publicUser(m.sender),
  body: m.unsentAt ? "" : m.body,
  createdAt: m.createdAt,
  readBy: m.reads.map((r) => r.userId),
  sharedPost: m.unsentAt ? null : m.sharedPost,
  replyToId: m.replyToId,
  unsent: !!m.unsentAt,
  media: m.unsentAt
    ? []
    : m.media.map((m) => ({
        id: m.mediaId,
        url: mediaUrl(m.media.processedUrl),
        mediaType: m.media.mediaType,
      })),
});
async function membership(userId: string, conversationId: string) {
  const member = await db.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!member) fail(404, "CONVERSATION_NOT_FOUND", "Conversation not found.");
  return member;
}
export async function messageRoutes(app: FastifyInstance) {
  const subscriber = redis.duplicate();
  const sockets = new Map<string, Set<import("ws").WebSocket>>();
  const socketSessions = new WeakMap<import("ws").WebSocket, string>();
  async function authorized(socket: import("ws").WebSocket) {
    const id = socketSessions.get(socket);
    const session = id
      ? await db.session.findUnique({ where: { id }, include: { user: true } })
      : null;
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt < new Date() ||
      session.user.suspended ||
      session.user.deactivatedAt
    ) {
      socket.close(1008, "Session expired");
      return false;
    }
    return true;
  }
  const alive = new WeakSet<import("ws").WebSocket>();
  const heartbeat = setInterval(() => {
    for (const set of sockets.values())
      for (const socket of set) {
        if (!alive.has(socket)) {
          socket.terminate();
          continue;
        }
        alive.delete(socket);
        socket.ping();
      }
  }, 30000);
  heartbeat.unref();
  subscriber.on("message", (_channel, data) => {
    void (async () => {
      try {
        const { userIds, event } = JSON.parse(data) as {
          userIds: string[];
          event: unknown;
        };
        for (const id of userIds)
          for (const socket of sockets.get(id) || [])
            if (socket.readyState === 1 && (await authorized(socket))) {
              if (
                socket.bufferedAmount >
                Number(process.env.MAX_WEBSOCKET_BUFFER_BYTES || 1048576)
              )
                socket.terminate();
              else socket.send(JSON.stringify(event));
            }
      } catch {
        app.log.error("Realtime delivery failed");
      }
    })();
  });
  app.addHook("onClose", async () => {
    clearInterval(heartbeat);
    for (const set of sockets.values())
      for (const socket of set) socket.close();
    await subscriber.quit();
  });
  app.get("/ws", { websocket: true }, (socket, req) => {
    let userId: string | undefined;
    let frames = 0;
    const reset = setInterval(() => {
      frames = 0;
    }, 10000);
    const authenticate = async () => {
      const input = parse(
        z.object({ ticket: z.string().min(20).max(100) }),
        req.query,
      );
      const identity = await redis.getdel(`ws:${hash(input.ticket)}`);
      if (!identity) {
        socket.close(1008, "Unauthorized");
        return;
      }
      const { userId: id, sessionId } = z
        .object({ userId: z.string(), sessionId: z.string() })
        .parse(JSON.parse(identity));
      socketSessions.set(socket, sessionId);
      if (!(await authorized(socket))) return;
      const user = await db.user.findUnique({ where: { id } });
      if (!user || user.suspended || user.deactivatedAt) {
        socket.close(1008, "Unauthorized");
        return;
      }
      if (socket.readyState !== 1) return;
      if ((sockets.get(id)?.size || 0) >= 5) {
        socket.close(1013, "Too many connections");
        return;
      }
      userId = id;
      alive.add(socket);
      websocketConnections.inc();
      const set = sockets.get(id) || new Set();
      set.add(socket);
      sockets.set(id, set);
      await subscriber.subscribe(`productscroll:realtime:${id}`);
      if (socket.readyState !== 1) return;
      socket.send(JSON.stringify({ type: "connected" }));
    };
    void authenticate().catch(() => socket.close(1008, "Unauthorized"));
    socket.on("pong", () => alive.add(socket));
    socket.on("message", (raw) => {
      void (async () => {
        if (
          !userId ||
          ++frames > 20 ||
          raw.toString().length > 1000 ||
          !(await authorized(socket))
        )
          return;
        const input = parse(
          z.object({
            type: z.literal("typing"),
            conversationId: z.string(),
            typing: z.boolean(),
          }),
          JSON.parse(raw.toString()),
        );
        await membership(userId, input.conversationId);
        const members = await db.conversationMember.findMany({
          where: {
            conversationId: input.conversationId,
            accepted: true,
            userId: { not: userId },
          },
        });
        const recipients: string[] = [];
        for (const m of members)
          if (!(await blocked(userId, m.userId))) recipients.push(m.userId);
        await emit(recipients, { ...input, userId });
      })().catch(() => undefined);
    });
    socket.on("close", () => {
      clearInterval(reset);
      if (userId) {
        websocketConnections.dec();
        sockets.get(userId)?.delete(socket);
        if (!sockets.get(userId)?.size) {
          sockets.delete(userId);
          void subscriber
            .unsubscribe(`productscroll:realtime:${userId}`)
            .catch(() => undefined);
        }
      }
    });
  });
  app.get("/conversations", async (req) => {
    const user = await requireUser(req);
    const conversations = await db.conversation.findMany({
      where: { members: { some: { userId: user.id } } },
      include: {
        members: { include: { user: true } },
        messages: {
          where: { hiddenFor: { none: { userId: user.id } } },
          include: includeMessage,
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    const unread = await db.message.groupBy({
      by: ["conversationId"],
      where: {
        conversationId: { in: conversations.map((c) => c.id) },
        senderId: { not: user.id },
        reads: { none: { userId: user.id } },
        hiddenFor: { none: { userId: user.id } },
        unsentAt: null,
      },
      _count: true,
    });
    const counts = new Map(unread.map((c) => [c.conversationId, c._count]));
    return {
      items: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        members: c.members.map((m) => publicUser(m.user)),
        isRequest: !c.members.find((m) => m.userId === user.id)?.accepted,
        lastMessage: c.messages[0] ? present(c.messages[0]) : null,
        unreadCount: counts.get(c.id) || 0,
      })),
    };
  });
  app.post("/conversations", async (req, reply) => {
    const user = await requireUser(req);
    const input = parse(
      z
        .object({
          memberIds: z.array(z.string()).min(1).max(19),
          title: z.string().max(80).optional(),
        })
        .strict(),
      req.body,
    );
    const ids = [...new Set([user.id, ...input.memberIds])];
    if (ids.length < 2)
      fail(400, "MEMBERS_REQUIRED", "Choose another builder.");
    if (
      ids.length > 2 &&
      !(await db.featureFlag.findFirst({
        where: { key: "group_messages", enabled: true },
      }))
    )
      fail(403, "FEATURE_DISABLED", "Group conversations are not enabled.");
    for (const id of ids.filter((i) => i !== user.id)) {
      const target = await db.user.findUnique({ where: { id } });
      if (
        !target ||
        target.suspended ||
        target.deactivatedAt ||
        (await blocked(user.id, id)) ||
        target.messageControl === "NOBODY"
      )
        fail(
          403,
          "MESSAGES_UNAVAILABLE",
          "This builder is not accepting messages.",
        );
      if (
        target.messageControl === "FOLLOWING" &&
        !(await db.userFollow.findUnique({
          where: {
            followerId_followingId: { followerId: id, followingId: user.id },
          },
        }))
      )
        fail(
          403,
          "MESSAGES_UNAVAILABLE",
          "This builder accepts messages from people they follow.",
        );
    }
    const directKey = ids.length === 2 ? ids.sort().join(":") : null;
    const existing = directKey
      ? await db.conversation.findUnique({ where: { directKey } })
      : null;
    const conversation =
      existing ||
      (await db.conversation.create({
        data: {
          title: input.title,
          directKey,
          members: {
            create: ids.map((userId) => ({
              userId,
              accepted: userId === user.id,
            })),
          },
        },
        include: { members: { include: { user: true } } },
      }));
    return reply.code(existing ? 200 : 201).send({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        members: (await db.user.findMany({ where: { id: { in: ids } } })).map(
          publicUser,
        ),
        unreadCount: 0,
      },
    });
  });
  app.get("/conversations/:id/messages", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    await membership(user.id, id);
    const { cursor, limit } = parse(pageQuery, req.query);
    const result = page(
      await db.message.findMany({
        where: {
          conversationId: id,
          hiddenFor: { none: { userId: user.id } },
          ...decodeCursor(cursor),
        },
        include: includeMessage,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
      }),
      limit,
    );
    return { ...result, items: result.items.map(present) };
  });
  app.post("/conversations/:id/messages", async (req, reply) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    const member = await membership(user.id, id);
    if (!member.accepted)
      fail(
        403,
        "REQUEST_PENDING",
        "Accept this message request before replying.",
      );
    const input = parse(
      z
        .object({
          body: z.string().trim().max(5000).default(""),
          sharedPostId: z.string().optional(),
          replyToId: z.string().optional(),
          mediaIds: z.array(z.string()).max(4).default([]),
        })
        .strict()
        .refine(
          (v) => !!v.body || !!v.sharedPostId || v.mediaIds.length > 0,
          "A message needs content.",
        ),
      req.body,
    );
    const members = await db.conversationMember.findMany({
      where: { conversationId: id, userId: { not: user.id } },
      include: { user: true },
    });
    for (const m of members)
      if (
        (await blocked(user.id, m.userId)) ||
        m.user.suspended ||
        m.user.deactivatedAt
      )
        fail(
          403,
          "MESSAGES_UNAVAILABLE",
          "You cannot send a message to this conversation.",
        );
    if (
      members.some((m) => !m.accepted) &&
      (await db.message.count({
        where: { conversationId: id, senderId: user.id },
      })) >= 1
    )
      fail(
        403,
        "REQUEST_PENDING",
        "Wait for this builder to accept your message request.",
      );
    if (input.sharedPostId) {
      await visiblePost(input.sharedPostId, user.id);
      for (const m of members) await visiblePost(input.sharedPostId, m.userId);
    }
    if (
      input.replyToId &&
      !(await db.message.findFirst({
        where: { id: input.replyToId, conversationId: id },
      }))
    )
      fail(400, "REPLY_INVALID", "Reply must belong to this conversation.");
    if (
      (await db.mediaAsset.count({
        where: {
          id: { in: input.mediaIds },
          ownerId: user.id,
          processingStatus: "READY",
          mediaType: "IMAGE",
        },
      })) !== new Set(input.mediaIds).size
    )
      fail(400, "MEDIA_NOT_READY", "Choose processed images you own.");
    const message = await db.$transaction(async (tx) => {
      await tx.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      });
      return tx.message.create({
        data: {
          conversationId: id,
          senderId: user.id,
          body: input.body,
          sharedPostId: input.sharedPostId,
          replyToId: input.replyToId,
          reads: { create: { userId: user.id } },
          media: { create: input.mediaIds.map((mediaId) => ({ mediaId })) },
        },
        include: includeMessage,
      });
    });
    const result = present(message);
    await emit([user.id, ...members.map((m) => m.userId)], {
      type: "message",
      conversationId: id,
      message: result,
    });
    for (const m of members)
      if (!m.muted)
        await notify(
          m.userId,
          user.id,
          "MESSAGE",
          `${user.displayName} sent you a message.`,
          undefined,
          undefined,
          `MESSAGE:${message.id}`,
        );
    return reply.code(201).send({ message: result });
  });
  app.post("/conversations/:id/accept", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    await membership(user.id, id);
    await db.conversationMember.update({
      where: { conversationId_userId: { conversationId: id, userId: user.id } },
      data: { accepted: true },
    });
    return { ok: true };
  });
  app.put("/conversations/:id/mute", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    await membership(user.id, id);
    const { muted } = parse(z.object({ muted: z.boolean() }), req.body);
    await db.conversationMember.update({
      where: { conversationId_userId: { conversationId: id, userId: user.id } },
      data: { muted },
    });
    return { ok: true };
  });
  app.post("/conversations/:id/read", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    await membership(user.id, id);
    const messages = await db.message.findMany({
      where: { conversationId: id, reads: { none: { userId: user.id } } },
      select: { id: true },
      take: 1000,
    });
    await db.$transaction([
      db.messageRead.createMany({
        data: messages.map((m) => ({ messageId: m.id, userId: user.id })),
        skipDuplicates: true,
      }),
      db.conversationMember.update({
        where: {
          conversationId_userId: { conversationId: id, userId: user.id },
        },
        data: { lastReadAt: new Date() },
      }),
    ]);
    const members = await db.conversationMember.findMany({
      where: { conversationId: id },
    });
    await emit(
      members.map((m) => m.userId),
      { type: "read", conversationId: id, userId: user.id },
    );
    return { ok: true };
  });
  app.delete("/messages/:id", async (req) => {
    const user = await requireUser(req);
    const { id } = parse(idParams, req.params);
    const { scope } = parse(
      z.object({ scope: z.enum(["self", "everyone"]).default("self") }),
      req.query,
    );
    const message = await db.message.findUnique({ where: { id } });
    if (!message) fail(404, "MESSAGE_NOT_FOUND", "Message not found.");
    await membership(user.id, message.conversationId);
    if (scope === "everyone") {
      if (
        message.senderId !== user.id ||
        message.createdAt < new Date(Date.now() - 15 * 60000)
      )
        fail(
          403,
          "UNSEND_UNAVAILABLE",
          "You can unsend your own messages for 15 minutes.",
        );
      await db.message.update({
        where: { id },
        data: { body: "", unsentAt: new Date(), sharedPostId: null },
      });

      const members = await db.conversationMember.findMany({
        where: { conversationId: message.conversationId },
        select: { userId: true },
      });
      const otherMemberIds = members
        .map((m) => m.userId)
        .filter((uid) => uid !== user.id);

      // Delete in-app notifications for this unsent message
      if (otherMemberIds.length > 0) {
        await db.notification.deleteMany({
          where: {
            userId: { in: otherMemberIds },
            type: "MESSAGE",
            OR: [
              { groupKey: `MESSAGE:${id}` },
              { groupKey: `MESSAGE:${user.id}` },
              { actorId: user.id },
            ],
          },
        });
      }

      await emit(
        members.map((m) => m.userId),
        {
          type: "message_unsent",
          conversationId: message.conversationId,
          messageId: id,
        },
      );
    } else
      await db.messageHidden.createMany({
        data: { messageId: id, userId: user.id },
        skipDuplicates: true,
      });
    return { ok: true };
  });
}
