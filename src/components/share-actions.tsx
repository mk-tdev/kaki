"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

export function ShareActions({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true); setError("");
      window.setTimeout(() => setCopied(false), 1800);
    } catch { setError("Copy failed. Use the Open KAKI button or scan the code."); }
  }

  return <div><div className="flex flex-col gap-3 sm:flex-row"><Button onClick={() => void copyLink()} variant="secondary" className="min-h-13 flex-1 bg-white text-ink">{copied ? <Check className="size-5 text-kaki-green" /> : <Copy className="size-5" />}{copied ? "Copied" : "Copy link"}</Button><ButtonLink href={url} className="min-h-13 flex-1 border border-white/30" ><ExternalLink className="size-5" />Open KAKI</ButtonLink></div>{error?<p role="status" className="mt-2 text-xs">{error}</p>:null}</div>;
}
