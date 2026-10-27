import { PrismaClient } from "@prisma/client";
export * from "@prisma/client";
type DatabaseObserver = (
  model: string,
  operation: string,
  seconds: number,
) => void;
let observer: DatabaseObserver | undefined;
export function setDatabaseObserver(next: DatabaseObserver) {
  observer = next;
}
const databaseUrl = process.env.DATABASE_URL
  ? new URL(process.env.DATABASE_URL)
  : undefined;
if (databaseUrl && !databaseUrl.searchParams.has("connection_limit")) {
  const size = Number(process.env.DATABASE_POOL_SIZE || 5);
  if (!Number.isInteger(size) || size < 1 || size > 100)
    throw new Error("DATABASE_POOL_SIZE must be between 1 and 100.");
  databaseUrl.searchParams.set("connection_limit", String(size));
  databaseUrl.searchParams.set("pool_timeout", "10");
}
export const db = new PrismaClient({
  ...(databaseUrl ? { datasourceUrl: databaseUrl.toString() } : {}),
}).$extends({
  query: {
    $allOperations: async ({ model, operation, args, query }) => {
      const started = performance.now();
      try {
        return await query(args);
      } finally {
        observer?.(
          model || "raw",
          operation,
          (performance.now() - started) / 1000,
        );
      }
    },
  },
});
