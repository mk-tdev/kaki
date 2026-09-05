import Link from "next/link";
import { FlaskConical, LogIn } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="bg-sun px-4 py-2 text-center text-xs font-black text-ink"><FlaskConical className="mr-2 inline size-4" />Showcase mode · All people, missions and impact numbers on these pages are sample data</div>
      <header className="sticky top-0 z-40 border-b border-ink/8 bg-cream/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"><Logo /><nav className="flex items-center gap-1 text-sm font-bold" aria-label="Demo navigation"><Link href="/demo" className="rounded-full px-3 py-2 text-muted hover:bg-white hover:text-purple">Overview</Link><Link href="/demo/journey" className="rounded-full px-3 py-2 text-muted hover:bg-white hover:text-purple">Journey</Link><Link href="/demo/bloom" className="hidden rounded-full px-3 py-2 text-muted hover:bg-white hover:text-purple sm:block">Bloom</Link><Link href="/ai-use" className="hidden rounded-full px-3 py-2 text-muted hover:bg-white hover:text-purple md:block">AI use</Link><Link href="/share" className="hidden rounded-full px-3 py-2 text-muted hover:bg-white hover:text-purple lg:block">Share</Link></nav><ButtonLink href="/ask" className="min-h-10 px-4 text-sm"><LogIn className="size-4" />Try the real app</ButtonLink></div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-11">{children}</main>
    </div>
  );
}
