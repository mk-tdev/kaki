"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Check, CheckCircle2, Clock3, Flower2, Languages, MapPin, Send, ShieldCheck, Sparkles, UserRoundCheck } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { CategoryIcon, categoryMeta } from "@/components/category-icon";
import { useMissions } from "@/components/mission-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import type { CommunityMessage } from "@/types/kaki";

export function MissionDetail({ missionId }: { missionId: string }) {
  const { profile, missions, acceptMission, startMission, completeMission } = useMissions();
  const mission = missions.find((item) => item.id === missionId);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [story, setStory] = useState("");
  const [consentToShare, setConsentToShare] = useState(true);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/missions/${missionId}/messages`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = await response.json() as { messages?: CommunityMessage[] };
        if (payload.messages) setMessages(payload.messages);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [missionId]);

  if (!mission) return <div className="paper-card mx-auto max-w-xl rounded-[32px] p-10 text-center"><h1 className="text-2xl font-black">Mission not found</h1><p className="mt-2 text-muted">It may have been removed or may not be visible to your account.</p><ButtonLink href="/discover" className="mt-6">Explore missions</ButtonLink></div>;
  const meta = categoryMeta[mission.category];
  const isRequester = mission.requester.id === profile.id;
  const isAssignedHelper = mission.helper?.id === profile.id;
  const canClaim = mission.status === "open" && !isRequester;
  const canStart = mission.status === "matched" && isAssignedHelper;
  const canComplete = mission.status === "in_progress" && isAssignedHelper;

  async function sendMessage() {
    const value = message.trim();
    if (!value) return;
    setSending(true); setActionError("");
    try {
      const response = await fetch(`/api/missions/${missionId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: value }) });
      const payload = await response.json() as { message?: CommunityMessage; error?: string };
      if (!response.ok || !payload.message) throw new Error(payload.error || "Could not send your message.");
      setMessages((current) => [...current, payload.message!]);
      setMessage("");
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Could not send your message.");
    } finally {
      setSending(false);
    }
  }

  async function runAction(action: () => Promise<void>) {
    setActionError("");
    try { await action(); } catch (caught) { setActionError(caught instanceof Error ? caught.message : "Could not update this mission."); }
  }

  async function finish() {
    await runAction(() => completeMission(missionId, story.trim() || undefined, consentToShare));
    setShowComplete(false);
  }

  return <div className="mx-auto max-w-6xl"><Link href="/discover" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-muted hover:text-purple"><ArrowLeft className="size-4" />Back to missions</Link><div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]"><div className="space-y-6"><section className="grain overflow-hidden rounded-[36px] bg-ink text-white shadow-[0_24px_70px_rgba(33,29,53,.2)]"><div className="p-7 sm:p-9"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><CategoryIcon category={mission.category} className="size-13" /><div><p className="text-xs font-black uppercase tracking-[.15em] text-sun">{meta.label}</p><p className="mt-1 text-sm text-white/55">Mission #{mission.id.slice(-6).toUpperCase()}</p></div></div><Status status={mission.status} /></div><h1 className="mt-7 max-w-2xl text-balance text-4xl font-black leading-[1.02] tracking-[-.06em] sm:text-5xl">{mission.title}</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-white/67">{mission.summary}</p><div className="mt-7 grid gap-3 sm:grid-cols-3"><DarkDetail icon={<CalendarDays />} label="When" value={new Intl.DateTimeFormat("en-SG", { weekday: "long", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(mission.scheduledAt))} /><DarkDetail icon={<MapPin />} label="Where" value={mission.location} /><DarkDetail icon={<Languages />} label="Language" value={mission.language} /></div></div></section>

        {mission.status === "completed" ? <section className="rounded-[32px] bg-mint p-7 text-[#17654d]"><div className="flex items-start gap-4"><span className="grid size-13 shrink-0 place-items-center rounded-full bg-white/70"><Flower2 className="size-6" /></span><div><p className="text-xs font-black uppercase tracking-[.15em]">Neighbour moment complete</p><h2 className="mt-2 text-2xl font-black tracking-[-.04em]">Pek Kio grew a little closer.</h2><p className="mt-2 leading-7 opacity-80">This moment is now part of the living Kampung Bloom.</p><ButtonLink href="/bloom" variant="secondary" className="mt-5 border-[#17654d]/15 bg-white/60 text-[#17654d]">See your bloom <Flower2 className="size-4" /></ButtonLink></div></div></section> : null}

        <section className="paper-card rounded-[32px] p-6 sm:p-8"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-purple/10 text-purple"><Sparkles className="size-5" /></span><div><p className="text-xs font-black uppercase tracking-[.14em] text-purple">Your Kaki guide</p><h2 className="text-2xl font-black tracking-[-.04em]">Three easy steps</h2></div></div><ol className="mt-7 space-y-5">{mission.guide.map((step, index) => <li key={step} className="flex gap-4"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-sm font-black text-white">{index + 1}</span><div className="border-b border-ink/8 pb-5 text-base leading-7 text-muted last:border-0"><p>{step}</p>{index === 0 && mission.accessibilityNotes ? <p className="mt-2 rounded-xl bg-sun/20 px-3 py-2 text-sm font-bold text-[#6c5313]">Tip: {mission.accessibilityNotes}</p> : null}</div></li>)}</ol><div className="mt-3 flex items-start gap-3 rounded-2xl bg-mint/55 p-4 text-[#17654d]"><ShieldCheck className="mt-0.5 size-5 shrink-0" /><div><p className="text-sm font-black">Keep it comfortable</p><p className="mt-1 text-sm leading-6 opacity-80">Stay at the agreed public location and keep the mission within its original scope. An organiser is one tap away.</p></div></div></section>

        {mission.helper ? <section className="paper-card rounded-[32px] p-6 sm:p-8"><div className="flex items-center justify-between"><h2 className="text-2xl font-black tracking-[-.04em]">Mission chat</h2><span className="flex items-center gap-1.5 text-xs font-bold text-kaki-green"><ShieldCheck className="size-4" />Participants only</span></div><div className="mt-6 space-y-3">{messages.length ? messages.map((item) => { const mine = item.sender.id === profile.id; return <div key={item.id} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${mine ? "ml-auto rounded-br-sm bg-purple text-white" : "rounded-bl-sm bg-ink/5 text-ink"}`}><p>{item.body}</p><p className={`mt-1 text-[10px] font-bold ${mine ? "text-white/55" : "text-muted"}`}>{mine ? "You" : item.sender.name}</p></div>; }) : <div className="rounded-2xl bg-ink/[.035] px-4 py-6 text-center text-sm text-muted">No messages yet. Say hello and confirm the meeting details.</div>}</div><div className="mt-5 flex gap-2"><input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void sendMessage(); }} placeholder="Write a friendly message…" className="h-12 min-w-0 flex-1 rounded-full border border-ink/10 bg-white px-4 text-sm" /><Button onClick={() => void sendMessage()} disabled={sending} aria-label="Send message" className="size-12 min-h-0 p-0"><Send className="size-4" /></Button></div></section> : null}
      </div>

      <aside className="space-y-5"><section className="paper-card rounded-[32px] p-6"><p className="text-xs font-black uppercase tracking-[.14em] text-purple">Neighbour asking</p><div className="mt-5 flex items-center gap-4"><Avatar profile={mission.requester} size="lg" /><div><h2 className="text-xl font-black">{mission.requester.name}</h2><p className="mt-1 text-sm text-muted">Verified Pek Kio neighbour</p><div className="mt-2 flex gap-1.5">{mission.requester.languages.map((item) => <span key={item} className="rounded-full bg-ink/5 px-2 py-1 text-[11px] font-bold text-muted">{item}</span>)}</div></div></div><p className="mt-5 text-sm leading-6 text-muted">{mission.requester.bio}</p><div className="mt-5 border-t border-ink/8 pt-5"><p className="text-xs font-black uppercase tracking-[.14em] text-muted">Can share too</p><p className="mt-2 text-sm font-bold text-ink">{mission.requester.skills.join(" · ")}</p></div></section>
        {mission.helper ? <section className="rounded-[32px] bg-purple p-6 text-white"><p className="text-xs font-black uppercase tracking-[.14em] text-sun">Your match</p><div className="mt-5 flex items-center gap-4"><Avatar profile={mission.helper} size="lg" /><div><h2 className="text-xl font-black">{mission.helper.name}</h2><p className="mt-1 text-sm text-white/60">Verified Kaki</p></div></div><p className="mt-5 text-sm leading-6 text-white/70">Matched for language, availability and digital confidence.</p></section> : null}
        <section className="paper-card sticky top-24 rounded-[32px] p-6"><h2 className="text-xl font-black">{isRequester ? "Your mission" : "Ready for this mission?"}</h2><p className="mt-2 text-sm leading-6 text-muted">{mission.status === "open" ? isRequester ? "Your request is live. We’ll show it here when a neighbour steps forward." : "Accept it and we’ll introduce you both." : mission.status === "matched" ? canStart ? "When you meet, start the guide together." : "A Kaki has been matched. The assigned helper will start the guide when you meet." : mission.status === "in_progress" ? canComplete ? "Finish when both of you are happy with the moment." : "This neighbour moment is happening now. Your Kaki will wrap it up when you finish." : "This mission is safely wrapped up."}</p>{actionError ? <p className="mt-3 rounded-xl bg-coral/10 p-3 text-xs font-bold text-coral">{actionError}</p> : null}{canClaim ? <Button onClick={() => void runAction(() => acceptMission(mission.id))} className="mt-5 w-full"><UserRoundCheck className="size-5" />I’ve got this!</Button> : null}{canStart ? <Button onClick={() => void runAction(() => startMission(mission.id))} className="mt-5 w-full"><Clock3 className="size-5" />Start mission</Button> : null}{canComplete ? <Button onClick={() => setShowComplete(true)} className="mt-5 w-full"><CheckCircle2 className="size-5" />Complete together</Button> : null}{mission.status === "completed" ? <ButtonLink href="/bloom" variant="secondary" className="mt-5 w-full"><Flower2 className="size-5" />Visit Kampung Bloom</ButtonLink> : null}<button className="mt-4 w-full text-center text-xs font-bold text-muted hover:text-coral">I need organiser support</button></section>
      </aside></div>

      {showComplete ? <div className="fixed inset-0 z-[70] grid place-items-end bg-ink/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="complete-title"><div className="w-full max-w-lg rounded-t-[36px] bg-paper p-7 shadow-2xl sm:rounded-[36px]"><span className="mx-auto grid size-16 place-items-center rounded-full bg-mint text-[#17654d]"><Flower2 className="size-8" /></span><h2 id="complete-title" className="mt-5 text-center text-3xl font-black tracking-[-.05em]">How did it go?</h2><p className="mt-2 text-center text-muted">Capture one small moment for the community bloom.</p><textarea value={story} onChange={(event) => setStory(event.target.value)} rows={4} placeholder="For example: We completed the task and learned something from each other…" className="mt-6 w-full resize-none rounded-2xl border border-ink/10 bg-white p-4 text-sm leading-6" /><label className="mt-4 flex items-start gap-3 rounded-2xl bg-ink/[.035] p-4 text-sm leading-6 text-muted"><input type="checkbox" checked={consentToShare} onChange={(event) => setConsentToShare(event.target.checked)} className="mt-1 size-4 accent-purple" /><span>Both participants are happy to share this short, first-name-only story on the public bloom wall.</span></label><div className="mt-5 grid grid-cols-2 gap-3"><Button variant="secondary" onClick={() => setShowComplete(false)}>Not yet</Button><Button onClick={() => void finish()}><Check className="size-4" />Grow our bloom</Button></div></div></div> : null}
    </div>;
}

function Status({ status }: { status: string }) { const label = status === "open" ? "Looking for a Kaki" : status === "matched" ? "Kaki found" : status === "in_progress" ? "Happening now" : status === "completed" ? "Completed" : "Organiser review"; return <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-black text-white"><span className="mr-2 inline-block size-2 rounded-full bg-sun" />{label}</span>; }
function DarkDetail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-2xl bg-white/8 p-4"><span className="text-sun">{icon}</span><p className="mt-3 text-[10px] font-black uppercase tracking-[.15em] text-white/45">{label}</p><p className="mt-1 text-sm font-bold leading-5 text-white">{value}</p></div>; }
