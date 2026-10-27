import { performance } from "node:perf_hooks";
import { readFile, writeFile } from "node:fs/promises";
const base = process.env.LOAD_BASE_URL || "http://127.0.0.1:4191";
const host = new URL(base).hostname;
if (!["localhost", "127.0.0.1", "::1"].includes(host))
  throw new Error("This benchmark only targets localhost");
const concurrency = Number(process.env.LOAD_CONCURRENCY || 20);
const seconds = Number(process.env.LOAD_SECONDS || 30);
if (!(concurrency >= 1 && concurrency <= 50 && seconds >= 1 && seconds <= 120))
  throw new Error("Keep local test within 50 clients / 120 seconds");
const sessions = JSON.parse(await readFile("work/scale-sessions.json", "utf8"));
const latencies = [],
  statuses = {},
  routes = {};
const start = performance.now(),
  deadline = start + seconds * 1000;
await Promise.all(
  Array.from({ length: concurrency }, async (_, worker) => {
    let iteration = 0,
      seen = [];
    while (performance.now() < deadline) {
      const kind =
        iteration % 10 === 0
          ? "profile"
          : iteration % 2 === 0
            ? "home"
            : "reels";
      const route =
        kind === "profile"
          ? "/api/users/perf_1001"
          : kind === "home"
            ? "/api/feed?limit=10"
            : `/api/reels${seen.length ? "?seen=" + encodeURIComponent(seen.join(",")) : ""}`;
      const begun = performance.now();
      try {
        const result = await fetch(base + route, {
          headers: {
            cookie: `ps_session=${sessions[worker % sessions.length]}`,
          },
          signal: AbortSignal.timeout(15000),
        });
        const body = await result.json();
        statuses[result.status] = (statuses[result.status] || 0) + 1;
        if (result.ok && kind === "reels")
          seen = [...seen, ...body.items.map((item) => item.id)].slice(-40);
        if (!result.ok) throw new Error(`HTTP ${result.status}`);
        const elapsed = performance.now() - begun;
        latencies.push(elapsed);
        (routes[kind] ||= []).push(elapsed);
      } catch (error) {
        statuses.errors = (statuses.errors || 0) + 1;
        if (statuses.errors <= 3)
          console.error(error.name, error.message, error.cause?.code || "");
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      iteration++;
    }
  }),
);
const summarize = (values) => {
  const s = [...values].sort((a, b) => a - b);
  return {
    count: s.length,
    p50Ms: s[Math.floor(s.length * 0.5)] || 0,
    p95Ms: s[Math.min(s.length - 1, Math.floor(s.length * 0.95))] || 0,
    p99Ms: s[Math.min(s.length - 1, Math.floor(s.length * 0.99))] || 0,
  };
};
const duration = (performance.now() - start) / 1000;
const result = {
  scope:
    "Local closed-loop authenticated HTTP test; excludes video transfer, TLS and production network latency",
  concurrency,
  seconds: duration,
  requestsPerSecond: latencies.length / duration,
  statuses,
  overall: summarize(latencies),
  routes: Object.fromEntries(
    Object.entries(routes).map(([key, values]) => [key, summarize(values)]),
  ),
};
await writeFile("work/logs/load-test.json", JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (statuses.errors) process.exitCode = 1;
