"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, LoaderCircle, ShieldCheck, Sparkles, X } from "lucide-react";
import { VoiceRequest } from "@/components/voice-request";
import { TranslateText } from "@/components/translate-text";
import { MissionReview } from "@/components/mission-review";
import { AiAssistanceSuggestions } from "@/components/ai-assistance-suggestions";
import { useMissions } from "@/components/mission-provider";
import { Button } from "@/components/ui/button";
import type { MissionDraft } from "@/lib/ai/schemas";

const languages = ["English", "中文", "Bahasa Melayu", "தமிழ்"];
export default function AskPage() {
  const router = useRouter();
  const requestInput = useRef<HTMLTextAreaElement>(null);
  const [clearVersion, setClearVersion] = useState(0);
  const { addMission } = useMissions();
  const [request, setRequest] = useState("");
  const [language, setLanguage] = useState("English");
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<MissionDraft | null>(null);
  const [mode, setMode] = useState<"local" | "openai" | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [meetingOffset, setMeetingOffset] = useState(15);
  async function createDraft() {
    if (request.trim().length < 3) { setError("Tell us a little more so we can make a useful mission."); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/ai/mission", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request, language }) });
      const result = await response.json() as { draft?: MissionDraft; mode?: "local" | "openai"; error?: string };
      if (!response.ok || !result.draft) throw new Error(result.error || "Mission generation failed");
      setDraft(result.draft); setMode(result.mode ?? "local");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  async function publishMission() {
    if (!draft) return;
    if (draft.location.trim().length < 3) { setError("Choose a public meeting point (at least 3 characters)."); return; }
    setPublishing(true);
    setError("");
    const meetingTime = new Date(Date.now() + meetingOffset * 60 * 1000);
    try {
      const mission = await addMission({ title: draft.title, originalRequest: draft.originalRequest, category: draft.category, language: draft.language, durationMinutes: draft.durationMinutes, location: draft.location.trim(), scheduledAt: meetingTime.toISOString(), summary: draft.summary, guide: draft.guide, safetyLevel: draft.safetyLevel });
      router.push(`/missions/${mission.id}?created=1`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not publish your mission.");

    } finally {
      setPublishing(false);
    }
  }

  if (draft) return <MissionReview onLocation={location => setDraft(current => current ? { ...current, location } : current)} meetingOffset={meetingOffset} onMeetingOffset={setMeetingOffset} error={error} draft={draft} mode={mode} publishing={publishing} onBack={() => setDraft(null)} onPublish={() => void publishMission()} />;

  return <div className="mx-auto max-w-3xl"><div className="text-center"><p className="text-xs font-black uppercase tracking-[.18em] text-purple">Create a mission</p><h1 className="mt-3 text-balance text-3xl font-bold tracking-[-.06em] sm:text-4xl">What can we do together today?</h1><p className="mx-auto mt-4 max-w-xl text-lg leading-7 text-muted">Speak naturally. KAKI will turn your words into one small, safe request.</p></div><div className="paper-card mt-8 rounded-2xl p-5 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-black text-ink">I’m most comfortable with</p><div className="flex flex-wrap gap-2">{languages.map((item) => <button key={item} disabled={voiceBusy || loading} onClick={() => setLanguage(item)} className={`min-h-11 rounded-lg px-3 text-sm font-bold transition ${language === item ? "bg-purple text-white" : "bg-ink/5 text-muted hover:bg-ink/8"}`}>{item}</button>)}</div></div><VoiceRequest onText={setRequest} onBusy={setVoiceBusy} disabled={loading} /><div className="my-7 flex items-center gap-3"><span className="h-px flex-1 bg-ink/10" /><span className="text-xs font-black uppercase tracking-[.16em] text-muted">or type</span><span className="h-px flex-1 bg-ink/10" /></div><div className="mb-2 flex items-center justify-between gap-3"><label htmlFor="request-text" className="text-sm font-bold">Your request</label><button type="button" disabled={!request || loading || voiceBusy} onClick={()=>{setRequest("");setError("");setClearVersion(value=>value+1);requestInput.current?.focus();}} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-purple hover:bg-purple/5 disabled:opacity-40"><X className="size-4"/>Clear text</button></div><textarea id="request-text" ref={requestInput} aria-label="Describe what you need" disabled={voiceBusy || loading} maxLength={1000} value={request} onChange={event=>setRequest(event.target.value)} rows={4} placeholder="For example: Help me send photos to my grandson…" className="w-full resize-y rounded-xl border border-ink/15 bg-white px-4 py-3 text-base leading-7 placeholder:text-muted/65" /><TranslateText key={clearVersion} text={request} language={language} onUse={setRequest} disabled={voiceBusy || loading} /><AiAssistanceSuggestions disabled={loading || voiceBusy} request={request} language={language} onSelect={setRequest} />{error ? <div className="mt-5 flex items-start gap-3 rounded-2xl bg-coral/10 p-4 text-sm font-bold text-[#92372d]"><AlertCircle className="mt-0.5 size-5 shrink-0" />{error}</div> : null}<Button onClick={createDraft} disabled={loading || voiceBusy} className="mt-6 min-h-14 w-full text-base">{loading ? <><LoaderCircle className="size-5 animate-spin" />Making this easy…</> : <><Sparkles className="size-5" />Turn this into a mission <ArrowRight className="size-5" /></>}</Button><p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-muted"><ShieldCheck className="size-4 text-kaki-green" />Sensitive requests are held for organiser review. Not an emergency service.</p></div></div>;
}
