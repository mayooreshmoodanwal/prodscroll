# Render & Vercel Free Tier Deployment Guide

This guide documents the live production architecture for ProductScroll deployed on Render's Free tier (backend, database, Redis, worker) and Vercel's Hobby tier (frontend).

## Live Production Endpoints

- **Web Frontend (Vercel):** [https://prodscroll-mayooreshmoodanwals-projects.vercel.app](https://prodscroll-mayooreshmoodanwals-projects.vercel.app)
- **API Health Endpoint:** [https://productscroll-api.onrender.com/health](https://productscroll-api.onrender.com/health)
- **Frontend-to-Backend Rewrite:** [https://prodscroll-mayooreshmoodanwals-projects.vercel.app/api/health](https://prodscroll-mayooreshmoodanwals-projects.vercel.app/api/health) (Verified HTTP 200 OK)

## Free Tier Architecture

### 1. Render Backend Stack ($0 / month)
- **Web Service (`productscroll-api`):** Free tier container (0.1 CPU, 512 MB RAM). Runs Fastify on port `$PORT` (10000) alongside the BullMQ worker process using [scripts/start-render.sh](file:///Users/ayushkumarsingh/Desktop/ProductScroll/scripts/start-render.sh).
- **PostgreSQL Database (`productscroll-db`):** Render Free tier PostgreSQL (1 GB storage, 0.1 CPU). Managed via [packages/database](file:///Users/ayushkumarsingh/Desktop/ProductScroll/packages/database), all 6 Prisma migrations applied automatically on container startup.
- **Key Value (`productscroll-redis`):** Render Free tier Redis-compatible Key Value instance (25 MB RAM, 50 connections). Used for BullMQ queues and Fastify rate limiting (`x-ratelimit-limit: 240`). Restricted to internal network via `ipAllowList: []`.

### 2. Vercel Web Frontend ($0 / month)
- **Host:** Vercel Hobby plan
- **Root Directory:** `apps/web`
- **Framework Preset:** Next.js
- **Node.js Version:** `22.x`
- **Production Environment Variables:**
  - `NEXT_PUBLIC_API_URL=/api`
  - `API_PROXY_ORIGIN=https://productscroll-api.onrender.com`
  - `NEXT_PUBLIC_SOCKET_URL=wss://productscroll-api.onrender.com`

All `/api/*` browser requests hit Vercel same-origin and are seamlessly reverse-proxied to Render via [apps/web/next.config.mjs](file:///Users/ayushkumarsingh/Desktop/ProductScroll/apps/web/next.config.mjs).

## Cloudflare R2 Media Integration (Optional Future Step)

To enable Cloudflare R2 media processing and playback:
1. Create private buckets `productscroll-incoming` and `productscroll-media` per [R2_SETUP.md](file:///Users/ayushkumarsingh/Desktop/ProductScroll/R2_SETUP.md).
2. Deploy the authenticated media worker in [infra/cloudflare/media/](file:///Users/ayushkumarsingh/Desktop/ProductScroll/infra/cloudflare/media/).
3. In the Render Dashboard under `productscroll-api` -> **Environment**:
   - Set `MEDIA_DRIVER=r2`
   - Fill in `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_DELIVERY_URL`, and `MEDIA_DELIVERY_SECRET`.
4. In Vercel, update `NEXT_PUBLIC_UPLOAD_ORIGINS` with your Cloudflare upload and media delivery origins.
