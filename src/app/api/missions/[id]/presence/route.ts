import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ action: z.enum(["on_way", "check_in", "consent"]), consentToShare: z.boolean().optional() });
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { data, error } = await supabase.from("mission_presence").select("*").eq("mission_id", id);
  return error ? NextResponse.json({ error: "Could not load check-ins." }, { status: 500 }) : NextResponse.json({ presence: data }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid check-in." }, { status: 400 });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { error } = await supabase.from("mission_presence").upsert({
    mission_id: id, user_id: auth.claims.sub,
    ...(parsed.data.action === "on_way" ? { on_way_at: new Date().toISOString() } : {}),
    ...(parsed.data.action === "check_in" ? { arrived_at: new Date().toISOString() } : {}),
    ...(parsed.data.consentToShare !== undefined ? { consent_to_share: parsed.data.consentToShare } : {}),
  }, { onConflict: "mission_id,user_id" });
  return error ? NextResponse.json({ error: "Only a participant in an active mission can check in." }, { status: 409 }) : NextResponse.json({ ok: true });
}
