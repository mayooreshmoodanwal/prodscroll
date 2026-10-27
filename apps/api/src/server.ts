import { buildApp } from "./app.js";
const app = await buildApp();
await app.listen({
  port: Number(process.env.API_PORT || 4000),
  host: process.env.API_HOST || "0.0.0.0",
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    void app.close().then(() => process.exit(0));
  });
