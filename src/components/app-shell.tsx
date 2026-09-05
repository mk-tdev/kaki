"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Flower2, Home, Plus, Search, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/kaki";

const navItems = [
  { href: "/home", label: "Home", Icon: Home },
  { href: "/discover", label: "Missions", Icon: Search },
  { href: "/ask", label: "Ask", Icon: Plus, primary: true },
  { href: "/bloom", label: "Bloom", Icon: Flower2 },
  { href: "/profile", label: "Profile", Icon: UserRound },
];

export function AppShell({ children, profile, unreadNotifications }: { children: ReactNode; profile: Profile; unreadNotifications: number }) {
  const pathname = usePathname();
  const [unread, setUnread] = useState(unreadNotifications);

  useEffect(() => {
    const refreshUnread = async () => {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json() as { notifications?: { readAt?: string }[] };
      setUnread(payload.notifications?.filter((item) => !item.readAt).length ?? 0);
    };

    const refresh = () => { if (document.visibilityState === "visible") void refreshUnread().catch(() => undefined); };
    refresh();
    const timer = window.setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [profile.id]);
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-ink/8 bg-cream/88 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            {navItems.map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return <Link key={href} href={href} className={cn("flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition", active ? "bg-white text-purple shadow-sm" : "text-muted hover:bg-white/60 hover:text-ink")}><Icon className="size-4" />{label}</Link>;
            })}
          </nav>
          <div className="flex items-center gap-2">
            {profile.role === "organiser" ? <Link href="/organiser" className="hidden items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2.5 text-sm font-bold text-ink transition hover:border-purple/30 lg:flex"><ShieldCheck className="size-4 text-purple" />Organiser</Link> : null}
            <Link href="/notifications" className="relative grid size-11 place-items-center rounded-full bg-white text-ink shadow-sm" aria-label={`${unread} unread notifications`}><Bell className="size-5" />{unread ? <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-coral px-1.5 text-[10px] font-black leading-5 text-white">{Math.min(unread, 99)}</span> : null}</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-9">{profile.isGuest ? <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-purple/8 px-4 py-3 text-xs text-purple-dark"><span><strong>Guest · {profile.name}</strong> — jump in and make a connection.</span><Link href="/profile" className="font-black underline underline-offset-4">Optional details</Link><p className="w-full text-[11px] text-muted">Keep this browser open. Signing out or clearing browser data loses your temporary identity. Guests are not identity-verified.</p></div> : null}{children}</main>
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
