"use client";
import { Flower2, Heart } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function BloomCelebration({ shared }: { shared: boolean }) {
  return <section className="relative overflow-hidden rounded-[32px] bg-mint p-8 text-center text-[#17654d]" role="status">
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">{Array.from({length:12},(_,i)=><span key={i} className="bloom-petal absolute h-4 w-2 rounded-full" style={{left:`${7+i*8}%`,top:"-20px",background:i%2?"#6d55d9":"#ecba4c",animationDelay:`${i*85}ms`}} />)}</div>
    <div className="bloom-pop relative mx-auto grid size-24 place-items-center rounded-full bg-white/70"><Flower2 className="size-14" /></div>
    <p className="mt-5 text-xs font-black uppercase tracking-[.18em]">One small act. One new connection.</p>
    <h2 className="mt-3 text-3xl font-black tracking-tight">You made the kampung bloom.</h2>
    <p className="mx-auto mt-3 max-w-md text-sm leading-7">{shared ? "You both agreed to share. Your completed moment can now appear on the live community wall." : "Your moment stays visible to you both and organisers. It is not on the public wall without consent from both people."}</p>
    <ButtonLink href={shared ? "/live" : "/bloom"} variant="secondary" className="mt-6 border-transparent bg-white/80"><Heart className="size-4" />{shared ? "See the live community wall" : "See our Bloom"}</ButtonLink>
  </section>;
}
