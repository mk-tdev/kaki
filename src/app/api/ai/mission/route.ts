import { NextResponse } from "next/server";
import { generateMissionDraft } from "@/lib/ai/mission";
import { missionRequestSchema } from "@/lib/ai/schemas";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: auth, error: authError } = await supabase.auth.getClaims();
    if (authError || !auth?.claims?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = missionRequestSchema.safeParse(await request.json());
    if (!payload.success) return NextResponse.json({ error: "Tell us a little more about what you need." }, { status: 400 });
    const result = await generateMissionDraft(payload.data.request, payload.data.language);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("mission generation failed", error);
    return NextResponse.json({ error: "KAKI could not prepare that mission just now. Please try again." }, { status: 500 });
  }
}
