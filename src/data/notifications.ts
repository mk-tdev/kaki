import "server-only";

import { requireIdentity } from "@/lib/auth/server";
import { query } from "@/lib/db/query";
import type { CommunityNotification } from "@/types/kaki";

type NotificationRow = {
  id: string;
  mission_id: string | null;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

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
  const { sub } = await requireIdentity();
  return (await query<NotificationRow>(`select id,mission_id,title,body,read_at,created_at from public.notifications where recipient_id=$1 order by created_at desc limit 50`,[sub])).map(mapNotification);
}
export async function markNotificationsRead(ids?: string[]) {
  const { sub } = await requireIdentity();
  await query(`update public.notifications set read_at=now() where recipient_id=$1 and read_at is null and ($2::uuid[] is null or id=any($2::uuid[]))`,[sub,ids?.length ? ids : null]);
}
