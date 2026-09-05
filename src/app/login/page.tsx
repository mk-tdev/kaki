"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, LoaderCircle, Mail, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  async function signIn() {
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    setLoading(true); setError("");
    if (!hasSupabaseEnv()) { setTimeout(() => { setLoading(false); router.push("/onboarding"); }, 450); return; }
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (authError) throw authError;
      setSent(true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not send your sign-in link."); }
    finally { setLoading(false); }
  }
  return <main className="grid min-h-screen place-items-center p-5"><div className="w-full max-w-md"><Logo className="justify-center" /><section className="paper-card mt-8 rounded-[36px] p-7 sm:p-9">{sent ? <div className="text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-mint text-[#17654d]"><Check className="size-7" /></span><h1 className="mt-5 text-3xl font-black tracking-[-.05em]">Check your inbox</h1><p className="mt-3 leading-7 text-muted">We sent a secure sign-in link to <strong className="text-ink">{email}</strong>.</p></div> : <><p className="text-xs font-black uppercase tracking-[.16em] text-purple">Welcome, Kaki</p><h1 className="mt-2 text-4xl font-black tracking-[-.06em]">Come on in.</h1><p className="mt-3 leading-7 text-muted">Use a password-free magic link. It’s easier to remember and safer to share.</p><label className="mt-7 block"><span className="text-sm font-black">Email address</span><span className="relative mt-2 flex items-center"><Mail className="absolute left-4 size-5 text-muted" /><input value={email} onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void signIn(); }} type="email" placeholder="you@example.com" className="h-14 w-full rounded-full border border-ink/10 bg-white pl-12 pr-4" /></span></label>{error ? <p className="mt-3 text-sm font-bold text-coral">{error}</p> : null}<Button onClick={() => void signIn()} disabled={loading} className="mt-5 min-h-14 w-full">{loading ? <LoaderCircle className="size-5 animate-spin" /> : <>Send my sign-in link <ArrowRight className="size-4" /></>}</Button><div className="mt-6 flex items-start gap-3 rounded-2xl bg-mint/55 p-4 text-sm leading-6 text-[#17654d]"><ShieldCheck className="mt-0.5 size-5 shrink-0" />Your contact details are never shown publicly or used for AI matching.</div></>}</section><button onClick={() => router.push("/home")} className="mt-5 w-full text-center text-sm font-black text-purple">Explore in demo mode →</button></div></main>;
}
