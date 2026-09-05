import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowRight, HeartHandshake, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ShareActions } from "@/components/share-actions";
import { guestModeEnabled } from "@/lib/guest-mode";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title:"Two phones. One kampung.", description:"Scan to ask for help or become a Kaki in Pek Kio." };
const entries = [
  {path:"ask",title:"I need a little help",subtitle:"One small ask can start a connection.",label:"PHONE 01 · ASK",colour:"bg-purple",icon:Sparkles},
  {path:"discover",title:"I can lend a hand",subtitle:"Choose a neighbour. Make their day.",label:"PHONE 02 · HELP",colour:"bg-[#21634d]",icon:HeartHandshake},
];
export default async function SharePage(){
  const [enabled,codes]=await Promise.all([guestModeEnabled(),Promise.all(entries.map(entry=>QRCode.toDataURL(`https://kaki-dun.vercel.app/${entry.path}`,{width:640,margin:4,errorCorrectionLevel:"M",color:{dark:"#211D35",light:"#ffffff"}})))]);
  return <main className="mx-auto min-h-screen max-w-7xl px-5 py-7 sm:px-8"><header className="flex items-center justify-between"><Logo/><Link className="text-sm font-black text-purple" href="/live">Open live Bloom wall ↗</Link></header>
    <div className="mx-auto mb-8 mt-10 max-w-3xl text-center"><p className="text-xs font-black uppercase tracking-[.2em] text-purple">Pek Kio · AI for real needs</p><h1 className="mt-4 text-5xl font-black leading-none tracking-[-.06em] sm:text-7xl">Two phones.<br/><span className="text-purple">One kampung.</span></h1><p className="mt-5 text-lg text-muted">{enabled?"Scan. Jump in. No signup, password or email verification.":"Scan to join KAKI. Sign in while guest access is switched off."}</p></div>
    <div className="grid gap-6 md:grid-cols-2">{entries.map((entry,index)=><section key={entry.path} className={`overflow-hidden rounded-[36px] ${entry.colour} p-6 text-white sm:p-8`}><div className="flex items-center justify-between"><p className="text-xs font-black tracking-[.16em] text-sun">{entry.label}</p><entry.icon className="size-6"/></div><h2 className="mt-4 text-3xl font-black tracking-tight">{entry.title}</h2><p className="mt-2 text-sm text-white/70">{entry.subtitle}</p><div className="mx-auto mt-6 max-w-80 rounded-[28px] bg-white p-2"><Image src={codes[index]} alt={`Scan to ${entry.path === "ask"?"ask for help":"help a neighbour"}`} width={640} height={640} unoptimized className="h-auto w-full rounded-[22px]"/></div><p className="my-4 text-center text-xs text-white/70">kaki-dun.vercel.app/{entry.path}</p><ShareActions url={`https://kaki-dun.vercel.app/${entry.path}`}/></section>)}</div>
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-bold text-muted"><span>Ask</span><ArrowRight className="size-4"/><span>Connect</span><ArrowRight className="size-4"/><span>Check in together</span><ArrowRight className="size-4"/><span className="text-purple">Watch it Bloom</span></div><p className="mt-4 text-center text-xs text-muted">Use two different phones or isolated browser profiles for two people. Keep each browser open.</p><nav className="my-7 flex justify-center gap-6 text-sm font-black text-purple"><Link href="/ai-use">How the AI works</Link><Link href="/demo">Fictional showcase</Link><Link href="/">Home</Link></nav>
  </main>;
}
