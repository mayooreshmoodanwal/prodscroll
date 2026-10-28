import { NextRequest, NextResponse } from "next/server";

// Rate limiting store for sensitive auth paths (Ubserve smoke test mitigation)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit = 60, windowMs = 60000) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count++;
  rateLimitMap.set(ip, entry);
  const remaining = Math.max(0, limit - entry.count);
  const resetSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  return {
    allowed: entry.count <= limit,
    limit,
    remaining,
    resetSeconds,
  };
}

// Clean up stale rate limit entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetAt + 60000) rateLimitMap.delete(key);
    }
  }, 120000);
}

const ROBOTS_TXT = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /
Disallow: /admin
Disallow: /settings
Disallow: /api/

# AI Search Crawlers (Index content to answer user prompts)
User-agent: OAI-SearchBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

# AI Training Crawlers
User-agent: GPTBot
Allow: /
Disallow: /admin
Disallow: /settings
Disallow: /api/

User-agent: ClaudeBot
Allow: /
Disallow: /admin
Disallow: /settings
Disallow: /api/

User-agent: Google-Extended
Allow: /
Disallow: /admin
Disallow: /settings
Disallow: /api/

User-agent: Applebot-Extended
Allow: /
Disallow: /admin
Disallow: /settings
Disallow: /api/

User-agent: CCBot
Allow: /
Disallow: /admin
Disallow: /settings
Disallow: /api/

# Content Signals (draft-romm-aipref-contentsignals)
Content-Signal: ai-train=no, search=yes, ai-input=no

# Sitemaps
Sitemap: https://prod.ayushkumarsingh.in/sitemap.xml
`;

const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://prod.ayushkumarsingh.in/</loc>
    <lastmod>2026-10-29T00:00:00+00:00</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://prod.ayushkumarsingh.in/explore</loc>
    <lastmod>2026-10-29T00:00:00+00:00</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://prod.ayushkumarsingh.in/reels</loc>
    <lastmod>2026-10-29T00:00:00+00:00</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://prod.ayushkumarsingh.in/following</loc>
    <lastmod>2026-10-29T00:00:00+00:00</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://prod.ayushkumarsingh.in/saved</loc>
    <lastmod>2026-10-29T00:00:00+00:00</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;

const SITEMAP_INDEX_XML = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://prod.ayushkumarsingh.in/sitemap.xml</loc>
    <lastmod>2026-10-29T00:00:00+00:00</lastmod>
  </sitemap>
</sitemapindex>`;

const API_CATALOG_JSON = JSON.stringify(
  {
    linkset: [
      {
        anchor: "https://productscroll-api.onrender.com/api",
        "service-desc": [
          {
            href: "https://productscroll-api.onrender.com/api/docs/json",
            type: "application/vnd.oai.openapi+json;version=3.0",
          },
        ],
        "service-doc": [
          {
            href: "https://productscroll-api.onrender.com/api/docs",
            type: "text/html",
          },
        ],
        status: [
          {
            href: "https://productscroll-api.onrender.com/healthz",
            type: "application/json",
          },
        ],
      },
    ],
  },
  null,
  2,
);

const OPENID_CONFIG = JSON.stringify(
  {
    issuer: "https://prod.ayushkumarsingh.in",
    authorization_endpoint: "https://prod.ayushkumarsingh.in/login",
    token_endpoint: "https://productscroll-api.onrender.com/api/auth/token",
    userinfo_endpoint: "https://productscroll-api.onrender.com/api/auth/me",
    jwks_uri: "https://productscroll-api.onrender.com/api/auth/jwks",
    registration_endpoint: "https://prod.ayushkumarsingh.in/auth.md",
    scopes_supported: ["openid", "profile", "email", "read", "write"],
    response_types_supported: ["code", "token"],
    grant_types_supported: [
      "authorization_code",
      "client_credentials",
      "refresh_token",
    ],
    token_endpoint_auth_methods_supported: [
      "client_secret_basic",
      "client_secret_post",
    ],
    service_documentation: "https://productscroll-api.onrender.com/api/docs",
  },
  null,
  2,
);

const OAUTH_PROTECTED_RESOURCE = JSON.stringify(
  {
    resource: "https://prod.ayushkumarsingh.in",
    authorization_servers: ["https://prod.ayushkumarsingh.in"],
    scopes_supported: ["read", "write", "messages", "profile"],
    bearer_methods_supported: ["header"],
    resource_documentation: "https://productscroll-api.onrender.com/api/docs",
  },
  null,
  2,
);

const MCP_SERVER_CARD = JSON.stringify(
  {
    $schema: "https://modelcontextprotocol.io/schemas/server-card.json",
    serverInfo: {
      name: "productscroll-mcp",
      version: "1.0.0",
      title: "ProductScroll MCP Server",
      description:
        "Model Context Protocol (MCP) server for discovering startups, products, and reels on ProductScroll.",
    },
    transport: {
      type: "sse",
      endpoint: "https://productscroll-api.onrender.com/api/mcp/sse",
    },
    capabilities: {
      tools: { listChanged: false },
      resources: { subscribe: false, listChanged: false },
      prompts: { listChanged: false },
    },
  },
  null,
  2,
);

const AGENT_CARD_JSON = JSON.stringify(
  {
    name: "ProductScroll Builder Agent",
    version: "1.0.0",
    description:
      "Agent for discovering startups, product updates, builder profiles, and product reels on ProductScroll.",
    supportedInterfaces: [
      {
        url: "https://productscroll-api.onrender.com/api/a2a",
        protocol: "HTTP/1.1",
        transport: "json-rpc-2.0",
      },
    ],
    capabilities: {
      search: true,
      reels: true,
      startups: true,
      products: true,
    },
    skills: [
      {
        id: "browse-startups",
        name: "Browse Startups",
        description:
          "Search and discover startups and products created by builders.",
      },
      {
        id: "view-reels",
        name: "View Product Reels",
        description: "Stream product reels and demo videos.",
      },
    ],
  },
  null,
  2,
);

const AGENT_SKILLS_INDEX = JSON.stringify(
  {
    $schema: "https://agentskills.io/schema/v0.2.0/index.json",
    skills: [
      {
        name: "browse-startups",
        type: "skill-md",
        description:
          "Discover early stage startups, builder updates, and product launches.",
        url: "https://prod.ayushkumarsingh.in/.well-known/agent-skills/browse-startups/SKILL.md",
      },
    ],
  },
  null,
  2,
);

const SKILL_MD = `---
name: browse-startups
description: Discover and inspect early-stage startups and builder products on ProductScroll
---

# ProductScroll Browse Startups Skill

Use this skill to fetch, search, and analyze startups and product reels hosted on ProductScroll.

## Endpoints
- **Explore API**: \`GET https://productscroll-api.onrender.com/api/explore\`
- **Search API**: \`GET https://productscroll-api.onrender.com/api/search?q={query}\`
- **Reels API**: \`GET https://productscroll-api.onrender.com/api/reels\`
- **Post Details**: \`GET https://productscroll-api.onrender.com/api/posts/{id}\`
`;

const AI_CATALOG_JSON = JSON.stringify(
  {
    specVersion: "1.0.0",
    host: {
      domain: "prod.ayushkumarsingh.in",
      name: "ProductScroll",
    },
    entries: [
      {
        id: "urn:air:prod.ayushkumarsingh.in:api:openapi",
        displayName: "ProductScroll REST API",
        type: "application/vnd.oai.openapi+json;version=3.0",
        url: "https://productscroll-api.onrender.com/api/docs/json",
        representativeQueries: [
          "Find startups on ProductScroll",
          "Get product reels",
          "Read founder updates",
        ],
      },
      {
        id: "urn:air:prod.ayushkumarsingh.in:mcp:server",
        displayName: "ProductScroll MCP Server",
        type: "application/json",
        url: "https://prod.ayushkumarsingh.in/.well-known/mcp/server-card.json",
        representativeQueries: [
          "Connect MCP agent to ProductScroll",
          "Browse products via MCP",
        ],
      },
      {
        id: "urn:air:prod.ayushkumarsingh.in:agent:card",
        displayName: "ProductScroll A2A Agent",
        type: "application/json",
        url: "https://prod.ayushkumarsingh.in/.well-known/agent-card.json",
        representativeQueries: [
          "A2A agent protocol discovery",
          "Collaborate with ProductScroll agent",
        ],
      },
    ],
  },
  null,
  2,
);

const POPPY_JSON = JSON.stringify(
  {
    protocol_version: "0.1",
    organization: {
      name: "ProductScroll",
      domain: "prod.ayushkumarsingh.in",
    },
    web: {},
    apis: {
      base_url: "https://productscroll-api.onrender.com/api",
    },
  },
  null,
  2,
);

const AUTH_MD = `# Agent Authentication & Registration (Auth.md)

ProductScroll supports autonomous AI agents and automated discovery.

## Identity & Protocol Discovery
- **Resource**: https://prod.ayushkumarsingh.in
- **OAuth Authorization Server**: https://prod.ayushkumarsingh.in/.well-known/oauth-authorization-server
- **OpenID Configuration**: https://prod.ayushkumarsingh.in/.well-known/openid-configuration
- **OAuth Protected Resource**: https://prod.ayushkumarsingh.in/.well-known/oauth-protected-resource
- **API Catalog**: https://prod.ayushkumarsingh.in/.well-known/api-catalog
- **API Documentation**: https://productscroll-api.onrender.com/api/docs
- **OpenAPI Schema**: https://productscroll-api.onrender.com/api/docs/json

## Supported Grant Types
- authorization_code
- client_credentials
- refresh_token

## Supported Scopes
- read: Read public startups, posts, reels, and profiles.
- write: Create posts and update product details.
- messages: Access and participate in conversation threads with builders.
- profile: Read authenticated builder profile.
`;

const SITE_MARKDOWN = `# ProductScroll — The Builders' Network

The future, in progress. Discover what people are building. Explore startups, product demos, and honest updates from the people behind them.

## Available Routes
- **Home Feed**: https://prod.ayushkumarsingh.in/
- **Explore Startups**: https://prod.ayushkumarsingh.in/explore
- **Product Reels**: https://prod.ayushkumarsingh.in/reels
- **Following Feed**: https://prod.ayushkumarsingh.in/following
- **Create Post**: https://prod.ayushkumarsingh.in/create
- **Settings**: https://prod.ayushkumarsingh.in/settings

## Agent Protocols & Machine-Readable Interfaces
- **API Catalog (RFC 9727)**: https://prod.ayushkumarsingh.in/.well-known/api-catalog
- **AI Catalog (ARD Spec)**: https://prod.ayushkumarsingh.in/.well-known/ai-catalog.json
- **A2A Agent Card**: https://prod.ayushkumarsingh.in/.well-known/agent-card.json
- **MCP Server Card**: https://prod.ayushkumarsingh.in/.well-known/mcp/server-card.json
- **OAuth Discovery**: https://prod.ayushkumarsingh.in/.well-known/oauth-authorization-server
- **OAuth Protected Resource**: https://prod.ayushkumarsingh.in/.well-known/oauth-protected-resource
- **Auth.md**: https://prod.ayushkumarsingh.in/auth.md
- **Personal Agent Protocol (Poppy)**: https://prod.ayushkumarsingh.in/.well-known/poppy.json
- **Agent Skills**: https://prod.ayushkumarsingh.in/.well-known/agent-skills/index.json
- **REST API Specs**: https://productscroll-api.onrender.com/api/docs/json
`;

const LINK_HEADERS = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</.well-known/ai-catalog.json>; rel="ai-catalog"',
  '</.well-known/agent-card.json>; rel="agent-card"',
  '</auth.md>; rel="author-doc"',
  '<https://productscroll-api.onrender.com/api/docs>; rel="service-doc"',
].join(", ");

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  // Rate limiting check for authentication routes (/login, /auth/*, /api/auth/*)
  const isAuthRoute =
    pathname === "/login" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth");

  if (isAuthRoute) {
    const rate = checkRateLimit(clientIp, 60, 60000);
    if (!rate.allowed) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Too many requests. Please try again shortly.",
            code: "RATE_LIMITED",
          },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(rate.resetSeconds),
            "RateLimit-Limit": String(rate.limit),
            "RateLimit-Remaining": "0",
            "RateLimit-Reset": String(rate.resetSeconds),
          },
        },
      );
    }
  }

  // Common security headers across all responses
  const baseHeaders: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    Link: LINK_HEADERS,
  };

  // Agent Readiness: Protocol Discovery & Well-Known endpoints
  if (pathname === "/robots.txt") {
    return new Response(ROBOTS_TXT, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (
    pathname === "/sitemap.xml" ||
    pathname === "/sitemap.xml.gz" ||
    pathname === "/sitemap-index.xml"
  ) {
    return new Response(SITEMAP_XML, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (pathname === "/sitemap_index.xml") {
    return new Response(SITEMAP_INDEX_XML, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (pathname === "/.well-known/api-catalog") {
    return new Response(API_CATALOG_JSON, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Type": "application/linkset+json; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (
    pathname === "/.well-known/openid-configuration" ||
    pathname === "/.well-known/oauth-authorization-server"
  ) {
    return new Response(OPENID_CONFIG, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (pathname === "/.well-known/oauth-protected-resource") {
    return new Response(OAUTH_PROTECTED_RESOURCE, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (pathname === "/auth.md") {
    return new Response(AUTH_MD, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (
    pathname === "/.well-known/mcp/server-card.json" ||
    pathname === "/.well-known/mcp/server-cards.json" ||
    pathname === "/.well-known/mcp.json"
  ) {
    return new Response(MCP_SERVER_CARD, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (pathname === "/.well-known/agent-card.json") {
    return new Response(AGENT_CARD_JSON, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (pathname === "/.well-known/agent-skills/index.json") {
    return new Response(AGENT_SKILLS_INDEX, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (
    pathname === "/.well-known/agent-skills/browse-startups/SKILL.md" ||
    pathname === "/.well-known/agent-skills/robots-txt/SKILL.md"
  ) {
    return new Response(SKILL_MD, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (pathname === "/.well-known/ai-catalog.json") {
    return new Response(AI_CATALOG_JSON, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (pathname === "/.well-known/poppy.json") {
    return new Response(POPPY_JSON, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Content Accessibility: Markdown Negotiation for AI Agents (Cloudflare Markdown for Agents standard)
  const acceptHeader = request.headers.get("accept") || "";
  if (
    pathname === "/index.md" ||
    (acceptHeader.includes("text/markdown") && !pathname.startsWith("/_next"))
  ) {
    return new Response(SITE_MARKDOWN, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Type": "text/markdown; charset=utf-8",
        Vary: "Accept",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Standard Next.js page response with Content-Security-Policy and hardened headers
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const api = new URL(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
    request.url,
  ).origin;
  const socket =
    process.env.NEXT_PUBLIC_SOCKET_URL || api.replace(/^http/, "ws");
  const development = process.env.NODE_ENV !== "production";

  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' https: http: data: blob:",
    "media-src 'self' https: http: blob:",
    `connect-src 'self' ${api} ${socket} https://productscroll-api.onrender.com wss://productscroll-api.onrender.com https://*.onrender.com wss://*.onrender.com https://*.r2.cloudflarestorage.com https://*.cloudflare.com blob: ${process.env.NEXT_PUBLIC_UPLOAD_ORIGINS || ""}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);

  // Apply all base security and link discovery headers
  for (const [key, value] of Object.entries(baseHeaders)) {
    response.headers.set(key, value);
  }

  if (isAuthRoute) {
    const rate = checkRateLimit(clientIp, 60, 60000);
    response.headers.set("RateLimit-Limit", String(rate.limit));
    response.headers.set("RateLimit-Remaining", String(rate.remaining));
    response.headers.set("RateLimit-Reset", String(rate.resetSeconds));
  }

  return response;
}

export const middleware = proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
