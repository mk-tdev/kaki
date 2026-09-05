import "server-only";
import { query } from "@/lib/db/query";
export async function guestModeEnabled() {
  const rows = await query<{guest_enabled:boolean}>("select guest_enabled from public.demo_settings where id=true");
  return rows[0]?.guest_enabled === true;
}
