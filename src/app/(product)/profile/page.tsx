"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CalendarClock, ChevronRight, Globe2, LogOut, ShieldCheck, SlidersHorizontal, UserRound } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { profiles } from "@/data/demo";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { Profile } from "@/types/kaki";

const roleLabels: Record<Profile["role"], string> = {
  resident: "Resident",
  helper: "Helper",
  organiser: "Organiser",
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(profiles[1]);
  const [available, setAvailable] = useState(true);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (!hasSupabaseEnv()) return;
    const controller = new AbortController();
    void fetch("/api/profile", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = await response.json() as { profile?: Profile };
        if (payload.profile) setProfile(payload.profile);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  async function signOut() {
    if (hasSupabaseEnv()) {
      const { createClient } = await import("@/lib/supabase/client");
      await createClient().auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-purple">My KAKI profile</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-.06em] sm:text-5xl">Show up as yourself.</h1>
      </div>

      <section className="paper-card mt-8 rounded-[36px] p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar profile={profile} size="lg" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black">{profile.name}</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-[11px] font-black text-[#17654d]">
                <ShieldCheck className="size-3" />
                {profile.verified ? "Verified" : "Community member"}
              </span>
            </div>
            <p className="mt-1 text-muted">{roleLabels[profile.role]} · Pek Kio community</p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{profile.bio || "Ready to share small moments of help with the neighbourhood."}</p>
          </div>
          <Button variant="secondary" onClick={() => router.push("/onboarding")}>Edit profile</Button>
        </div>
        <div className="mt-7 grid gap-3 border-t border-ink/8 pt-7 sm:grid-cols-3">
          <ProfileFact label="Languages" value={profile.languages.join(" · ") || "English"} />
          <ProfileFact label="Skills" value={profile.skills.join(" · ") || "Add your skills"} />
          <ProfileFact label="Neighbour moments" value="14 completed" />
        </div>
      </section>

      <section className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="paper-card rounded-[32px] p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-purple/10 text-purple"><CalendarClock className="size-5" /></span>
            <div><h2 className="text-xl font-black">My availability</h2><p className="text-sm text-muted">When missions can find you</p></div>
          </div>
          <label className="mt-6 flex items-center justify-between rounded-2xl bg-ink/[.035] p-4">
            <span><strong className="block text-sm">Available this weekend</strong><span className="text-xs text-muted">Sat 2–5pm · Sun 9–11am</span></span>
            <input type="checkbox" checked={available} onChange={(event) => setAvailable(event.target.checked)} className="size-5 accent-purple" />
          </label>
          <button className="mt-4 flex w-full items-center justify-between text-sm font-black text-purple">Change schedule <ChevronRight className="size-4" /></button>
        </div>
        <div className="paper-card rounded-[32px] p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-sun/25 text-[#76580d]"><SlidersHorizontal className="size-5" /></span>
            <div><h2 className="text-xl font-black">Mission preferences</h2><p className="text-sm text-muted">What feels right for you</p></div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">{["Digital help", "Friendly walks", "Food rescue", "Photography"].map((item) => <span key={item} className="rounded-full bg-ink/5 px-3 py-2 text-xs font-bold text-ink">{item}</span>)}</div>
          <button className="mt-5 flex w-full items-center justify-between text-sm font-black text-purple">Edit preferences <ChevronRight className="size-4" /></button>
        </div>
      </section>

      <section className="paper-card mt-6 divide-y divide-ink/8 rounded-[32px] px-6">
        <Setting icon={<Bell />} title="Notifications" detail="Mission matches and reminders" control={<input type="checkbox" checked={notifications} onChange={(event) => setNotifications(event.target.checked)} className="size-5 accent-purple" />} />
        <Setting icon={<Globe2 />} title="Language" detail={profile.languages[0] ?? "English"} />
        <Setting icon={<UserRound />} title="Privacy & consent" detail="Manage what the community sees" />
        <Setting icon={<ShieldCheck />} title="Safety centre" detail="Guidelines and organiser support" />
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <Link href="/organiser" className="inline-flex items-center gap-2 text-sm font-black text-purple"><ShieldCheck className="size-4" />Open organiser view</Link>
        <button onClick={() => void signOut()} className="inline-flex items-center gap-2 text-sm font-black text-coral"><LogOut className="size-4" />Sign out</button>
      </div>
    </div>
  );
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[11px] font-black uppercase tracking-[.14em] text-muted">{label}</p><p className="mt-2 text-sm font-bold leading-6 text-ink">{value}</p></div>;
}

function Setting({ icon, title, detail, control }: { icon: React.ReactNode; title: string; detail: string; control?: React.ReactNode }) {
  return <div className="flex items-center gap-4 py-5"><span className="text-purple">{icon}</span><span className="flex-1"><strong className="block text-sm">{title}</strong><span className="text-xs text-muted">{detail}</span></span>{control ?? <ChevronRight className="size-4 text-muted" />}</div>;
}
