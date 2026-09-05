"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LeaveRequest({ matched, busy, onConfirm }: { matched: boolean; busy: boolean; onConfirm: () => Promise<boolean> }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) return <button disabled={busy} onClick={() => setConfirming(true)} className="mt-4 min-h-11 w-full rounded-xl text-sm font-bold text-muted underline decoration-ink/20 underline-offset-4 hover:text-purple">{matched ? "I can’t make it" : "Cancel my request"}</button>;
  return <div className="mt-4 rounded-2xl border border-purple/15 bg-purple/5 p-4" role="group" aria-label="Confirm cancellation">
    <h3 className="font-black">Plans changed? That’s okay.</h3>
    <p className="mt-2 text-sm leading-6 text-muted">{matched ? "This ends the request for both of you. We’ll notify your neighbour in the app so they know not to come. You can ask again another time." : "This removes your request from the board. You can ask again whenever you’re ready."} No reason needed.</p>
    <div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" disabled={busy} onClick={() => setConfirming(false)}>Keep the plan</Button><Button disabled={busy} onClick={() => { void onConfirm().then(ok => { if (ok) setConfirming(false); }); }}>{busy ? "Updating…" : "Yes, cancel request"}</Button></div>
  </div>;
}
