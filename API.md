# API contract

The running API publishes OpenAPI at `/api/openapi.json` and an explorer at `/api/docs`. Main mutation payloads have JSON schemas; domain handlers apply stricter Zod validation and authorization. The public DTOs are in `packages/types`; the implementation is the authority for optional fields and enum values.

## Conventions

REST requests use JSON, except signed binary upload PUTs. Browser fetches include credentials and must send an allowed Origin on mutations. Native clients use `Authorization: Bearer <accessToken>`. Successful list responses normally contain `{items, nextCursor, hasMore}`; bounded aggregate lists use `{items}`. Follow/like/save changes use an explicit target boolean so repeating a request does not toggle accidentally.

Errors have `{error:{code,message,requestId}}`. Statuses distinguish 400 validation, 401 identity, 403 permission/origin, 404 unavailable/private resource, 409 conflict, 429 limit and 500 sanitized internal errors. Respect Retry-After when rate limited. Maximum general page size is 40; opaque cursors must not be edited. Cookie changes on the refresh route require Origin just like other mutations.

## Core examples

```http
POST /api/auth/register
Content-Type: application/json

{"email":"builder@example.com","username":"curious_builder","displayName":"Curious Builder","password":"a-long-unique-password","role":"FOUNDER"}
```

Registration issues a session and queues email verification. Verify through `/auth/verify-email` before content mutations. Onboard with `PUT /users/me/onboarding` and `{"interests":["AI","Robotics","Climate"]}`. Login returns a public user and mobile access/refresh tokens while setting browser cookies. Store tokens only in SecureStore on mobile; web uses HttpOnly cookies.

```http
PUT /api/posts/POST_ID/like
Content-Type: application/json
Authorization: Bearer ACCESS_TOKEN

{"liked":true}
```

Use the same route with false to unlike. Save/follow endpoints similarly accept `{saved:true}` and `{following:true}`. Post creation accepts `{caption,kind,startupId?,productId?,mediaIds?,tags?,draft?}`. The author comes from the session; clients cannot assign arbitrary authors. Startup/product association requires scoped publishing permission.

Upload lifecycle: `POST /media/upload-url` with `{filename,mimeType,size}` → PUT actual bytes to the returned URL with its headers → `POST /media/:id/complete` → poll the owner-only `GET /media/:id` until READY/FAILED → create a post referencing READY media IDs. Preserve drafts if the upload fails. Local uploads require the exact declared size/type and a valid HMAC expiry. Limits are 15 MiB/image, 100 MiB/video, 1 GiB per user/day and video at most 180 seconds/4K.

## Realtime

### Continuous reels

`GET /api/reels` returns up to 10 READY video reels. Supply `?seen=ID1,ID2,...` with the last 40 loaded IDs for the next batch (maximum 60). Each request reranks eligible content using current interests and ingested engagement events. Unlike Home's stable cursor snapshot, this endpoint always starts a fresh ranking and returns `nextCursor: null`; `hasMore` indicates that eligible reels exist. With at least 10 eligible reels the batch contains 10 distinct items. A smaller catalog returns what is available. Recent exclusions are relaxed oldest-first when needed so browsing can continue through a finite catalog without an artificial end.

Web and native clients request the next batch when the seventh reel in the current ten-item batch becomes active. Only nearby video players stay mounted. Home's endpoint and mixed-card layout retain their existing behavior.

Call `POST /auth/ws-ticket` while authenticated, then connect to `/api/ws?ticket=ONE_USE_TICKET` with ws/wss matching the API scheme. Tickets expire in 30 seconds and bind to the session. The gateway rechecks session revocation/suspension for delivery and typing. A socket first receives `{type:"connected"}`.

Send messages through `POST /conversations/:id/messages`; REST performs membership, request and block checks and persists the message. Subscribe to `{type:"message",conversationId,message}`, `{type:"read",conversationId,userId}`, `{type:"typing",conversationId,userId,typing}` and `{type:"notification",notification}`. Clients may send only typing frames; durable messages do not depend on socket memory. Obtain a new ticket and reload paginated history after reconnect.

An unsolicited one-to-one conversation allows one initial message until the recipient accepts. Groups are feature-flagged. “Sent” means server persistence; an explicit transport delivery acknowledgment is not implemented. Read receipts are persisted per member. Unsend is restricted to the author and a 15-minute window; delete-for-self uses a per-user hide record.

## Route inventory

| Domain   | Method | Route                             |
| -------- | ------ | --------------------------------- |
| admin    | POST   | `/api/reports`                    |
| admin    | GET    | `/api/admin/stats`                |
| admin    | GET    | `/api/admin/reports`              |
| admin    | POST   | `/api/admin/reports/:id/action`   |
| admin    | GET    | `/api/admin/users`                |
| admin    | PATCH  | `/api/admin/users/:id`            |
| admin    | GET    | `/api/admin/audit`                |
| admin    | GET    | `/api/admin/flags`                |
| admin    | PUT    | `/api/admin/flags/:key`           |
| admin    | GET    | `/api/admin/verifications`        |
| admin    | POST   | `/api/admin/verifications/:id`    |
| admin    | POST   | `/api/admin/categories`           |
| admin    | GET    | `/api/admin/jobs`                 |
| admin    | POST   | `/api/admin/jobs/:id/retry`       |
| auth     | GET    | `/api/auth/providers`             |
| auth     | POST   | `/api/auth/mobile-exchange`       |
| auth     | POST   | `/api/auth/register`              |
| auth     | POST   | `/api/auth/login`                 |
| auth     | GET    | `/api/auth/me`                    |
| auth     | POST   | `/api/auth/refresh`               |
| auth     | POST   | `/api/auth/logout`                |
| auth     | POST   | `/api/auth/logout-all`            |
| auth     | GET    | `/api/auth/sessions`              |
| auth     | DELETE | `/api/auth/sessions/:id`          |
| auth     | POST   | `/api/auth/verify-email`          |
| auth     | POST   | `/api/auth/resend-verification`   |
| auth     | POST   | `/api/auth/forgot-password`       |
| auth     | POST   | `/api/auth/reset-password`        |
| auth     | POST   | `/api/auth/ws-ticket`             |
| auth     | GET    | `/api/auth/google`                |
| auth     | GET    | `/api/auth/google/callback`       |
| content  | GET    | `/api/feed`                       |
| content  | GET    | `/api/reels`                      |
| content  | GET    | `/api/explore`                    |
| content  | POST   | `/api/events`                     |
| content  | GET    | `/api/posts/:id`                  |
| content  | GET    | `/api/drafts`                     |
| content  | POST   | `/api/posts`                      |
| content  | POST   | `/api/posts/:id/publish`          |
| content  | DELETE | `/api/posts/:id`                  |
| content  | PUT    | `/api/posts/:id/like`             |
| content  | PUT    | `/api/posts/:id/save`             |
| content  | GET    | `/api/saves`                      |
| content  | GET    | `/api/collections`                |
| content  | POST   | `/api/collections`                |
| content  | GET    | `/api/collections/:id`            |
| content  | PUT    | `/api/collections/:id/items`      |
| media    | POST   | `/api/media/upload-url`           |
| media    | PUT    | `/api/uploads/:id`                |
| media    | POST   | `/api/media/:id/complete`         |
| media    | GET    | `/api/media/:id`                  |
| messages | GET    | `/api/ws`                         |
| messages | GET    | `/api/conversations`              |
| messages | POST   | `/api/conversations`              |
| messages | GET    | `/api/conversations/:id/messages` |
| messages | POST   | `/api/conversations/:id/messages` |
| messages | POST   | `/api/conversations/:id/accept`   |
| messages | PUT    | `/api/conversations/:id/mute`     |
| messages | POST   | `/api/conversations/:id/read`     |
| messages | DELETE | `/api/messages/:id`               |
| social   | GET    | `/api/categories`                 |
| social   | PUT    | `/api/users/me/onboarding`        |
| social   | PATCH  | `/api/users/me`                   |
| social   | GET    | `/api/users/me/export`            |
| social   | POST   | `/api/users/me/deactivate`        |
| social   | DELETE | `/api/users/me`                   |
| social   | GET    | `/api/users/:username`            |
| social   | PUT    | `/api/users/:id/follow`           |
| social   | GET    | `/api/users/me/follow-requests`   |
| social   | PUT    | `/api/users/:id/follow-request`   |
| social   | DELETE | `/api/users/:id/follower`         |
| social   | POST   | `/api/users/:id/block`            |
| social   | DELETE | `/api/users/:id/block`            |
| social   | PUT    | `/api/users/:id/mute`             |
| social   | GET    | `/api/posts/:id/comments`         |
| social   | POST   | `/api/posts/:id/comments`         |
| social   | PATCH  | `/api/comments/:id`               |
| social   | DELETE | `/api/comments/:id`               |
| social   | PUT    | `/api/comments/:id/like`          |
| social   | GET    | `/api/notifications`              |
| social   | PUT    | `/api/notifications/read`         |
| social   | GET    | `/api/notifications/preferences`  |
| social   | PUT    | `/api/notifications/preferences`  |
| startups | GET    | `/api/founder/startups`           |
| startups | POST   | `/api/startups`                   |
| startups | GET    | `/api/startups/:slug`             |
| startups | PATCH  | `/api/startups/:id`               |
| startups | PUT    | `/api/startups/:id/follow`        |
| startups | PUT    | `/api/startups/:id/members`       |
| startups | POST   | `/api/startups/:id/products`      |
| startups | GET    | `/api/products/:slug`             |
| startups | POST   | `/api/startups/:id/verification`  |
| startups | GET    | `/api/startups/:id/analytics`     |
| startups | GET    | `/api/search`                     |
| startups | GET    | `/api/search/history`             |
| startups | DELETE | `/api/search/history`             |

Health and metrics are described in DEPLOYMENT.md. Admin endpoints require server-side roles; startup management checks scoped memberships. Investment routes do not exist.

## R2 playback and exports

`GET /api/media/:id/playback` returns fresh `url` and `thumbnailUrl` for a READY asset visible to the caller: owner, visible post, or eligible conversation attachment. It returns 404 when access is absent. R2 URLs are bearer links valid for 15 minutes, scoped to one asset. Clients refresh near expiry; all HLS child URLs carry the signature. `POST /api/media/upload-url` reserves the daily byte quota transactionally and rejects an overloaded processing queue with 503 `UPLOAD_BUSY`. Production uploads go directly to private R2 storage; the local raw-upload endpoint exists only in development.

`GET /api/users/me/export` retains the account JSON shape and sends it as an attachment. It streams database pages of 100 rows, including collection items, and is limited to two exports per hour per authenticated identity. The browser downloads the response directly. Exports are not a repeatable-read database snapshot; concurrent account edits can affect the export.
