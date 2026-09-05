import { z } from "zod";

export const matchInsightSchema = z.object({
  headline: z.string().min(3).max(100),
  summary: z.string().min(3).max(300),
  reasons: z.array(z.object({
    label: z.enum(["Language", "Skills", "Availability"]),
    evidence: z.enum(["shared", "needs_confirmation"]),
    detail: z.string().min(3).max(180),
  })).length(3),
  icebreaker: z.string().min(3).max(180),
});
export type MatchInsight = z.infer<typeof matchInsightSchema>;
