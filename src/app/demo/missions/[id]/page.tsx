import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Check, Clock3, Languages, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { CategoryIcon, categoryMeta } from "@/components/category-icon";
import { ButtonLink } from "@/components/ui/button";
import { demoMissions } from "@/data/demo";

export default async function DemoMissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mission = demoMissions.find((item) => item.id === id);
  if (!mission) notFound();
  const meta = categoryMeta[mission.category];

  return (
    <div className="mx-auto max-w-6xl"><Link href="/demo" className="mb-6 inline-flex items-center gap-2 text-sm font-black text-muted hover:text-purple"><ArrowLeft className="size-4" />Back to demo</Link><div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]"><div className="space-y-6"><section className="grain overflow-hidden rounded-[36px] bg-ink p-7 text-white shadow-[0_24px_70px_rgba(33,29,53,.2)] sm:p-9"><div className="flex items-center gap-3"><CategoryIcon category={mission.category} className="size-13" /><div><p className="text-xs font-black uppercase tracking-[.15em] text-sun">{meta.label}</p><p className="mt-1 text-sm text-white/55">Sample mission</p></div></div><h1 className="mt-7 text-balance text-4xl font-black leading-[1.02] tracking-[-.06em] sm:text-5xl">{mission.title}</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-white/67">{mission.summary}</p><div className="mt-7 grid gap-3 sm:grid-cols-3"><Detail icon={<CalendarDays />} label="When" value={new Intl.DateTimeFormat("en-SG", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(mission.scheduledAt))} /><Detail icon={<MapPin />} label="Where" value={mission.location} /><Detail icon={<Languages />} label="Language" value={mission.language} /></div></section>
          <section className="paper-card rounded-[32px] p-7"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-purple/10 text-purple"><Sparkles className="size-5" /></span><div><p className="text-xs font-black uppercase tracking-[.14em] text-purple">AI-made Kaki guide</p><h2 className="text-2xl font-black tracking-[-.04em]">Three easy steps</h2></div></div><ol className="mt-7 space-y-5">{mission.guide.map((step, index) => <li key={step} className="flex gap-4"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-sm font-black text-white">{index + 1}</span><p className="border-b border-ink/8 pb-5 leading-7 text-muted">{step}</p></li>)}</ol><div className="mt-4 flex items-start gap-3 rounded-2xl bg-mint/55 p-4 text-sm leading-6 text-[#17654d]"><ShieldCheck className="mt-0.5 size-5 shrink-0" /><p><strong className="block">Safety is part of the flow</strong>Public meeting points, clear scope and organiser escalation stay visible throughout.</p></div></section></div>
        <aside className="space-y-5"><section className="paper-card rounded-[32px] p-6"><p className="text-xs font-black uppercase tracking-[.14em] text-purple">Neighbour asking</p><div className="mt-5 flex items-center gap-4"><Avatar profile={mission.requester} size="lg" /><div><h2 className="text-xl font-black">{mission.requester.name}</h2><p className="mt-1 text-sm text-muted">Sample Pek Kio profile</p></div></div><p className="mt-5 text-sm leading-6 text-muted">{mission.requester.bio}</p></section>{mission.helper ? <section className="rounded-[32px] bg-purple p-6 text-white"><p className="text-xs font-black uppercase tracking-[.14em] text-sun">AI-assisted match</p><div className="mt-5 flex items-center gap-4"><Avatar profile={mission.helper} size="lg" /><div><h2 className="text-xl font-black">{mission.helper.name}</h2><p className="mt-1 text-sm text-white/60">Language + skills fit</p></div></div></section> : null}<section className="paper-card rounded-[32px] p-6"><div className="flex items-center gap-2 text-purple"><Clock3 className="size-5" /><p className="text-xs font-black uppercase tracking-[.14em]">Prototype interaction</p></div><h2 className="mt-4 text-xl font-black">Ready to try it for real?</h2><p className="mt-2 text-sm leading-6 text-muted">Sample pages are read-only. The live app creates real accounts, profiles and missions.</p><ButtonLink href="/register" className="mt-5 w-full"><Check className="size-4" />Create real account</ButtonLink></section></aside></div>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl bg-white/8 p-4"><span className="text-sun">{icon}</span><p className="mt-3 text-[10px] font-black uppercase tracking-[.15em] text-white/45">{label}</p><p className="mt-1 text-sm font-bold leading-5">{value}</p></div>;
}
