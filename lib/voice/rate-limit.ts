import { getDb } from "@/lib/db/client";
import { sql } from "drizzle-orm";

const LIMIT = 5;

export async function takeCallSlot(kind: "email" | "ip" | "tool-ip" | "tool-call", key: string) {
  const db = getDb();
  const rows = await db.execute(sql<{ n: number }>`
    INSERT INTO call_rate_buckets (kind, bucket_key, window_start, n)
    VALUES (${kind}, ${key}, date_trunc('hour', now()), 1)
    ON CONFLICT (kind, bucket_key, window_start)
    DO UPDATE SET n = call_rate_buckets.n + 1
    WHERE call_rate_buckets.n < ${LIMIT}
    RETURNING n
  `);
  const list = Array.isArray(rows) ? rows : (rows as { rows?: Array<{ n: number }> }).rows;
  return Boolean(list && list.length > 0);
}
