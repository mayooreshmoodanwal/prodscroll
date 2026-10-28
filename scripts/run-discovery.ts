import { PrismaClient } from "@prisma/client";
import { runDiscoveryEngine } from "./discovery/engine.js";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArgIndex = args.indexOf("--limit");
  const limit = limitArgIndex !== -1 && args[limitArgIndex + 1] ? parseInt(args[limitArgIndex + 1], 10) : 25;

  const db = new PrismaClient();

  try {
    const result = await runDiscoveryEngine({
      dryRun,
      targetCount: limit,
      db,
    });
    console.log("Run finished successfully:", JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("Discovery run failed:", err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
