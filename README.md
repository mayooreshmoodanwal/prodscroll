# ProductScroll

A persisted social discovery application for startups and products. The monorepo contains a Next.js web app, Expo iOS/Android app, Fastify REST/WebSocket service, BullMQ media/notification worker, and PostgreSQL schema. There is no investment, payment, wallet, equity, or securities implementation.

## Run locally

Requirements: Node.js 22+, pnpm 10.32.1 (`corepack enable`), and Docker Compose, or existing PostgreSQL 18 and Redis 7 services. Run commands from this repository root.

```sh
pnpm install
node scripts/setup-env.mjs
docker compose up -d
pnpm db:generate
pnpm db:validate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

`setup-env` creates `.env` with random local session/JWT secrets and preserves an existing file. Review database connection and ports before starting; do not stop unrelated applications to free a port. The seed command generates original demonstration artwork and video loops, then seeds persistent records. It is intended for disposable development databases, never production.

Default endpoints: web http://localhost:3000, API http://localhost:4000/api, OpenAPI explorer http://localhost:4000/api/docs, health http://localhost:4000/health, Mailpit http://localhost:8025. The delivered local preview can use different ports specified in `.env`.

### Demo accounts

| Account                   | Email                           | Password          |
| ------------------------- | ------------------------------- | ----------------- |
| Maya Chen, founder        | maya@productscroll.local        | BuildSomething!42 |
| Arjun Mehta, founder      | arjun_mehta@productscroll.local | BuildSomething!42 |
| Aisha Khan, administrator | admin@productscroll.local       | BuildSomething!42 |

All seed identities and business stories are fictional demonstration data. A fresh seed contains 30 users (10 founders), 15 startups, 25 products, 100 posts plus 50 reels, social relationships, comments, collections, conversations and notifications. The 50 reels reuse 15 locally generated concept videos. The “Explore with demo account” button performs a real login against the seeded Maya account.

### Processes separately

```sh
pnpm dev:web
pnpm dev:api
pnpm dev:worker
pnpm dev:mobile
```

API and worker must run together for verification emails, media processing and analytics. Local email delivery writes text messages to `work/mail`; open the verification/reset link in the relevant file. Select `EMAIL_DRIVER=smtp` to use Mailpit or a configured SMTP service. Local push delivery writes JSON to `work/push`; it does not send OS notifications.

### Native mobile

Use Expo Go for basic local testing or a development build for OAuth/deep-link verification. Set `EXPO_PUBLIC_API_URL` to the machine's reachable LAN URL ending in `/api`; a physical phone cannot use your computer's `localhost`. Set `PUBLIC_API_URL` and `MEDIA_PUBLIC_URL` to reachable LAN addresses too and regenerate seed URLs. Expo reads `apps/mobile/.env`, so either put the public variable there or export it in the terminal before `pnpm dev:mobile`. Do not put server secrets in the mobile environment.

```sh
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:4000/api pnpm dev:mobile
pnpm --filter @productscroll/mobile exec expo export --platform android --platform ios --output-dir ../../work/mobile-dist
```

The native client includes secure rotating tokens, interest onboarding, virtualized feeds/reels, search, profiles, saves, creation/upload, notifications and live messages. Founder management and moderation currently use the responsive web interface. Physical iOS/Android device testing, signing, store submission and platform push providers remain release work. See [VALIDATION.md](VALIDATION.md).

## Environment

Copy `.env.example` through the setup script. Core configuration:

| Variables                                                         | Purpose                                                                                                          |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`, `REDIS_URL`                                       | PostgreSQL and Redis connections; use separate instances/databases per environment                               |
| `PORT`, `API_PORT`, `WEB_ORIGIN`                                  | Web/API ports and exact allowed browser origin(s), comma-separated                                               |
| `PUBLIC_API_URL`, `NEXT_PUBLIC_API_URL`, `EXPO_PUBLIC_API_URL`    | Public API origin, web API base and mobile API base; public prefixes contain no secrets                          |
| `SESSION_SECRET`, `JWT_SECRET`                                    | Independent random secrets; minimum 32 characters in production                                                  |
| `MEDIA_DRIVER`, `MEDIA_DIR`, `MEDIA_PUBLIC_URL`                   | `local` development storage and public delivery; relative directory is evaluated from `apps/api` / `apps/worker` |
| `R2_*`, `MEDIA_DELIVERY_SECRET`                                   | Cloudflare R2 private buckets and authenticated media Worker                                                     |
| `EMAIL_DRIVER`, `SMTP_*`, `MAIL_DIR`                              | Local outbox or SMTP email adapter                                                                               |
| `PUSH_DIR`                                                        | Local development push outbox                                                                                    |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | Optional Google OIDC configuration; Google button is hidden until configured                                     |
| `METRICS_TOKEN`, `LOG_LEVEL`, `TRUST_PROXY`                       | Metrics authentication, structured logs and explicitly trusted ingress                                           |
| `FFMPEG_PATH`, `FFPROBE_PATH`                                     | Optional system executables; otherwise bundled development tools                                                 |

For local development, keep `MEDIA_DIR` identical for API and worker. Production uses private Cloudflare R2 buckets; workers only need temporary local scratch storage. See [R2_SETUP.md](R2_SETUP.md). `.env`, uploaded media, email outboxes, logs, caches and tokens are excluded from version control and the source archive.

## Verification and builds

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration     # real PostgreSQL + Redis, creates/removes its own test users
pnpm build               # production web build + server type validation
# Start API, worker and web before the next two suites:
pnpm test:system          # real email outbox, video pipeline and two live WebSockets
pnpm exec playwright install chromium
pnpm test:e2e             # complete browser journeys
NODE_ENV=production pnpm --filter @productscroll/web start
```

Server packages execute TypeScript with `tsx`; `build` validates them without emitting JS. Container images include that runtime. CI gates on lint, typing, unit, integration, system and browser tests, native bundle exports, and production build. The local environment cannot launch standalone Chrome; browser automation results must not be represented as passing until CI runs them.

## Engineering guide

- [ARCHITECTURE.md](ARCHITECTURE.md): domain boundaries and deployment diagram.
- [DATABASE.md](DATABASE.md): schema, migrations, constraints and ER diagram.
- [API.md](API.md): REST/WebSocket contract and request examples.
- [SECURITY.md](SECURITY.md): implemented controls and release gates.
- [RECOMMENDATION_ENGINE.md](RECOMMENDATION_ENGINE.md): candidate generation, weights, diversity and signals.
- [MODERATION.md](MODERATION.md): report handling, permissions and audit operations.
- [DEPLOYMENT.md](DEPLOYMENT.md): containers, providers, monitoring, migrations and recovery.
- [DEPLOYMENT_FREE.md](DEPLOYMENT_FREE.md): Vercel frontend and always-on OCI free-tier deployment preparation.
- [R2_SETUP.md](R2_SETUP.md): private R2 upload and delivery setup.
- [SCALABILITY_REVIEW.md](SCALABILITY_REVIEW.md): measured capacity, limits, and upgrade path.
- [VALIDATION.md](VALIDATION.md): tested behavior and remaining verification.
# ProductScrollGemma
