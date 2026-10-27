# Free early deployment

## Proposed services

- **Web:** Vercel, Next.js monorepo project rooted at `apps/web`.
- **API, background worker, PostgreSQL, Redis and HTTPS ingress:** one Oracle Cloud Infrastructure Always Free Ampere VM running the included Docker Compose stack. This avoids the sleeping-instance pattern of free application hosts.
- **Images and video:** the existing Cloudflare R2 integration with private incoming and processed buckets and the authenticated media Worker.

Oracle currently includes 1,500 Ampere OCPU-hours and 9,000 GB-hours per month, equivalent to two OCPUs and 12 GB RAM, plus 200 GB combined Always Free boot/block volume. OCI says capacity can be unavailable in a home region. This is a small, single-VM beta setup with no high availability; it is not a capacity or uptime commitment. Keep backups outside the VM and watch the storage, egress and R2/Worker quotas. [Oracle Always Free resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm).

Vercel Hobby is free for personal/non-commercial use only and can be paused when quotas are exceeded. Vercel says Hobby cannot connect to GitHub organization-owned repositories; the specified repository appears to be under a personal account, but account access must be restored before import. For a commercial/public business launch, select a Vercel plan permitted for that use instead of relying on Hobby. [Vercel Hobby terms and limits](https://vercel.com/docs/plans/hobby), [Vercel terms](https://vercel.com/legal/terms).

The deployment needs a domain to route `api.your-domain` to the VM. Point its DNS A record to the VM public IP and allow inbound TCP 80/443 in the OCI subnet and host firewall. Vercel hosts the web app at its assigned HTTPS domain. Browser REST requests go through a same-origin Next.js rewrite, so secure session cookies work. The browser connects to `wss://api.your-domain/ws` directly; the API's one-use socket ticket avoids relying on cross-site cookies for the WebSocket handshake.

## Vercel project settings

Import the private repo into the Vercel account, set **Root Directory** to `apps/web`, and enable **Include source files outside the Root Directory** so workspace packages and the root lockfile are present. Select Next.js and deploy only after the API VM is healthy.

Set these production environment variables in Vercel, then redeploy:

```dotenv
NEXT_PUBLIC_API_URL=/api
API_PROXY_ORIGIN=https://api.your-domain.example
NEXT_PUBLIC_SOCKET_URL=wss://api.your-domain.example
NEXT_PUBLIC_UPLOAD_ORIGINS=https://your-account-id.r2.cloudflarestorage.com https://your-media-worker.example
```

`API_PROXY_ORIGIN` is the HTTPS origin only (no `/api` suffix). Add the exact assigned Vercel production origin to the API's `WEB_ORIGIN` and R2 incoming-bucket CORS policy. The socket URL belongs to the API domain. The upload-origin list belongs to CSP and must contain the exact R2 upload and media Worker origins.

The Next.js API rewrite keeps login cookies same-origin while forwarding API traffic. Rate limits still run on the API and its visible client IP depends on proxy forwarding; verify client-IP handling and abuse limits before opening registration. Native apps can point `EXPO_PUBLIC_API_URL` directly at `https://api.your-domain.example/api`.

## Oracle VM setup

1. Create an OCI account and launch an Always Free eligible Ubuntu ARM Ampere VM in the home region. A public IPv4 and internet gateway are required. Open only ports 22 (preferably restricted to your admin IP), 80 and 443; do not open PostgreSQL, Redis, or API port 4000. OCI account enrollment, identity verification and terms are handled by the account owner.
2. Install Docker Engine and the Compose plugin from Docker's official Ubuntu instructions. Attach a persistent boot/block volume within the 200 GB free allowance. Enable automatic security updates and a host firewall.
3. Clone the private repository after GitHub access is restored. Create `/opt/productscroll/.env.production` with mode `0600`; populate the required variables below. Never commit this file or copy it into the web build.
4. Point the API DNS A record at the VM. Start Compose, run migrations once, restart services, and check the API health endpoint and TLS certificate.

```dotenv
NODE_ENV=production
API_DOMAIN=api.your-domain.example
ACME_EMAIL=ops@your-domain.example
WEB_ORIGIN=https://your-production-project.vercel.app
PUBLIC_API_URL=https://api.your-domain.example
DATABASE_URL=postgresql://productscroll:REPLACE_WITH_URL_ENCODED_PASSWORD@postgres:5432/productscroll?schema=public
REDIS_URL=redis://redis:6379
POSTGRES_PASSWORD=REPLACE_WITH_A_LONG_RANDOM_URL_SAFE_PASSWORD
API_PORT=4000
MEDIA_DRIVER=r2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_UPLOAD_BUCKET=productscroll-incoming
R2_MEDIA_BUCKET=productscroll-media
R2_DELIVERY_URL=https://your-media-worker.example
MEDIA_DELIVERY_SECRET=
SESSION_SECRET=
JWT_SECRET=
DATABASE_POOL_SIZE=5
WORKER_MEDIA_CONCURRENCY=1
WORKER_QUEUES=default,media,events,fanout
EMAIL_DRIVER=smtp
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
PUSH_PROVIDER=local
TRUST_PROXY=true
LOG_LEVEL=info
API_RATE_LIMIT=240
```

Generate independent 32+ byte secrets with a password manager or `openssl rand -hex 32`. URL-encode the PostgreSQL password in `DATABASE_URL` (or use only URL-safe generated characters). Do not use sample/demo login credentials in production. Configure SMTP with a verified sender; local file email delivery and local push are not production delivery services.

```sh
chmod 600 .env.production
docker compose --env-file .env.production -f compose.oracle.yaml build
docker compose --env-file .env.production -f compose.oracle.yaml run --rm api pnpm db:migrate
docker compose --env-file .env.production -f compose.oracle.yaml up -d
docker compose --env-file .env.production -f compose.oracle.yaml ps
```

The `api` is reachable only inside the Compose network; Caddy terminates TLS and forwards requests. Database, Redis, and scratch data use persistent Docker volumes, but VM disk loss still loses those volumes. Automate encrypted PostgreSQL dumps to a separate private destination, and rehearse restore before real user data is stored. R2 media and database backups require separate lifecycle/retention planning.

## Release gates

- Restore the invalid GitHub CLI credential, then import the **private** repository and confirm Vercel's deployment source and root-directory settings.
- Choose a domain and Cloudflare/other DNS provider, create both private R2 buckets and the authenticated media Worker, set least-privilege secrets, and verify uploads, HLS playback, expiry and ACL revocation in staging.
- Test login/session renewal/logout, Google OAuth if enabled, web and mobile media uploads, realtime messaging, email delivery, health monitoring, data export/deletion and backup recovery.
- Review the unresolved dependency advisories in `SECURITY.md` before broad launch.
- The free OCI shape is a single failure domain and may not be available at creation time. Set memory/disk/queue alarms; move to redundant paid services and managed database/Redis before a reliability-sensitive launch or sustained growth.

This guide prepares the target architecture; it does not claim resources have been created or production has been deployed. Live credentials and account setup are required first.
