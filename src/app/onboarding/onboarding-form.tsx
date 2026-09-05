"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, HandHeart, Languages, LoaderCircle, ShieldCheck, UserRound } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import type { Profile, UserRole } from "@/types/kaki";

const roleOptions: { role: Exclude<UserRole, "organiser">; title: string; text: string; icon: React.ReactNode }[] = [
  { role: "resident", title: "I may need a Kaki", text: "Ask for a little help, company or a skill.", icon: <UserRound /> },
  { role: "helper", title: "I can be a Kaki", text: "Offer time and skills in small, flexible ways.", icon: <HandHeart /> },
];

export function OnboardingForm({ initialProfile }: { initialProfile: Profile }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialProfile.name === "New Kaki" ? "" : initialProfile.name);
  const [role, setRole] = useState<Exclude<UserRole, "organiser">>(initialProfile.role === "organiser" ? "helper" : initialProfile.role);
  const [language, setLanguage] = useState(initialProfile.languages[0] ?? "English");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function finishOnboarding() {
    if (fullName.trim().length < 2) { setError("Tell us the name your neighbours should see."); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName, role, preferredLanguage: language }) });
      if (response.status === 401) { router.replace("/login"); return; }
      if (!response.ok) throw new Error("Could not save your profile. Please try again.");
      router.replace(role === "resident" ? "/ask" : "/home");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save your profile.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="min-h-screen px-5 py-8"><div className="mx-auto max-w-3xl"><Logo className="justify-center" /><div className="mt-10 text-center"><p className="text-xs font-black uppercase tracking-[.18em] text-purple">Your community profile</p><h1 className="mt-3 text-4xl font-black tracking-[-.06em] sm:text-5xl">How would you like to join?</h1><p className="mx-auto mt-4 max-w-lg text-lg leading-7 text-muted">You can ask, help and share at any time. This gives KAKI a safe, useful starting point.</p></div><label className="paper-card mt-8 block rounded-[28px] p-6"><span className="text-sm font-black">Name your neighbours will see</span><input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" maxLength={80} placeholder="e.g. Mei Lin" className="mt-3 h-13 w-full rounded-full border border-ink/10 bg-white px-5 outline-none transition focus:border-purple/50" /></label><div className="mt-5 grid gap-4 md:grid-cols-2">{roleOptions.map((item) => <button key={item.role} type="button" onClick={() => setRole(item.role)} className={`rounded-[28px] border p-6 text-left transition ${role === item.role ? "border-purple bg-purple text-white shadow-[0_18px_45px_rgba(109,85,217,.22)]" : "border-ink/10 bg-white/70 text-ink hover:border-purple/30"}`}><span className={`grid size-12 place-items-center rounded-2xl ${role === item.role ? "bg-white/12 text-sun" : "bg-purple/10 text-purple"}`}>{item.icon}</span><h2 className="mt-5 text-lg font-black">{item.title}</h2><p className={`mt-2 text-sm leading-6 ${role === item.role ? "text-white/65" : "text-muted"}`}>{item.text}</p></button>)}</div><section className="paper-card mt-5 rounded-[28px] p-6"><div className="flex items-center gap-3"><Languages className="size-5 text-purple" /><div><h2 className="font-black">My preferred language</h2><p className="text-sm text-muted">KAKI can translate mission guidance for you.</p></div></div><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{["English", "中文", "Bahasa Melayu", "தமிழ்"].map((item) => <button key={item} type="button" onClick={() => setLanguage(item)} className={`min-h-11 rounded-full text-sm font-bold ${language === item ? "bg-ink text-white" : "bg-ink/5 text-muted"}`}>{item}</button>)}</div></section><div className="mt-4 flex items-start gap-3 rounded-2xl bg-mint/55 p-4 text-sm leading-6 text-[#17654d]"><ShieldCheck className="mt-0.5 size-5 shrink-0" />Organiser access is approved separately by Pek Kio community staff.</div>{error ? <p role="alert" className="mt-4 text-center text-sm font-bold text-coral">{error}</p> : null}<Button onClick={() => void finishOnboarding()} disabled={loading} className="mt-6 min-h-14 w-full text-base">{loading ? <LoaderCircle className="size-5 animate-spin" /> : <>Enter KAKI <ArrowRight className="size-5" /></>}</Button><p className="mt-4 text-center text-xs text-muted">You can change these choices later.</p></div></main>;
}
