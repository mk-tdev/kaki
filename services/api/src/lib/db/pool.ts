import { Pool, types } from "pg";

types.setTypeParser(1184, value => new Date(value).toISOString());
const state = globalThis as unknown as { kakiPool?: Pool };
export function pool() {
  if (!process.env.DATABASE_URL) throw new Error("Azure PostgreSQL is not configured.");
  return state.kakiPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true },
    max: Number(process.env.DATABASE_POOL_MAX || 3),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 15_000,
    allowExitOnIdle: true,
  });
}
