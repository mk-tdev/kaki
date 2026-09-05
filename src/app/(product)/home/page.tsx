"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Flower2, HandHeart, MessageCircle, Mic, Sparkles } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { MissionCard } from "@/components/mission-card";
import { SectionHeading } from "@/components/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { useMissions } from "@/components/mission-provider";

export default function HomePage() {
  const { profile, missions, impact } = useMissions();
  const activeMission = missions.find((mission) => mission.status === "matched" || mission.status === "in_progress");
  const openMissions = missions.filter((mission) => mission.status === "open");
  const today = new Intl.DateTimeFormat("en-SG", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return (
    <div className="space-y-10">
      <section className="grid items-stretch gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <div className="grain relative overflow-hidden rounded-[36px] bg-purple p-7 text-white shadow-[0_24px_70px_rgba(109,85,217,.24)] sm:p-10">
          <div className="relative z-10 max-w-xl"><div className="mb-5 flex items-center gap-3"><Avatar profile={profile} /><div><p className="text-sm text-white/60">{today}</p><p className="font-black">Hello, {profile.name}</p></div></div><h1 className="text-balance text-4xl font-black leading-[1.02] tracking-[-.06em] sm:text-5xl">Who could use a Kaki today?</h1><p className="mt-4 max-w-lg text-lg leading-7 text-white/72">{openMissions.length ? `${openMissions.length} real ${openMissions.length === 1 ? "mission is" : "missions are"} open in your community view.` : "No open requests yet. You can create the first neighbour moment."}</p><ButtonLink href={openMissions.length ? "/discover" : "/ask"} variant="sun" className="mt-7">{openMissions.length ? "Find a mission" : "Create a mission"} <ArrowRight className="size-4" /></ButtonLink></div>
          <div className="absolute -bottom-14 -right-10 size-64 rounded-full border-[42px] border-white/8" /><div className="absolute right-28 top-8 size-16 rounded-full bg-sun/80 blur-sm" />
        </div>
        <div className="paper-card rounded-[36px] p-7"><p className="text-xs font-black uppercase tracking-[.16em] text-purple">Your live community view</p><p className="mt-5 text-6xl font-black tracking-[-.07em] text-ink">{impact.neighbourMoments}</p><p className="mt-1 text-lg font-bold text-muted">shared neighbour moments</p><p className="mt-5 text-sm leading-6 text-muted">This count comes from completed, consented stories visible to your account.</p><Link href="/bloom" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-purple"><Flower2 className="size-4" />See the Kampung Bloom</Link></div>
      </section>

      <section><SectionHeading eyebrow="Quick actions" title="What can we do together?" /><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Action href="/ask" icon={<Mic />} title="Ask for help" text="Speak naturally" tone="bg-purple text-white" /><Action href="/discover" icon={<HandHeart />} title="Offer my time" text="Find a small mission" tone="bg-sun text-ink" /><Action href={activeMission ? `/missions/${activeMission.id}` : "/discover"} icon={<MessageCircle />} title="My Kaki" text={activeMission ? "Mission ready" : "No active mission"} tone="bg-mint text-[#17654d]" /><Action href="/bloom" icon={<Sparkles />} title="Share a moment" text="Grow the mural" tone="bg-[#ffd8d2] text-[#a83d31]" /></div></section>

      {activeMission ? <section><SectionHeading eyebrow="Up next" title="Your next neighbour moment"><Link href="/discover" className="text-sm font-black text-purple">All missions →</Link></SectionHeading><div className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><MissionCard mission={activeMission} /><div className="grain flex min-h-64 flex-col justify-between overflow-hidden rounded-[32px] bg-ink p-7 text-white"><div><div className="flex items-center gap-2 text-sun"><CalendarDays className="size-5" /><span className="text-xs font-black uppercase tracking-[.15em]">Ready when you are</span></div><h3 className="mt-5 max-w-lg text-3xl font-black tracking-[-.05em]">Your three-step Kaki guide is ready.</h3><p className="mt-3 max-w-xl leading-7 text-white/65">No expertise needed—just patience, curiosity and fifteen minutes.</p></div><ButtonLink href={`/missions/${activeMission.id}`} variant="secondary" className="mt-8 w-fit border-white/15 bg-white/10 text-white hover:bg-white/15">Open mission guide <ArrowRight className="size-4" /></ButtonLink></div></div></section> : null}

      <section><SectionHeading eyebrow="Near you" title="Fresh missions" />{openMissions.length ? <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{openMissions.slice(0, 3).map((mission) => <MissionCard key={mission.id} mission={mission} />)}</div> : <div className="paper-card mt-5 rounded-[32px] px-6 py-12 text-center"><h3 className="text-xl font-black">The board is ready for its first request.</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Real missions will appear here as neighbours publish them.</p><ButtonLink href="/ask" className="mt-5">Create a mission</ButtonLink></div>}</section>
    </div>
  );
}

function Action({ href, icon, title, text, tone }: { href: string; icon: React.ReactNode; title: string; text: string; tone: string }) { return <Link href={href} className="paper-card group flex items-center gap-4 rounded-[26px] p-4 transition hover:-translate-y-1"><span className={`grid size-13 shrink-0 place-items-center rounded-2xl ${tone}`}>{icon}</span><span><strong className="block text-base font-black text-ink">{title}</strong><span className="text-sm text-muted">{text}</span></span><ArrowRight className="ml-auto size-4 text-muted transition group-hover:translate-x-1 group-hover:text-purple" /></Link>; }
