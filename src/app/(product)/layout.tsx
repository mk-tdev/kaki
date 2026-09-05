import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MissionProvider } from "@/components/mission-provider";
import { listBlooms } from "@/data/blooms";
import { listMissions } from "@/data/missions";
import { listNotifications } from "@/data/notifications";
import { getCurrentProfile } from "@/data/profile";

export default async function ProductLayout({ children }: { children: React.ReactNode }) {
  let profile;
  try {
    profile = await getCurrentProfile();
  } catch {
    redirect("/login");
  }

  if (!profile.onboardedAt) redirect("/onboarding");

  const [missions, blooms, notifications] = await Promise.all([listMissions(), listBlooms(), listNotifications()]);

  return (
    <MissionProvider profile={profile} initialMissions={missions} initialBlooms={blooms}>
      <AppShell profile={profile} unreadNotifications={notifications.filter((item) => !item.readAt).length}>{children}</AppShell>
    </MissionProvider>
  );
}
