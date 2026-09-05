import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MissionProvider } from "@/components/mission-provider";
import { listBlooms } from "@/data/blooms";
import { listMissions } from "@/data/missions";
import { listNotifications } from "@/data/notifications";
import { getCurrentProfile } from "@/data/profile";
import { GuestEntry } from "@/components/guest-entry";
import { guestModeEnabled } from "@/lib/guest-mode";

export const dynamic = "force-dynamic";

export default async function ProductLayout({ children }: { children: React.ReactNode }) {
  let profile;
  try {
    profile = await getCurrentProfile();
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "Unauthorized") throw error;
    if (await guestModeEnabled()) return <GuestEntry />;
    redirect("/login");
  }

  if (profile.isGuest && !await guestModeEnabled()) redirect("/login?guest=ended");
  if (!profile.onboardedAt && !profile.isGuest) redirect("/onboarding");

  const [missions, blooms, notifications] = await Promise.all([listMissions(), listBlooms(), listNotifications()]);

  return (
    <MissionProvider profile={profile} initialMissions={missions} initialBlooms={blooms}>
      <AppShell profile={profile} unreadNotifications={notifications.filter((item) => !item.readAt).length}>{children}</AppShell>
    </MissionProvider>
  );
}
