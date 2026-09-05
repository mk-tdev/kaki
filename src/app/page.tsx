import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Clock3, Flower2, Languages, MapPin, Mic, ShieldCheck, Sparkles } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Logo } from "@/components/brand/logo";
import { HeroCommunityBloom } from "@/components/hero-community-bloom";
import { ButtonLink } from "@/components/ui/button";
import type { Profile } from "@/types/kaki";

const landingProfiles: [Profile, Profile] = [
  { id: "illustrative-requester", name: "Auntie Mei", role: "resident", ageBand: "70–79", languages: ["中文", "English"], avatarTone: "coral", skills: ["Home cooking"], verified: true, bio: "Illustrative Pek Kio neighbour." },
  { id: "illustrative-helper", name: "Arjun", role: "helper", ageBand: "18–24", languages: ["English"], avatarTone: "purple", skills: ["Phone basics"], verified: true, bio: "Illustrative digital Kaki." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden">
      <header className="relative z-20 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-bold text-muted lg:flex" aria-label="Landing navigation">
          <a href="#how" className="hover:text-purple">How it works</a>
          <a href="#impact" className="hover:text-purple">Our impact</a>
          <a href="#safety" className="hover:text-purple">Trust & safety</a>
          <Link href="/ai-use" className="hover:text-purple">AI use</Link>
          <Link href="/share" className="hover:text-purple">Share</Link>
        </nav>
        <ButtonLink href="/home" className="group shrink-0 gap-3 border border-white/20 bg-gradient-to-br from-purple to-purple-dark py-2 pl-4 pr-2 shadow-[0_6px_0_#382681,0_12px_24px_#6d55d930] hover:shadow-[0_3px_0_#382681,0_8px_18px_#6d55d930] motion-safe:hover:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple"><span>Let’s KAKI</span><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sun text-ink"><ArrowRight className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5" /></span></ButtonLink>
      </header>

      <main>
        <section className="relative mx-auto grid min-h-[760px] max-w-7xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:pt-4">
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple/15 bg-white/70 px-4 py-2 text-sm font-bold text-purple-dark shadow-sm"><span className="size-2 rounded-full bg-kaki-green" />Made with Pek Kio, for Pek Kio</div>
            <h1 className="text-balance max-w-3xl text-[clamp(3rem,13vw,7.5rem)] font-black leading-[.84] tracking-[-0.075em] text-ink sm:text-[clamp(3.7rem,8vw,7.5rem)]">One small favour.<br /><span className="text-purple">One real neighbour.</span></h1>
            <p className="mt-8 max-w-xl text-balance text-lg leading-8 text-muted sm:text-xl">Speak what you need. KAKI turns it into a safe, bite-sized mission and finds a neighbour who can help—right here in Pek Kio.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/ask" className="min-h-14 px-7 text-base"><Mic className="size-5" />I need a Kaki</ButtonLink>
              <ButtonLink href="/discover" variant="sun" className="min-h-14 px-7 text-base">I can be a Kaki <ArrowRight className="size-5" /></ButtonLink>
              <ButtonLink href="/demo" variant="secondary" className="min-h-14 px-7 text-base">View demo</ButtonLink>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-muted"><span className="flex items-center gap-2"><Check className="size-4 text-kaki-green" />No complicated forms</span><span className="flex items-center gap-2"><Check className="size-4 text-kaki-green" />4 languages</span><span className="flex items-center gap-2"><Check className="size-4 text-kaki-green" />Safe public spaces</span></div>
          </div>

          <div className="relative mx-auto min-h-[590px] w-full max-w-[590px]">
            <div className="absolute left-[5%] top-[7%] size-40 rounded-full bg-sun/60 blur-3xl" />
            <div className="absolute bottom-[9%] right-[4%] size-52 rounded-full bg-mint blur-3xl" />
            <HeroCommunityBloom />
            <div className="hero-request-card grain paper-card absolute left-[2%] top-[12%] z-10 w-[82%] rotate-[-4deg] rounded-[36px] p-6 sm:left-[8%] sm:w-[76%]">
              <div className="flex items-center gap-4"><Avatar profile={landingProfiles[0]} size="lg" /><div><p className="text-xs font-black uppercase tracking-[.15em] text-coral">Illustrative request</p><p className="mt-1 text-xl font-black">“How do I send a photo?”</p></div></div>
              <div className="mt-6 flex items-center justify-center gap-3 rounded-3xl bg-purple/8 px-4 py-5 text-purple"><Sparkles className="size-5" /><span className="font-black">KAKI is making this easy…</span></div>
            </div>
            <div className="hero-mission-card grain absolute right-[2%] top-[48%] z-20 w-[86%] rotate-[3deg] rounded-[36px] bg-ink p-6 text-white shadow-[0_28px_70px_rgba(33,29,53,.28)] sm:w-[78%]">
              <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.15em] text-sun">15-minute mission</p><h2 className="mt-2 text-2xl font-black tracking-[-.04em]">Send a photo to family</h2></div><span className="grid size-12 place-items-center rounded-2xl bg-white/10"><Languages className="size-6 text-mint" /></span></div>
              <div className="mt-5 space-y-3 text-sm text-white/75"><p className="flex items-center gap-2"><Clock3 className="size-4 text-sun" />Saturday, 3:00pm · 15 min</p><p className="flex items-center gap-2"><MapPin className="size-4 text-sun" />Pek Kio Community Innovation Space</p></div>
              <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5"><Avatar profile={landingProfiles[1]} /><div><p className="font-black">Arjun is your Kaki</p><p className="text-xs text-white/60">English · Digital buddy</p></div><span className="ml-auto rounded-full bg-mint px-3 py-1.5 text-xs font-black text-[#17654d]">Matched!</span></div>
            </div>
            <div className="hero-bloom-badge absolute bottom-[2%] left-[1%] z-30 flex items-center gap-3 rounded-full bg-coral px-5 py-3 text-sm font-black text-white shadow-xl"><Flower2 className="hero-bloom-flower size-5" />A new neighbour moment bloomed</div>
          </div>
        </section>

        <section id="impact" className="bg-ink px-5 py-8 text-white sm:px-8">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 py-7 md:grid-cols-4"><Impact value="Real" label="account-backed profiles" /><Impact value="Live" label="community mission updates" /><Impact value="Safe" label="row-level permissions" /><Impact value="Clear" label="demo and live data separation" /></div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pt-24 sm:px-8">
          <div className="paper-card grid overflow-hidden rounded-[40px] lg:grid-cols-[.72fr_1.28fr]">
            <div className="flex flex-col justify-center p-8 sm:p-12"><p className="text-xs font-black uppercase tracking-[.18em] text-coral">Built for real life</p><h2 className="mt-3 text-balance text-4xl font-black tracking-[-.055em] sm:text-5xl">Four needs.<br />One kampung.</h2><p className="mt-5 text-lg leading-8 text-muted">Digital confidence, healthy movement, repair and sharing, and skills worth passing on—connected in one welcoming place.</p><ButtonLink href="/poster" variant="secondary" className="mt-7 w-fit">View event poster <ArrowRight className="size-4" /></ButtonLink></div>
            <div className="relative min-h-[360px] bg-purple/8 lg:min-h-[520px]"><Image src="/assets/kaki-community-hero.png" alt="Pek Kio neighbours sharing digital skills, walking, repairing and exchanging recipes" fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" /></div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <p className="text-center text-xs font-black uppercase tracking-[.2em] text-purple">How it works</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-balance text-center text-4xl font-black tracking-[-.055em] sm:text-5xl">Less screen time.<br />More neighbour time.</h2>
          <div className="mt-14 grid gap-5 md:grid-cols-3"><Step number="01" title="Say what you need" text="Speak or type naturally in the language you are most comfortable with." icon={<Mic />} /><Step number="02" title="Meet the right Kaki" text="AI creates a small, safe mission and matches language, time and skills." icon={<Sparkles />} /><Step number="03" title="Make Pek Kio bloom" text="Complete the moment, exchange a skill and add to our living community mural." icon={<Flower2 />} /></div>
        </section>

        <section id="safety" className="mx-auto mb-24 max-w-7xl px-5 sm:px-8">
          <div className="grain grid overflow-hidden rounded-[40px] bg-purple text-white lg:grid-cols-[.8fr_1.2fr]">
            <div className="p-8 sm:p-12"><ShieldCheck className="size-12 text-sun" /><h2 className="mt-6 text-4xl font-black tracking-[-.055em]">Safe by design.<br />Human by nature.</h2><p className="mt-5 max-w-md text-lg leading-8 text-white/72">AI helps organise. People make the decisions. Sensitive needs are always reviewed by a trained community organiser.</p></div>
            <div className="grid gap-3 bg-white/8 p-6 sm:grid-cols-2 sm:p-10"><Safety label="Clear verification status" /><Safety label="Public-place meeting guidance" /><Safety label="No location tracking" /><Safety label="Sensitive requests held for review" /><Safety label="AI-assisted introductions" /><Safety label="Consent-led story sharing" /></div>
          </div>
        </section>
      </main>
      <footer className="border-t border-ink/10 px-5 py-10 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row"><Logo /><p className="text-center text-sm text-muted">Built for the Pek Kio Community Innovation Space · Singapore</p><div className="flex flex-wrap justify-center gap-5"><Link href="/ai-use" className="text-sm font-black text-muted">AI use</Link><Link href="/share" className="text-sm font-black text-muted">Share QR</Link><Link href="/demo" className="text-sm font-black text-muted">View demo</Link><Link href="/home" className="text-sm font-black text-purple">Enter KAKI →</Link></div></div></footer>
    </div>
  );
}

function Impact({ value, label }: { value: string; label: string }) { return <div><p className="text-3xl font-black tracking-[-.05em] text-sun sm:text-4xl">{value}</p><p className="mt-1 text-sm text-white/60">{label}</p></div>; }
function Step({ number, title, text, icon }: { number: string; title: string; text: string; icon: React.ReactNode }) { return <div className="paper-card rounded-[32px] p-7"><div className="flex items-center justify-between"><span className="grid size-13 place-items-center rounded-2xl bg-purple text-white">{icon}</span><span className="text-4xl font-black text-ink/8">{number}</span></div><h3 className="mt-8 text-2xl font-black tracking-[-.04em]">{title}</h3><p className="mt-3 leading-7 text-muted">{text}</p></div>; }
function Safety({ label }: { label: string }) { return <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-4 text-sm font-bold"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-mint text-[#17654d]"><Check className="size-4" /></span>{label}</div>; }
