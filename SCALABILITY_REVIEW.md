# Scalability review — 20 October 2026

The application has been improved for growth toward 10 lakh registered accounts. A registered-account count is not a traffic specification: 10 lakh stored accounts, 10 lakh daily active users and 10 lakh concurrent video viewers require very different infrastructure. This review does not certify any of those active-user capacity levels.

## Implemented changes

| Area            | Change and benefit                                                                                                                                                                                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Storage         | Private Cloudflare R2 buckets, direct signed uploads, streaming worker transfers and authenticated edge delivery move media bytes away from API nodes.                                                                                                                                 |
| Reels           | Ten metadata items per batch, prefetch at reel seven, limited mounted players, small HLS buffers and expiring-link refresh. Home layout is unchanged.                                                                                                                                  |
| Ranking         | Public candidate IDs cached for 15 seconds; discovery samples up to 500 recent people and 500 recent startup follows, then selects 100 post IDs before visibility checks; bounded history reads; impressions restricted to candidate IDs; only ten ranking winners computed for Reels. |
| Queries         | Feed/media reverse indexes; visibility enforced with database relationship predicates; full-catalog reel counts removed.                                                                                                                                                               |
| Counters        | PostgreSQL maintains startup follower counts on real follow changes, avoiding follower aggregation on every feed card.                                                                                                                                                                 |
| Database        | Five connections per process by default, explicit pool timeout, request-local reuse of session validation.                                                                                                                                                                             |
| Jobs            | Separate media, events, notification/maintenance and default queues; bounded concurrency, retained-job limits and upload backlog rejection.                                                                                                                                            |
| Fanout          | 250 followers per job, batch notifications/preferences, Redis pipelines and continuation jobs.                                                                                                                                                                                         |
| Realtime        | Redis channels scoped to users with local connections, socket heartbeat and slow-consumer buffer limit.                                                                                                                                                                                |
| Correctness     | Transaction-serialized daily upload quota; current ACLs checked when issuing playback links; counters tested under concurrent duplicate writes.                                                                                                                                        |
| Account exports | Streamed database pages and direct browser download avoid buffering an entire account on API nodes; limited to two exports per hour.                                                                                                                                                   |
| Cleanup         | Incoming originals removed after processing, R2 worker scratch removed on success/failure, expired-upload cleanup pages continued; analytics relies on database idempotency rather than a Redis marker per event job.                                                                  |

## Workload and capacity evidence

The isolated local fixture contains **1,000,000 synthetic accounts, 100,000 posts, 33,333 reels, 50,000 startup follows, 100,000 likes, 20,000 engagement events and 4,000 impressions**. PostgreSQL reports about 628 MB after loading/analyzing it. Media records are metadata fixtures; no million-user video library was generated.

The benchmark sends authenticated profile, Home and Reels requests using 20 synthetic sessions. It is a local closed-loop test, not a production arrival-rate or video-load test. It excludes CDN transfer, TLS, remote network latency, uploads/transcoding, large message histories, hot celebrities, bot traffic, failover and long-running endurance. The 19 October 2026 run completed **1,439 successful requests in 30.46 seconds (47.24 requests/second), with no HTTP errors**. Overall p95 was **628 ms**, p99 **825 ms**.

| Route   | Requests |    p50 |    p95 |    p99 |
| ------- | -------: | -----: | -----: | -----: |
| Profile |      158 | 299 ms | 441 ms | 454 ms |
| Home    |      566 | 411 ms | 644 ms | 843 ms |
| Reels   |      715 | 436 ms | 653 ms | 804 ms |

These measurements establish behavior on a million-account dataset with **20 concurrent clients**, not support for a million active users. The earlier diagnostic run exposed a follow-query scan across 100,000 posts; selecting bounded author/post IDs before visibility joins removed that bottleneck. The benchmark predates the final dependency patch upgrades on 20 October; all functional/build checks were rerun after those upgrades. The reproducible runner and aggregate JSON are included with the handoff.

Reproduce only against a new empty disposable database whose name begins `productscroll_scale_`:

```sh
createdb productscroll_scale_REPLACE_WITH_UNIQUE_SUFFIX
# Create a private .env.scale.local with that DATABASE_URL, a dedicated unused Redis DB,
# API_PORT=4191, API_HOST=127.0.0.1, API_RATE_LIMIT=60000 and LOG_LEVEL=warn.
# This high limiter is ONLY for a local benchmark; keep normal production abuse limits.
pnpm exec dotenv -e .env.scale.local -- pnpm --filter @productscroll/database migrate
psql -v ON_ERROR_STOP=1 -d productscroll_scale_REPLACE_WITH_UNIQUE_SUFFIX -f tests/performance/fixture.sql
pnpm exec dotenv -e .env.scale.local -- node scripts/scale-sessions.mjs
pnpm exec dotenv -e .env.scale.local -- pnpm --filter @productscroll/api exec tsx src/server.ts
# Separate terminal, repository root:
node scripts/load-test.mjs
```

The fixture refuses a nonempty user table and an unrelated database name. Sessions expire after one hour; their file is private and excluded from deliverables. The runner only targets localhost, caps clients at 50 and duration at 120 seconds, and fails on HTTP errors. Stop the benchmark API after use. Keep the database for repeatable tests or explicitly drop that disposable database when finished; do not delete another application's data or flush shared Redis.

## Start free, upgrade against measured thresholds

Use local PostgreSQL/Redis and the R2/Workers free allowances while traffic is small. No paid tool or subscription is required by this implementation. R2's allowance is 10 GB-month Standard storage and limited monthly operations; Workers Free is independently limited to 100,000 requests/day. HLS generates multiple requests per viewed video. These limits will be reached long before a million active video viewers. [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/).

| Growth signal                                  | Next action                                                                                                       |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Worker/R2 free quota nearing exhaustion        | Upgrade their plans and set budget/usage alerts before users hit request limits.                                  |
| API CPU/p95 exceeds your chosen SLO            | Add stateless API replicas behind a WebSocket-capable load balancer; measure again.                               |
| Database connections/pool wait grows           | Add PgBouncer and size the total connection budget; upgrade DB resources before adding more replicas.             |
| Query I/O or table size dominates              | Inspect query plans; archive/partition event history and add read replicas for explicitly lag-tolerant queries.   |
| Transcode queue age rises                      | Add isolated media workers with measured per-host concurrency and bounded scratch storage.                        |
| Celebrity notifications dominate               | Scale the fanout queue separately; consider read-time inbox aggregation for very large fanouts.                   |
| Candidate quality declines with catalog growth | Build category/interest retrieval pools or a dedicated retrieval index; evaluate diversity and relevance offline. |

A proposed future load profile might be 10 lakh registered users, 1 lakh daily active users and 10,000 simultaneous sessions. These are planning inputs, **not tested capacities**. Define feed requests/second, video viewing minutes, upload rate, latency/error SLOs and cost budget before sizing that deployment. Run distributed load, soak and failure tests against staging with those inputs.

## Remaining limits and release work

- The database/queue dual write has no durable transactional outbox; a crash between persistence and enqueue can miss a delivery. Add an outbox for stronger guarantees. SMTP delivery is at-least-once.
- Feed retrieval is bounded and intentionally approximate. Users with many follows or sparse matches can still drive expensive relationship queries. Popular-account counters can become contended; measure before sharding counters or changing consistency.
- Event/impression tables need an explicit retention/archive policy before sustained large traffic. Message/user dashboards and administration also need profiling on realistic skew and history, beyond this feed-focused benchmark.
- Redis holds sessions' transient workflow state, queues, caches and rate limits; configure persistence, monitoring, private networking and high availability. Use eviction policies that do not silently discard durable queue data; separate cache and queues if needed.
- Socket connection caps are per API process. Large multi-node deployments need global device/connection policies and tests for reconnect storms.
- Private media links remain valid for up to 15 minutes after issuance. Actual Cloudflare credentials, upload CORS, edge runtime/cache behavior and expiry refresh require staging verification. Partial processed objects and detached assets need a complete retention policy.
- Malware scanning/isolation, production email/push/OAuth, independent security review, physical-device QA, backup restoration and failover drills remain release gates. See SECURITY.md and VALIDATION.md.
- Large existing databases need online index/backfill rollout planning; bundled migrations must not be blindly run at peak traffic.

No code-only review can honestly guarantee that a free deployment will easily handle 10 lakh active users. The changes remove concrete bottlenecks and provide measurable upgrade paths without claiming untested capacity.
