"use client";

import { useEffect, useState } from "react";
import { Flower2, LoaderCircle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

// Strict Mode and concurrent mounts share one request; creation is POST only.
let entry: Promise<void> | undefined;
function enter() {
  entry ??= fetch("/api/auth/guest", { method: "POST" }).then(async response => {
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || "Could not join. Please try again.");
    }
    async function signIn() {
      const supabase = createClient();
      const { data } = await supabase.auth.getClaims();
      if (data?.claims?.sub) return;
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw new Error(error.status === 429 ? "Too many people are joining from this network. Try mobile data or wait a little." : "Guest entry is unavailable. Ask the demo host to check anonymous sign-ins.");
    }
    if (navigator.locks) await navigator.locks.request("kaki-guest-entry", signIn);
    else await signIn();
  }).catch(error => { entry = undefined; throw error; });
  return entry;
}

export function GuestEntry() {
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void enter().then(() => { if (active) window.location.reload(); }).catch(error => { if (active) setError(error.message); });
    return () => { active = false; };
  }, []);
  return <main className="grid min-h-dvh place-items-center px-6"><div className="max-w-md text-center">
    <div className="mx-auto grid size-24 place-items-center rounded-[32px] bg-purple text-sun"><Flower2 className="size-12 motion-safe:animate-pulse" /></div>
    <h1 className="mt-6 text-4xl font-black tracking-tight">Come as you are.</h1>
    <p className="mt-3 text-muted">No email. No password. Just a neighbour ready to connect.</p>
    {error ? <div role="alert" className="mt-6"><p className="text-coral">{error}</p><Button className="mt-4" onClick={() => window.location.reload()}>Try again</Button><ButtonLink className="ml-2 mt-4" variant="secondary" href="/login">Sign in instead</ButtonLink></div> : <p role="status" className="mt-8 flex items-center justify-center gap-2 text-purple"><LoaderCircle className="size-5 animate-spin" />Joining the kampung…</p>}
    <p className="mt-8 text-xs leading-5 text-muted">A temporary identity is saved in this browser. Clearing browser data or signing out loses access. Please avoid sharing private details.</p>
  </div></main>;
}
