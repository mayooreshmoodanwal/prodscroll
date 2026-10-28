import { randomBytes, randomInt, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import type { PrismaClient } from "@prisma/client";

const scrypt = promisify(scryptCallback);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${key.toString("hex")}`;
}

export function generateTempPassword(): string {
  // Generate cryptographically random secure temporary password (e.g. 18 chars with upper, lower, digits, symbol)
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*";
  const bytes = randomBytes(20);
  let result = "";
  for (let i = 0; i < 18; i++) {
    result += chars[bytes[i] % chars.length];
  }
  // Ensure at least 1 upper, 1 lower, 1 digit, 1 symbol
  return result + "A1!";
}

export async function generateUnique7DigitUid(db: PrismaClient): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const num = randomInt(1000000, 9999999);
    const uid = String(num);
    const existing = await db.user.findUnique({ where: { id: uid } });
    if (!existing) return uid;
  }
  throw new Error("Unable to generate unique 7-digit numeric UID after 50 attempts.");
}

const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "root",
  "support",
  "help",
  "prodgram",
  "prodscroll",
  "editorial",
  "discovery",
  "api",
  "app",
  "system",
  "moderator",
  "official",
  "founder",
  "login",
  "register",
  "signup",
  "signin",
  "auth",
  "reels",
  "feed",
  "explore",
  "messages",
  "notifications",
  "settings",
]);

export async function generateCleanUsername(
  db: PrismaClient,
  rawName: string,
  preferredPlatformUser?: string | null,
): Promise<string> {
  // Sanitize name: convert to lowercase, alphanumeric and underscores only, 3-24 characters
  let base = (preferredPlatformUser || rawName)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (base.length < 3) base = `founder_${base}`.slice(0, 20);
  if (base.length > 20) base = base.slice(0, 20);

  // Check reserved
  if (RESERVED_USERNAMES.has(base)) {
    base = `${base}_founder`;
  }

  // Check collision in database
  let candidate = base;
  let counter = 1;

  while (true) {
    const existing = await db.user.findUnique({ where: { username: candidate } });
    if (!existing) return candidate;

    const suffix = counter < 10 ? `0${counter}` : String(counter);
    candidate = `${base.slice(0, 20 - suffix.length - 1)}_${suffix}`;
    counter++;
  }
}

export function generateOutreachDraft(params: {
  founderName: string;
  productName: string;
  companyName: string;
  username: string;
  productSlug: string;
  inviteToken?: string;
  verifiedEmail?: string | null;
}): string {
  const recipient = params.founderName && params.founderName !== "Tech Founder" ? params.founderName : "Founder";
  const productUrl = `https://prodscroll-mayooreshmoodanwals-projects.vercel.app/product/${params.productSlug}`;
  const claimUrl = params.inviteToken
    ? `https://prodscroll-mayooreshmoodanwals-projects.vercel.app/verify?token=${params.inviteToken}`
    : `https://prodscroll-mayooreshmoodanwals-projects.vercel.app/login`;

  return `Subject: Prodgram Discovery: Featuring ${params.productName}

Hi ${recipient},

I'm reaching out from the Prodgram team. We track and spotlight the most promising new software, developer tools, and startup products.

Our autonomous product discovery engine surfaced ${params.productName} and we've featured it with a dedicated product page and demo overview:
${productUrl}

Because this profile was created through our public discovery engine, it currently bears a "Discovered by Prodgram" marker and is unclaimed. We have reserved the username @${params.username} for you.

If you'd like to claim this official profile, update the product narrative, link your team, or publish your official product reels:
1. Open your claim and setup link: ${claimUrl}
2. Review and verify ownership of ${params.companyName}.
3. Once claimed, the profile will display as officially founder-verified.

We would love to have you on board! If you have any questions or want any details updated immediately, just reply to this email.

Best regards,
The Prodgram Editorial Team
https://prodscroll-mayooreshmoodanwals-projects.vercel.app
`;
}
