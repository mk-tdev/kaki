import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "sun" | "dark";
const styles: Record<ButtonVariant, string> = {
  primary: "bg-purple text-white shadow-[0_10px_24px_rgba(109,85,217,.24)] hover:bg-purple-dark",
  secondary: "border border-[var(--line)] bg-paper text-ink hover:border-purple/30 hover:bg-white",
  ghost: "text-ink hover:bg-ink/5",
  sun: "bg-sun text-ink shadow-[0_10px_24px_rgba(248,200,74,.24)] hover:bg-[#f3bc2d]",
  dark: "bg-ink text-white hover:bg-[#342c53]",
};

export function Button({ className, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={cn("inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-center text-[15px] leading-snug whitespace-normal [overflow-wrap:anywhere] [&>svg]:shrink-0 font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50", styles[variant], className)} {...props} />;
}

export function ButtonLink({ href, children, className, variant = "primary" }: { href: string; children: ReactNode; className?: string; variant?: ButtonVariant }) {
  return <Link href={href} className={cn("inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-center text-[15px] leading-snug whitespace-normal [overflow-wrap:anywhere] [&>svg]:shrink-0 font-bold transition-all duration-200", styles[variant], className)}>{children}</Link>;
}
