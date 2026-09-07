import { OpenAI } from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { missionDraftSchema } from "./schemas.js";
import { createLocalDraft } from "./local-draft.js";

export async function generateMissionDraft(request: string, language: string) {
  if (!process.env.OPENAI_API_KEY) return { draft: createLocalDraft(request, language), mode: "local" as const };
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 40_000, maxRetries: 0 });
    const response = await client.responses.parse({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      input: [
        { role: "system", content: "You convert informal Pek Kio community requests into small, safe, practical neighbour missions. Use warm Singapore English and plain language. Never diagnose, give medical advice, or route emergencies to a volunteer. Mark requests involving crisis, abuse, medical symptoms, money transfers, private-home access, or unsafe electrical work as review. Default to an approved public community location. Create a 3-step guide that helps without patronising the requester." },
        { role: "user", content: `Preferred language: ${language}\nResident request: ${request}` },
      ],
      text: { format: zodTextFormat(missionDraftSchema, "kaki_mission") },
    });
    if (!response.output_parsed) throw new Error("No structured response");
    return { draft: response.output_parsed, mode: "openai" as const };
  } catch (error) {
    console.error("OpenAI mission shaping unavailable", error instanceof Error ? error.name : "Unknown error");
    return { draft: createLocalDraft(request, language), mode: "local" as const };
  }
}
