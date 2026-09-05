import { describe, expect, it } from "vitest";
import { createLocalDraft } from "@/lib/ai/local-draft";
import { missionDraftSchema } from "@/lib/ai/schemas";

describe("createLocalDraft", () => {
  it("turns a phone request into a valid digital mission", () => {
    const draft = createLocalDraft("Help me send a WhatsApp photo", "English");
    expect(draft.category).toBe("digital");
    expect(draft.safetyLevel).toBe("community");
    expect(missionDraftSchema.safeParse(draft).success).toBe(true);
  });

  it("routes potentially urgent health requests to organiser review", () => {
    const draft = createLocalDraft("I have chest pain and need medical advice", "English");
    expect(draft.safetyLevel).toBe("review");
    expect(draft.safetyNote).toContain("organiser");
  });

  it("retains the resident's preferred language", () => {
    expect(createLocalDraft("Teach me a family recipe", "中文").language).toBe("中文");
  });
});
