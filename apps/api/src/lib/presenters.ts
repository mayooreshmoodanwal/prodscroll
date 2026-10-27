import { mediaUrl } from "./media-access.js";
import { db, type Prisma } from "@productscroll/database";
import { publicUser } from "./core.js";
export const startupInclude = {
  owner: true,
} satisfies Prisma.StartupInclude;
export type StartupRecord = Prisma.StartupGetPayload<{
  include: typeof startupInclude;
}>;
export const presentStartup = (s: StartupRecord) => ({
  id: s.id,
  slug: s.slug,
  name: s.name,
  pitch: s.pitch,
  description: s.description,
  category: s.category,
  website: s.website,
  logoUrl: mediaUrl(s.logoUrl),
  coverUrl: mediaUrl(s.coverUrl),
  location: s.location,
  foundingYear: s.foundingYear,
  problem: s.problem,
  solution: s.solution,
  verified: s.verificationStatus === "VERIFIED",
  verificationStatus: s.verificationStatus,
  ownerId: s.ownerId,
  followerCount: s.followerCount,
  founder: publicUser(s.owner),
});
export const postInclude = (userId?: string) =>
  ({
    author: true,
    startup: {
      include: {
        ...startupInclude,
        followers: {
          where: { userId: userId || "__guest__" },
          select: { userId: true },
        },
      },
    },
    product: { include: { startup: { include: startupInclude } } },
    media: { include: { media: true }, orderBy: { position: "asc" as const } },
    likes: {
      where: { userId: userId || "__guest__" },
      select: { userId: true },
    },
    saves: { where: { userId: userId || "__guest__" }, select: { id: true } },
  }) satisfies Prisma.PostInclude;
export type PostRecord = Prisma.PostGetPayload<{
  include: ReturnType<typeof postInclude>;
}>;
export const presentPost = (p: PostRecord) => ({
  id: p.id,
  kind: p.kind,
  caption: p.caption,
  tags: p.tags,
  draft: p.draft,
  createdAt: p.createdAt,
  author: publicUser(p.author),
  startup: p.startup
    ? {
        ...presentStartup(p.startup),
        following: p.startup.followers.length > 0,
      }
    : null,
  product: p.product
    ? {
        ...p.product,
        imageUrl: mediaUrl(p.product.imageUrl),
        startup: presentStartup(p.product.startup),
      }
    : null,
  media: p.media.map(({ media: m }) => ({
    id: m.id,
    mediaType: m.mediaType,
    url: mediaUrl(m.processedUrl || m.originalUrl),
    thumbnailUrl: mediaUrl(m.thumbnailUrl),
    width: m.width,
    height: m.height,
    durationMs: m.durationMs,
    mimeType: m.mimeType,
    processingStatus: m.processingStatus,
  })),
  likeCount: p.likeCount,
  commentCount: p.commentCount,
  saveCount: p.saveCount,
  liked: p.likes.length > 0,
  saved: p.saves.length > 0,
});
export async function getPost(id: string, userId?: string) {
  const p = await db.post.findUniqueOrThrow({
    where: { id },
    include: postInclude(userId),
  });
  return presentPost(p);
}
export const productInclude = {
  startup: { include: startupInclude },
} satisfies Prisma.ProductInclude;
export const presentProduct = (
  p: Prisma.ProductGetPayload<{ include: typeof productInclude }>,
) => ({
  ...p,
  imageUrl: mediaUrl(p.imageUrl),
  startup: presentStartup(p.startup),
});
