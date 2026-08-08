import { redirect } from "next/navigation";

/** `/onboarding` a secas no es un paso: manda al primero. */
export default function OnboardingIndex() {
  redirect("/onboarding/welcome");
}
