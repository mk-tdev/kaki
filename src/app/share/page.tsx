import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowLeft, QrCode, ScanLine, Share2, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ShareActions } from "@/components/share-actions";

const appUrl = "https://kaki-dun.vercel.app/";

export const metadata: Metadata = {
  title: "Scan to join",
  description: "Scan the KAKI QR code to open the live Pek Kio community app.",
};

export default async function SharePage() {
  const qrCode = await QRCode.toDataURL(appUrl, { width: 720, margin: 2, errorCorrectionLevel: "H", color: { dark: "#211D35", light: "#FFFDF7" } });

  return <main className="min-h-screen px-5 py-7 sm:px-8"><div className="mx-auto max-w-6xl"><header className="flex items-center justify-between"><Logo /><Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-muted hover:text-purple"><ArrowLeft className="size-4" />Back home</Link></header><section className="mt-8 grid overflow-hidden rounded-[42px] bg-ink shadow-[0_30px_90px_rgba(33,29,53,.25)] lg:grid-cols-[.9fr_1.1fr]"><div className="grain relative flex flex-col justify-center p-8 text-white sm:p-12"><div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.14em] text-sun"><Share2 className="size-4" />Live hackathon demo</div><h1 className="mt-6 text-balance text-5xl font-black leading-[.93] tracking-[-.065em] sm:text-7xl">Scan.<br /><span className="text-mint">Join the kampung.</span></h1><p className="mt-6 max-w-md text-lg leading-8 text-white/65">Point your phone camera at the QR code to open the real KAKI app—no URL typing needed.</p><div className="mt-8 flex items-center gap-3 rounded-2xl bg-white/8 p-4 text-sm text-white/70"><Sparkles className="size-5 shrink-0 text-sun" />Built for Pek Kio Community Innovation Space, Singapore.</div><div className="absolute -bottom-24 -left-20 size-72 rounded-full border-[52px] border-white/[.04]" /></div><div className="bg-paper p-6 sm:p-10"><div className="mx-auto max-w-md"><div className="relative mx-auto aspect-square w-full rounded-[36px] border border-ink/10 bg-white p-5 shadow-[0_20px_60px_rgba(48,39,83,.12)]"><Image src={qrCode} alt={`QR code for ${appUrl}`} fill unoptimized sizes="448px" className="rounded-[28px] object-contain p-4" /><span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[20px] border-4 border-white bg-purple text-white shadow-lg"><QrCode className="size-8" /></span><span className="pointer-events-none absolute inset-3 rounded-[28px] border-2 border-dashed border-purple/15" /></div><div className="mt-6 text-center"><div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.15em] text-purple"><ScanLine className="size-4" />Camera → Scan → Open</div><p className="mt-3 break-all text-lg font-black">kaki-dun.vercel.app</p><p className="mt-1 text-sm text-muted">Works on iPhone and Android</p></div><div className="mt-6"><ShareActions url={appUrl} /></div></div></div></section><nav className="mt-6 flex flex-wrap justify-center gap-5 text-sm font-black"><Link href="/demo" className="text-purple">View guided demo</Link><Link href="/ai-use" className="text-purple">See how AI is used</Link><Link href="/register" className="text-purple">Create an account</Link></nav></div></main>;
}
