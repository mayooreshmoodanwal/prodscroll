# Local validation — 20 October 2026

Cloudflare R2 integration and scalability changes are implemented in the source. The local preview continues to use local media because live Cloudflare credentials and infrastructure are not configured. No paid service was purchased or public deployment performed.

## Completed checks

These checks were rerun after the final Next.js 16.3.8, Nodemailer 10.1.7 and Sharp 0.35.5 dependency upgrades:

| Check                                                | Result                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| Workspace TypeScript                                 | All app/package checks pass                                                       |
| ESLint                                               | Pass                                                                              |
| Unit tests                                           | 6 pass: ranking and R2 configuration/Worker authorization                         |
| API/database integration tests                       | 14 pass                                                                           |
| Running API/worker/WebSocket system tests            | 2 pass                                                                            |
| Next.js production build and API/worker build checks | Pass                                                                              |
| iOS and Android Hermes bundle exports                | Pass; physical device execution remains unverified                                |
| Compose configuration                                | Local and production configurations parse; full container launch was not verified |
| Dependency audit                                     | 2 high and 1 moderate upstream advisory remain; see SECURITY.md                   |

Six migrations were applied to both isolated local development and scale databases on 19 October; Prisma client generation passed. The seeded local application remains available. Large existing databases require an online index/backfill rollout plan before applying these migrations.

Integration coverage includes persisted authentication, ownership/visibility, comment pagination, saves/follows, session rotation/revocation, seven consecutive ten-item reel batches, ready-video filtering, repeat avoidance and reranking after negative feedback. New checks exercise concurrent startup follow counters, serialized daily upload quotas, private-media playback authorization after accepted follow/block changes, and streamed exports containing 205 posts and 205 collection items. System tests process a real video into HLS/poster assets, publish the reel, and exercise two live sockets with durable messages and read receipts.

The R2 unit tests use a mock bucket/cache binding. They verify signature expiry/tampering, authorization before cache access and signed HLS child URLs. They do not prove Cloudflare account permissions, live upload CORS, edge runtime behavior or billing configuration.

## Browser checks

The 20 October production-build smoke check in the in-app browser verified:

- Home renders its existing mixed-card feed; Reels has the dedicated fixed vertical player.
- Reels begins with 10 metadata items and has loaded 20 by the eighth visible reel.
- Five video elements are mounted at that point, with exactly one playing and no media errors.
- No browser warnings/errors were observed during this smoke check.

Earlier focused Reels checks on 25 September verified the exact reel-seven/reel-seventeen prefetch triggers, save-state restoration, comment playback pause, viewport-sized navigation and the 390 × 844 phone layout without horizontal overflow. Those wider interaction/phone checks were not all repeated in this final smoke pass.

Standalone Playwright previously could not launch Chrome in this sandbox (process aborted). The five browser test cases are supplied for CI but are **not recorded as passing locally**. Manual browser checks and native bundle export do not replace CI browser execution or physical touch-device testing.

## Performance evidence

On 19 October, a dedicated PostgreSQL database held **1,000,000 synthetic accounts, 100,000 posts and 33,333 reels**, plus follows, likes, events and impressions (about 628 MB). A local 30.46-second closed-loop HTTP run used **20 concurrent authenticated clients**:

| Metric                  |                Result |
| ----------------------- | --------------------: |
| Successful responses    |                 1,439 |
| HTTP errors             |                     0 |
| Throughput              | 47.24 requests/second |
| Overall p50 / p95 / p99 |    415 / 628 / 825 ms |
| Home p95                |                644 ms |
| Reels p95               |                653 ms |
| Profile p95             |                441 ms |

The feed bottleneck found during profiling was a relationship query that scanned the large post table. Discovery now selects bounded followed-author/post IDs before visibility joins, caches public candidate IDs briefly and limits impression/history reads. See SCALABILITY_REVIEW.md for the workload, indexes, tradeoffs and reproduction instructions. The aggregate benchmark JSON is included in the handoff; session cookies are excluded.

This establishes behavior on a million-account dataset, **not support for a million concurrent or daily active users**. It excludes video/CDN transfer, remote latency, TLS, concurrent uploads, skewed celebrity traffic, message-history scale, sustained mobile memory use, soak tests and infrastructure failures. The benchmark predates the final dependency patch upgrades; functional/build checks were rerun after them. Free-tier quotas are suitable for an early launch, not an active-user capacity promise.

## Remaining release work

- Configure private R2 buckets, the authenticated media Worker, exact CORS/CSP origins and secrets, then complete the live staging checks in R2_SETUP.md. Existing objects/URLs require an explicit migration when changing a deployed storage provider.
- Resolve or explicitly assess the three unpatched Expo/toolchain advisories before release. Add media scanning/isolation, Google-only account-deletion reauthentication and complete object retention/deletion policies. See SECURITY.md.
- Configure/live-test Google OAuth, production SMTP, APNs/FCM, TLS, hosted monitoring and alerts; external delivery remains unverified.
- Run browser CI and physical iOS/Android QA for accessibility, captions, gestures, offline recovery, backgrounding, deep links and sustained memory behavior.
- Complete distributed load/soak/fault tests, backup restoration and failover drills. Add a transactional outbox if durable database-to-queue delivery is required; current dual writes have a crash window.
- Native founder/admin management uses responsive web. Group management, cross-route scroll restoration, richer captions and remaining native parity need further work.

The investment feature remains disabled and has no transaction implementation.
