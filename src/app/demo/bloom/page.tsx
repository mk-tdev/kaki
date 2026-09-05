import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { categoryMeta } from "@/components/category-icon";
import { SectionHeading } from "@/components/section-heading";
import { demoBlooms } from "@/data/demo";
import type { MissionCategory } from "@/types/kaki";

export default function DemoBloomPage() {
  return (
    <div><Link href="/demo" className="mb-6 inline-flex items-center gap-2 text-sm font-black text-muted hover:text-purple"><ArrowLeft className="size-4" />Back to demo</Link><SectionHeading eyebrow="Sample community impact" title="The Kampung Bloom"><span className="rounded-full bg-sun/30 px-3 py-2 text-xs font-black text-[#76580d]">Illustrative stories</span></SectionHeading>
      <section className="grain relative mt-7 min-h-[480px] overflow-hidden rounded-[40px] bg-ink p-7 sm:p-10"><div className="relative z-10 max-w-xl"><p className="text-xs font-black uppercase tracking-[.16em] text-sun">Every mission leaves a flower</p><h2 className="mt-4 text-4xl font-black tracking-[-.055em] text-white sm:text-5xl">Small moments.<br />Visible community roots.</h2><p className="mt-4 max-w-lg leading-7 text-white/60">This sample wall shows how consented stories can turn individual help into a collective story Pek Kio can see and celebrate.</p></div><div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-4">{demoBlooms.map((bloom) => <div key={bloom.id} className="group relative flex flex-col items-center text-center"><BloomFlower category={bloom.category} /><p className="mt-3 text-xs font-black text-white">{bloom.title}</p></div>)}</div><div className="absolute -bottom-28 -right-16 size-80 rounded-full border-[52px] border-white/[.05]" /></section>
      <section className="mt-10"><SectionHeading eyebrow="Stories behind the flowers" title="A mural with meaning" /><div className="mt-6 grid gap-5 md:grid-cols-2">{demoBlooms.map((bloom) => <article key={bloom.id} className="paper-card flex gap-4 rounded-[28px] p-5"><BloomFlower category={bloom.category} small /><div><p className="text-xs font-black uppercase tracking-[.12em] text-purple">{bloom.participantNames.join(" + ")}</p><h3 className="mt-1 text-xl font-black tracking-[-.035em]">{bloom.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{bloom.story}</p></div></article>)}</div></section>
    </div>
  );
}

function BloomFlower({ category, small = false }: { category: MissionCategory; small?: boolean }) {
  const color = categoryMeta[category].bloom;
  return <span className={`relative grid shrink-0 place-items-center rounded-full bg-white/10 ${small ? "size-14" : "size-20"}`}><span className="absolute h-[82%] w-[38%] rounded-full" style={{ background: color, transform: "rotate(45deg)" }} /><span className="absolute h-[82%] w-[38%] rounded-full opacity-80" style={{ background: color, transform: "rotate(-45deg)" }} /><span className="relative size-[28%] rounded-full bg-sun shadow-sm" /></span>;
}
