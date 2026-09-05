"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, MessageCircle, Flower2, MapPin, Navigation, Send, ShieldCheck, Sparkles } from "lucide-react";
import { ChatDialog } from "@/components/chat-dialog";
import { Avatar } from "@/components/avatar";
import { CategoryIcon, categoryMeta } from "@/components/category-icon";
import { useMissions } from "@/components/mission-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import { JourneyMap } from "@/components/journey-map";
import { MatchReveal } from "@/components/match-reveal";
import { BloomCelebration } from "@/components/bloom-celebration";
import { createClient } from "@/lib/supabase/client";
import type { CommunityMessage, MissionPresence } from "@/types/kaki";

export function MissionDetail({ missionId }: { missionId: string }) {
  const { profile, missions, acceptMission, startMission, completeMission, syncError } = useMissions();
  const mission = missions.find(item => item.id === missionId);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [presence, setPresence] = useState<MissionPresence[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [coordinationError, setCoordinationError] = useState("");
  const [story, setStory] = useState("");
  const [showComplete, setShowComplete] = useState(false);
  const messageInput = useRef<HTMLInputElement>(null);
  const sequence = useRef(0);
  const connected = Boolean(mission?.helper && [mission.requester.id,mission.helper.id].includes(profile.id));
  const refreshCoordination = useCallback(async () => {
    const id = ++sequence.current;
    const responses = await Promise.all([fetch(`/api/missions/${missionId}/messages`,{cache:"no-store"}),fetch(`/api/missions/${missionId}/presence`,{cache:"no-store"})]);
    if (responses.some(r=>!r.ok)) throw new Error("Could not sync chat and check-ins. Retrying…");
    const [chat,arrival] = await Promise.all(responses.map(r=>r.json()));
    if(id===sequence.current){setMessages(chat.messages);setPresence(arrival.presence);setCoordinationError("");}
  },[missionId]);
  useEffect(()=>{
    if(!connected)return;
    const sync=()=>{if(document.visibilityState==="visible")void refreshCoordination().catch(error=>setCoordinationError(error.message));};
    sync();
    const supabase=createClient();
    const channel=supabase.channel(`coordination-${missionId}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"mission_presence",filter:`mission_id=eq.${missionId}`},sync)
      .on("postgres_changes",{event:"*",schema:"public",table:"mission_messages",filter:`mission_id=eq.${missionId}`},sync).subscribe();
    const sequenceRef=sequence;
    const timer=window.setInterval(sync,4000);window.addEventListener("focus",sync);
    return()=>{++sequenceRef.current;window.clearInterval(timer);window.removeEventListener("focus",sync);void supabase.removeChannel(channel);};
  },[connected,missionId,refreshCoordination]);

  if(!mission)return <div className="paper-card mx-auto max-w-xl rounded-[32px] p-10 text-center"><h1 className="text-2xl font-black">This mission isn’t available</h1><p className="mt-3 text-muted">Another neighbour may have claimed it, or it is private.</p><ButtonLink href="/discover" className="mt-6">Find another moment</ButtonLink></div>;
  const isRequester=mission.requester.id===profile.id;
  const isHelper=mission.helper?.id===profile.id;
  const mine=presence.find(p=>p.user_id===profile.id);
  const bothHere=[mission.requester.id,mission.helper?.id].every(id=>presence.some(p=>p.user_id===id&&p.arrived_at));
  const shared=[mission.requester.id,mission.helper?.id].every(id=>presence.some(p=>p.user_id===id&&p.consent_to_share));
  const active=["matched","in_progress"].includes(mission.status);
  const statusLabel={draft:"Draft",open:"Looking for a Kaki",matched:"Kaki found",in_progress:"Happening now",completed:"A Bloom is born",cancelled:"Cancelled",flagged:"Needs organiser review"}[mission.status];
  async function act(action:()=>Promise<void>){setBusy(true);setError("");try{await action();return true;}catch(error){setError(error instanceof Error?error.message:"Could not save. Try again.");return false;}finally{setBusy(false);}}
  async function updatePresence(action:"on_way"|"check_in"|"consent",consentToShare?:boolean){
    const response=await fetch(`/api/missions/${missionId}/presence`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,consentToShare})});
    if(!response.ok){const payload=await response.json();throw new Error(payload.error);}
    await refreshCoordination();
  }
  async function send(){const body=message.trim();if(!body||busy)return;await act(async()=>{
    const response=await fetch(`/api/missions/${missionId}/messages`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({body})});
    const payload=await response.json();if(!response.ok)throw new Error(payload.error||"Could not send.");setMessage("");await refreshCoordination();
  });}
  return <div className="mx-auto max-w-6xl">
    <Link href="/discover" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-muted"><ArrowLeft className="size-4" />All missions</Link>
    {syncError||coordinationError?<p role="status" className="mb-4 rounded-2xl bg-sun/30 p-4 text-sm">{syncError||coordinationError}</p>:null}
      <section className="grain overflow-hidden rounded-[36px] bg-ink p-5 text-white sm:p-7"><div className="flex items-center justify-between gap-3"><CategoryIcon category={mission.category} className="size-12" /><span className="rounded-full bg-white/10 px-3 py-2 text-xs font-black">{statusLabel}</span></div><p className="mt-4 text-xs font-black uppercase tracking-[.17em] text-sun">{categoryMeta[mission.category].label}</p><h1 className="mt-3 text-2xl font-black leading-[1.05] tracking-[-.05em] sm:text-4xl">{mission.title}</h1><p className="mt-4 leading-6 text-white/70">{mission.summary}</p><p className="mt-4 text-sm font-bold text-sun">{mission.durationMinutes} minutes · {mission.language}</p><p className="mt-3 flex items-center gap-2 text-sm"><MapPin className="size-4" />{mission.location}</p><p className="mt-4 text-xs text-white/60">Requested: {new Intl.DateTimeFormat("en-SG",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Singapore"}).format(new Date(mission.scheduledAt))} SGT · Confirm in chat</p></section>
    <div className="mt-5 grid items-start gap-5 lg:grid-cols-[.8fr_1.2fr]"><aside className="space-y-4">
      <section className="paper-card rounded-[32px] p-6"><p className="text-xs font-black uppercase tracking-[.15em] text-purple">Your neighbours</p><div className="mt-3 space-y-3">{[mission.requester,...(mission.helper?[mission.helper]:[])].map(person=><div key={person.id} className="flex items-center gap-3"><Avatar profile={person} size="md"/><div><p className="font-black">{person.name}{person.id===profile.id?" (you)":""}</p><p className="mt-1 text-xs text-muted">{person.id===mission.requester.id?"Asking for help":"Stepping forward"} · {person.verified?"Verified":"Not identity-verified"}</p></div>{presence.some(p=>p.user_id===person.id&&p.arrived_at)?<Check aria-label="Checked in" className="ml-auto size-5 text-kaki-green"/>:null}</div>)}</div></section>
      <section className="paper-card rounded-[32px] p-6"><h2 className="text-xl font-black tracking-tight">{mission.status==="open"?isRequester?"Your request is live.":"Be someone’s Kaki.":"One step at a time."}</h2><p className="mt-3 text-sm leading-7 text-muted">{mission.status==="open"?isRequester?"Keep this page open. It updates when someone steps forward.":"Only accept if you feel comfortable with the task. Confirm the details together.":mission.status==="matched"?"Say hello, agree where to meet, then each tap ‘I’m here’. The helper can start once both have checked in.":mission.status==="in_progress"?"Follow the guide together. Finish when you’re both happy with the moment.":mission.status==="flagged"?"This request is held out of the community board. Approach an organiser; this is not an emergency response service.":"Thank you for showing up for your neighbourhood."}</p>
        {connected?<Button variant="secondary" className="mt-4 w-full" onClick={()=>setChatOpen(true)} aria-haspopup="dialog"><MessageCircle className="size-5"/>Open chat{messages.length ? ` · ${messages.length} messages` : ""}</Button>:null}
        {error?<p role="alert" className="mt-4 rounded-2xl bg-coral/10 p-3 text-sm text-coral">{error}</p>:null}
        {mission.status==="open"&&!isRequester?<Button className="mt-5 w-full" disabled={busy} onClick={()=>void act(()=>acceptMission(missionId))}>I’ve got this! <Sparkles className="size-4"/></Button>:null}
        {connected&&active?<div className="mt-5 space-y-3">{mission.status==="matched"&&!mine?.arrived_at?<><Button variant="secondary" className="w-full" disabled={busy||Boolean(mine?.on_way_at)} onClick={()=>void act(()=>updatePresence("on_way"))}><Navigation className="size-4"/>{mine?.on_way_at?"On my way ✓":"I’m on my way"}</Button><Button className="w-full" disabled={busy} onClick={()=>void act(()=>updatePresence("check_in"))}><MapPin className="size-4"/>I’m here</Button></>:mine?.arrived_at?<p className="rounded-xl bg-mint/60 p-3 text-center text-sm font-bold text-kaki-green">You’re checked in ✓</p>:null}
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-ink/5 p-4 text-xs leading-6"><input type="checkbox" className="mt-1 size-4 shrink-0 accent-purple" checked={mine?.consent_to_share??false} disabled={busy} onChange={e=>void act(()=>updatePresence("consent",e.target.checked))}/><span>I agree to share our short story and first names on the public Bloom wall. Optional; both people must agree.</span></label>
          {isHelper&&mission.status==="matched"?<Button className="w-full" disabled={busy||!bothHere} onClick={()=>void act(()=>startMission(missionId))}>{bothHere?"Let’s start together":"Waiting for both check-ins"}</Button>:null}
          {isHelper&&mission.status==="in_progress"?<Button className="w-full" disabled={busy} onClick={()=>setShowComplete(v=>!v)}><Flower2 className="size-5"/>Complete together</Button>:null}
        </div>:null}
        {showComplete&&mission.status==="in_progress"?<div className="mt-5 border-t border-ink/10 pt-5"><label className="text-sm font-black" htmlFor="bloom-story">One moment to remember (optional)</label><textarea id="bloom-story" value={story} onChange={e=>setStory(e.target.value)} maxLength={500} rows={4} className="mt-3 w-full rounded-2xl border border-ink/10 bg-white p-4 text-sm" placeholder="What did you learn together? Avoid private details."/><p className="mt-2 text-xs leading-5 text-muted">Ask your neighbour before finishing. {shared?"Both have opted into public sharing.":"This story stays off the public wall."}</p><Button className="mt-4 w-full" disabled={busy} onClick={()=>void act(()=>completeMission(missionId,story,mine?.consent_to_share??false)).then(ok=>{if(ok)setShowComplete(false);})}>{busy?"Growing…":"Grow our Bloom"}</Button></div>:null}
      </section>
    </aside><div className="min-w-0 space-y-5">
      {mission.status==="completed"?<BloomCelebration shared={shared}/>:null}
      {connected?<JourneyMap mission={mission} presence={presence}/>:null}
      <details className="paper-card group rounded-[32px] p-5"><summary className="flex cursor-pointer list-none items-center gap-2 text-lg font-black tracking-tight [&::-webkit-details-marker]:hidden"><Sparkles className="size-5 text-purple" />Your Kaki guide<ChevronDown className="ml-auto size-5 transition-transform group-open:rotate-180" /></summary><ol className="mt-6 space-y-5">{mission.guide.map((step,index)=><li key={index} className="flex items-start gap-3 text-sm leading-7 text-muted"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-purple/10 font-black text-purple">{index+1}</span>{step}</li>)}</ol><p className="mt-6 flex gap-3 rounded-2xl bg-mint/60 p-4 text-xs leading-6 text-[#17654d]"><ShieldCheck className="mt-1 size-4 shrink-0" />Meet in an agreed public place. Don’t share passwords, payment details or a home address. For concerns, approach the event organiser in person.</p></details>
      {connected?<MatchReveal missionId={missionId} onIcebreaker={text=>{setMessage(text);setChatOpen(true);}}/>:null}
</div></div>
      {connected?<ChatDialog open={chatOpen} onClose={()=>setChatOpen(false)}><section className="paper-card rounded-[32px] p-6" id="mission-chat"><h2 className="text-2xl font-black tracking-tight">Say hello 👋</h2><p className="mt-1 text-xs text-muted">Private to participants and organisers · updates automatically</p><div className="mt-5 max-h-80 space-y-3 overflow-y-auto" aria-live="polite" aria-relevant="additions">{messages.length?messages.map(item=><div key={item.id} className={`max-w-[90%] rounded-2xl p-4 text-sm leading-6 ${item.sender.id===profile.id?"ml-auto bg-purple text-white":"bg-ink/5"}`}><p className="whitespace-pre-wrap break-words">{item.body}</p><p className="mt-1 text-[10px] opacity-60">{item.sender.id===profile.id?"You":item.sender.name}</p></div>):<p className="py-6 text-center text-sm text-muted">Confirm your meeting point and say what you can help with.</p>}</div><form className="mt-5 flex gap-2" onSubmit={e=>{e.preventDefault();void send();}}><input ref={messageInput} aria-label="Message your neighbour" maxLength={1000} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Say hello, Kaki…" className="min-w-0 flex-1 rounded-full border border-ink/15 bg-white px-4 text-sm"/><Button type="submit" aria-label="Send message" disabled={busy||!message.trim()} className="size-12 p-0"><Send className="size-4"/></Button></form>{error?<p role="alert" className="mt-3 text-sm text-coral">{error}</p>:null}</section></ChatDialog>:null}

  </div>;
}
