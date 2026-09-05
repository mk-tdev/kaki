"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Flower2, HandHeart, MessageCircle, Mic, Sparkles } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { MissionCard } from "@/components/mission-card";
import { SectionHeading } from "@/components/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { profiles } from "@/data/demo";
import { useMissions } from "@/components/mission-provider";

export default function HomePage() {
  const { missions, impact } = useMissions();
  const activeMission = missions.find((mission) => mission.status === "matched" || mission.status === "in_progress");
  return (
    <div className="space-y-10">
      <section className="grid items-stretch gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <div className="grain relative overflow-hidden rounded-[36px] bg-purple p-7 text-white shadow-[0_24px_70px_rgba(109,85,217,.24)] sm:p-10">
          <div className="relative z-10 max-w-xl"><div className="mb-5 flex items-center gap-3"><Avatar profile={profiles[1]} /><div><p className="text-sm text-white/60">Saturday, 5 September</p><p className="font-black">Good morning, Arjun</p></div></div><h1 className="text-balance text-4xl font-black leading-[1.02] tracking-[-.06em] sm:text-5xl">Who could use a Kaki today?</h1><p className="mt-4 max-w-lg text-lg leading-7 text-white/72">Three small missions nearby match your skills and language.</p><ButtonLink href="/discover" variant="sun" className="mt-7">Find a mission <ArrowRight className="size-4" /></ButtonLink></div>
          <div className="absolute -bottom-14 -right-10 size-64 rounded-full border-[42px] border-white/8" /><div className="absolute right-28 top-8 size-16 rounded-full bg-sun/80 blur-sm" />
        </div>
        <div className="paper-card rounded-[36px] p-7"><p className="text-xs font-black uppercase tracking-[.16em] text-purple">Pek Kio this month</p><p className="mt-5 text-6xl font-black tracking-[-.07em] text-ink">{impact.neighbourMoments}</p><p className="mt-1 text-lg font-bold text-muted">neighbour moments</p><div className="mt-7 h-3 overflow-hidden rounded-full bg-ink/6"><div className="h-full w-[72%] rounded-full bg-gradient-to-r from-purple via-coral to-sun" /></div><p className="mt-3 text-sm text-muted"><strong className="text-ink">72%</strong> towards our September goal</p><Link href="/bloom" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-purple"><Flower2 className="size-4" />See the Kampung Bloom</Link></div>
      </section>

      <section><SectionHeading eyebrow="Quick actions" title="What can we do together?" /><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Action href="/ask" icon={<Mic />} title="Ask for help" text="Speak naturally" tone="bg-purple text-white" /><Action href="/discover" icon={<HandHeart />} title="Offer my time" text="Find a small mission" tone="bg-sun text-ink" /><Action href={activeMission ? `/missions/${activeMission.id}` : "/discover"} icon={<MessageCircle />} title="My Kaki" text={activeMission ? "Mission ready" : "No active mission"} tone="bg-mint text-[#17654d]" /><Action href="/bloom" icon={<Sparkles />} title="Share a moment" text="Grow the mural" tone="bg-[#ffd8d2] text-[#a83d31]" /></div></section>

      {activeMission ? <section><SectionHeading eyebrow="Up next" title="Your next neighbour moment"><Link href="/discover" className="text-sm font-black text-purple">All missions →</Link></SectionHeading><div className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><MissionCard mission={activeMission} /><div className="grain flex min-h-64 flex-col justify-between overflow-hidden rounded-[32px] bg-ink p-7 text-white"><div><div className="flex items-center gap-2 text-sun"><CalendarDays className="size-5" /><span className="text-xs font-black uppercase tracking-[.15em]">Ready when you are</span></div><h3 className="mt-5 max-w-lg text-3xl font-black tracking-[-.05em]">Your three-step Kaki guide is ready.</h3><p className="mt-3 max-w-xl leading-7 text-white/65">No expertise needed—just patience, curiosity and fifteen minutes.</p></div><ButtonLink href={`/missions/${activeMission.id}`} variant="secondary" className="mt-8 w-fit border-white/15 bg-white/10 text-white hover:bg-white/15">Open mission guide <ArrowRight className="size-4" /></ButtonLink></div></div></section> : null}

      <section><SectionHeading eyebrow="Near you" title="Fresh missions" /><div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{missions.filter((mission) => mission.status === "open").slice(0, 3).map((mission) => <MissionCard key={mission.id} mission={mission} />)}</div></section>
    </div>
  );
}

function Action({ href, icon, title, text, tone }: { href: string; icon: React.ReactNode; title: string; text: string; tone: string }) { return <Link href={href} className="paper-card group flex items-center gap-4 rounded-[26px] p-4 transition hover:-translate-y-1"><span className={`grid size-13 shrink-0 place-items-center rounded-2xl ${tone}`}>{icon}</span><span><strong className="block text-base font-black text-ink">{title}</strong><span className="text-sm text-muted">{text}</span></span><ArrowRight className="ml-auto size-4 text-muted transition group-hover:translate-x-1 group-hover:text-purple" /></Link>; }
