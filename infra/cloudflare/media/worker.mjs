const encoder = new TextEncoder();
const response = (status, message) =>
  new Response(message, { status, headers: { "Cache-Control": "no-store" } });
export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin");
    const origins = (env.ALLOWED_ORIGINS || "").split(",");
    if (origin && !origins.includes(origin))
      return response(403, "Origin unavailable");
    const cors = {
      ...(origin
        ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" }
        : {}),
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range",
      "Access-Control-Expose-Headers":
        "Content-Length, Content-Range, Accept-Ranges",
    };
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: cors });
    if (!["GET", "HEAD"].includes(request.method))
      return response(405, "Method unavailable");
    const url = new URL(request.url);
    const segments = url.pathname.slice(1).split("/");
    if (
      segments.length < 2 ||
      segments.some(
        (part) =>
          !/^[a-zA-Z0-9._-]+$/.test(part) || part === "." || part === "..",
      ) ||
      !/\.(webp|m3u8|ts)$/.test(url.pathname)
    )
      return response(404, "Media unavailable");
    const expires = Number(url.searchParams.get("expires"));
    const signature = url.searchParams.get("signature") || "";
    if (
      !Number.isSafeInteger(expires) ||
      expires < Date.now() / 1000 ||
      expires > Date.now() / 1000 + 1800 ||
      !/^[a-f0-9]{64}$/.test(signature) ||
      !env.MEDIA_DELIVERY_SECRET ||
      env.MEDIA_DELIVERY_SECRET.length < 32
    )
      return response(403, "Media link expired");
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(env.MEDIA_DELIVERY_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const bytes = Uint8Array.from(signature.match(/../g), (pair) =>
      parseInt(pair, 16),
    );
    if (
      !(await crypto.subtle.verify(
        "HMAC",
        key,
        bytes,
        encoder.encode(`${segments[0]}:${expires}`),
      ))
    )
      return response(403, "Media link unavailable");
    // Authorization happens before every cache lookup. Tokens never enter the
    // internal object-cache key and signed responses must not be cached publicly.
    const objectKey = segments.join("/");
    const cacheKey = new Request(`${url.origin}/${objectKey}`);
    const cache = caches.default;
    let stored = await cache.match(cacheKey);
    if (!stored) {
      const object = await env.MEDIA.get(objectKey);
      if (!object) return response(404, "Media unavailable");
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("ETag", object.httpEtag);
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("Content-Length", String(object.size));
      stored = new Response(object.body, { headers });
      ctx.waitUntil(cache.put(cacheKey, stored.clone()));
    }
    const headers = new Headers(stored.headers);
    for (const [name, value] of Object.entries(cors)) headers.set(name, value);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Cache-Control", "private, no-store");
    if (objectKey.endsWith(".m3u8")) {
      // FFmpeg produces relative HLS paths; propagate the asset-scoped token to
      // playlists and segments without making the private bucket public.
      const manifest = (await stored.text())
        .split("\n")
        .map((line) => {
          if (!line.trim() || line.startsWith("#")) return line;
          const child = new URL(line, url);
          if (
            child.origin !== url.origin ||
            child.pathname.split("/")[1] !== segments[0]
          )
            throw new Error("Invalid media manifest");
          child.search = url.search;
          return child.toString();
        })
        .join("\n");
      headers.delete("Content-Length");
      return new Response(request.method === "HEAD" ? null : manifest, {
        headers,
      });
    }
    // Individual HLS segments are small; serving the full segment also supports
    // clients that omit Range. Images use the same authorized edge cache.
    return new Response(request.method === "HEAD" ? null : stored.body, {
      headers,
    });
  },
};
