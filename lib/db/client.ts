import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createDb(url = process.env.DATABASE_URL) {
  if (!url) {
    throw new Error("Missing DATABASE_URL");
  }

  // Transaction-mode pooler (port 6543) does not support prepared statements.
  const client = postgres(url, { prepare: false, max: 3 });
  return { db: drizzle(client, { schema }), client };
}

const globalForDb = globalThis as unknown as {
  profiliDb?: ReturnType<typeof createDb>;
};

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL");
  }
  if (!globalForDb.profiliDb) {
    globalForDb.profiliDb = createDb();
  }
  return globalForDb.profiliDb.db;
}
