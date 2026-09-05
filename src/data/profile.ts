import "server-only";
import { apiGet } from "@/lib/api/server";
import type { Profile } from "@/types/kaki";
export async function getCurrentProfile():Promise<Profile> {
 return (await apiGet<{profile:Profile}>("/api/profile")).profile;
}
