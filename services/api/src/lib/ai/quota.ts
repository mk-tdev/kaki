import { query } from "../db/query.js";
export async function takeAiQuota() {
  const rows = await query<{allowed:boolean}>("select public.take_ai_quota() as allowed");
  return rows[0]?.allowed === true;
}
