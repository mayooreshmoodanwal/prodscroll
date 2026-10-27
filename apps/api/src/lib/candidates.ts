import { db, type Prisma } from "@productscroll/database";
import { redis } from "./core.js";
const pending = new Map<string, Promise<string[]>>();
/** Shared public discovery pools. Personalized visibility is reapplied afterward. */
export async function publicCandidateIds(reels: boolean): Promise<string[]> {
  const key = `candidates:v1:${reels ? "reels" : "home"}`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as string[];
  const existing = pending.get(key);
  if (existing) return existing;
  const promise = (async () => {
    const where: Prisma.PostWhereInput = {
      draft: false,
      removedAt: null,
      author: { privateAccount: false, suspended: false, deactivatedAt: null },
      ...(reels
        ? {
            kind: "REEL",
            media: {
              some: {
                media: { processingStatus: "READY", mediaType: "VIDEO" },
              },
            },
          }
        : {}),
    };
    const [fresh, popular] = await Promise.all([
      db.post.findMany({
        where,
        select: { id: true },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 150,
      }),
      db.post.findMany({
        where,
        select: { id: true },
        orderBy: [{ saveCount: "desc" }, { id: "desc" }],
        take: 80,
      }),
    ]);
    const ids = [...new Set([...fresh, ...popular].map((post) => post.id))];
    await redis.set(key, JSON.stringify(ids), "EX", 15);
    return ids;
  })().finally(() => pending.delete(key));
  pending.set(key, promise);
  return promise;
}

/** Discovery samples recent follows; ACL checks happen on the resulting bounded IDs. */
export async function followedCandidateIds(
  userId: string,
  reels: boolean,
): Promise<string[]> {
  const [people, startups] = await Promise.all([
    db.userFollow.findMany({
      where: { followerId: userId, accepted: true },
      select: { followingId: true },
      orderBy: [{ createdAt: "desc" }, { followingId: "desc" }],
      take: 500,
    }),
    db.startupFollow.findMany({
      where: { userId },
      select: { startupId: true },
      orderBy: [{ createdAt: "desc" }, { startupId: "desc" }],
      take: 500,
    }),
  ]);
  return (
    await db.post.findMany({
      where: {
        draft: false,
        removedAt: null,
        OR: [
          { authorId: { in: [userId, ...people.map((p) => p.followingId)] } },
          { startupId: { in: startups.map((s) => s.startupId) } },
        ],
        ...(reels
          ? {
              kind: "REEL",
              media: {
                some: {
                  media: { processingStatus: "READY", mediaType: "VIDEO" },
                },
              },
            }
          : {}),
      },
      select: { id: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 100,
    })
  ).map((p) => p.id);
}
