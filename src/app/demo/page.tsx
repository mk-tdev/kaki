import Link from "next/link";
import { ArrowRight, Clock3, Flower2, HeartHandshake, Recycle, Sparkles } from "lucide-react";
import { MissionCard } from "@/components/mission-card";
import { SectionHeading } from "@/components/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { demoImpact, demoMissions } from "@/data/demo";

export default function DemoPage() {
  return (
    <div className="space-y-11">
      <section className="grain relative overflow-hidden rounded-[40px] bg-purple px-7 py-10 text-white shadow-[0_26px_80px_rgba(109,85,217,.24)] sm:px-11 sm:py-14">
        <div className="relative z-10 max-w-3xl"><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.14em] text-sun"><Sparkles className="size-4" />Hackathon product tour</div><h1 className="mt-6 text-balance text-5xl font-black leading-[.95] tracking-[-.065em] sm:text-7xl">See the kampung<br />come alive.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">Explore a complete sample journey—from a neighbour’s request to a matched mission and a lasting community bloom.</p><div className="mt-8 flex flex-wrap gap-3"><ButtonLink href={`/demo/missions/${demoMissions[0].id}`} variant="sun">Open the hero mission <ArrowRight className="size-4" /></ButtonLink><ButtonLink href="/demo/bloom" variant="secondary" className="border-white/15 bg-white/10 text-white hover:bg-white/15">See sample impact <Flower2 className="size-4" /></ButtonLink></div></div>
        <div className="absolute -bottom-28 -right-16 size-96 rounded-full border-[64px] border-white/[.07]" /><Flower2 className="absolute right-[12%] top-[18%] hidden size-32 rotate-12 text-mint/30 lg:block" />
      </section>

      <section><SectionHeading eyebrow="Sample mission board" title="Four ways neighbours connect"><Link href="/register" className="text-sm font-black text-purple">Create a real account →</Link></SectionHeading><div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{demoMissions.map((mission) => <MissionCard key={mission.id} mission={mission} href={`/demo/missions/${mission.id}`} />)}</div></section>

      <section><SectionHeading eyebrow="Illustrative outcomes" title="The impact story judges can grasp"><span className="rounded-full bg-sun/30 px-3 py-2 text-xs font-black text-[#76580d]">Sample metrics</span></SectionHeading><div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4"><Metric icon={<Flower2 />} value={demoImpact.neighbourMoments.toLocaleString()} label="Neighbour moments" tone="bg-purple/10 text-purple" /><Metric icon={<Clock3 />} value={demoImpact.minutesShared.toLocaleString()} label="Minutes shared" tone="bg-sun/30 text-[#76580d]" /><Metric icon={<HeartHandshake />} value={demoImpact.skillsExchanged.toLocaleString()} label="Skills exchanged" tone="bg-[#ffd8d2] text-[#a83d31]" /><Metric icon={<Recycle />} value={demoImpact.itemsSaved.toLocaleString()} label="Items saved" tone="bg-mint text-[#17654d]" /></div></section>

      <section className="paper-card flex flex-col items-start justify-between gap-6 rounded-[34px] p-7 sm:flex-row sm:items-center sm:p-9"><div><p className="text-xs font-black uppercase tracking-[.15em] text-coral">Ready for real data?</p><h2 className="mt-2 text-3xl font-black tracking-[-.05em]">The live product starts with you.</h2><p className="mt-2 text-muted">Register, complete your community profile and publish a real mission to Supabase.</p></div><ButtonLink href="/register" className="shrink-0">Create my account <ArrowRight className="size-4" /></ButtonLink></section>
    </div>
  );
}

function Metric({ icon, value, label, tone }: { icon: React.ReactNode; value: string; label: string; tone: string }) {
  return <div className="paper-card rounded-[26px] p-5"><span className={`grid size-10 place-items-center rounded-2xl ${tone}`}>{icon}</span><p className="mt-5 text-3xl font-black tracking-[-.05em]">{value}</p><p className="mt-1 text-sm text-muted">{label}</p></div>;
}
