import { BadgeCheck } from "lucide-react";
import type { Profile } from "@/types/kaki";
import { cn, initials } from "@/lib/utils";

const tones = {
  purple: "bg-[#dcd5ff] text-[#4f37bd]",
  coral: "bg-[#ffd8d2] text-[#a83d31]",
  green: "bg-[#c9eedc] text-[#17654d]",
  yellow: "bg-[#ffebaa] text-[#76580d]",
};

export function Avatar({ profile, size = "md" }: { profile: Profile; size?: "sm" | "md" | "lg" }) {
  return (
    <span className="relative inline-flex shrink-0">
      <span className={cn("grid place-items-center rounded-full font-black", tones[profile.avatarTone], size === "sm" && "size-9 text-xs", size === "md" && "size-12 text-sm", size === "lg" && "size-20 text-xl")} aria-label={profile.name}>
        {initials(profile.name)}
      </span>
      {profile.verified ? <BadgeCheck className="absolute -bottom-0.5 -right-0.5 size-4 fill-purple text-white" aria-label="Verified community member" /> : null}
    </span>
  );
}
