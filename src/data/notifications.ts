import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CommunityNotification } from "@/types/kaki";

type NotificationRow = {
  id: string;
  mission_id: string | null;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

async function authenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) throw new Error("Unauthorized");
  return { supabase, userId };
}

function mapNotification(row: NotificationRow): CommunityNotification {
  return {
    id: row.id,
    missionId: row.mission_id ?? undefined,
    title: row.title,
    body: row.body,
    readAt: row.read_at ?? undefined,
    createdAt: row.created_at,
  };
}

export async function listNotifications(): Promise<CommunityNotification[]> {
  const { supabase, userId } = await authenticatedClient();
  const { data, error } = await supabase.from("notifications").select("id,mission_id,title,body,read_at,created_at").eq("recipient_id", userId).order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return (data as NotificationRow[]).map(mapNotification);
}

export async function markNotificationsRead(ids?: string[]) {
  const { supabase, userId } = await authenticatedClient();
  let query = supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", userId).is("read_at", null);
  if (ids?.length) query = query.in("id", ids);
  const { error } = await query;
  if (error) throw error;
}
