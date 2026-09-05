import "server-only";

import { requireIdentity } from "@/lib/auth/server";
import { query, transaction } from "@/lib/db/query";
import type { CommunityMessage, Profile } from "@/types/kaki";

type MessageProfile = { id: string; full_name: string; role: Profile["role"]; age_band: string | null; spoken_languages: string[]; skills: string[]; bio: string; verified_at: string | null };
type MessageRow = { id: string; mission_id: string; body: string; is_system: boolean; created_at: string; sender: MessageProfile };

const messageSelect = `select m.*,row_to_json(p) as sender from public.mission_messages m join (select id,full_name,role,age_band,spoken_languages,skills,bio,verified_at from public.profiles) p on p.id=m.sender_id`;

function mapSender(row: MessageProfile): Profile {
  return { id: row.id, name: row.full_name, role: row.role, ageBand: row.age_band ?? "Prefer not to say", languages: row.spoken_languages, avatarTone: "purple", skills: row.skills, verified: Boolean(row.verified_at), bio: row.bio };
}

function mapMessage(row: MessageRow): CommunityMessage {
  return { id: row.id, missionId: row.mission_id, body: row.body, isSystem: row.is_system, sender: mapSender(row.sender), createdAt: row.created_at };
}

export async function listMissionMessages(missionId: string) {
  await requireIdentity();
  return (await query<MessageRow>(`${messageSelect} where m.mission_id=$1 order by m.created_at`, [missionId])).map(mapMessage);
}
export async function sendMissionMessage(missionId: string, body: string) {
  const { sub } = await requireIdentity();
  return transaction(async client => {
    const result = await client.query<{id:string}>(`insert into public.mission_messages(mission_id,sender_id,body,is_system) values($1,$2,$3,false) returning id`,[missionId,sub,body]);
    const rows = await client.query<MessageRow>(`${messageSelect} where m.id=$1`,[result.rows[0].id]);
    return mapMessage(rows.rows[0]);
  });
}
