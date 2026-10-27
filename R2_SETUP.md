# Cloudflare R2 setup

R2 is the production object store. Local development remains free and works without cloud credentials. No Cloudflare account, bucket, secret or paid plan has been created by this change. The `@aws-sdk/*` packages are protocol clients for Cloudflare's S3-compatible endpoint; they do not select Amazon storage or use default AWS credentials.

## Buckets and credentials

1. Create **private**, Standard-class buckets named `productscroll-incoming` and `productscroll-media` (or change the environment and binding names together). Keep public access and public bucket custom domains disabled on both.
2. Create an R2 object read/write credential restricted to these buckets. Store the account ID, access key ID and secret key only in server/worker secrets. Use separate credentials per environment; split API and worker credentials further when deploying separate services.
3. In the incoming bucket's CORS dashboard JSON editor, paste `infra/cloudflare/r2-cors.json`, replacing localhost origins with the exact HTTPS web origin. This file uses the **dashboard format**, not Wrangler's different CORS JSON schema. Browser PUT uploads require CORS even with a presigned URL. [Cloudflare CORS documentation](https://developers.cloudflare.com/r2/buckets/cors/).
4. Configure an incoming-bucket lifecycle to expire `incoming/` objects after two days. The worker deletes originals on successful processing; the lifecycle catches abandoned uploads and failed cleanup. Investigate queues that approach this age before objects expire.

## Authenticated media Worker

`infra/cloudflare/media/worker.mjs` reads the private processed bucket through the `MEDIA` binding. It verifies an asset-scoped HMAC and expiry before reading the internal edge cache, then attaches the token to HLS child playlists and segments. Public response caching is disabled; the internal cache uses the canonical object key after authorization. The app issues 15-minute links. ACL changes prevent fresh links, while already issued links remain usable until expiry.

Configure `infra/cloudflare/media/wrangler.jsonc` with your processed bucket and exact `ALLOWED_ORIGINS`. Create one random `MEDIA_DELIVERY_SECRET` of at least 32 characters and install the same value in API secrets and the Worker secret. Use Wrangler's interactive secret prompt so it is not stored in shell history:

```sh
# Run these yourself against the intended Cloudflare account after reviewing configuration.
# Wrangler is a deployment tool, not an application runtime dependency.
pnpm dlx wrangler@4 login
pnpm dlx wrangler@4 secret put MEDIA_DELIVERY_SECRET --config infra/cloudflare/media/wrangler.jsonc
pnpm dlx wrangler@4 deploy --config infra/cloudflare/media/wrangler.jsonc
```

Use the deployed Worker HTTPS origin for `R2_DELIVERY_URL`. For production, attach a custom domain to the **Worker**, preserving its authorization checks. Do not attach the processed bucket directly to a public custom domain, and do not use an `r2.dev` URL. [Private bindings](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/), [public bucket behavior](https://developers.cloudflare.com/r2/buckets/public-buckets/).

## Server configuration

```dotenv
MEDIA_DRIVER=r2
R2_ACCOUNT_ID=your_32_character_account_id
R2_ACCESS_KEY_ID=your_scoped_access_key
R2_SECRET_ACCESS_KEY=your_secret
R2_UPLOAD_BUCKET=productscroll-incoming
R2_MEDIA_BUCKET=productscroll-media
R2_DELIVERY_URL=https://your-media-worker.example.com
MEDIA_DELIVERY_SECRET=the_same_random_secret_as_the_worker
# Optional jurisdiction-specific Cloudflare R2 endpoint; otherwise derived from account ID.
R2_ENDPOINT=
# Exact origins, separated by spaces; used at WEB BUILD TIME:
NEXT_PUBLIC_UPLOAD_ORIGINS=https://your_account_id.r2.cloudflarestorage.com https://your-media-worker.example.com
```

API startup rejects local media in `NODE_ENV=production`. Keep `MEDIA_DIR` writable on media workers for bounded download/transcode scratch files. Production APIs do not need shared disks. Changing storage drivers does not copy old objects or rewrite existing database URLs: migrate any existing deployment's objects and canonical URLs with a separately validated migration before switching. Local demonstration media remains local in the delivered preview.

## Staging verification

- Upload an image and a video from web and mobile. Confirm the incoming object is private, completion checks size/type, processing reaches READY, and the original is deleted.
- Play the HLS master, variants and segments through the Worker. Check unsigned, modified, expired and cross-asset tokens return 403, including after a cache hit. Worker request logs must omit URL query strings containing bearer links.
- Verify private posts, blocked users, deleted/hidden messages and conversation membership against `/api/media/:id/playback`. A user with an issued link can share it until expiry; this is not DRM.
- Leave a reel open through token refresh and test iOS native HLS. Revoke access and verify fresh link requests fail. Test origin policies, HTTP HEAD, retries and cache behavior on actual Cloudflare infrastructure.
- Set usage alerts and monitor storage, R2 operations, Worker requests/CPU, queue age and processing failures. Handle partial processed outputs and ready-but-unattached/deleted-account assets with an operator retention policy.

Local tests exercise Worker signature/cache ordering and manifest rewriting using a mock R2 binding. They do not prove Cloudflare account permissions, edge behavior, CORS or billing configuration.

## Free starting point

Local PostgreSQL, Redis, Node.js, FFmpeg and the web/mobile development stack do not require paid service subscriptions. Cloudflare R2 Standard currently includes 10 GB-month storage, 1 million Class A and 10 million Class B operations monthly, with no Internet egress charge. Workers Free has a separate 100,000-request daily allowance; every HLS playlist/segment request still invokes the authentication Worker, including cache hits. These allowances are an early-stage budget, not a million-user capacity promise. See [R2 pricing](https://developers.cloudflare.com/r2/pricing/) and [Workers limits](https://developers.cloudflare.com/workers/platform/limits/).
