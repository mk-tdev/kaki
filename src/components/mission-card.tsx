import Link from "next/link";
import { Clock3, Languages, MapPin } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { CategoryIcon, categoryMeta } from "@/components/category-icon";
import type { Mission } from "@/types/kaki";
import { cn, formatMissionDate } from "@/lib/utils";

const statusLabels: Record<Mission["status"], string> = {
  draft: "Draft",
  open: "Looking for a Kaki",
  matched: "Kaki found",
  in_progress: "Happening now",
  completed: "Completed",
  cancelled: "Cancelled",
  flagged: "Organiser review",
};

export function MissionCard({ mission, compact = false, href }: { mission: Mission; compact?: boolean; href?: string }) {
  return (
    <Link href={href ?? `/missions/${mission.id}`} className="paper-card group block rounded-2xl p-5 transition duration-200 hover:-translate-y-1 hover:border-purple/25 hover:shadow-[0_22px_60px_rgba(48,39,83,.13)]">
      <div className="flex items-start gap-3">
        <CategoryIcon category={mission.category} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-muted">{categoryMeta[mission.category].label}</span>
            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-black", mission.status === "open" && "bg-sun/35 text-[#6c5313]", mission.status === "matched" && "bg-purple/10 text-purple-dark", mission.status === "completed" && "bg-mint text-[#17654d]", mission.status === "cancelled" && "bg-ink/8 text-muted", mission.status === "flagged" && "bg-coral/15 text-[#a83d31]", mission.status === "in_progress" && "bg-purple text-white")}>{statusLabels[mission.status]}</span>
          </div>
          <h3 className="mt-2 text-xl font-black leading-tight tracking-[-0.035em] text-ink group-hover:text-purple-dark">{mission.title}</h3>
        </div>
      </div>
      {compact ? null : <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{mission.summary}</p>}
      <div className="mt-4 grid gap-2 text-sm font-medium text-muted">
        <span className="flex items-center gap-2"><Clock3 className="size-4 text-purple" />{mission.durationMinutes} min · {formatMissionDate(mission.scheduledAt)}</span>
        <span className="flex items-center gap-2"><MapPin className="size-4 text-purple" /><span className="truncate">{mission.location}</span></span>
        <span className="flex items-center gap-2"><Languages className="size-4 text-purple" />{mission.language}</span>
      </div>
      <div className="mt-5 flex items-center gap-3 border-t border-ink/8 pt-4">
        <Avatar profile={mission.requester} size="sm" />
        <div className="min-w-0"><p className="truncate text-sm font-bold text-ink">{mission.requester.name}</p><p className="text-xs capitalize text-muted">{mission.requester.role} · Pek Kio</p></div>
        <span className="ml-auto text-sm font-black text-purple">View mission →</span>
      </div>
    </Link>
  );
}
