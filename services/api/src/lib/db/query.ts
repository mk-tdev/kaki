import type { PoolClient, QueryResultRow } from "pg";
import { pool } from "./pool.js";
import { getIdentity } from "../auth/server.js";

// SET LOCAL and claims must be on the SAME checked-out connection as every query.
// Runtime role is NOINHERIT and owns no tables; RLS remains the authority.
export async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const identity = await getIdentity();
  const client = await pool().connect();
  let broken = false;
  try {
    await client.query("BEGIN");
    await client.query(identity ? "SET LOCAL ROLE authenticated" : "SET LOCAL ROLE anon");
    await client.query("select set_config('request.jwt.claims',$1,true)", [JSON.stringify(identity ?? {})]);
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch { broken = true; }
    throw error;
  } finally { client.release(broken); }
}
export async function query<T extends QueryResultRow = QueryResultRow>(sql: string, values: unknown[] = []) {
  return transaction(async client => (await client.query<T>(sql, values)).rows);
}
