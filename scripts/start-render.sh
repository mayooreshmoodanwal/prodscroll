#!/bin/sh
set -e

echo "[Render Startup] Running database migrations..."
pnpm db:migrate || echo "[Render Startup] Warning: db:migrate exited with non-zero status"

echo "[Render Startup] Starting background worker..."
pnpm --filter @productscroll/worker start &
WORKER_PID=$!

echo "[Render Startup] Starting API server on port ${PORT:-4000}..."
pnpm --filter @productscroll/api start &
API_PID=$!

trap 'echo "Shutting down..."; kill -TERM $WORKER_PID $API_PID 2>/dev/null' SIGTERM SIGINT

wait -n $API_PID $WORKER_PID
