import { z } from "zod";

export const missionDraftSchema = z.object({
  title: z.string().min(3).max(100),
  originalRequest: z.string().min(3).max(1000),
  summary: z.string().min(3).max(500),
  category: z.enum(["digital", "wellbeing", "repair", "food", "skills"]),
  language: z.string().min(2).max(80),
  durationMinutes: z.number().int().min(10).max(180),
  location: z.string().min(3).max(160),
  guide: z.array(z.string().min(3).max(180)).min(3).max(5),
  safetyLevel: z.enum(["community", "review"]),
  safetyNote: z.string().max(240),
});

export const missionRequestSchema = z.object({
  request: z.string().min(3).max(1000),
  language: z.string().min(2).max(40).default("English"),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
});

export const missionCreateSchema = missionDraftSchema.omit({ safetyNote: true }).extend({
  scheduledAt: z.string().datetime({ offset: true }),
});

export const missionUpdateSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("claim") }),
  z.object({ action: z.literal("start") }),
  z.object({ action: z.literal("complete"), story: z.string().trim().max(500).refine(value => value.length === 0 || value.length >= 3).optional(), consentToShare: z.boolean().default(false) }),
]);

export type MissionDraft = z.infer<typeof missionDraftSchema>;
