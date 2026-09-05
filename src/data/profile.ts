import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/kaki";

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

async function authenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) throw new Error("Unauthorized");
  return { supabase, userId };
}

export async function getCurrentProfile() {
  const { supabase, userId } = await authenticatedClient();
  const { data, error } = await supabase.from("profiles").select(profileSelect).eq("id", userId).single();
  if (error) throw error;
  const profile = mapProfile(data as ProfileRow);
  const { data: auth } = await supabase.auth.getClaims();
  return { ...profile, isGuest: auth?.claims?.is_anonymous === true };
}

export async function updateCurrentProfile(input: {
  fullName: string;
  role: Exclude<UserRole, "organiser">;
  preferredLanguage: string;
  skills?: string[];
}) {
  const { supabase, userId } = await authenticatedClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      role: input.role,
      preferred_language: input.preferredLanguage,
      spoken_languages: [input.preferredLanguage],
      onboarded_at: new Date().toISOString(),
      ...(input.skills ? { skills: input.skills } : {}),
    })
    .eq("id", userId)
    .select(profileSelect)
    .single();
  if (error) throw error;
  return mapProfile(data as ProfileRow);
}
