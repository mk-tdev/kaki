import { createMission, listMissions } from "../../../data/missions.js";
import { missionCreateSchema } from "../../../lib/ai/schemas.js";

export async function GET() {
  try { return Response.json({ missions: await listMissions(), mode: "postgres" }); }
  catch (error) { const unauthorized = error instanceof Error && error.message === "Unauthorized"; return Response.json({ error: unauthorized ? "Unauthorized" : "Could not load missions." }, { status: unauthorized ? 401 : 500 }); }
}

export async function POST(request: Request) {
  try {
    const payload = missionCreateSchema.safeParse(await request.json());
    if (!payload.success) return Response.json({ error: "Invalid mission details." }, { status: 400 });
    return Response.json({ mission: await createMission(payload.data) }, { status: 201 });
  } catch (error) {
    const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
    const unauthorized = message === "Unauthorized";
    const limited = message.includes("three requests every 15 minutes");
    return Response.json({ error: unauthorized ? "Unauthorized" : limited ? "You’ve posted three requests. Please wait 15 minutes before asking again." : "Could not create the mission." }, { status: unauthorized ? 401 : limited ? 429 : 500 });
  }
}
