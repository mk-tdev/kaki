import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/data/profile";
import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  let profile;
  try {
    profile = await getCurrentProfile();
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") redirect("/login");
    throw error;
  }
  return <OnboardingForm initialProfile={profile} />;
}
