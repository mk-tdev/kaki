import "server-only";
import { apiGet } from "@/lib/api/server";
import type { Bloom } from "@/types/kaki";
export async function listBlooms():Promise<Bloom[]> {
 return (await apiGet<{blooms:Bloom[]}>("/api/blooms")).blooms;
}
