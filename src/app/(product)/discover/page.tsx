"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { categoryMeta } from "@/components/category-icon";
import { MissionCard } from "@/components/mission-card";
import { SectionHeading } from "@/components/section-heading";
import { useMissions } from "@/components/mission-provider";
import type { MissionCategory } from "@/types/kaki";
import { cn } from "@/lib/utils";

type Filter = "all" | MissionCategory;

export default function DiscoverPage() {
  const { missions } = useMissions();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const visible = useMemo(() => missions.filter((mission) => {
    if (mission.status !== "open") return false;
    if (filter !== "all" && mission.category !== filter) return false;
    const haystack = `${mission.title} ${mission.summary} ${mission.location} ${mission.language}`.toLowerCase();
    return haystack.includes(deferredQuery.toLowerCase());
  }), [deferredQuery, filter, missions]);

  return <div><SectionHeading eyebrow="Mission board" title="Small ways to show up"><p className="max-w-md text-sm leading-6 text-muted">Choose something that fits your time, language and confidence.</p></SectionHeading><div className="mt-7 flex flex-col gap-4 rounded-[28px] border border-ink/10 bg-white/60 p-4 lg:flex-row lg:items-center"><label className="relative flex min-h-12 flex-1 items-center"><Search className="absolute left-4 size-5 text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search missions, skills or language" className="h-12 w-full rounded-full border border-ink/10 bg-paper pl-12 pr-4 text-sm font-medium placeholder:text-muted/70" /></label><div className="flex gap-2 overflow-x-auto pb-1"><button onClick={() => setFilter("all")} className={cn("flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold", filter === "all" ? "bg-ink text-white" : "bg-white text-muted")}><SlidersHorizontal className="size-4" />All</button>{(Object.keys(categoryMeta) as MissionCategory[]).map((category) => { const meta = categoryMeta[category]; return <button key={category} onClick={() => setFilter(category)} className={cn("min-h-11 shrink-0 rounded-full px-4 text-sm font-bold", filter === category ? "bg-purple text-white" : "bg-white text-muted")}>{meta.label}</button>; })}</div></div><div className="mt-8 flex items-center justify-between"><p className="text-sm font-bold text-muted"><strong className="text-ink">{visible.length}</strong> missions near Pek Kio</p><select aria-label="Sort missions" className="rounded-full border border-ink/10 bg-paper px-4 py-2 text-sm font-bold"><option>Best match</option><option>Soonest</option><option>Shortest first</option></select></div>{visible.length ? <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map((mission) => <MissionCard key={mission.id} mission={mission} />)}</div> : <div className="paper-card mt-5 rounded-[32px] px-6 py-16 text-center"><p className="text-xl font-black">No missions match yet.</p><p className="mt-2 text-muted">Try another category or a shorter search.</p></div>}</div>;
}
