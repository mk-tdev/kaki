import "server-only";
import { apiGet } from "@/lib/api/server";
import type { Mission } from "@/types/kaki";
export async function listMissions():Promise<Mission[]> {
 return (await apiGet<{missions:Mission[]}>("/api/missions")).missions;
}
