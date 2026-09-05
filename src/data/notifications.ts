import "server-only";
import { apiGet } from "@/lib/api/server";
import type { CommunityNotification } from "@/types/kaki";
export async function listNotifications():Promise<CommunityNotification[]> {
 return (await apiGet<{notifications:CommunityNotification[]}>("/api/notifications")).notifications;
}
