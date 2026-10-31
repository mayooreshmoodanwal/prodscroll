import { buildApp } from "./app.js";
import { db } from "@productscroll/database";

const app = await buildApp();

// Bootstrap super admin account & clean up legacy notifications
try {
  const promoted = await db.user.updateMany({
    where: {
      OR: [
        { email: "ayushsingh1772004@gmail.com" },
        { username: "ayush" },
      ],
    },
    data: { role: "ADMIN" },
  });
  if (promoted.count > 0) {
    app.log.info(`[SuperAdmin Init] Assigned ADMIN role to ${promoted.count} user(s).`);
  }

  // Purge any legacy message notifications that exposed quotes or belonged to unsent messages
  const purged = await db.notification.deleteMany({
    where: {
      type: "MESSAGE",
      OR: [
        { body: { contains: "Jhattu" } },
        { body: { contains: 'sent you a message: "' } },
      ],
    },
  });
  if (purged.count > 0) {
    app.log.info(`[Notification Cleanup] Deleted ${purged.count} legacy/unsent notification(s).`);
  }
} catch (err) {
  app.log.error(err, "[Bootstrap Initialization Error]");
}

await app.listen({
  port: Number(process.env.API_PORT || 4000),
  host: process.env.API_HOST || "0.0.0.0",
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    void app.close().then(() => process.exit(0));
  });
