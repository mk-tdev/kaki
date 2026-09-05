import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

export const assistanceSuggestionsSchema = z.object({
  suggestions: z.array(z.string().min(8).max(120)).length(3),
});

export async function generateAssistanceSuggestions(partialRequest: string, language: string) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI is not configured");

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 20_000, maxRetries: 0 });
  const response = await client.responses.parse({
    model: process.env.OPENAI_MODEL || "gpt-5-mini",
    input: [
      {
        role: "system",
        content: "You help Pek Kio residents describe small neighbour-to-neighbour assistance requests. Given a partial request, return exactly three concise, distinct first-person suggestions that the resident can tap to complete or clarify their thought. Keep each suggestion practical, warm, specific, and suitable for a public community setting. Do not diagnose, give medical advice, suggest money transfers, promise professional services, or invent private details. Write in the resident's preferred language when practical.",
      },
      { role: "user", content: `Preferred language: ${language}\nPartial request: ${partialRequest}` },
    ],
    text: { format: zodTextFormat(assistanceSuggestionsSchema, "kaki_assistance_suggestions") },
  });

  if (!response.output_parsed) throw new Error("OpenAI did not return suggestions");
  return response.output_parsed.suggestions;
}
