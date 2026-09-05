import { NextResponse } from "next/server";
import { updateMission } from "@/data/missions";
import { missionUpdateSchema } from "@/lib/ai/schemas";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = missionUpdateSchema.safeParse(await request.json());
    if (!payload.success) return NextResponse.json({ error: "Invalid mission update." }, { status: 400 });
    const { id } = await params;
    await updateMission(id, payload.data.action, payload.data.action === "complete" ? payload.data.story : undefined, payload.data.action === "complete" ? payload.data.consentToShare : false);
    return NextResponse.json({ ok: true });
  } catch (error) { const unauthorized = error instanceof Error && error.message === "Unauthorized"; return NextResponse.json({ error: unauthorized ? "Unauthorized" : "Could not update the mission." }, { status: unauthorized ? 401 : 500 }); }
}
