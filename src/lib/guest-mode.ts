import "server-only";
import { apiGet } from "@/lib/api/server";
export async function guestModeEnabled() {
 return (await apiGet<{enabled:boolean}>("/api/guest-mode")).enabled;
}
