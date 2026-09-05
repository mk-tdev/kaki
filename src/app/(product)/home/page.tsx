"use client";
import Link from "next/link";
import { ArrowRight, HandHeart, Mic } from "lucide-react";
import { MissionCard } from "@/components/mission-card";
import { ButtonLink } from "@/components/ui/button";
import { useMissions } from "@/components/mission-provider";

export default function HomePage() {
  const { profile, missions } = useMissions();
  const mine = missions.filter(mission => [mission.requester.id, mission.helper?.id].includes(profile.id));
  const active = mine.filter(mission => ["open", "matched", "in_progress"].includes(mission.status));
  const available = missions.filter(mission => mission.status === "open" && mission.requester.id !== profile.id);
  return <div className="mx-auto max-w-4xl space-y-7">
    <section>
      <p className="text-xs font-black uppercase tracking-[.15em] text-purple">Neighbours helping neighbours</p>
      <h1 className="mt-3 text-3xl font-black tracking-[-.05em] sm:text-5xl">A little help. A new connection.</h1>
      <p className="mt-3 max-w-xl text-base leading-7 text-muted">Share a skill, learn something new, or lend a hand. Every generation has something to give.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link href="/ask" className="flex min-h-28 items-center gap-4 rounded-2xl bg-purple p-5 text-white shadow-lg shadow-purple/15"><Mic className="size-8 shrink-0" /><span><strong className="block text-xl font-black">Ask for help</strong><span className="text-sm text-white/75">Tell KAKI what you need</span></span><ArrowRight className="ml-auto size-5" /></Link>
        <Link href="/discover" className="flex min-h-28 items-center gap-4 rounded-2xl bg-sun p-5 text-ink"><HandHeart className="size-8 shrink-0" /><span><strong className="block text-xl font-black">Help a neighbour</strong><span className="text-sm text-ink/65">A few minutes can mean a lot</span></span><ArrowRight className="ml-auto size-5" /></Link>
      </div>
    </section>
    {active.length ? <section><h2 className="text-xl font-black">Your connections</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{active.map(mission => <MissionCard key={mission.id} mission={mission} />)}</div></section> : null}
    <section><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">Someone could use your help</h2><Link href="/discover" className="shrink-0 text-sm font-bold text-purple">See all →</Link></div>
      {available.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2">{available.slice(0, 2).map(mission => <MissionCard key={mission.id} mission={mission} />)}</div> : <div className="paper-card mt-4 rounded-2xl p-6"><p className="text-sm leading-6 text-muted">No requests waiting right now. Need a hand or want to learn a skill?</p><ButtonLink href="/ask" variant="secondary" className="mt-4">Ask a neighbour</ButtonLink></div>}
    </section>
    <p className="text-center text-xs leading-6 text-muted">AI helps turn your ask into a simple request. The connection is human.<br /><Link href="/bloom" className="font-bold text-purple">Neighbour stories →</Link></p>
  </div>;
}
