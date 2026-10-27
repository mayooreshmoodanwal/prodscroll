import { PrismaClient } from "../packages/database/node_modules/@prisma/client/default.js";
import { randomBytes, createHash } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
const url = new URL(process.env.DATABASE_URL);
if (!url.pathname.startsWith("/productscroll_scale_"))
  throw new Error("Use a dedicated scale database");
const db = new PrismaClient();
const sessions = [];
for (let i = 1001; i <= 1020; i++) {
  const token = randomBytes(32).toString("hex");
  await db.session.create({
    data: {
      userId: `perf-user-${i}`,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      refreshHash: randomBytes(32).toString("hex"),
      userAgent: "Synthetic load test",
      expiresAt: new Date(Date.now() + 3600000),
    },
  });
  sessions.push(token);
}
await mkdir("work", { recursive: true });
await writeFile("work/scale-sessions.json", JSON.stringify(sessions), {
  mode: 0o600,
});
await db.$disconnect();
console.log("Created 20 temporary synthetic test sessions");
