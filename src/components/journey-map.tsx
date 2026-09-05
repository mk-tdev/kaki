"use client";
import { Check, Flower2, MapPin, Navigation, Users } from "lucide-react";
import type { Mission, MissionPresence } from "@/types/kaki";

export function JourneyMap({ mission, presence }: { mission: Mission; presence: MissionPresence[] }) {
  const helper = presence.find(p => p.user_id === mission.helper?.id);
  const requester = presence.find(p => p.user_id === mission.requester.id);
  const arrived = Boolean(helper?.arrived_at && requester?.arrived_at);
  const completed = mission.status === "completed";
  const stage = completed ? 4 : mission.status === "in_progress" ? 3 : arrived ? 2 : helper?.on_way_at ? 1 : 0;
  const labels = ["Kaki found", "On the way", "Both checked in", "Sharing a moment", "A Bloom is born"];
  return <section className="overflow-hidden rounded-[32px] border border-purple/10 bg-[#ede9fb]">
    <div className="flex items-center justify-between gap-3 px-6 pt-6"><div><p className="text-xs font-black uppercase tracking-[.15em] text-purple">Your Kaki journey</p><h2 className="mt-1 text-2xl font-black tracking-tight" aria-live="polite">{labels[stage]}</h2></div><span className="rounded-full bg-white/80 px-3 py-2 text-[10px] font-bold text-purple">Illustration · not GPS</span></div>
    <div className="relative mx-4 mt-4 h-64 overflow-hidden rounded-[24px] sm:h-80" aria-label={`Illustrated meeting scene. ${labels[stage]}. Meeting point: ${mission.location}`} role="img">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#fffdf7,transparent_70%)]" />
      <div className="absolute inset-x-[7%] top-[20%] h-[67%] rounded-[35%] bg-[#c4e7cf] shadow-[0_14px_0_#9cc9b0,0_25px_35px_#6d55d920]" />
      <svg viewBox="0 0 600 300" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path d="M85 217 C175 290 168 125 290 182 S425 220 476 124" fill="none" stroke="#fffdf7" strokeWidth="29" strokeLinecap="round" />
        <path d="M85 217 C175 290 168 125 290 182 S425 220 476 124" fill="none" stroke="#b7acda" strokeWidth="2" strokeDasharray="5 9" />
        {[{x:110,y:80,c:"#f2ba92"},{x:240,y:58,c:"#ada0df"},{x:405,y:65,c:"#edcd72"}].map(({x,y,c}) => <g key={x}><path d={`M${x} ${y} l48 -22 39 22 -48 22z`} fill="#fffdf7" /><path d={`M${x} ${y} l48 22 v62 l-48 -22z`} fill={c}/><path d={`M${x+48} ${y+22} l39 -22 v62 l-39 22z`} fill={c} opacity=".7"/>{[0,1,2].map(i=><path key={i} d={`M${x+10} ${y+15+i*16} l12 5 v8 l-12 -5z M${x+29} ${y+23+i*16} l10 4 v8 l-10 -4z`} fill="#fffdf7" opacity=".8"/>)}</g>)}
        {[{x:67,y:149},{x:346,y:105},{x:529,y:208},{x:309,y:250}].map(({x,y}) => <g key={x}><ellipse cx={x} cy={y+22} rx="19" ry="7" fill="#3d906f" opacity=".16"/><path d={`M${x} ${y} v23`} stroke="#917554" strokeWidth="6"/><circle cx={x} cy={y-6} r="18" fill="#60a583"/><circle cx={x-7} cy={y-11} r="10" fill="#86b998"/></g>)}
      </svg>
      <div className="absolute left-[72%] top-[36%] -translate-x-1/2 rounded-2xl bg-ink px-3 py-2 text-white shadow-lg"><MapPin className="mx-auto size-5 text-sun" /><span className="mt-1 block text-[9px] font-black">MEET HERE</span></div>
      <div className={`journey-kaki absolute top-[66%] grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-purple text-white shadow-xl ${stage === 1 ? "journey-walking" : ""}`} style={{ left: stage >= 2 || helper?.arrived_at ? "69%" : stage === 1 ? "45%" : "22%" }}><Users className="size-6" /></div>
      <div className="absolute left-[80%] top-[63%] grid size-10 -translate-x-1/2 place-items-center rounded-full border-4 border-white bg-coral text-white shadow-lg">{requester?.arrived_at ? <Check className="size-5" /> : <MapPin className="size-5" />}</div>
      {completed ? <div className="bloom-pop absolute left-1/2 top-[30%] grid size-24 -translate-x-1/2 place-items-center rounded-full bg-sun shadow-xl"><Flower2 className="size-14 text-purple" /></div> : null}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-[10px] font-bold text-purple"><Navigation className="size-3" />Pek Kio-inspired scene · no location collected</div>
    </div>
    <div className="px-6 pb-6 pt-4"><p className="text-sm font-bold">{mission.location}</p><p className="mt-1 text-xs leading-5 text-muted">Confirm the exact public meeting point in chat. Avatar movement is decorative; status changes come from participant actions.</p><ol className="mt-4 flex gap-1.5" aria-label="Journey progress">{labels.map((label,index) => <li key={label} className={`h-1.5 flex-1 rounded-full ${index <= stage ? "bg-purple" : "bg-purple/15"}`} aria-label={`${label}${index <= stage ? ", reached" : ", pending"}`} />)}</ol></div>
  </section>;
}
