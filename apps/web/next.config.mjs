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
        ],
      },
    ];
  },
};
export default config;
