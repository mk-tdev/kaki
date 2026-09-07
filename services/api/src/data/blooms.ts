
import { requireIdentity } from "../lib/auth/server.js";
import { query } from "../lib/db/query.js";
import type { Bloom, MissionCategory } from "../types/kaki.js";

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
  await requireIdentity();
  const data = await query<BloomRow>("select id,mission_id,category,title,story,participant_names,created_at from public.blooms order by created_at desc");

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
