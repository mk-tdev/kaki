import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/data/profile";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  let profile;
  try {
    profile = await getCurrentProfile();
  } catch {
    redirect("/login");
  }
  return <OnboardingForm initialProfile={profile} />;
}
