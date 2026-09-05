"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasSupabaseEnv()) { setError("KAKI authentication is not configured yet."); return; }
    setLoading(true); setError("");
    try {
      const { error: authError } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
      if (authError) throw authError;
      router.replace("/home");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign you in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-5">
      <div className="w-full max-w-md">
        <Logo className="justify-center" />
        <section className="paper-card mt-8 rounded-[36px] p-7 sm:p-9">
          <p className="text-xs font-black uppercase tracking-[.16em] text-purple">Welcome back</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-.06em]">Come on in.</h1>
          <p className="mt-3 leading-7 text-muted">Sign in to see your real missions, matches and community moments.</p>
          <form className="mt-7 space-y-4" onSubmit={signIn}>
            <label className="block">
              <span className="text-sm font-black">Email address</span>
              <span className="relative mt-2 flex items-center"><Mail className="absolute left-4 size-5 text-muted" /><input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required type="email" placeholder="you@example.com" className="h-14 w-full rounded-full border border-ink/10 bg-white pl-12 pr-4" /></span>
            </label>
            <label className="block">
              <span className="text-sm font-black">Password</span>
              <span className="relative mt-2 flex items-center"><LockKeyhole className="absolute left-4 size-5 text-muted" /><input value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required minLength={8} type={showPassword ? "text" : "password"} className="h-14 w-full rounded-full border border-ink/10 bg-white pl-12 pr-12" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 text-muted" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button></span>
            </label>
            {error ? <p role="alert" className="rounded-2xl bg-coral/10 p-3 text-sm font-bold text-coral">{error}</p> : null}
            <Button type="submit" disabled={loading} className="min-h-14 w-full">{loading ? <LoaderCircle className="size-5 animate-spin" /> : <>Sign in <ArrowRight className="size-4" /></>}</Button>
          </form>
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-mint/55 p-4 text-sm leading-6 text-[#17654d]"><ShieldCheck className="mt-0.5 size-5 shrink-0" />Your account and community data are protected by row-level security.</div>
          <p className="mt-6 text-center text-sm text-muted">New to KAKI? <Link href="/register" className="font-black text-purple">Create an account</Link></p>
        </section>
        <Link href="/demo" className="mt-5 block w-full text-center text-sm font-black text-purple">View the guided demo →</Link>
      </div>
    </main>
  );
}
