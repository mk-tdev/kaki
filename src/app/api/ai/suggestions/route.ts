import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAssistanceSuggestions } from "@/lib/ai/suggestions";
import { createClient } from "@/lib/supabase/server";
import { takeAiQuota } from "@/lib/ai/quota";

const requestSchema = z.object({
  request: z.string().trim().min(3).max(1000),
  language: z.string().trim().min(2).max(40),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: auth, error: authError } = await supabase.auth.getClaims();
    if (authError || !auth?.claims?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = requestSchema.safeParse(await request.json());
    if (!payload.success) return NextResponse.json({ error: "Keep typing for AI suggestions." }, { status: 400 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "AI suggestions are not configured." }, { status: 503 });
    if (!await takeAiQuota()) return NextResponse.json({ error: "AI request limit reached. Please try later." }, { status: 429 });

    if (request.signal.aborted) return new NextResponse(null, { status: 499 });
    const suggestions = await generateAssistanceSuggestions(payload.data.request, payload.data.language, request.signal);
    return NextResponse.json({ suggestions, mode: "openai" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (request.signal.aborted) return new NextResponse(null, { status: 499 });
    console.error("assistance suggestion generation failed", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "AI suggestions are taking a short break." }, { status: 500 });
  }
}
