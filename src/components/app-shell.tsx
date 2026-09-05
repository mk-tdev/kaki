"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Flower2, Home, Plus, Search, ShieldCheck, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/home", label: "Home", Icon: Home },
  { href: "/discover", label: "Missions", Icon: Search },
  { href: "/ask", label: "Ask", Icon: Plus, primary: true },
  { href: "/bloom", label: "Bloom", Icon: Flower2 },
  { href: "/profile", label: "Profile", Icon: UserRound },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-ink/8 bg-cream/88 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            {navItems.filter((item) => !item.primary).map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return <Link key={href} href={href} className={cn("flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition", active ? "bg-white text-purple shadow-sm" : "text-muted hover:bg-white/60 hover:text-ink")}><Icon className="size-4" />{label}</Link>;
            })}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/organiser" className="hidden items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2.5 text-sm font-bold text-ink transition hover:border-purple/30 lg:flex"><ShieldCheck className="size-4 text-purple" />Organiser</Link>
            <button className="relative grid size-11 place-items-center rounded-full bg-white text-ink shadow-sm" aria-label="Notifications"><Bell className="size-5" /><span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-coral" /></button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-9">{children}</main>
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-paper/95 px-3 pt-2 backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
        <div className="mx-auto grid max-w-md grid-cols-5 items-end">
          {navItems.map(({ href, label, Icon, primary }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return <Link key={href} href={href} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold", primary ? "-mt-7" : active ? "text-purple" : "text-muted")}>
              <span className={cn("grid place-items-center", primary ? "size-14 rounded-full bg-purple text-white shadow-[0_10px_28px_rgba(109,85,217,.35)]" : "size-7")}><Icon className={primary ? "size-6" : "size-5"} /></span>
              <span>{label}</span>
            </Link>;
          })}
        </div>
      </nav>
    </div>
  );
}
