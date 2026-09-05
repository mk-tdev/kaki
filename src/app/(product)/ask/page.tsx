"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, Clock3, Languages, LoaderCircle, MapPin, Mic, ShieldCheck, Sparkles, Square } from "lucide-react";
import { MeetingSettings } from "@/components/meeting-settings";
import { AiAssistanceSuggestions } from "@/components/ai-assistance-suggestions";
import { CategoryIcon, categoryMeta } from "@/components/category-icon";
import { useMissions } from "@/components/mission-provider";
import { Button } from "@/components/ui/button";
import type { MissionDraft } from "@/lib/ai/schemas";

type SpeechRecognitionInstance = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

const languages = ["English", "中文", "Bahasa Melayu", "தமிழ்"];
export default function AskPage() {
  const router = useRouter();
  const { addMission } = useMissions();
  const [request, setRequest] = useState("");
  const [language, setLanguage] = useState("English");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<MissionDraft | null>(null);
  const [mode, setMode] = useState<"local" | "openai" | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [meetingOffset, setMeetingOffset] = useState(15);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => () => { recognitionRef.current?.stop(); }, []);

  function toggleVoice() {
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const browserWindow = window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const Recognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
    if (!Recognition) { setError("Voice input is not supported in this browser. You can type your request instead."); return; }
    const recognition = new Recognition();
    recognition.lang = language === "中文" ? "zh-SG" : language === "Bahasa Melayu" ? "ms-SG" : language === "தமிழ்" ? "ta-SG" : "en-SG";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0].transcript).join(" ");
      setRequest(transcript.slice(0, 1000));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => { setListening(false); setError("I could not hear that clearly. Try again or type below."); };
    recognitionRef.current = recognition;
    setError(""); setListening(true);
    try { recognition.start(); } catch { setListening(false); setError("Microphone unavailable. Type your request instead."); }
  }

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

  if (draft) return <ReviewDraft onLocation={location => setDraft(current => current ? { ...current, location } : current)} meetingOffset={meetingOffset} onMeetingOffset={setMeetingOffset} error={error} draft={draft} mode={mode} publishing={publishing} onBack={() => setDraft(null)} onPublish={() => void publishMission()} />;

  return <div className="mx-auto max-w-3xl"><div className="text-center"><p className="text-xs font-black uppercase tracking-[.18em] text-purple">Create a mission</p><h1 className="mt-3 text-balance text-4xl font-black tracking-[-.06em] sm:text-5xl">What can we do together today?</h1><p className="mx-auto mt-4 max-w-xl text-lg leading-7 text-muted">Speak naturally. KAKI will turn your words into one small, safe request.</p></div><div className="paper-card mt-8 rounded-[36px] p-5 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-black text-ink">I’m most comfortable with</p><div className="flex flex-wrap gap-2">{languages.map((item) => <button key={item} onClick={() => setLanguage(item)} className={`min-h-10 rounded-full px-3 text-sm font-bold transition ${language === item ? "bg-purple text-white" : "bg-ink/5 text-muted hover:bg-ink/8"}`}>{item}</button>)}</div></div><div className="mt-8 text-center"><button onClick={toggleVoice} aria-label={listening ? "Stop voice input" : "Start voice input"} aria-pressed={listening} className={`breathe mx-auto grid size-28 place-items-center rounded-full text-white shadow-[0_18px_45px_rgba(109,85,217,.3)] transition ${listening ? "bg-coral" : "bg-purple hover:bg-purple-dark"}`}>{listening ? <Square className="size-9 fill-white" /> : <Mic className="size-11" />}</button><p className="mt-4 font-black text-ink">{listening ? "Listening… tap to stop" : "Tap and tell KAKI"}</p><p className="mt-1 text-sm text-muted">Your browser handles transcription; audio may use its speech service</p></div>{listening ? <div className="mt-5 flex h-10 items-center justify-center gap-1" role="status" aria-label="Listening; transcription appears below">{Array.from({length: 19}, (_, i) => <span key={i} className="voice-bar h-9 w-1.5 rounded-full bg-purple" style={{animationDelay: `${i * 60}ms`}} />)}</div> : null}<div className="my-7 flex items-center gap-3"><span className="h-px flex-1 bg-ink/10" /><span className="text-xs font-black uppercase tracking-[.16em] text-muted">or type</span><span className="h-px flex-1 bg-ink/10" /></div><label className="block"><span className="sr-only">Describe what you need</span><textarea maxLength={1000} value={request} onChange={(event) => setRequest(event.target.value)} rows={5} placeholder="For example: I want to learn how to send photos to my grandson…" className="w-full resize-none rounded-[24px] border border-ink/10 bg-white px-5 py-4 text-lg leading-7 placeholder:text-muted/55" /></label><AiAssistanceSuggestions disabled={loading} request={listening ? "" : request} language={language} onSelect={setRequest} />{error ? <div className="mt-5 flex items-start gap-3 rounded-2xl bg-coral/10 p-4 text-sm font-bold text-[#92372d]"><AlertCircle className="mt-0.5 size-5 shrink-0" />{error}</div> : null}<Button onClick={createDraft} disabled={loading} className="mt-6 min-h-14 w-full text-base">{loading ? <><LoaderCircle className="size-5 animate-spin" />Making this easy…</> : <><Sparkles className="size-5" />Turn this into a mission <ArrowRight className="size-5" /></>}</Button><p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-muted"><ShieldCheck className="size-4 text-kaki-green" />Sensitive requests are held for organiser review. Not an emergency service.</p></div></div>;
}

function ReviewDraft({ onLocation, meetingOffset, onMeetingOffset, error, draft, mode, publishing, onBack, onPublish }: { onLocation: (location: string) => void; meetingOffset: number; onMeetingOffset: (minutes: number) => void; error: string; draft: MissionDraft; mode: "local" | "openai" | null; publishing: boolean; onBack: () => void; onPublish: () => void }) {
  const meta = categoryMeta[draft.category];
  return <div className="mx-auto max-w-3xl"><button onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm font-black text-muted hover:text-purple"><ArrowLeft className="size-4" />Change my request</button><div className="text-center"><div className="mx-auto grid size-16 place-items-center rounded-[22px] bg-purple text-white"><Sparkles className="size-7" /></div><p className="mt-4 text-xs font-black uppercase tracking-[.18em] text-purple">KAKI understood</p><h1 className="mt-2 text-4xl font-black tracking-[-.06em]">Here’s your mission</h1></div><div className="paper-card mt-8 overflow-hidden rounded-[36px]"><div className="bg-ink p-6 text-white sm:p-8"><div className="flex items-start gap-4"><CategoryIcon category={draft.category} className="size-14" /><div><p className="text-xs font-black uppercase tracking-[.14em] text-sun">{meta.label} · {draft.durationMinutes} minutes</p><h2 className="mt-2 text-3xl font-black tracking-[-.05em]">{draft.title}</h2><p className="mt-3 leading-7 text-white/65">{draft.summary}</p></div></div></div><div className="p-6 sm:p-8"><div className="grid gap-3 sm:grid-cols-3"><Detail icon={<Clock3 />} label="Time" value={meetingOffset === 1440 ? "Tomorrow, around this time" : `In about ${meetingOffset} minutes`} /><Detail icon={<MapPin />} label="Meeting point" value={draft.location} /><Detail icon={<Languages />} label="Language" value={draft.language} /></div><MeetingSettings location={draft.location} onLocation={onLocation} minutes={meetingOffset} onMinutes={onMeetingOffset} disabled={publishing} /><div className="mt-7 rounded-[24px] bg-purple/7 p-5"><p className="text-sm font-black text-purple-dark">Your Kaki will receive this guide</p><ol className="mt-4 space-y-3">{draft.guide.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-6 text-ink"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-purple text-xs font-black text-white">{index + 1}</span>{step}</li>)}</ol></div><div className={`mt-5 flex items-start gap-3 rounded-2xl p-4 ${draft.safetyLevel === "review" ? "bg-coral/10 text-[#92372d]" : "bg-mint/65 text-[#17654d]"}`}>{draft.safetyLevel === "review" ? <AlertCircle className="size-5 shrink-0" /> : <ShieldCheck className="size-5 shrink-0" />}<div><p className="text-sm font-black">{draft.safetyLevel === "review" ? "Organiser review needed" : "Community-safe mission"}</p><p className="mt-1 text-sm leading-6 opacity-80">{draft.safetyNote}</p></div></div>{error ? <p role="alert" className="mt-4 text-sm text-coral">{error}</p> : null}<Button onClick={onPublish} disabled={publishing || draft.location.trim().length < 3} className="mt-6 min-h-14 w-full text-base">{publishing ? <LoaderCircle className="size-5 animate-spin" /> : null}{publishing ? "Publishing…" : draft.safetyLevel === "review" ? "Send to organiser" : "Find my Kaki"}<ArrowRight className="size-5" /></Button><p className="mt-3 text-center text-[11px] text-muted">Prepared with {mode === "openai" ? "OpenAI" : "KAKI’s offline-safe rules"} · You stay in control</p></div></div></div>;
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-2xl bg-ink/[.035] p-4"><span className="text-purple">{icon}</span><p className="mt-3 text-[11px] font-black uppercase tracking-[.14em] text-muted">{label}</p><p className="mt-1 text-sm font-bold leading-5 text-ink">{value}</p></div>; }
