# Deployment and operations

## Artifacts and environments

`Dockerfile` has separate `api`, `worker` and `web` targets. `compose.yaml` supplies local PostgreSQL 18, Redis 7 and Mailpit. `compose.production.yaml` runs application containers against operator-managed PostgreSQL/Redis/object storage configured in `.env.production`; it does not provision a cloud account, DNS, TLS certificates or a public database.

A Docker daemon was unavailable during local verification. Compose syntax is checkable without a daemon, but container image execution must pass in CI/staging before release.

## Production procedure

1. Provision separate staging/production databases and Redis namespaces/instances, private incoming object storage and a processed-media delivery origin. Give the API signed-upload permissions and the worker read/transcode/publish permissions. Configure the authenticated Cloudflare Worker in R2_SETUP.md and verify authorization in staging.
2. Create `.env.production` from the documented variables; choose independent random JWT/session/metrics secrets, exact HTTPS web/API URLs, real SMTP, and `NODE_ENV=production`. Public endpoints in the web bundle are build-time values.
3. Configure HTTPS ingress for web/API and WebSocket upgrades, reasonable body and timeout limits, and private backend reachability. Cookie-based browser deployments should keep web/API under the same registrable site. Enable `TRUST_PROXY` only behind an ingress that strips untrusted forwarding headers.
4. Run the CI pipeline against a clean database. Build images with the exact public API URL:

```sh
docker compose --env-file .env.production -f compose.production.yaml build
# One migration job before rolling out app nodes; no demo seed:
docker compose --env-file .env.production -f compose.production.yaml run --rm api pnpm db:migrate
docker compose --env-file .env.production -f compose.production.yaml up -d
```

5. Verify health/readiness, login, publish/media completion, socket reconnect/read receipts, negative authorization tests, delivery providers and metrics in staging. Roll out incrementally and observe error/latency/queue trends. Deployment is not authorized merely because a build exists.

The images retain the TypeScript runtime and workspace dependencies. They are functional build definitions, not size-optimized distroless images. Use `FFMPEG_PATH=/usr/bin/ffmpeg` and `FFPROBE_PATH=/usr/bin/ffprobe` in production (already set in the image).

## Provider setup

**Google:** create a web OIDC client, allow the exact `GOOGLE_REDIRECT_URI`, set client ID/secret and verify the callback's web and `productscroll://oauth` mobile exchange flows. The client hides Google login if credentials are absent. Native OAuth must be tested in a signed/development build with its registered scheme.

**Cloudflare R2:** follow [R2_SETUP.md](R2_SETUP.md). Production requires `MEDIA_DRIVER=r2`, separate private incoming/processed buckets, a private-bucket Worker binding, signed delivery, and exact CORS/CSP origins. The AWS-named SDK only implements R2’s compatible protocol; no AWS account or Amazon bucket is used.

**Email:** use `EMAIL_DRIVER=smtp` plus SMTP host/port/from and credentials as needed. Configure SPF/DKIM/DMARC at the domain/provider. Local mode intentionally writes only to `work/mail`.

**Push:** implement the `PushProvider` adapter and device token registration using APNS/FCM/Expo credentials. The shipped adapter writes local JSON files. No device delivery claim is made.

## Monitoring and jobs

`/health` and `/api/health` check PostgreSQL and Redis. `/metrics` requires `X-Metrics-Token` equal to `METRICS_TOKEN`; it is denied when the token is unset. Prometheus metrics cover HTTP route duration/status (including feed), Prisma duration, authentication failures, active sockets, queue states, failed media and Node runtime metrics. Route labels use templates, not IDs or query text.

Structured JSON request/worker logs carry request/job IDs and omit payload text. The ErrorReporter adapter accepts sanitized operational context for a hosted service. Configure dashboards/alerts externally: sustained 5xx, p95 feed latency above your SLO, Redis/DB failures, growing queue age, failed media/jobs and missing worker activity. Metrics per API process require per-node scraping.

Jobs use five attempts with exponential backoff, then a dead-letter queue and persisted failure record. Stable IDs make event inserts and follower notification creation repeatable. Email is at-least-once and can duplicate across a crash; a transactional outbox/provider idempotency layer remains a reliability gate. The worker schedules daily paged cleanup of stale pending/failed uploads. Hourly counter reconciliation is disabled by default; enable it only for a planned repair. Successful processing deletes incoming R2 originals and temporary files; configure an incoming-bucket lifecycle as a fallback. Retention for ready-but-unattached assets, partial processed outputs and deleted-user objects still needs an operator policy.

## Backups and rollback

Use encrypted PostgreSQL backups plus WAL/PITR with separate storage credentials. Keep database and media object versions consistent enough to reconstruct references. Set retention and test restores regularly. Redis persistence helps queues; it is not the durable message store.

```sh
# Environment variables can be loaded with your secret manager or dotenv-cli.
pnpm exec dotenv -e .env -- bash scripts/backup.sh
# Restore only to a NEW EMPTY database:
RESTORE_DATABASE_URL=postgresql://.../productscroll_restore bash scripts/restore.sh work/backups/ARCHIVE.dump
```

Use PostgreSQL client tools matching the server major version. These scripts validate the archive and refuse a nonempty restore target; a successful archive listing is not a tested recovery RTO/RPO. Rehearse application queries and media retrieval after restore. Never run the demonstration seed during recovery.

For rollback, redeploy the previous compatible image. Prefer forward fixes for migrations and avoid dropping columns in the same release that stops using them. Take a verified backup before destructive schema changes and review lock behavior against production-shaped data.

## Independent scaling

Run lightweight delivery workers with `WORKER_QUEUES=default`, media workers with `WORKER_QUEUES=media`, analytics with `WORKER_QUEUES=events`, and paged maintenance/fanout with `WORKER_QUEUES=fanout`. One small development process can consume all four queues. Legacy default-queue jobs are still understood while upgrading. Drain old jobs before retiring old workers.

Set `DATABASE_POOL_SIZE` per process and budget total connections across all API/worker replicas. Add PgBouncer before multiplying replicas beyond the database connection budget. Do not increase media concurrency without measuring CPU, resident memory and scratch-disk usage. R2-backed APIs need no shared media volume. Workers need writable scratch disk; isolate media workers and apply CPU/memory/disk limits in the production scheduler.

For an existing large database, stage the new follower column, bounded backfill and index builds under an expand/contract migration plan. The bundled migrations are verified on fresh/local fixtures; their index creation and follower backfill can lock or scan large existing tables. Create equivalent indexes concurrently and resolve reviewed migration bookkeeping as part of a controlled rollout, not during peak traffic.
