import { db, Prisma, type Role } from "../src/index.js";
import identities from "./identities.json";
import { randomBytes, scrypt as callback } from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(callback);
const salt = randomBytes(16).toString("hex");
const passwordHash = `scrypt:${salt}:${((await scrypt(process.env.SEED_PASSWORD || "BuildSomething!42", salt, 64)) as Buffer).toString("hex")}`;
if (process.env.NODE_ENV === "production")
  throw new Error("Demonstration seed data must not run in production.");
const categories = [
  "AI",
  "Robotics",
  "Consumer Apps",
  "Fintech",
  "Healthtech",
  "SaaS",
  "Climate",
  "Mobility",
  "Space",
  "Gaming",
  "Cybersecurity",
  "Developer Tools",
  "Hardware",
  "Biotech",
  "Ecommerce",
  "Education",
  "Creator Economy",
  "Design",
];
for (const name of categories)
  await db.category.upsert({
    where: { name },
    create: { name, slug: name.toLowerCase().replaceAll(" ", "-") },
    update: {},
  });
const users = [];
for (const [i, name] of identities.people.entries()) {
  const username = name.toLowerCase().replaceAll(" ", "_");
  const user = await db.user.upsert({
    where: { id: `seed-user-${i}` },
    create: {
      id: `seed-user-${i}`,
      email:
        i === 0
          ? "maya@productscroll.local"
          : i === 29
            ? "admin@productscroll.local"
            : `${username}@productscroll.local`,
      username,
      displayName: name,
      passwordHash,
      role: (i < 10 ? "FOUNDER" : i === 29 ? "ADMIN" : "USER") as Role,
      bio:
        i < 10
          ? "Building thoughtful tools. Sharing the messy middle."
          : "Curious about the people building what comes next.",
      emailVerifiedAt: new Date(),
      onboarded: true,
      location: ["Bengaluru", "London", "San Francisco", "Copenhagen"][i % 4],
    },
    update: {
      username,
      displayName: name,
      passwordHash,
      email:
        i === 0
          ? "maya@productscroll.local"
          : i === 29
            ? "admin@productscroll.local"
            : `${username}@productscroll.local`,
    },
  });
  users.push(user);
  const chosen = await db.category.findMany({
    where: {
      name: {
        in: [
          categories[i % categories.length],
          categories[(i + 3) % categories.length],
          categories[(i + 6) % categories.length],
        ],
      },
    },
  });
  await db.userInterest.createMany({
    data: chosen.map((c) => ({ userId: user.id, categoryId: c.id })),
    skipDuplicates: true,
  });
}
const startups = [];
const base = process.env.MEDIA_PUBLIC_URL || "http://localhost:4000/media";
for (const [i, s] of identities.startups.entries()) {
  const startup = await db.startup.upsert({
    where: { id: `seed-startup-${i}` },
    create: {
      id: `seed-startup-${i}`,
      slug: s.slug,
      name: s.name,
      pitch: s.pitch,
      description: s.description,
      category: s.category,
      website: `https://example.com/${s.slug}`,
      coverUrl: `${base}/seed/${s.slug}.webp`,
      location: s.location,
      foundingYear: 2024 + (i % 3),
      ownerId: users[i % 10].id,
      verificationStatus: i % 4 === 0 ? "VERIFIED" : "UNVERIFIED",
      problem:
        "Useful ideas deserve tools that are easier to understand and more enjoyable to use.",
      solution: s.description,
      members: { create: { userId: users[i % 10].id, role: "OWNER" } },
    },
    update: {
      slug: s.slug,
      name: s.name,
      pitch: s.pitch,
      description: s.description,
      category: s.category,
      coverUrl: `${base}/seed/${s.slug}.webp`,
    },
  });
  startups.push(startup);
}
const products = [];
for (let i = 0; i < 25; i++) {
  const s = identities.startups[i % 15];
  const slug = i < 15 ? `${s.slug}-one` : `${s.slug}-studio`;
  const product = await db.product.upsert({
    where: { id: `seed-product-${i}` },
    create: {
      id: `seed-product-${i}`,
      slug,
      name: i < 15 ? s.product : `${s.name} Studio`,
      description: s.description,
      category: s.category,
      startupId: startups[i % 15].id,
      status: i % 4 === 0 ? "LAUNCHED" : "BETA",
      imageUrl: `${base}/seed/${s.slug}.webp`,
      website: `https://example.com/${s.slug}`,
      releaseNotes:
        "This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.",
      launchDate: new Date(Date.now() - i * 86400000),
    },
    update: {
      slug,
      name: i < 15 ? s.product : `${s.name} Studio`,
      description: s.description,
      category: s.category,
      imageUrl: `${base}/seed/${s.slug}.webp`,
    },
  });
  products.push(product);
}
const captions = [
  (s: (typeof identities.startups)[0]) =>
    `Meet ${s.product}. ${s.pitch} We have been quietly building this, and today we are opening the doors. Curious what you would make with it.`,
  (s: (typeof identities.startups)[0]) =>
    `A small look behind the scenes at ${s.name}. This week we stripped away three steps from the first-use experience. Sometimes the best feature is the one you remove.`,
  (s: (typeof identities.startups)[0]) =>
    `From our notebook to your screen. Here is a visual walkthrough of the idea behind ${s.product}. Still early, still learning — feedback from builders is always welcome.`,
  (s: (typeof identities.startups)[0]) =>
    `One thing we learned building ${s.name}: the details people notice are rarely the ones you expect. Sharing a little progress from the workshop today.`,
  (s: (typeof identities.startups)[0]) =>
    `${s.product} is taking shape. We redesigned the onboarding after sitting down with early users. Here is what that process taught us about keeping things simple.`,
  (s: (typeof identities.startups)[0]) =>
    `A new chapter for ${s.name}. We are testing the next iteration with a small group of makers. What would you want us to explore next?`,
];
for (let i = 0; i < 150; i++) {
  const index = i % 15,
    s = identities.startups[index],
    reel = i >= 100;
  const id = `seed-post-${String(i).padStart(3, "0")}`;
  const product = products[index];
  const mediaId = `seed-media-${i}`;
  await db.mediaAsset.upsert({
    where: { id: mediaId },
    create: {
      id: mediaId,
      ownerId: users[index % 10].id,
      mediaType: reel ? "VIDEO" : "IMAGE",
      storageKey: `seed/${i}`,
      processedUrl: `${base}/seed/${s.slug}.${reel ? "mp4" : "webp"}`,
      thumbnailUrl: `${base}/seed/${s.slug}.webp`,
      mimeType: reel ? "video/mp4" : "image/webp",
      fileSizeBytes: reel ? 500000 : 80000,
      processingStatus: "READY",
      width: 1200,
      height: 900,
      durationMs: reel ? 6000 : null,
    },
    update: {
      processedUrl: `${base}/seed/${s.slug}.${reel ? "mp4" : "webp"}`,
      thumbnailUrl: `${base}/seed/${s.slug}.webp`,
    },
  });
  await db.post.upsert({
    where: { id },
    create: {
      id,
      authorId: users[index % 10].id,
      startupId: startups[index].id,
      productId: product.id,
      kind: reel
        ? "REEL"
        : i % 7 === 0
          ? "LAUNCH"
          : i % 3 === 0
            ? "UPDATE"
            : "POST",
      caption: captions[Math.floor(i / 15) % captions.length](s),
      tags: [s.category, "Building in public"],
      createdAt: new Date(
        Date.now() - (i % 100) * 2 * 3600000 - (reel ? 3600000 : 0),
      ),
      media: { create: { mediaId, position: 0 } },
    },
    update: {},
  });
  for (let j = 0; j < 3 + (i % 19); j++)
    await db.like.createMany({
      data: { postId: id, userId: users[(i + j + 10) % 30].id },
      skipDuplicates: true,
    });
  if (i % 3 === 0)
    await db.save.createMany({
      data: { postId: id, userId: users[0].id },
      skipDuplicates: true,
    });
  if (i % 2 === 0)
    await db.comment.upsert({
      where: { id: `seed-comment-${i}` },
      create: {
        id: `seed-comment-${i}`,
        postId: id,
        authorId: users[(i + 12) % 30].id,
        body: [
          "Love the thinking behind this. How did you approach the first version?",
          "The simpler onboarding makes a lot of sense. Following along!",
          "Really thoughtful work. Would love to hear more about your next steps.",
        ][i % 3],
      },
      update: {},
    });
}
for (let i = 0; i < 30; i++) {
  for (let j = 0; j < 5; j++)
    await db.startupFollow.createMany({
      data: { userId: users[i].id, startupId: startups[(i + j) % 15].id },
      skipDuplicates: true,
    });
  for (let j = 1; j <= 4; j++)
    await db.userFollow.createMany({
      data: { followerId: users[i].id, followingId: users[(i + j) % 30].id },
      skipDuplicates: true,
    });
}
const collection = await db.collection.upsert({
  where: { userId_name: { userId: users[0].id, name: "Products to try" } },
  create: { userId: users[0].id, name: "Products to try" },
  update: {},
});
const saved = await db.save.findMany({
  where: { userId: users[0].id },
  take: 8,
});
await db.collectionItem.createMany({
  data: saved.map((s) => ({ collectionId: collection.id, saveId: s.id })),
  skipDuplicates: true,
});
for (let i = 1; i <= 3; i++) {
  const directKey = [users[0].id, users[i].id].sort().join(":");
  const convo = await db.conversation.upsert({
    where: { directKey },
    create: {
      id: `seed-conversation-${i}`,
      directKey,
      members: {
        create: [
          { userId: users[0].id, accepted: true },
          { userId: users[i].id, accepted: true },
        ],
      },
    },
    update: {},
  });
  await db.message.upsert({
    where: { id: `seed-message-${i}` },
    create: {
      id: `seed-message-${i}`,
      conversationId: convo.id,
      senderId: users[i].id,
      body: [
        "Hey Maya! I saw your latest update on Forma. How did you approach the canvas interactions?",
        "That new prototype looks really thoughtful. Would love to compare notes sometime.",
        "Thanks for sharing your process. We are exploring something similar with our onboarding.",
      ][i - 1],
    },
    update: {},
  });
}
for (let i = 1; i < 12; i++)
  await db.notification.upsert({
    where: { id: `seed-notification-${i}` },
    create: {
      id: `seed-notification-${i}`,
      userId: users[0].id,
      actorId: users[i].id,
      type: i % 2 ? "FOLLOW" : "COMMENT",
      body:
        i % 2
          ? `${users[i].displayName} started following you.`
          : `${users[i].displayName} commented on your launch.`,
      postId: i % 2 ? null : "seed-post-000",
      createdAt: new Date(Date.now() - i * 3600000),
    },
    update: {},
  });
for (const [key, enabled] of Object.entries({
  group_messages: true,
  startup_verification: true,
  founder_analytics: true,
  recommendation_v2: false,
  investment_module: false,
}))
  await db.featureFlag.upsert({
    where: { key },
    create: { key, enabled },
    update: key === "investment_module" ? { enabled: false } : {},
  });
await db.rankingConfig.upsert({
  where: { key: "default" },
  create: {
    key: "default",
    weights: {
      affinity: 2.5,
      following: 2,
      freshness: 1.6,
      quality: 0.8,
      negative: 5,
      repetition: 1.8,
      exploration: 0.15,
      creatorPenalty: 3,
      categoryPenalty: 2,
    },
  },
  update: {},
});
await db.$executeRaw(
  Prisma.sql`UPDATE "Post" p SET "likeCount"=(SELECT COUNT(*)::integer FROM "Like" l WHERE l."postId"=p.id), "saveCount"=(SELECT COUNT(*)::integer FROM "Save" s WHERE s."postId"=p.id), "commentCount"=(SELECT COUNT(*)::integer FROM "Comment" c WHERE c."postId"=p.id)`,
);
console.log(
  "Seeded 30 users, 10 founders, 15 startups, 25 products, 100 posts and 50 reels with persisted social activity. Demonstration identities are fictional.",
);
await db.$disconnect();
