import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5", className)} aria-label="KAKI home">
      <span className="relative size-10 shrink-0 overflow-hidden rounded-[15px] shadow-[0_8px_20px_rgba(109,85,217,.25)]">
        <Image src="/icons/icon-192.png" alt="" fill sizes="40px" priority className="object-cover" />
      </span>
      {compact ? null : <span className="text-xl font-black tracking-[-0.05em] text-ink">KAKI</span>}
    </Link>
  );
}
