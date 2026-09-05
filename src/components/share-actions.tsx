"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

export function ShareActions({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <div className="flex flex-col gap-3 sm:flex-row"><Button onClick={() => void copyLink()} variant="secondary" className="min-h-13 flex-1">{copied ? <Check className="size-5 text-kaki-green" /> : <Copy className="size-5" />}{copied ? "Copied" : "Copy app link"}</Button><ButtonLink href={url} className="min-h-13 flex-1" ><ExternalLink className="size-5" />Open KAKI</ButtonLink></div>;
}
