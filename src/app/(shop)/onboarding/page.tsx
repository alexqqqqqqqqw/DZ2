import type { Metadata } from "next";

import { OnboardingScreen } from "@/components/screens/onboarding-screen";

export const metadata: Metadata = { title: "Как устроен заказ" };

export default function OnboardingPage() {
  return <OnboardingScreen />;
}
