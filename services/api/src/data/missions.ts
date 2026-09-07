import { requireIdentity } from "../lib/auth/server.js";
import { query, transaction } from "../lib/db/query.js";
import type { MissionDraft } from "../lib/ai/schemas.js";
import type { Mission, Profile } from "../types/kaki.js";

type DbProfile = { id: string; full_name: string; role: Profile["role"]; age_band: string | null; spoken_languages: string[]; skills: string[]; bio: string; verified_at: string | null };
type DbMission = { id: string; title: string; original_request: string; category: Mission["category"]; status: Mission["status"]; language: string; duration_minutes: number; location_label: string; scheduled_at: string; summary: string; guide: string[]; accessibility_notes: string | null; safety_level: Mission["safetyLevel"]; created_at: string; requester: DbProfile; helper: DbProfile | null };

function mapProfile(row: DbProfile, index = 0): Profile {
  const tones: Profile["avatarTone"][] = ["coral", "purple", "green", "yellow"];
  return { id: row.id, name: row.full_name, role: row.role, ageBand: row.age_band ?? "Prefer not to say", languages: row.spoken_languages, avatarTone: tones[index % tones.length], skills: row.skills, verified: Boolean(row.verified_at), bio: row.bio };
}

function mapMission(row: DbMission): Mission {
  return { id: row.id, title: row.title, originalRequest: row.original_request, category: row.category, status: row.status, requester: mapProfile(row.requester), helper: row.helper ? mapProfile(row.helper, 1) : undefined, language: row.language, durationMinutes: row.duration_minutes, location: row.location_label, scheduledAt: row.scheduled_at, summary: row.summary, guide: row.guide, accessibilityNotes: row.accessibility_notes ?? undefined, safetyLevel: row.safety_level, createdAt: row.created_at };
}

const missionSelect = `select m.*, row_to_json(r) as requester, row_to_json(h) as helper
 from public.missions m join (select id,full_name,role,age_band,spoken_languages,skills,bio,verified_at from public.profiles) r on r.id=m.requester_id
 left join (select id,full_name,role,age_band,spoken_languages,skills,bio,verified_at from public.profiles) h on h.id=m.helper_id`;

export async function listMissions() {
  await requireIdentity();
  return (await query<DbMission>(`${missionSelect} order by m.scheduled_at`)).map(mapMission);
}
export async function createMission(input: Omit<MissionDraft, "safetyNote"> & { scheduledAt: string }) {
  const identity = await requireIdentity();
  return transaction(async client => {
    const result = await client.query<{id:string}>(`insert into public.missions
      (requester_id,title,original_request,summary,category,status,language,duration_minutes,location_label,scheduled_at,guide,safety_level,ai_model)
      values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning id`,
      [identity.sub,input.title,input.originalRequest,input.summary,input.category,input.safetyLevel === "review" ? "flagged" : "open",input.language,input.durationMinutes,input.location,input.scheduledAt,JSON.stringify(input.guide),input.safetyLevel,process.env.OPENAI_MODEL ?? "local-rules"]);
    const mission = await client.query<DbMission>(`${missionSelect} where m.id=$1`, [result.rows[0].id]);
    return mapMission(mission.rows[0]);
  });
}
export async function updateMission(id: string, action: "claim" | "start" | "complete" | "cancel", story?: string, consentToShare = false) {
  const { sub } = await requireIdentity();
  await transaction(async client => {
    let sql: string;
    if (action === "cancel") sql = `update public.missions set status='cancelled',cancelled_at=now() where id=$1 and (requester_id=$2 or helper_id=$2) and status in ('draft','open','flagged','matched','in_progress') returning id`;
    else if (action === "claim") sql = `update public.missions set helper_id=$2,status='matched' where id=$1 and status='open' and requester_id<>$2 returning id`;
    else if (action === "start") sql = `update public.missions set status='in_progress' where id=$1 and helper_id=$2 and status='matched' returning id`;
    else {
      await client.query(`update public.mission_presence set reflection=$3,consent_to_share=$4 where mission_id=$1 and user_id=$2`, [id,sub,story || "",consentToShare]);
      sql = `update public.missions set status='completed',completed_at=now() where id=$1 and helper_id=$2 and status='in_progress' returning id`;
    }
    const result = await client.query(sql,[id,sub]);
    if (!result.rowCount) throw new Error("This request has changed or you cannot perform this action. Refresh and try again.");
  });
}
