import path from "node:path";
const config = {
  devIndicators: false,
  turbopack: { root: path.resolve("../..") },
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    const apiOrigin = process.env.API_PROXY_ORIGIN;
    if (!apiOrigin) return [];
    const parsedApiOrigin = new URL(apiOrigin);
    if (
      parsedApiOrigin.pathname !== "/" ||
      parsedApiOrigin.search ||
      parsedApiOrigin.username ||
      parsedApiOrigin.password ||
      (process.env.NODE_ENV === "production" && parsedApiOrigin.protocol !== "https:") ||
      !["http:", "https:"].includes(parsedApiOrigin.protocol)
    ) {
      throw new Error("API_PROXY_ORIGIN must be an HTTP(S) origin without a path or query.");
    }
    return [{ source: "/api/:path*", destination: `${parsedApiOrigin.origin}/api/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' https: data: blob:; media-src 'self' https: blob:; connect-src 'self' https://prod.ayushkumarsingh.in https://productscroll-api.onrender.com wss://productscroll-api.onrender.com https://*.onrender.com wss://*.onrender.com https://*.r2.cloudflarestorage.com https://*.cloudflare.com blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
          },
          {
            key: "Link",
            value:
              '</.well-known/api-catalog>; rel="api-catalog", </.well-known/ai-catalog.json>; rel="ai-catalog", </.well-known/agent-card.json>; rel="agent-card", </auth.md>; rel="author-doc", <https://productscroll-api.onrender.com/api/docs>; rel="service-doc"',
          },
        ],
      },
      {
        source: "/.well-known/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, HEAD, OPTIONS" },
        ],
      },
      {
        source: "/robots.txt",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Content-Type", value: "text/plain; charset=utf-8" },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Content-Type", value: "application/xml; charset=utf-8" },
        ],
      },
    ];
  },
};
export default config;
