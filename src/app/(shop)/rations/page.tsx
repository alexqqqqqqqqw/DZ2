import type { Metadata } from "next";

import { RationsScreen } from "@/components/screens/rations-screen";

export const metadata: Metadata = { title: "Тип питания" };

export default function RationsPage() {
  return <RationsScreen />;
}
