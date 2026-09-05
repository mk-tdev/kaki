import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function takeAiQuota() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("take_ai_quota");
  return !error && data === true;
}
