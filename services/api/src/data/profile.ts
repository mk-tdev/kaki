
import { requireIdentity } from "../lib/auth/server";
import { query } from "../lib/db/query";
import type { Profile, UserRole } from "../types/kaki";

const profileSelect = "id,full_name,role,onboarded_at,age_band,spoken_languages,skills,bio,verified_at";

type ProfileRow = {
  id: string;
  full_name: string;
  role: UserRole;
  onboarded_at: string | null;
  age_band: string | null;
  spoken_languages: string[];
  skills: string[];
  bio: string;
  verified_at: string | null;
};

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.full_name,
    role: row.role,
    onboardedAt: row.onboarded_at ?? undefined,
    ageBand: row.age_band ?? "Prefer not to say",
    languages: row.spoken_languages,
    avatarTone: "purple",
    skills: row.skills,
    verified: Boolean(row.verified_at),
    bio: row.bio,
  };
}

export async function getCurrentProfile() {
  const identity = await requireIdentity();
  const rows = await query<ProfileRow>(`select ${profileSelect} from public.profiles where id=$1`,[identity.sub]);
  if (!rows[0]) throw new Error("Unauthorized");
  return { ...mapProfile(rows[0]), isGuest: identity.is_anonymous };
}
export async function updateCurrentProfile(input: {
  fullName: string; role: Exclude<UserRole, "organiser">; preferredLanguage: string; skills?: string[];
}) {
  const { sub } = await requireIdentity();
  const rows = await query<ProfileRow>(`update public.profiles set full_name=$2,role=$3,preferred_language=$4,spoken_languages=$5,onboarded_at=now(),skills=coalesce($6,skills) where id=$1 returning ${profileSelect}`,
    [sub,input.fullName,input.role,input.preferredLanguage,[input.preferredLanguage],input.skills ?? null]);
  if (!rows[0]) throw new Error("Unauthorized");
  return mapProfile(rows[0]);
}
