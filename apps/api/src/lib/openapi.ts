import type { RouteOptions } from "fastify";
type Field = Record<string, unknown>;
const string = (maxLength = 200): Field => ({ type: "string", maxLength });
const boolean: Field = { type: "boolean" };
const array = (items: Field, maxItems = 10): Field => ({
  type: "array",
  items,
  maxItems,
});
const body = (
  properties: Record<string, Field>,
  required: string[] = Object.keys(properties),
) => ({ type: "object", properties, required });
const definitions: Record<string, Field> = {
  "POST /auth/register": body(
    {
      email: { type: "string", format: "email" },
      username: string(30),
      displayName: string(60),
      password: string(128),
      role: { type: "string", enum: ["USER", "FOUNDER"] },
    },
    ["email", "username", "displayName", "password"],
  ),
  "POST /auth/login": body({ email: string(), password: string(128) }),
  "POST /auth/refresh": body({ refreshToken: string() }),
  "POST /auth/forgot-password": body({ email: string() }),
  "POST /auth/reset-password": body({ token: string(), password: string(128) }),
  "POST /auth/verify-email": body({ token: string() }),
  "POST /auth/mobile-exchange": body({ code: string(), verifier: string(128) }),
  "PUT /users/me/onboarding": body(
    { interests: array(string(60)), discovery: array(string(60)) },
    ["interests"],
  ),
  "POST /posts": body(
    {
      caption: string(5000),
      kind: { type: "string", enum: ["POST", "REEL", "UPDATE", "LAUNCH"] },
      startupId: string(),
      productId: string(),
      mediaIds: array(string()),
      tags: array(string(40)),
      draft: boolean,
    },
    ["caption"],
  ),
  "POST /posts/:id/comments": body({ body: string(2000), parentId: string() }, [
    "body",
  ]),
  "PUT /posts/:id/like": body({ liked: boolean }),
  "PUT /posts/:id/save": body({ saved: boolean }),
  "PUT /users/:id/follow": body({ following: boolean }),
  "PUT /startups/:id/follow": body({ following: boolean }),
  "POST /collections": body({ name: string(60) }),
  "PUT /collections/:id/items": body({ postId: string(), saved: boolean }),
  "POST /media/upload-url": body({
    filename: string(),
    mimeType: {
      type: "string",
      enum: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "video/mp4",
        "video/quicktime",
        "video/webm",
      ],
    },
    size: { type: "integer", minimum: 1, maximum: 104857600 },
  }),
  "POST /conversations": body(
    { memberIds: array(string(), 20), title: string(100) },
    ["memberIds"],
  ),
  "POST /conversations/:id/messages": body(
    {
      body: string(4000),
      sharedPostId: string(),
      replyToId: string(),
      mediaIds: array(string(), 4),
    },
    [],
  ),
  "POST /events": body({
    events: array(
      body(
        {
          type: string(40),
          postId: string(),
          startupId: string(),
          value: { type: "number" },
        },
        ["type"],
      ),
      50,
    ),
  }),
};
export function documentRoute(route: RouteOptions) {
  if (
    !route.url.startsWith("/api/") ||
    route.url.startsWith("/api/docs") ||
    route.url === "/api/openapi.json"
  )
    return;
  const path = route.url.slice(4);
  const method = Array.isArray(route.method) ? route.method[0] : route.method;
  route.schema = {
    ...route.schema,
    tags: [path.split("/")[1] || "system"],
    summary: `${method} ${path}`,
  };
  if (definitions[`${method} ${path}`])
    route.schema.body = definitions[`${method} ${path}`];
  if (!path.startsWith("/auth/") && !["GET", "HEAD"].includes(method!))
    route.schema.security = [{ session: [] }, { bearerAuth: [] }];
}
