import { afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { storageConfig } from "../../packages/config/src/storage";
import worker from "../../infra/cloudflare/media/worker.mjs";
const secret = "a-local-unit-test-signing-secret-with-40-bytes";
const env = {
  MEDIA_DRIVER: "r2",
  R2_ACCOUNT_ID: "a".repeat(32),
  R2_ACCESS_KEY_ID: "access",
  R2_SECRET_ACCESS_KEY: "test-secret",
  R2_UPLOAD_BUCKET: "incoming",
  R2_MEDIA_BUCKET: "processed",
  R2_DELIVERY_URL: "https://media.example.test",
  MEDIA_DELIVERY_SECRET: secret,
};
afterEach(() => vi.unstubAllGlobals());
describe("private Cloudflare R2 configuration and delivery", () => {
  it("uses R2 auto region and rejects public development delivery or mixed buckets", () => {
    expect(storageConfig(env)).toMatchObject({
      driver: "r2",
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    });
    expect(() =>
      storageConfig({ ...env, R2_MEDIA_BUCKET: "incoming" }),
    ).toThrow("separate R2 buckets");
    expect(() =>
      storageConfig({ ...env, R2_DELIVERY_URL: "https://public.r2.dev" }),
    ).toThrow("not r2.dev");
    expect(() => storageConfig({ ...env, R2_SECRET_ACCESS_KEY: "" })).toThrow(
      "Missing R2_SECRET_ACCESS_KEY",
    );
    expect(() => storageConfig({ MEDIA_DRIVER: "s3" })).toThrow("Migrate S3_*");
    expect(storageConfig({ MEDIA_DRIVER: "local" })).toEqual({
      driver: "local",
    });
  });
  it("authorizes before cache access and propagates an asset-scoped signature through HLS", async () => {
    const stored = new Map<string, Response>();
    const cache = {
      match: vi.fn(async (key: Request) => stored.get(key.url)?.clone()),
      put: vi.fn(async (key: Request, value: Response) => {
        stored.set(key.url, value);
      }),
    };
    vi.stubGlobal("caches", { default: cache });
    const get = vi.fn(async () => ({
      body: "#EXTM3U\n360/index.m3u8\n",
      size: 27,
      httpEtag: '"etag"',
      writeHttpMetadata: (headers: Headers) =>
        headers.set("Content-Type", "application/vnd.apple.mpegurl"),
    }));
    const context = { waitUntil: (promise: Promise<unknown>) => promise };
    const bindings = {
      MEDIA: { get },
      MEDIA_DELIVERY_SECRET: secret,
      ALLOWED_ORIGINS: "https://app.example.test",
    };
    const expires = Math.floor(Date.now() / 1000) + 600;
    const signature = createHmac("sha256", secret)
      .update(`asset123:${expires}`)
      .digest("hex");
    const url = `https://media.example.test/asset123/master.m3u8?expires=${expires}&signature=${signature}`;
    expect(
      (
        await worker.fetch(
          new Request(url.replace(signature, "0".repeat(64))),
          bindings,
          context,
        )
      ).status,
    ).toBe(403);
    expect(cache.match).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
    const good = await worker.fetch(
      new Request(url, { headers: { Origin: "https://app.example.test" } }),
      bindings,
      context,
    );
    expect(good.status).toBe(200);
    expect(good.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await good.text()).toContain(
      `https://media.example.test/asset123/360/index.m3u8?expires=${expires}&signature=${signature}`,
    );
    expect(
      (
        await worker.fetch(
          new Request(url.replace("asset123/", "another/")),
          bindings,
          context,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await worker.fetch(
          new Request(url, {
            headers: { Origin: "https://untrusted.example" },
          }),
          bindings,
          context,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await worker.fetch(
          new Request(url.replace(String(expires), "1")),
          bindings,
          context,
        )
      ).status,
    ).toBe(403);
    const cached = await worker.fetch(new Request(url), bindings, context);
    expect(cached.status).toBe(200);
    expect(get).toHaveBeenCalledTimes(1);
  });
});
