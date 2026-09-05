import "server-only";
import { query } from "@/lib/db/query";
export async function takeAiQuota() {
  const rows = await query<{allowed:boolean}>("select public.take_ai_quota() as allowed");
  return rows[0]?.allowed === true;
}
