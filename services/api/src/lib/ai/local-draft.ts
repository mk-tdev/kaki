import type { MissionDraft } from "./schemas.js";

const sensitivePattern = /suicide|self[- ]?harm|kill myself|abuse|violence|emergency|chest pain|cannot breathe|medical diagnosis|money transfer|bank transfer|password|otp|private.home|my home|electrical wiring|mains|live wire/i;

export function createLocalDraft(request: string, language: string): MissionDraft {
  const normalized = request.toLowerCase();
  const category = /phone|whatsapp|photo|app|online|computer|healthhub/.test(normalized) ? "digital" : /walk|lonely|talk|company|exercise/.test(normalized) ? "wellbeing" : /fix|repair|broken|fan|lamp/.test(normalized) ? "repair" : /food|cook|leftover|recipe|meal/.test(normalized) ? "food" : "skills";
  const safetyLevel = sensitivePattern.test(request) ? "review" : "community";
  const title = category === "digital" ? "A little digital help" : category === "wellbeing" ? "A friendly neighbourhood moment" : category === "repair" ? "Repair it together" : category === "food" ? "Cook, share and waste less" : "Share a skill or story";
  return { title, originalRequest: request, summary: request.length > 160 ? `${request.slice(0, 157)}…` : request, category, language, durationMinutes: category === "wellbeing" ? 30 : category === "food" ? 45 : 20, location: "Pek Kio Community Innovation Space", guide: ["Introduce yourself and confirm what would feel helpful today.", "Work through the task together, letting the resident lead where possible.", "Recap one simple next step and check whether anything needs organiser follow-up."], safetyLevel, safetyNote: safetyLevel === "review" ? "This request needs a community organiser to review and coordinate the right support." : "Meet at the approved public community space and keep the task within the agreed scope." };
}
