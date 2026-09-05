import { NextResponse } from "next/server";
import { createMission, listMissions } from "@/data/missions";
import { missionCreateSchema } from "@/lib/ai/schemas";

export async function GET() {
  try { return NextResponse.json({ missions: await listMissions(), mode: "supabase" }); }
  catch (error) { const unauthorized = error instanceof Error && error.message === "Unauthorized"; return NextResponse.json({ error: unauthorized ? "Unauthorized" : "Could not load missions." }, { status: unauthorized ? 401 : 500 }); }
}

export async function POST(request: Request) {
  try {
    const payload = missionCreateSchema.safeParse(await request.json());
    if (!payload.success) return NextResponse.json({ error: "Invalid mission details." }, { status: 400 });
    return NextResponse.json({ mission: await createMission(payload.data) }, { status: 201 });
  } catch (error) { const unauthorized = error instanceof Error && error.message === "Unauthorized"; return NextResponse.json({ error: unauthorized ? "Unauthorized" : "Could not create the mission." }, { status: unauthorized ? 401 : 500 }); }
}
