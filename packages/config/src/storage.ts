/** Server-side configuration. Local development never needs a cloud account. */
export function storageConfig(env: NodeJS.ProcessEnv = process.env) {
  const driver = env.MEDIA_DRIVER || "local";
  if (driver === "local") return { driver } as const;
  if (driver !== "r2")
    throw new Error(
      "MEDIA_DRIVER must be local or r2. Migrate S3_* settings to R2_*.",
    );
  const required = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_UPLOAD_BUCKET",
    "R2_MEDIA_BUCKET",
    "R2_DELIVERY_URL",
    "MEDIA_DELIVERY_SECRET",
  ] as const;
  for (const name of required)
    if (!env[name]?.trim())
      throw new Error(`Missing ${name} for Cloudflare R2.`);
  if (!/^[a-f0-9]{32}$/i.test(env.R2_ACCOUNT_ID!))
    throw new Error(
      "R2_ACCOUNT_ID must be the 32-character Cloudflare account ID.",
    );
  if (env.R2_UPLOAD_BUCKET === env.R2_MEDIA_BUCKET)
    throw new Error(
      "Use separate R2 buckets for incoming and processed media.",
    );
  if (env.MEDIA_DELIVERY_SECRET!.length < 32)
    throw new Error(
      "MEDIA_DELIVERY_SECRET must contain at least 32 characters.",
    );
  const endpoint =
    env.R2_ENDPOINT || `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const parsed = new URL(endpoint);
  if (
    parsed.protocol !== "https:" ||
    !parsed.hostname.endsWith(".r2.cloudflarestorage.com")
  )
    throw new Error("R2_ENDPOINT must be a Cloudflare R2 HTTPS API endpoint.");
  const delivery = new URL(env.R2_DELIVERY_URL!);
  if (
    delivery.protocol !== "https:" ||
    delivery.hostname.endsWith(".r2.dev") ||
    delivery.search ||
    delivery.pathname !== "/"
  )
    throw new Error(
      "R2_DELIVERY_URL must be the HTTPS origin of the authenticated media Worker, not r2.dev.",
    );
  return {
    driver,
    endpoint,
    region: "auto",
    uploadBucket: env.R2_UPLOAD_BUCKET!,
    mediaBucket: env.R2_MEDIA_BUCKET!,
    deliveryUrl: delivery.origin,
    deliverySecret: env.MEDIA_DELIVERY_SECRET!,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
  } as const;
}
