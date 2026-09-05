import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MissionDraft } from "@/lib/ai/schemas";
import type { Mission, Profile } from "@/types/kaki";

type DbProfile = { id: string; full_name: string; role: Profile["role"]; age_band: string | null; spoken_languages: string[]; skills: string[]; bio: string; verified_at: string | null };
type DbMission = { id: string; title: string; original_request: string; category: Mission["category"]; status: Mission["status"]; language: string; duration_minutes: number; location_label: string; scheduled_at: string; summary: string; guide: string[]; accessibility_notes: string | null; safety_level: Mission["safetyLevel"]; created_at: string; requester: DbProfile; helper: DbProfile | null };

function mapProfile(row: DbProfile, index = 0): Profile {
  const tones: Profile["avatarTone"][] = ["coral", "purple", "green", "yellow"];
  return { id: row.id, name: row.full_name, role: row.role, ageBand: row.age_band ?? "Prefer not to say", languages: row.spoken_languages, avatarTone: tones[index % tones.length], skills: row.skills, verified: Boolean(row.verified_at), bio: row.bio };
}

function mapMission(row: DbMission): Mission {
  return { id: row.id, title: row.title, originalRequest: row.original_request, category: row.category, status: row.status, requester: mapProfile(row.requester), helper: row.helper ? mapProfile(row.helper, 1) : undefined, language: row.language, durationMinutes: row.duration_minutes, location: row.location_label, scheduledAt: row.scheduled_at, summary: row.summary, guide: row.guide, accessibilityNotes: row.accessibility_notes ?? undefined, safetyLevel: row.safety_level, createdAt: row.created_at };
}

async function authenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) throw new Error("Unauthorized");
  return { supabase, userId };
}

const missionSelect = "id,title,original_request,category,status,language,duration_minutes,location_label,scheduled_at,summary,guide,accessibility_notes,safety_level,created_at,requester:profiles!missions_requester_id_fkey(id,full_name,role,age_band,spoken_languages,skills,bio,verified_at),helper:profiles!missions_helper_id_fkey(id,full_name,role,age_band,spoken_languages,skills,bio,verified_at)";

export async function listMissions() {
  const { supabase } = await authenticatedClient();
  const { data, error } = await supabase.from("missions").select(missionSelect).order("scheduled_at", { ascending: true });
  if (error) throw error;
  return (data as unknown as DbMission[]).map(mapMission);
}

export async function createMission(input: Omit<MissionDraft, "safetyNote"> & { scheduledAt: string }) {
  const { supabase, userId } = await authenticatedClient();
  const { data, error } = await supabase.from("missions").insert({ requester_id: userId, title: input.title, original_request: input.originalRequest, summary: input.summary, category: input.category, status: input.safetyLevel === "review" ? "flagged" : "open", language: input.language, duration_minutes: input.durationMinutes, location_label: input.location, scheduled_at: input.scheduledAt, guide: input.guide, safety_level: input.safetyLevel, ai_model: process.env.OPENAI_MODEL ?? "local-rules" }).select(missionSelect).single();
  if (error) throw error;
  return mapMission(data as unknown as DbMission);
}

export async function updateMission(id: string, action: "claim" | "start" | "complete" | "cancel", story?: string, consentToShare = false) {
  const { supabase, userId } = await authenticatedClient();
  if (action === "cancel") {
    const { data, error } = await supabase.from("missions").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", id).in("status", ["draft","open","flagged","matched","in_progress"]).or(`requester_id.eq.${userId},helper_id.eq.${userId}`).select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("This request has changed or you are not a participant. Refresh and try again.");
  } else if (action === "claim") {
    const { data, error } = await supabase.from("missions").update({ helper_id: userId, status: "matched" }).eq("id", id).eq("status", "open").neq("requester_id", userId).select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("This mission is no longer available to claim.");
  } else if (action === "start") {
    const { data, error } = await supabase.from("missions").update({ status: "in_progress" }).eq("id", id).eq("helper_id", userId).eq("status", "matched").select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Only the assigned Kaki can start a matched mission.");
  } else {
    // Save only the helper's own reflection/consent. The database derives joint
    // consent and creates the Bloom atomically with the completed transition.
    const { error: presenceError } = await supabase.from("mission_presence").update({ reflection: story || "", consent_to_share: consentToShare }).eq("mission_id", id).eq("user_id", userId);
    if (presenceError) throw presenceError;
    const completedAt = new Date().toISOString();
    const { data: mission, error } = await supabase.from("missions").update({ status: "completed", completed_at: completedAt }).eq("id", id).eq("helper_id", userId).eq("status", "in_progress").select("id,title,category,requester_id,helper_id").maybeSingle();
    if (error) throw error;
    if (!mission) throw new Error("Only the assigned Kaki can complete a mission in progress.");
  }
}
