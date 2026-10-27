# Render Free Tier Deployment Guide

This guide describes how to deploy the ProductScroll backend stack (Fastify API, background worker, PostgreSQL, and Key Value Redis) to Render's Free tier, paired with the Vercel frontend.

## Free Tier Architecture on Render

- **Web Service (`productscroll-api`):** Free tier instance (0.1 CPU, 512 MB RAM). Runs both the Fastify API (ports routed via `$PORT`) and the background worker process using [scripts/start-render.sh](file:///Users/ayushkumarsingh/Desktop/ProductScroll/scripts/start-render.sh).
- **PostgreSQL Database (`productscroll-db`):** Render Free tier PostgreSQL (1 GB storage, 0.1 CPU). Automatically connected to the API via internal connection string.
- **Key Value (`productscroll-redis`):** Render Free tier Redis-compatible Key Value instance (25 MB RAM, 50 connections). Used for BullMQ queues and rate limits.
- **Frontend:** Vercel (Hobby plan, rooted at `apps/web`).

## Step 1: Connect Blueprint on Render

1. Log into your Render dashboard at [https://dashboard.render.com](https://dashboard.render.com).
2. Click **New +** in the top navigation and select **Blueprint**.
3. Select your private GitHub repository: `mayooreshmoodanwal/prodscroll`. (If not visible, click **Configure access on GitHub** to grant Render access to the repository).
4. Render will read [render.yaml](file:///Users/ayushkumarsingh/Desktop/ProductScroll/render.yaml) and display the stack plan:
   - Web Service: `productscroll-api` (Free)
   - Database: `productscroll-db` (Free)
   - Key Value: `productscroll-redis` (Free)
5. Click **Apply**. Render will automatically provision the PostgreSQL database, Key Value store, and build the Docker container.
6. Once deployed, note your Render web service URL (e.g. `https://productscroll-api.onrender.com`).

## Step 2: Configure R2 & Vercel Origins on Render

In the Render dashboard under `productscroll-api` -> **Environment**:
- `PUBLIC_API_URL`: `https://productscroll-api.onrender.com`
- `WEB_ORIGIN`: Your production Vercel URL (e.g. `https://productscroll.vercel.app`)
- If using Cloudflare R2 for media:
  - `R2_ACCOUNT_ID`
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_DELIVERY_URL`
  - `MEDIA_DELIVERY_SECRET`

## Step 3: Configure & Deploy Vercel Frontend

With your Render API URL available, configure the Vercel project:

1. Root Directory: `apps/web`
2. Enable: **Include source files outside the Root Directory**
3. Set Production Environment Variables:
   ```dotenv
   NEXT_PUBLIC_API_URL=/api
   API_PROXY_ORIGIN=https://productscroll-api.onrender.com
   NEXT_PUBLIC_SOCKET_URL=wss://productscroll-api.onrender.com
   NEXT_PUBLIC_UPLOAD_ORIGINS=https://<ACCOUNT_ID>.r2.cloudflarestorage.com https://<MEDIA_WORKER_DOMAIN>
   ```
4. Deploy to Vercel.
