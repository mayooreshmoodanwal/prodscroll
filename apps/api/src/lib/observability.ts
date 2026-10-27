import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from "prom-client";
import { setDatabaseObserver, db } from "@productscroll/database";
import { jobs } from "./core.js";

// Adapters receive only operational context. Request bodies, headers and identities
// are deliberately absent so a hosted reporter can be installed without PII.
export interface ErrorReporter {
  capture(error: Error, context: { requestId: string; route: string }): void;
}
let reporter: ErrorReporter = { capture: () => undefined };
export function setErrorReporter(next: ErrorReporter) {
  reporter = next;
}
export function captureError(
  error: unknown,
  context: { requestId: string; route: string },
) {
  reporter.capture(
    new Error(error instanceof Error ? error.name : "UnknownError"),
    context,
  );
}
export const metrics = new Registry();
collectDefaultMetrics({ register: metrics, prefix: "productscroll_" });
export const requestDuration = new Histogram({
  name: "productscroll_http_duration_seconds",
  help: "HTTP request duration by route template",
  labelNames: ["method", "route", "status"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [metrics],
});
export const authFailures = new Counter({
  name: "productscroll_auth_failures_total",
  help: "Rejected authentication requests",
  registers: [metrics],
});
export const databaseDuration = new Histogram({
  name: "productscroll_database_duration_seconds",
  help: "Prisma operation duration, including errors",
  labelNames: ["model", "operation"] as const,
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.5, 1, 5],
  registers: [metrics],
});
setDatabaseObserver((model, operation, seconds) =>
  databaseDuration.observe({ model, operation }, seconds),
);
export const websocketConnections = new Gauge({
  name: "productscroll_websocket_connections",
  help: "Currently authenticated sockets in this API process",
  registers: [metrics],
});
new Gauge({
  name: "productscroll_queue_jobs",
  help: "Background jobs by state",
  labelNames: ["state"] as const,
  registers: [metrics],
  async collect() {
    const counts = await jobs.getJobCounts(
      "waiting",
      "active",
      "failed",
      "delayed",
    );
    for (const [state, count] of Object.entries(counts))
      this.set({ state }, count);
  },
});
new Gauge({
  name: "productscroll_media_failed",
  help: "Failed media assets awaiting cleanup",
  registers: [metrics],
  async collect() {
    this.set(
      await db.mediaAsset.count({ where: { processingStatus: "FAILED" } }),
    );
  },
});
