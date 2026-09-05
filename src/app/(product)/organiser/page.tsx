import { redirect } from "next/navigation";
import { OrganiserDashboard } from "@/components/organiser-dashboard";
import { getCurrentProfile } from "@/data/profile";

export default async function OrganiserPage() {
  const profile = await getCurrentProfile();
  if (profile.role !== "organiser") redirect("/home");

  return <OrganiserDashboard />;
}
