import { generateMissionDraft } from "../../../../lib/ai/mission";
import { missionRequestSchema } from "../../../../lib/ai/schemas";
import { createClient } from "../../../../lib/auth/server";
import { takeAiQuota } from "../../../../lib/ai/quota";

export async function POST(request: Request) {
  try {
    const authClient = await createClient();
    const { data: auth, error: authError } = await authClient.auth.getClaims();
    if (authError || !auth?.claims?.sub) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const payload = missionRequestSchema.safeParse(await request.json());
    if (!payload.success) return Response.json({ error: "Tell us a little more about what you need." }, { status: 400 });
    if (!await takeAiQuota()) return Response.json({ error: "AI is taking a breather. Please try again later or ask the event host." }, { status: 429 });
    const result = await generateMissionDraft(payload.data.request, payload.data.language);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("mission generation failed", error);
    return Response.json({ error: "KAKI could not prepare that mission just now. Please try again." }, { status: 500 });
  }
}
