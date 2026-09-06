"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  Database,
  Expand,
  Globe2,
  HandHeart,
  HeartHandshake,
  KeyRound,
  Languages,
  MapPin,
  MessageCircle,
  Mic,
  QrCode,
  Server,
  ShieldCheck,
  Sparkles,
  StickyNote,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

type Scene = {
  shortTitle: string;
  duration: number;
  note: string;
  content: ReactNode;
};

const SCENE_COUNT = 10;

function IntergenerationScene({ onBegin }: { onBegin: () => void }) {
  return <div className="grid min-h-0 flex-1 items-center gap-6 lg:grid-cols-[.82fr_1.18fr]">
    <div className="relative z-10 py-4 lg:py-8">
      <p className="inline-flex rounded-full bg-coral px-4 py-2 text-xs font-black tracking-[.16em] text-white">INTER-GENERATION</p>
      <h1 className="mt-6 max-w-3xl text-[clamp(2.5rem,5vw,5.4rem)] font-black leading-[.92] tracking-[-.055em] text-ink">Different ages.<br /><span className="text-purple">Shared strengths.</span><br />One neighbourhood.</h1>
      <p className="mt-6 max-w-2xl text-[clamp(1.05rem,1.75vw,1.45rem)] font-bold leading-relaxed text-muted">Use AI to help neighbours of all ages connect, share skills &amp; support one another.</p>
      <button onClick={onBegin} className="mt-6 inline-flex min-h-14 items-center gap-4 rounded-xl bg-purple px-6 text-base font-black text-white shadow-[0_6px_0_#382681] transition-transform motion-safe:hover:translate-y-0.5">See the idea in action <ArrowRight className="size-5" /></button>
    </div>
    <div className="relative h-[38vh] min-h-72 overflow-hidden border-b-4 border-sun lg:h-[68vh] lg:min-h-[520px]">
      <Image src="/assets/kaki-intergeneration.png" alt="Neighbours of different generations exchanging digital, gardening and repair skills" fill priority sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover object-[76%_center] lg:object-[72%_center]" />
    </div>
  </div>;
}

function PeopleFirstScene() {
  return <div className="flex min-h-0 flex-1 flex-col justify-center">
    <p className="text-xs font-black tracking-[.18em] text-coral">WHY KAKI IS DIFFERENT</p>
    <h1 className="mt-4 max-w-6xl text-[clamp(2.5rem,5.4vw,5.8rem)] font-black leading-[.9] tracking-[-.06em] text-ink">I don’t want to build another product <span className="text-purple">people have to learn.</span></h1>
    <p className="mt-6 max-w-4xl text-[clamp(1.05rem,1.8vw,1.5rem)] font-bold leading-relaxed text-muted">More unfamiliar technology can widen the gap we are trying to close.</p>

    <div className="mt-8 grid gap-4 md:grid-cols-2">
      <article className="border-t-4 border-coral bg-paper p-6 shadow-[0_8px_0_rgba(33,29,53,.07)] sm:p-8">
        <div className="flex items-center gap-3 text-coral"><Bot className="size-8" /><p className="text-xs font-black tracking-[.16em]">NOT MORE TECH TO MASTER</p></div>
        <p className="mt-5 text-[clamp(1.4rem,2.8vw,2.6rem)] font-black leading-tight text-ink">No new technical language.<br />No extra confidence gap.</p>
      </article>
      <article className="border-t-4 border-sun bg-purple p-6 text-white shadow-[0_8px_0_rgba(33,29,53,.12)] sm:p-8">
        <div className="flex items-center gap-3 text-sun"><HeartHandshake className="size-8" /><p className="text-xs font-black tracking-[.16em]">MORE HUMAN CONNECTION</p></div>
        <p className="mt-5 text-[clamp(1.4rem,2.8vw,2.6rem)] font-black leading-tight">People connect.<br />Skills and support move both ways.</p>
      </article>
    </div>

    <p className="mt-7 text-[clamp(1.2rem,2.2vw,2rem)] font-black text-ink">AI stays in the background. <span className="text-purple">The neighbour comes forward.</span></p>
  </div>;
}

function IntroScene({ onBegin }: { onBegin: () => void }) {
  return <div className="grid min-h-0 flex-1 items-center gap-6 lg:grid-cols-[.88fr_1.12fr]">
    <div className="relative z-10 py-4 lg:py-8">
      <h1 className="max-w-3xl text-[clamp(2.25rem,4.5vw,5rem)] font-black leading-[.94] tracking-[-.055em] text-ink">AI can answer<br />a question.<br /><span className="text-purple">A neighbour can<br />change the moment.</span></h1>
      <p className="mt-6 max-w-xl text-[clamp(1rem,1.7vw,1.45rem)] leading-relaxed text-muted">KAKI turns everyday needs into small, safe missions—and finds someone nearby who can help.</p>
      <button onClick={onBegin} className="mt-6 inline-flex min-h-14 items-center gap-4 rounded-xl bg-purple px-6 text-base font-black text-white shadow-[0_6px_0_#382681] transition-transform motion-safe:hover:translate-y-0.5">Begin story <ArrowRight className="size-5" /></button>
    </div>
    <div className="relative h-[34vh] min-h-64 overflow-hidden border-b-4 border-sun lg:h-[68vh] lg:min-h-[520px]">
      <Image src="/assets/kaki-presentation-neighbour.png" alt="A community organiser and an older neighbour exploring AI together" fill priority sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover object-[68%_center]" />
    </div>
  </div>;
}

function WitnessScene() {
  return <div className="grid min-h-0 flex-1 items-center gap-8 lg:grid-cols-[1fr_.92fr]">
    <div>
      <h1 className="slide-heading">Yesterday, I saw <span className="text-purple">the idea.</span></h1>
      <blockquote className="mt-7 max-w-3xl border-l-4 border-purple pl-5 text-[clamp(1.25rem,2.4vw,2.2rem)] font-bold leading-snug text-ink">“An organiser sat beside an older neighbour and showed her what ChatGPT could do.”</blockquote>
      <p className="mt-8 max-w-3xl text-[clamp(1.1rem,1.8vw,1.5rem)] leading-relaxed text-muted">The barrier wasn’t intelligence. It was <strong className="text-purple">confidence</strong>, <strong className="text-coral">language</strong>—and <strong className="text-ink">having someone beside her.</strong></p>
    </div>
    <div className="relative h-[38vh] min-h-72 overflow-hidden border-b-4 border-coral lg:h-[61vh] lg:min-h-[480px]">
      <Image src="/assets/kaki-presentation-organiser.png" alt="The organiser standing beside an older neighbour as she learns on her phone" fill sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover object-center" />
    </div>
  </div>;
}

const needs = [
  { label: "Teach me", detail: "A phone feature", icon: MessageCircle, tone: "bg-sun" },
  { label: "Walk with me", detail: "A little movement", icon: Users, tone: "bg-coral text-white" },
  { label: "Show me how", detail: "A skill worth sharing", icon: HandHeart, tone: "bg-mint" },
];

function OpportunityScene() {
  return <div className="flex min-h-0 flex-1 flex-col justify-center">
    <h1 className="slide-heading max-w-6xl">What if every small need could find the <span className="text-purple">right neighbour?</span></h1>
    <div className="mt-10 grid divide-y border-y border-ink/15 md:grid-cols-3 md:divide-x md:divide-y-0">
      {needs.map(({ label, detail, icon: Icon, tone }) => <div key={label} className="group flex items-center gap-5 px-2 py-6 sm:px-6 md:py-10">
        <span className={cn("grid size-16 shrink-0 place-items-center rounded-xl", tone)}><Icon className="size-8" /></span>
        <div><h2 className="text-[clamp(1.6rem,3vw,3rem)] font-black tracking-tight">{label}</h2><p className="mt-1 text-muted">{detail}</p></div>
      </div>)}
    </div>
    <p className="mt-8 max-w-3xl text-xl font-bold leading-relaxed text-muted">Not a marketplace of strangers. A trusted way for neighbours of every age to ask, step forward, and exchange value.</p>
  </div>;
}

const flow = [
  { label: "Speak naturally", icon: Mic, tone: "bg-sun" },
  { label: "AI shapes a safe mission", icon: Bot, tone: "bg-mint" },
  { label: "A Kaki steps forward", icon: HeartHandshake, tone: "bg-coral text-white" },
  { label: "Meet. Help. Share.", icon: MapPin, tone: "bg-purple text-white" },
];

function ProductScene() {
  return <div className="flex min-h-0 flex-1 flex-col justify-center">
    <h1 className="slide-heading">From “I need help”<br />to <span className="text-purple">“I’ve got you.”</span></h1>
    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {flow.map(({ label, icon: Icon, tone }, index) => <div key={label} className="relative flex min-h-36 flex-col justify-between border-t-4 border-ink bg-paper p-5 shadow-[0_8px_0_rgba(33,29,53,.07)]">
        <span className={cn("grid size-12 place-items-center rounded-lg", tone)}><Icon className="size-6" /></span>
        <div><span className="text-xs font-black text-purple">0{index + 1}</span><h2 className="mt-1 text-xl font-black leading-tight">{label}</h2></div>
        {index < flow.length - 1 ? <ArrowRight className="absolute -right-5 top-1/2 z-10 hidden size-7 -translate-y-1/2 rounded-full bg-cream p-1 text-purple lg:block" /> : null}
      </div>)}
    </div>
    <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-base font-bold text-muted"><span className="flex items-center gap-2"><Languages className="size-5 text-purple" />4 community languages</span><span className="flex items-center gap-2"><Check className="size-5 text-kaki-green" />Public-place safety built in</span><span className="flex items-center gap-2"><MessageCircle className="size-5 text-coral" />Real-time coordination</span></div>
  </div>;
}

function AiScene() {
  return <div className="flex min-h-0 flex-1 flex-col justify-center">
    <h1 className="slide-heading">AI does the <span className="text-purple">invisible work.</span></h1>
    <div className="mt-10 grid overflow-hidden border border-ink/15 lg:grid-cols-[1fr_auto_1fr]">
      <div className="bg-mint p-6 sm:p-9"><Bot className="size-10 text-purple" /><h2 className="mt-5 text-3xl font-black">AI</h2><p className="mt-4 text-lg font-bold leading-9">Understand · Translate<br />Structure · Match · Guide</p></div>
      <div className="relative z-10 grid bg-ink px-6 py-8 text-center text-white lg:w-64 lg:place-items-center"><p className="text-2xl font-black leading-tight">AI creates clarity.<br /><span className="text-sun">People create belonging.</span></p></div>
      <div className="bg-coral p-6 text-white sm:p-9"><Users className="size-10" /><h2 className="mt-5 text-3xl font-black">Human</h2><p className="mt-4 text-lg font-bold leading-9">Trust · Decide · Meet<br />Teach · Care</p></div>
    </div>
    <p className="mt-7 max-w-4xl text-lg leading-relaxed text-muted">KAKI uses AI to remove friction—not agency. Neighbours choose whether to connect, where to meet, and when to step away.</p>
  </div>;
}

function ValueScene() {
  return <div className="grid min-h-0 flex-1 items-center gap-8 lg:grid-cols-[1fr_.82fr]">
    <div>
      <h1 className="slide-heading">One platform.<br />Two generations.<br /><span className="text-purple">Value in both directions.</span></h1>
      <div className="mt-8 flex flex-col border-y border-ink/15 sm:flex-row">
        <div className="flex-1 py-5 sm:pr-6"><p className="text-sm font-black text-purple">YOUNGER NEIGHBOUR SHARES</p><p className="mt-2 text-2xl font-black">Digital confidence</p></div>
        <div className="flex-1 border-t border-ink/15 py-5 sm:border-l sm:border-t-0 sm:pl-6"><p className="text-sm font-black text-coral">OLDER NEIGHBOUR SHARES</p><p className="mt-2 text-2xl font-black">Life skills & stories</p></div>
      </div>
      <p className="mt-7 text-xl font-bold text-muted">Connection · Confidence · A stronger kampung</p>
    </div>
    <div className="relative h-[42vh] min-h-80 overflow-hidden border-b-4 border-purple lg:h-[65vh]">
      <Image src="/assets/kaki-community-hero.png" alt="Pek Kio neighbours of different generations sharing skills" fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover object-center" />
    </div>
  </div>;
}

function ClosingScene({ qrCode }: { qrCode: string }) {
  return <div className="grid min-h-0 flex-1 items-center gap-8 lg:grid-cols-[1fr_auto]">
    <div>
      <p className="text-[clamp(1.3rem,2.2vw,2rem)] font-black">Don’t build AI that replaces community.</p>
      <h1 className="mt-4 max-w-5xl text-[clamp(3rem,6.7vw,6.5rem)] font-black leading-[.9] tracking-[-.06em] text-purple">Build AI that<br />activates it.</h1>
      <div className="mt-9 flex flex-wrap gap-3">
        <Link href="/home" className="inline-flex min-h-14 items-center gap-3 rounded-xl bg-purple px-6 text-base font-black text-white shadow-[0_6px_0_#382681]">Open KAKI <ArrowRight className="size-5" /></Link>
        <Link href="/share" className="inline-flex min-h-14 items-center gap-3 rounded-xl border-2 border-ink/15 bg-paper px-6 text-base font-black"><QrCode className="size-5" />Scan to try</Link>
      </div>
      <p className="mt-8 text-sm font-bold text-muted">KAKI · Pek Kio, Singapore · AI for real needs</p>
    </div>
    <div className="hidden w-64 border-2 border-ink bg-paper p-4 text-center shadow-[10px_10px_0_#f8c84a] sm:block"><Image src={qrCode} unoptimized width={480} height={480} alt="Scan to open KAKI" className="h-auto w-full" /><p className="mt-3 text-sm font-black">Try KAKI now</p></div>
  </div>;
}

function ArchitectureScene() {
  const layers = [
    {
      eyebrow: "PUBLIC EXPERIENCE",
      title: "Vercel Next.js",
      detail: "Pages, same-origin API bridge and HttpOnly session cookie",
      icon: Globe2,
      tone: "bg-sun",
    },
    {
      eyebrow: "SERVER-ONLY HTTPS",
      title: "Azure NestJS API",
      detail: "Authentication, safety rules, quotas, missions and AI calls",
      icon: Server,
      tone: "bg-coral text-white",
    },
    {
      eyebrow: "PRIVATE NETWORK",
      title: "Azure PostgreSQL",
      detail: "Accounts and community data protected by roles and RLS",
      icon: Database,
      tone: "bg-purple text-white",
    },
  ];

  return <div className="flex min-h-0 flex-1 flex-col justify-center">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-black tracking-[.18em] text-coral">APP ARCHITECTURE</p>
        <h1 className="slide-heading mt-3">Simple outside.<br /><span className="text-purple">Private where it matters.</span></h1>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-ink/15 bg-paper px-4 py-3 text-sm font-black text-muted">
        <ShieldCheck className="size-5 text-kaki-green" /> PostgreSQL has no public endpoint
      </div>
    </div>

    <div className="mt-7 grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
      {layers.map(({ eyebrow, title, detail, icon: Icon, tone }, index) => <div key={title} className="contents">
        <article className="flex min-h-40 flex-col border-t-4 border-ink bg-paper p-5 shadow-[0_8px_0_rgba(33,29,53,.07)]">
          <div className="flex items-start justify-between gap-3">
            <span className={cn("grid size-12 place-items-center rounded-lg", tone)}><Icon className="size-6" /></span>
            <span className="text-right text-[10px] font-black tracking-[.14em] text-muted">{eyebrow}</span>
          </div>
          <h2 className="mt-5 text-2xl font-black tracking-tight">{title}</h2>
          <p className="mt-2 max-w-sm text-sm font-bold leading-relaxed text-muted">{detail}</p>
        </article>
        {index < layers.length - 1 ? <div className="grid place-items-center py-1 text-purple" aria-hidden="true"><ArrowRight className="size-7 rotate-90 lg:rotate-0" /></div> : null}
      </div>)}
    </div>

    <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_1.15fr]">
      <div className="flex items-center gap-4 border border-ink/15 bg-mint px-5 py-4">
        <Sparkles className="size-7 shrink-0 text-purple" />
        <div><p className="text-xs font-black tracking-[.14em] text-purple">OPENAI</p><p className="mt-1 font-bold">Called only by NestJS; the browser never sees the API key.</p></div>
      </div>
      <div className="flex items-center gap-4 border border-ink/15 bg-paper px-5 py-4">
        <KeyRound className="size-7 shrink-0 text-coral" />
        <p className="font-bold"><span className="text-purple">Bridge key</span> authenticates Vercel to Azure. <span className="text-purple">Opaque sessions</span> identify each neighbour.</p>
      </div>
    </div>
  </div>;
}

export function PresentationDeck({ qrCode }: { qrCode: string }) {
  const [current, setCurrent] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);
  const touchStart = useRef<number | null>(null);
  const go = useCallback((next: number) => {
    setCurrent(Math.max(0, Math.min(SCENE_COUNT - 1, next)));
    setNotesOpen(false);
  }, []);
  const scenes: Scene[] = [
    { shortTitle: "Inter-generation", duration: 30, note: "Start with the purpose. KAKI uses AI to help neighbours of every age discover one another, exchange useful skills and offer support. The value moves in both directions.", content: <IntergenerationScene onBegin={() => go(1)} /> },
    { shortTitle: "People first", duration: 35, note: "This is the distinction. KAKI is not another technical product residents must master. More unfamiliar steps can widen the confidence gap. AI should handle complexity quietly, so people can focus on meeting, sharing and supporting one another.", content: <PeopleFirstScene /> },
    { shortTitle: "The belief", duration: 30, note: "Open with the contrast. AI is powerful, but the moment that changes someone’s confidence is often another person sitting beside them. KAKI is built around that human truth.", content: <IntroScene onBegin={() => go(3)} /> },
    { shortTitle: "The moment", duration: 45, note: "Today I watched an organiser help an older neighbour understand ChatGPT and how she could use it. She did not lack ability. She needed a trusted person, familiar language and permission to try.", content: <WitnessScene /> },
    { shortTitle: "The opportunity", duration: 35, note: "That moment should not depend on chance. Across Pek Kio, small requests and useful skills exist side by side. KAKI makes those needs visible and approachable.", content: <OpportunityScene /> },
    { shortTitle: "The product", duration: 50, note: "A resident speaks naturally. AI converts the request into a clear, bounded and safer mission. A neighbour chooses to help. They chat, agree a public meeting point, check in and complete the moment together.", content: <ProductScene /> },
    { shortTitle: "The AI", duration: 45, note: "AI handles language, structure, matching and simple guidance. It never decides trust for people. Both neighbours keep control, can abandon gracefully and never need to share a password or home address.", content: <AiScene /> },
    { shortTitle: "The exchange", duration: 45, note: "Intergeneration is not one-way volunteering. A younger neighbour may offer digital confidence. An older neighbour may pass on repair, cooking or local knowledge. Both leave with more than they arrived with.", content: <ValueScene /> },
    { shortTitle: "The challenge", duration: 35, note: "Close on the distinction: we are not building AI to replace community support. We are using AI to activate the support already living in the neighbourhood. Invite the judges to scan and try it.", content: <ClosingScene qrCode={qrCode} /> },
    { shortTitle: "The architecture", duration: 30, note: "The public experience stays on Vercel. Every browser API call remains same-origin, then the Next.js server forwards it over HTTPS with a private bridge credential. NestJS owns authentication, business rules and OpenAI calls. PostgreSQL is reachable only inside the Azure virtual network through its private endpoint.", content: <ArchitectureScene /> },
  ];
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") { event.preventDefault(); go(current + 1); }
      if (event.key === "ArrowLeft" || event.key === "PageUp") { event.preventDefault(); go(current - 1); }
      if (event.key === "Home") { event.preventDefault(); go(0); }
      if (event.key === "End") { event.preventDefault(); go(scenes.length - 1); }
      if (event.key.toLowerCase() === "n") setNotesOpen(value => !value);
      if (event.key === "Escape") setNotesOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, go, scenes.length]);

  async function toggleFullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  }

  return <main className="presentation-shell flex min-h-dvh flex-col overflow-x-hidden bg-cream px-4 pb-3 pt-3 text-ink sm:px-7 sm:pb-5 sm:pt-5 lg:h-dvh lg:overflow-hidden lg:px-10">
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-ink/15 pb-3">
      <Logo />
      <div className="flex items-center gap-2">
        <Link href="/self-reading" className="hidden text-sm font-black text-muted hover:text-purple md:block">Read the full idea</Link>
        <button onClick={() => setNotesOpen(value => !value)} aria-pressed={notesOpen} className="grid size-10 place-items-center rounded-lg border border-ink/15 bg-paper" aria-label="Toggle speaker notes"><StickyNote className="size-4" /></button>
        <button onClick={() => void toggleFullscreen()} className="grid size-10 place-items-center rounded-lg border border-ink/15 bg-paper" aria-label="Toggle full screen"><Expand className="size-4" /></button>
      </div>
    </header>

    <div className="flex min-h-0 flex-1 pt-3">
      <section key={current} className="presentation-scene flex min-h-0 min-w-0 flex-1 flex-col pr-3 sm:pr-6" aria-label={`Scene ${current + 1}: ${scenes[current].shortTitle}`} onTouchStart={event => { touchStart.current = event.changedTouches[0].clientX; }} onTouchEnd={event => { if (touchStart.current === null) return; const distance = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(distance) > 60) go(current + (distance < 0 ? 1 : -1)); touchStart.current = null; }}>
        {scenes[current].content}
      </section>

      <nav className="sticky top-3 flex h-[calc(100dvh-5.5rem)] w-12 shrink-0 self-start flex-col items-center border-l border-ink/15 pl-2 sm:w-20 sm:pl-4 lg:static lg:h-auto lg:self-stretch" aria-label="Presentation controls">
        <div className="mb-3 text-center leading-none"><span className="block text-base font-black text-purple sm:text-lg">{String(current + 1).padStart(2, "0")}</span><span className="mt-1 block text-[10px] font-bold text-muted sm:text-xs">/ {String(SCENE_COUNT).padStart(2, "0")}</span></div>
        <ol className="flex min-h-40 flex-1 flex-col gap-1.5" aria-label="Presentation progress">{scenes.map((scene, index) => <li key={scene.shortTitle} className="min-h-4 flex-1"><button onClick={() => go(index)} aria-label={`Go to scene ${index + 1}: ${scene.shortTitle}`} aria-current={index === current ? "step" : undefined} className={cn("h-full w-2 rounded-sm transition-colors sm:w-2.5", index <= current ? "bg-purple" : "bg-ink/10")} /></li>)}</ol>
        <div className="mt-3 flex flex-col gap-2">
          <button onClick={() => go(current - 1)} disabled={current === 0} className="grid size-10 place-items-center rounded-lg border border-ink/15 bg-paper disabled:opacity-30 sm:size-11" aria-label="Previous scene"><ArrowLeft className="size-5" /></button>
          <button onClick={() => go(current + 1)} disabled={current === scenes.length - 1} className="grid size-10 place-items-center rounded-lg bg-purple text-white disabled:opacity-30 sm:size-11" aria-label="Next scene"><ArrowRight className="size-5" /></button>
        </div>
      </nav>
    </div>

    {notesOpen ? <aside className="fixed bottom-4 left-4 right-16 z-50 mx-auto max-w-3xl border-2 border-ink bg-paper p-5 shadow-[10px_10px_0_#f8c84a] sm:right-24" aria-label="Speaker notes">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.15em] text-purple">Speaker note · {scenes[current].shortTitle}</p><p className="mt-2 text-base font-bold leading-relaxed">{scenes[current].note}</p></div><button onClick={() => setNotesOpen(false)} className="grid size-9 shrink-0 place-items-center rounded-lg bg-ink text-white" aria-label="Close speaker notes"><X className="size-4" /></button></div>
    </aside> : null}
  </main>;
}
