"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { Flower2, Maximize, QrCode } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/client";
import { categoryMeta } from "@/components/category-icon";
import type { MissionCategory } from "@/types/kaki";

type PublicBloom={id:string;title:string;story:string;category:MissionCategory;participant_names:string[];created_at:string};
export function LiveBloomWall(){
  const [blooms,setBlooms]=useState<PublicBloom[]>([]);
  const [total,setTotal]=useState(0);
  const [loaded,setLoaded]=useState(false);
  const [error,setError]=useState("");
  useEffect(()=>{
    let active=true;let inFlight=false;
    const refresh=async()=>{if(inFlight||document.visibilityState!=="visible")return;inFlight=true;try{const response=await fetch("/api/live",{cache:"no-store"});if(!response.ok)throw new Error();const payload=await response.json();if(active){setBlooms(payload.blooms);setTotal(payload.total);setLoaded(true);setError("");}}catch{if(active)setError("Connection interrupted. We’re reconnecting…");}finally{inFlight=false;}};
    void refresh();const supabase=createClient();const channel=supabase.channel("public-bloom-wall").on("postgres_changes",{event:"*",schema:"public",table:"blooms"},()=>void refresh()).subscribe();
    const timer=window.setInterval(()=>void refresh(),5000);window.addEventListener("focus",refresh);
    return()=>{active=false;window.clearInterval(timer);window.removeEventListener("focus",refresh);void supabase.removeChannel(channel);};
  },[]);
  async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{setError("Fullscreen isn’t supported here. Use your browser’s fullscreen control.");}}
  return <main className="min-h-dvh bg-ink px-5 py-7 text-white sm:px-10"><header className="mx-auto flex max-w-7xl items-center justify-between gap-4"><Link href="/" className="rounded-full bg-paper px-4 py-2"><Logo/></Link><div className="flex items-center gap-3"><button aria-label="Toggle fullscreen" className="grid size-11 place-items-center rounded-full bg-white/10" onClick={()=>void fullscreen()}><Maximize className="size-5"/></button><Link href="/share" className="flex items-center gap-2 rounded-full bg-sun px-4 py-3 text-sm font-black text-ink"><QrCode className="size-4"/>Join in</Link></div></header><div className="mx-auto mt-12 max-w-7xl"><p className="text-xs font-black uppercase tracking-[.2em] text-sun">Pek Kio · live community Bloom</p><div className="mt-5 flex flex-wrap items-end justify-between gap-6"><h1 className="max-w-3xl text-5xl font-black leading-none tracking-[-.06em] sm:text-7xl">Small acts.<br/><span className="text-mint">A closer kampung.</span></h1><div className="rounded-[28px] bg-white/8 px-8 py-5 text-center"><p className="text-6xl font-black text-sun" aria-live="polite">{loaded?total:"—"}</p><p className="mt-2 text-xs font-bold text-white/60">completed moments shared</p></div></div><p className="mt-6 max-w-2xl text-sm leading-7 text-white/60">Every flower represents a completed neighbour moment. Only stories with both participants’ consent appear here. No sample data, no simulated impact.</p>{error?<p role="status" className="mt-4 text-sm text-sun">{error}</p>:null}
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite" aria-relevant="additions">{blooms.map(bloom=><article key={bloom.id} className="reveal-in rounded-[30px] border border-white/10 bg-white/5 p-6"><Flower2 className="bloom-pop size-12 text-mint"/><p className="mt-5 text-[10px] font-black uppercase tracking-[.15em] text-sun">{categoryMeta[bloom.category].label}</p><h2 className="mt-2 text-xl font-black">{bloom.title}</h2><p className="mt-3 break-words text-sm leading-7 text-white/65">{bloom.story}</p><p className="mt-5 text-xs font-bold text-white/45">{bloom.participant_names.join(" + ")} · {new Intl.DateTimeFormat("en-SG",{day:"numeric",month:"short",timeZone:"Asia/Singapore"}).format(new Date(bloom.created_at))}</p></article>)}</div>
    {loaded&&!blooms.length?<div className="my-12 rounded-[36px] border border-dashed border-white/20 px-6 py-16 text-center"><Flower2 className="mx-auto size-16 text-mint/50"/><h2 className="mt-5 text-3xl font-black">The first Bloom could be yours.</h2><p className="mt-3 text-white/60">Ask. Help. Check in together. Let a small moment grow.</p></div>:null}<p className="mt-8 pb-6 text-xs text-white/35">{total>36?"Showing the latest 36 shared moments. ":""}Updates automatically · completed moments are participant-reported, not independently verified.</p></div></main>;
}
