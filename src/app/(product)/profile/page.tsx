"use client";

import { useRouter } from "next/navigation";
import { Globe2, LogOut, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { useMissions } from "@/components/mission-provider";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/kaki";

const roleLabels: Record<Profile["role"], string> = { resident: "Resident", helper: "Helper", organiser: "Organiser" };

export default function ProfilePage() {
  const router = useRouter();
  const { profile, missions } = useMissions();
  const completed = missions.filter((mission) => mission.status === "completed" && (mission.requester.id === profile.id || mission.helper?.id === profile.id)).length;

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div><p className="text-xs font-black uppercase tracking-[.18em] text-purple">My KAKI profile</p><h1 className="mt-2 text-4xl font-black tracking-[-.06em] sm:text-5xl">Show up as yourself.</h1></div>
      <section className="paper-card mt-8 rounded-[36px] p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center"><Avatar profile={profile} size="lg" /><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-black">{profile.name}</h2><span className="inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-[11px] font-black text-[#17654d]"><ShieldCheck className="size-3" />{profile.verified ? "Verified" : "Community member"}</span></div><p className="mt-1 text-muted">{roleLabels[profile.role]} · Pek Kio community</p><p className="mt-3 max-w-xl text-sm leading-6 text-muted">{profile.bio || "Ready to share small moments of help with the neighbourhood."}</p></div><Button variant="secondary" onClick={() => router.push("/onboarding")}>Edit profile</Button></div>
        <div className="mt-7 grid gap-3 border-t border-ink/8 pt-7 sm:grid-cols-3"><ProfileFact icon={<Globe2 />} label="Languages" value={profile.languages.join(" · ") || "English"} /><ProfileFact icon={<Sparkles />} label="Skills" value={profile.skills.join(" · ") || "Add skills to your profile"} /><ProfileFact icon={<UserRound />} label="Neighbour moments" value={`${completed} completed`} /></div>
      </section>
      <section className="mt-6 rounded-[32px] bg-ink p-6 text-white sm:p-8"><div className="flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-mint text-[#17654d]"><ShieldCheck className="size-5" /></span><div><h2 className="text-xl font-black">Your real data stays yours.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">KAKI only exposes profile and mission information allowed by your role and relationship to each mission. Contact details are never shown on community cards.</p></div></div></section>
      <div className="mt-6 flex justify-end"><button onClick={() => void signOut()} className="inline-flex items-center gap-2 text-sm font-black text-coral"><LogOut className="size-4" />Sign out</button></div>
    </div>
  );
}

function ProfileFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl bg-ink/[.035] p-4"><span className="text-purple">{icon}</span><p className="mt-3 text-[11px] font-black uppercase tracking-[.14em] text-muted">{label}</p><p className="mt-2 text-sm font-bold leading-6 text-ink">{value}</p></div>;
}
