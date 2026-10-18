import type { Metadata } from "next";

import { LandingScreen } from "@/components/screens/landing-screen";

export const metadata: Metadata = {
  title: "Готовые рационы",
};

export default function HomePage() {
  return <LandingScreen />;
}
