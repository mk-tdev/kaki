import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CommunityMessage, Profile } from "@/types/kaki";

type MessageProfile = { id: string; full_name: string; role: Profile["role"]; age_band: string | null; spoken_languages: string[]; skills: string[]; bio: string; verified_at: string | null };
type MessageRow = { id: string; mission_id: string; body: string; is_system: boolean; created_at: string; sender: MessageProfile };

const messageSelect = "id,mission_id,body,is_system,created_at,sender:profiles!mission_messages_sender_id_fkey(id,full_name,role,age_band,spoken_languages,skills,bio,verified_at)";

function mapSender(row: MessageProfile): Profile {
  return { id: row.id, name: row.full_name, role: row.role, ageBand: row.age_band ?? "Prefer not to say", languages: row.spoken_languages, avatarTone: "purple", skills: row.skills, verified: Boolean(row.verified_at), bio: row.bio };
}

function mapMessage(row: MessageRow): CommunityMessage {
  return { id: row.id, missionId: row.mission_id, body: row.body, isSystem: row.is_system, sender: mapSender(row.sender), createdAt: row.created_at };
}

async function authenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) throw new Error("Unauthorized");
  return { supabase, userId };
}

export async function listMissionMessages(missionId: string) {
  const { supabase } = await authenticatedClient();
  const { data, error } = await supabase.from("mission_messages").select(messageSelect).eq("mission_id", missionId).order("created_at", { ascending: true });
  if (error) throw error;
  return (data as unknown as MessageRow[]).map(mapMessage);
}

export async function sendMissionMessage(missionId: string, body: string) {
  const { supabase, userId } = await authenticatedClient();
  const { data, error } = await supabase.from("mission_messages").insert({ mission_id: missionId, sender_id: userId, body, is_system: false }).select(messageSelect).single();
  if (error) throw error;
  return mapMessage(data as unknown as MessageRow);
}
