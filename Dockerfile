FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ffmpeg ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && pnpm db:generate
RUN mkdir -p /app/work/media /app/work/mail /app/work/push && touch /app/.env && chown -R node:node /app
ENV NODE_ENV=production FFMPEG_PATH=/usr/bin/ffmpeg FFPROBE_PATH=/usr/bin/ffprobe MEDIA_DIR=/app/work/media
USER node

FROM base AS api
EXPOSE 4000
CMD ["pnpm", "--filter", "@productscroll/api", "start"]

FROM base AS worker
CMD ["pnpm", "--filter", "@productscroll/worker", "start"]

FROM base AS web
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api
ARG NEXT_PUBLIC_UPLOAD_ORIGINS=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_PUBLIC_UPLOAD_ORIGINS=$NEXT_PUBLIC_UPLOAD_ORIGINS
RUN pnpm --filter @productscroll/web build
EXPOSE 3000
CMD ["pnpm", "--filter", "@productscroll/web", "start"]
