"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, Check, Flower2 } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import type { CommunityNotification } from "@/types/kaki";

export function NotificationsList({ initialNotifications }: { initialNotifications: CommunityNotification[] }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [updating, setUpdating] = useState(false);
  const unread = notifications.filter((item) => !item.readAt);

  async function markAllRead() {
    if (!unread.length) return;
    setUpdating(true);
    const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: unread.map((item) => item.id) }) });
    if (response.ok) {
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((item) => item.readAt ? item : { ...item, readAt }));
      router.refresh();
    }
    setUpdating(false);
  }

  return <div><SectionHeading eyebrow="Your updates" title="Notifications">{unread.length ? <Button variant="secondary" onClick={() => void markAllRead()} disabled={updating} className="min-h-10 px-4 text-sm"><Check className="size-4" />Mark all read</Button> : null}</SectionHeading>{notifications.length ? <div className="paper-card mt-7 overflow-hidden rounded-[32px]">{notifications.map((item) => { const content = <div className="flex gap-4 p-5 sm:p-6"><span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${item.readAt ? "bg-ink/5 text-muted" : "bg-purple text-white"}`}><Bell className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h2 className="font-black">{item.title}</h2>{item.readAt ? null : <span className="mt-1 size-2.5 shrink-0 rounded-full bg-coral" />}</div><p className="mt-1 text-sm leading-6 text-muted">{item.body}</p><p className="mt-2 text-xs font-bold text-muted">{new Intl.DateTimeFormat("en-SG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(item.createdAt))}</p></div></div>; return item.missionId ? <Link key={item.id} href={`/missions/${item.missionId}`} className="block border-b border-ink/8 transition last:border-0 hover:bg-white/50">{content}</Link> : <div key={item.id} className="border-b border-ink/8 last:border-0">{content}</div>; })}</div> : <div className="paper-card mt-7 rounded-[32px] px-6 py-16 text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-mint text-[#17654d]"><Flower2 className="size-7" /></span><h2 className="mt-5 text-2xl font-black tracking-[-.04em]">All quiet for now.</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Real mission matches, starts and completions will appear here automatically.</p></div>}</div>;
}
