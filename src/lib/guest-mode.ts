import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function guestModeEnabled() {
  const supabase = await createClient();
  const { data } = await supabase.from("demo_settings").select("guest_enabled").eq("id", true).maybeSingle();
  // Fail closed until the reviewed cloud migration is applied.
  return data?.guest_enabled === true;
}
