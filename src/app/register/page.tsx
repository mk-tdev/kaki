"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/auth/client";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (fullName.trim().length < 2) { setError("Tell us the name your neighbours should see."); return; }
    setLoading(true); setError("");
    try {
      const { data, error: authError } = await createClient().auth.signUp({
        email: email.trim(),
        password,
        inviteCode,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
          data: { full_name: fullName.trim(), preferred_language: "English" },
        },
      });
      if (authError) throw authError;
      if (data.session) { router.replace("/onboarding"); router.refresh(); return; }
      setSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create your account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-5">
      <div className="w-full max-w-md">
        <Logo className="justify-center" />
        <section className="paper-card mt-8 rounded-[36px] p-7 sm:p-9">
          {sent ? <div className="text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-mint text-[#17654d]"><Check className="size-7" /></span><h1 className="mt-5 text-3xl font-black tracking-[-.05em]">Check your inbox</h1><p className="mt-3 leading-7 text-muted">Confirm <strong className="text-ink">{email}</strong>, then finish your community profile.</p><Link href="/login" className="mt-6 inline-block font-black text-purple">Back to sign in →</Link></div> : <><p className="text-xs font-black uppercase tracking-[.16em] text-purple">Join the kampung</p><h1 className="mt-2 text-4xl font-black tracking-[-.06em]">Create your KAKI account.</h1><p className="mt-3 leading-7 text-muted">Use an organiser invitation to create a pilot account. Email addresses are not verified in this pilot.</p><form className="mt-7 space-y-4" onSubmit={register}><Field icon={<UserRound />} label="Neighbour name" value={fullName} onChange={setFullName} type="text" autoComplete="name" placeholder="e.g. Mei Lin" /><Field icon={<LockKeyhole />} label="Invitation code" value={inviteCode} onChange={setInviteCode} type="text" autoComplete="off" placeholder="Ask the organiser" /><Field icon={<Mail />} label="Email address" value={email} onChange={setEmail} type="email" autoComplete="email" placeholder="you@example.com" /><label className="block"><span className="text-sm font-black">Password</span><span className="relative mt-2 flex items-center"><LockKeyhole className="absolute left-4 size-5 text-muted" /><input value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required minLength={8} type={showPassword ? "text" : "password"} className="h-14 w-full rounded-full border border-ink/10 bg-white pl-12 pr-12" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 text-muted" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button></span><span className="mt-2 block text-xs text-muted">At least 8 characters</span></label>{error ? <p role="alert" className="rounded-2xl bg-coral/10 p-3 text-sm font-bold text-coral">{error}</p> : null}<Button type="submit" disabled={loading} className="min-h-14 w-full">{loading ? <LoaderCircle className="size-5 animate-spin" /> : <>Create account <ArrowRight className="size-4" /></>}</Button></form><p className="mt-6 text-center text-sm text-muted">Already registered? <Link href="/login" className="font-black text-purple">Sign in</Link></p></>}
        </section>
        <Link href="/demo" className="mt-5 block w-full text-center text-sm font-black text-purple">Explore the sample experience first →</Link>
      </div>
    </main>
  );
}

function Field({ icon, label, value, onChange, type, autoComplete, placeholder }: { icon: React.ReactNode; label: string; value: string; onChange: (value: string) => void; type: "text" | "email"; autoComplete: string; placeholder: string }) {
  return <label className="block"><span className="text-sm font-black">{label}</span><span className="relative mt-2 flex items-center"><span className="absolute left-4 text-muted">{icon}</span><input value={value} onChange={(event) => onChange(event.target.value)} required type={type} autoComplete={autoComplete} placeholder={placeholder} className="h-14 w-full rounded-full border border-ink/10 bg-white pl-12 pr-4" /></span></label>;
}
