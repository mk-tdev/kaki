import { Bike, HeartHandshake, Salad, Smartphone, Wrench, type LucideIcon } from "lucide-react";
import type { MissionCategory } from "@/types/kaki";
import { cn } from "@/lib/utils";

export const categoryMeta: Record<MissionCategory, { label: string; description: string; Icon: LucideIcon; color: string; bloom: string }> = {
  digital: { label: "Digital help", description: "Phones, apps and online services", Icon: Smartphone, color: "bg-[#ded7ff] text-[#4f37bd]", bloom: "#6D55D9" },
  wellbeing: { label: "Walk & wellbeing", description: "Movement, company and listening", Icon: Bike, color: "bg-[#ffd8d2] text-[#a83d31]", bloom: "#F46F5F" },
  repair: { label: "Fix & share", description: "Repair, borrow and reuse", Icon: Wrench, color: "bg-[#c9eedc] text-[#17654d]", bloom: "#238968" },
  food: { label: "Food rescue", description: "Cook, share and waste less", Icon: Salad, color: "bg-[#ffebaa] text-[#76580d]", bloom: "#F8C84A" },
  skills: { label: "Skills & stories", description: "Teach something worth keeping", Icon: HeartHandshake, color: "bg-[#f0d8ff] text-[#754194]", bloom: "#B66DCE" },
};

export function CategoryIcon({ category, className }: { category: MissionCategory; className?: string }) {
  const { Icon, color } = categoryMeta[category];
  return <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", color, className)}><Icon className="size-5" aria-hidden="true" /></span>;
}
