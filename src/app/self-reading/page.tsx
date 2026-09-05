import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  ChefHat,
  HeartHandshake,
  Languages,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Why KAKI exists",
  description: "A self-reading story about using AI to reconnect generations and grow community spirit.",
};

const steps = [
  { number: "01", title: "Speak naturally", text: "Ask for help in the words and language that feel comfortable.", icon: MessageCircle },
  { number: "02", title: "AI creates clarity", text: "KAKI translates and shapes the need into a clear, safer mission.", icon: Bot },
  { number: "03", title: "A neighbour chooses", text: "A nearby Kaki sees the request and decides whether to step forward.", icon: Users },
  { number: "04", title: "Meet and exchange", text: "Both people coordinate, meet in public, help and share what they know.", icon: HeartHandshake },
];

const exchanges = [
  ["Taking better phone photos", "The stories behind old neighbourhood pictures"],
  ["Using digital public services", "Repairing, gardening and cooking skills"],
  ["Spotting online scams", "Local history that cannot be searched online"],
];

export default function SelfReadingPage() {
  return <main className="min-h-dvh overflow-hidden text-ink">
    <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
      <Logo />
      <div className="flex items-center gap-3">
        <Link href="/presentation" className="hidden text-sm font-black text-muted hover:text-purple sm:block">View presentation</Link>
        <Link href="/home" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-purple px-4 text-sm font-black text-white shadow-[0_4px_0_#382681]">Open live demo <ArrowRight className="size-4" /></Link>
      </div>
    </header>

    <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-20 pt-8 sm:px-8 lg:grid-cols-[1fr_.9fr] lg:pb-28 lg:pt-14">
      <div>
        <p className="text-sm font-black uppercase tracking-[.16em] text-purple">Why KAKI exists</p>
        <h1 className="mt-5 max-w-4xl text-balance text-[clamp(3rem,6vw,6rem)] font-black leading-[.92] tracking-[-.065em]">AI is moving faster.<br /><span className="text-purple">Not everyone has someone to run with.</span></h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">The technical distance between younger and older generations is growing. KAKI does not push more technology at people. It uses AI to bring people together.</p>
      </div>
      <div className="relative min-h-[420px] overflow-hidden border-b-4 border-sun sm:min-h-[540px]">
        <Image src="/assets/kaki-presentation-neighbour.png" alt="A younger community organiser helping an older neighbour explore AI" fill priority sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover object-[68%_center]" />
      </div>
    </section>

    <section className="bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[.7fr_1.3fr] lg:py-28">
        <div><p className="text-sm font-black uppercase tracking-[.16em] text-sun">01 · The gap</p><h2 className="mt-4 text-4xl font-black tracking-[-.05em] sm:text-5xl">The learning curve gets steeper when you climb it alone.</h2></div>
        <div className="max-w-3xl space-y-6 text-lg leading-8 text-white/70"><p>Young people are growing up alongside AI. For many older adults, every new leap adds another unfamiliar layer: new words, new screens and new reasons to worry about making a mistake.</p><p>The problem is not a lack of intelligence. It is a lack of confidence, context and someone patient sitting beside you.</p><blockquote className="border-l-4 border-coral pl-6 text-2xl font-black leading-snug text-white sm:text-3xl">Access to technology is not the same as access to understanding.</blockquote></div>
      </div>
    </section>

    <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_.9fr] lg:py-28">
      <div>
        <p className="text-sm font-black uppercase tracking-[.16em] text-purple">02 · The moment</p>
        <h2 className="mt-4 text-4xl font-black tracking-[-.05em] sm:text-5xl">Today, the idea happened in front of me.</h2>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">An organiser sat with an older woman and explained what ChatGPT is and how it could help her. That small act gave the technology meaning. It turned something intimidating into something she could try.</p>
      </div>
      <div className="border-y-2 border-purple py-8 sm:py-10"><Sparkles className="size-9 text-coral" /><p className="mt-5 text-2xl font-black leading-snug sm:text-3xl">That is KAKI in one scene: not a machine replacing a person, but technology helping one person reach another.</p></div>
    </section>

    <section className="bg-purple text-white">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <p className="text-sm font-black uppercase tracking-[.16em] text-sun">03 · The idea</p>
        <h2 className="mt-4 max-w-5xl text-balance text-4xl font-black tracking-[-.055em] sm:text-6xl">Not another app that teaches people how to use an app.</h2>
        <p className="mt-7 max-w-3xl text-xl leading-9 text-white/75">KAKI is a neighbourhood experience. It helps people ask for small assistance, find someone nearby and turn a useful moment into a human connection. AI removes the friction; neighbours create the trust.</p>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
      <div className="max-w-3xl"><p className="text-sm font-black uppercase tracking-[.16em] text-purple">04 · How it works</p><h2 className="mt-4 text-4xl font-black tracking-[-.05em] sm:text-5xl">From “I need help” to “I’ve got you.”</h2><p className="mt-5 text-lg leading-8 text-muted">The AI stays in the background. The neighbourly moment stays at the centre.</p></div>
      <ol className="mt-12 grid border-y border-ink/15 md:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ number, title, text, icon: Icon }) => <li key={title} className="border-b border-ink/15 p-6 last:border-b-0 md:border-l md:first:border-l-0 lg:border-b-0 sm:p-8"><div className="flex items-center justify-between"><span className="grid size-12 place-items-center rounded-lg bg-mint text-purple"><Icon className="size-6" /></span><span className="text-3xl font-black text-ink/10">{number}</span></div><h3 className="mt-8 text-xl font-black">{title}</h3><p className="mt-3 leading-7 text-muted">{text}</p></li>)}
      </ol>
      <div className="mt-8 grid overflow-hidden border border-ink/15 lg:grid-cols-[1fr_auto_1fr]"><div className="bg-mint p-7 sm:p-9"><Bot className="size-9 text-purple" /><h3 className="mt-4 text-2xl font-black">AI helps</h3><p className="mt-3 font-bold leading-8">Understand · Translate · Structure · Guide</p></div><div className="grid bg-ink px-7 py-8 text-center text-xl font-black text-white lg:w-64 lg:place-items-center">AI creates clarity.<br /><span className="text-sun">People create belonging.</span></div><div className="bg-coral p-7 text-white sm:p-9"><HeartHandshake className="size-9" /><h3 className="mt-4 text-2xl font-black">People choose</h3><p className="mt-3 font-bold leading-8">Trust · Decide · Meet · Teach · Care</p></div></div>
    </section>

    <section className="bg-paper">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <p className="text-sm font-black uppercase tracking-[.16em] text-purple">05 · The exchange</p>
        <h2 className="mt-4 max-w-4xl text-balance text-4xl font-black tracking-[-.05em] sm:text-5xl">Every generation has something worth sharing.</h2>
        <div className="mt-10 grid overflow-hidden border-2 border-ink lg:grid-cols-[1fr_auto_1fr]"><div className="bg-mint p-7 sm:p-10"><Languages className="size-10 text-purple" /><p className="mt-5 text-sm font-black uppercase tracking-[.12em] text-purple">A younger neighbour shares</p><p className="mt-3 text-3xl font-black">How to use ChatGPT</p></div><div className="grid bg-purple px-6 py-7 text-center font-black text-white lg:w-48 lg:place-items-center">Both leave richer</div><div className="bg-sun/50 p-7 sm:p-10"><ChefHat className="size-10 text-coral" /><p className="mt-5 text-sm font-black uppercase tracking-[.12em] text-coral">An older neighbour shares</p><p className="mt-3 text-3xl font-black">A century-old recipe</p></div></div>
        <div className="mt-10 divide-y border-y border-ink/15">{exchanges.map(([younger, older]) => <div key={younger} className="grid gap-2 py-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-6"><p className="font-bold text-purple">{younger}</p><ArrowRight className="hidden size-5 text-ink/25 sm:block" /><p className="font-bold text-coral">{older}</p></div>)}</div>
        <p className="mt-8 max-w-3xl text-xl font-black leading-8">Nobody is only a giver. Nobody is only a receiver. That is how assistance becomes belonging.</p>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
      <div className="grid items-center gap-10 border-t-4 border-purple pt-10 lg:grid-cols-[1fr_auto]">
        <div><p className="text-sm font-black uppercase tracking-[.16em] text-purple">06 · Why it matters</p><h2 className="mt-4 max-w-4xl text-balance text-4xl font-black tracking-[-.055em] sm:text-6xl">AI should not replace the neighbour.<br /><span className="text-purple">It should help neighbours find each other.</span></h2><p className="mt-6 max-w-2xl text-lg leading-8 text-muted">KAKI turns assistance into shared experience—and shared experience into a stronger community spirit.</p></div>
        <div className="flex flex-col gap-3 lg:w-64"><Link href="/home" className="inline-flex min-h-14 items-center justify-between rounded-xl bg-purple px-6 font-black text-white shadow-[0_6px_0_#382681]">Open live demo <ArrowRight className="size-5" /></Link><Link href="/presentation" className="inline-flex min-h-14 items-center justify-between rounded-xl border-2 border-ink/15 bg-paper px-6 font-black">View presentation <ArrowRight className="size-5" /></Link><Link href="/share" className="inline-flex items-center gap-2 px-1 pt-2 text-sm font-black text-purple"><ShieldCheck className="size-4" />Open share QR</Link></div>
      </div>
    </section>

    <footer className="border-t border-ink/15 px-5 py-8 text-center text-sm font-bold text-muted sm:px-8">KAKI · Pek Kio, Singapore · AI for real needs</footer>
  </main>;
}
