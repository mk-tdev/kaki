"use client";
import { AlertCircle, ArrowLeft, ArrowRight, ChevronDown, LoaderCircle, MapPin, ShieldCheck } from "lucide-react";
import { categoryMeta } from "@/components/category-icon";
import { MeetingSettings } from "@/components/meeting-settings";
import { Button } from "@/components/ui/button";
import type { MissionDraft } from "@/lib/ai/schemas";

export function MissionReview({ onLocation, meetingOffset, onMeetingOffset, error, draft, mode, publishing, onBack, onPublish }: {
  onLocation:(location:string)=>void; meetingOffset:number; onMeetingOffset:(minutes:number)=>void;
  error:string; draft:MissionDraft; mode:"local"|"openai"|null; publishing:boolean; onBack:()=>void; onPublish:()=>void;
}) {
  const needsReview=draft.safetyLevel==="review";
  const validLocation=draft.location.trim().length>=3;
  return <div className="mx-auto max-w-3xl">
    <button disabled={publishing} onClick={onBack} className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-muted hover:text-purple"><ArrowLeft className="size-4"/>Edit my request</button>
    <h1 className="text-3xl font-bold tracking-tight">Ready to ask your neighbours?</h1>
    <div className="paper-card mt-5 rounded-2xl p-5 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-wider text-purple">{categoryMeta[draft.category].label} · {draft.durationMinutes} min · {draft.language}</p>
      <h2 className="mt-2 text-2xl font-bold leading-tight tracking-tight">{draft.title}</h2>
      <p className="mt-3 text-sm leading-6 text-muted">{draft.summary}</p>
      <details className="group mt-5 border-y border-ink/10 py-1">
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 py-2 [&::-webkit-details-marker]:hidden">
          <MapPin className="size-5 shrink-0 text-purple"/><span className="min-w-0 flex-1"><span className="block text-sm font-bold">Meeting details <span className="font-normal text-muted">· optional edits</span></span><span className="mt-1 block text-xs leading-5 text-muted">{validLocation?draft.location:"Choose a public meeting point"} · {meetingOffset===1440?"Tomorrow":meetingOffset===60?"In about an hour":"In about 15 minutes"}</span></span><ChevronDown className="size-4 shrink-0 text-purple transition-transform group-open:rotate-180"/>
        </summary>
        <MeetingSettings location={draft.location} onLocation={onLocation} minutes={meetingOffset} onMinutes={onMeetingOffset} disabled={publishing}/>
      </details>
      {needsReview?<div role="alert" className="mt-4 flex gap-3 rounded-xl border border-coral/25 bg-coral/10 p-4 text-[#92372d]"><AlertCircle className="size-5 shrink-0"/><div><p className="text-sm font-bold">Organiser review needed</p><p className="mt-1 text-sm leading-6">{draft.safetyNote}</p></div></div>:<details className="mt-3 text-xs text-muted"><summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden"><ShieldCheck className="size-4 shrink-0 text-kaki-green"/>Meet in public. Keep personal details private.<ChevronDown className="ml-auto size-4 shrink-0"/></summary><p className="pb-2 leading-6">{draft.safetyNote}</p></details>}
      {!validLocation?<p role="alert" className="mt-3 text-sm text-coral">Open meeting details and enter a public place.</p>:null}
      {error?<p role="alert" className="mt-3 text-sm text-coral">{error}</p>:null}
      <Button onClick={onPublish} disabled={publishing||!validLocation} className="mt-3 min-h-14 w-full text-base">{publishing?<LoaderCircle className="size-5 animate-spin"/>:null}{publishing?"Publishing…":needsReview?"Send to organiser":"Find my Kaki"}<ArrowRight className="size-5"/></Button>
      <details className="group mt-4 border-t border-ink/10 pt-2">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-bold text-muted [&::-webkit-details-marker]:hidden">Preview the helper guide<ChevronDown className="ml-auto size-4 transition-transform group-open:rotate-180"/></summary>
        <p className="py-2 text-xs leading-5 text-muted">Use your selected meeting point above if the AI guide suggests a different place.</p>
        <ol className="space-y-3 py-3">{draft.guide.map((step,index)=><li key={index} className="flex gap-3 text-sm leading-6"><span className="font-bold text-purple">{index+1}.</span>{step}</li>)}</ol>
      </details>
    </div>
    <p className="mt-3 text-center text-[11px] text-muted">Prepared with {mode==="openai"?"OpenAI":"KAKI’s offline-safe rules"} · You decide what to share</p>
  </div>;
}
