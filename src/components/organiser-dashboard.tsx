"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, CircleDot, Clock3, ShieldCheck, UsersRound } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { useMissions } from "@/components/mission-provider";
import { SectionHeading } from "@/components/section-heading";
import { formatMissionDate } from "@/lib/utils";
import type { Mission, MissionStatus } from "@/types/kaki";

const activeStatuses = new Set<MissionStatus>(["matched", "in_progress"]);

export function OrganiserDashboard() {
  const { profile, missions, impact } = useMissions();
  const review = missions.filter((mission) => mission.status === "flagged");
  const open = missions.filter((mission) => mission.status === "open");
  const active = missions.filter((mission) => activeStatuses.has(mission.status));
  const completed = missions.filter((mission) => mission.status === "completed");
  const queue = [...review, ...open, ...active].slice(0, 8);

  return (
    <div className="space-y-9">
      <SectionHeading eyebrow="Live operations" title={`Good day, ${profile.name}`}>
        <span className="inline-flex items-center gap-2 rounded-full bg-mint px-4 py-2 text-xs font-black text-[#17654d]"><CircleDot className="size-4" />Connected to Supabase</span>
      </SectionHeading>

      <section className="grain relative overflow-hidden rounded-[36px] bg-ink p-7 text-white sm:p-9">
        <div className="relative z-10 max-w-2xl"><div className="flex items-center gap-3 text-sun"><ShieldCheck className="size-6" /><p className="text-xs font-black uppercase tracking-[.16em]">Community pulse</p></div><h2 className="mt-5 text-balance text-4xl font-black tracking-[-.055em] sm:text-5xl">Real needs, visible at a glance.</h2><p className="mt-4 max-w-xl text-lg leading-8 text-white/65">Review safety-sensitive requests first, then help open missions find the right neighbour.</p></div>
        <div className="absolute -bottom-28 right-8 size-72 rounded-full border-[48px] border-white/[.06]" />
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric icon={<AlertTriangle />} value={review.length} label="Needs review" tone="bg-coral/15 text-[#a83d31]" />
        <Metric icon={<UsersRound />} value={open.length} label="Awaiting a Kaki" tone="bg-sun/30 text-[#76580d]" />
        <Metric icon={<Clock3 />} value={active.length} label="Active now" tone="bg-purple/10 text-purple" />
        <Metric icon={<CheckCircle2 />} value={completed.length} label="Completed" tone="bg-mint text-[#17654d]" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
        <div className="paper-card rounded-[32px] p-6 sm:p-7">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.15em] text-purple">Action queue</p><h2 className="mt-2 text-2xl font-black tracking-[-.04em]">Missions needing attention</h2></div><span className="text-sm font-bold text-muted">{queue.length} visible</span></div>
          {queue.length ? <div className="mt-6 divide-y divide-ink/8">{queue.map((mission) => <QueueRow key={mission.id} mission={mission} />)}</div> : <div className="mt-6 rounded-[24px] bg-mint/45 px-5 py-10 text-center"><CheckCircle2 className="mx-auto size-8 text-[#17654d]" /><p className="mt-3 font-black text-[#17654d]">The queue is clear.</p><p className="mt-1 text-sm text-[#17654d]/70">New live requests will appear here automatically.</p></div>}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[32px] bg-purple p-7 text-white"><p className="text-xs font-black uppercase tracking-[.15em] text-sun">Community outcome</p><p className="mt-5 text-6xl font-black tracking-[-.07em]">{impact.neighbourMoments}</p><p className="mt-1 font-bold text-white/70">neighbour moments visible</p><div className="mt-6 border-t border-white/10 pt-5 text-sm leading-6 text-white/60">{impact.minutesShared.toLocaleString()} minutes shared across completed missions.</div></div>
          <div className="paper-card rounded-[28px] p-6"><h3 className="text-lg font-black">About this dashboard</h3><p className="mt-2 text-sm leading-6 text-muted">Every count and queue item is calculated from the signed-in organiser’s permitted Supabase rows. No sample records are mixed in.</p></div>
        </aside>
      </section>
    </div>
  );
}

function QueueRow({ mission }: { mission: Mission }) {
  const urgent = mission.status === "flagged";
  return <Link href={`/missions/${mission.id}`} className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0"><CategoryIcon category={mission.category} className="size-11" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-black">{mission.title}</p><span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[.08em] ${urgent ? "bg-coral/15 text-[#a83d31]" : mission.status === "open" ? "bg-sun/30 text-[#76580d]" : "bg-purple/10 text-purple"}`}>{urgent ? "Review" : mission.status.replace("_", " ")}</span></div><p className="mt-1 truncate text-xs text-muted">{mission.requester.name} · {formatMissionDate(mission.scheduledAt)} · {mission.location}</p></div><ArrowRight className="size-4 text-muted transition group-hover:translate-x-1 group-hover:text-purple" /></Link>;
}

function Metric({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone: string }) {
  return <div className="paper-card rounded-[26px] p-5"><span className={`grid size-10 place-items-center rounded-2xl ${tone}`}>{icon}</span><p className="mt-5 text-4xl font-black tracking-[-.055em]">{value}</p><p className="mt-1 text-sm text-muted">{label}</p></div>;
}
