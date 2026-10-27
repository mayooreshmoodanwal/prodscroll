import { performance } from "node:perf_hooks";
const base = process.env.PUBLIC_API_URL || "http://localhost:4000";
const times = [];
for (let i = 0; i < 12; i++) {
  const started = performance.now(),
    response = await fetch(`${base}/api/feed?limit=15`);
  if (!response.ok) throw new Error(`Feed returned ${response.status}`);
  const body = await response.json();
  if (!Array.isArray(body.items)) throw new Error("Invalid feed payload");
  times.push(performance.now() - started);
}
const sorted = [...times].sort((a, b) => a - b);
console.log(
  JSON.stringify(
    {
      samples: times.length,
      scope:
        "Sequential local requests against demonstration data; not a load test",
      firstMs: times[0],
      medianMs: sorted[6],
      p95Ms: sorted[11],
    },
    null,
    2,
  ),
);
