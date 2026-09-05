import type { ReactNode } from "react";

export function SectionHeading({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div>
      {eyebrow ? <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-purple">{eyebrow}</p> : null}
      <div className="flex flex-wrap items-end justify-between gap-3"><h2 className="text-3xl font-black tracking-[-0.055em] text-ink sm:text-4xl">{title}</h2>{children}</div>
    </div>
  );
}
