import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Bloom, MissionCategory } from "@/types/kaki";

type BloomRow = {
  id: string;
  mission_id: string;
  category: MissionCategory;
  title: string;
  story: string;
  participant_names: string[];
  created_at: string;
};

export async function listBlooms(): Promise<Bloom[]> {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError || !auth?.claims?.sub) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("blooms")
    .select("id,mission_id,category,title,story,participant_names,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data as BloomRow[]).map((row) => ({
    id: row.id,
    missionId: row.mission_id,
    category: row.category,
    title: row.title,
    story: row.story,
    participantNames: row.participant_names,
    createdAt: row.created_at,
  }));
}
