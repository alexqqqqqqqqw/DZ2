import type { Metadata } from "next";

import { PayScreen } from "@/components/screens/pay-screen";

export const metadata: Metadata = { title: "Оплата" };

export default function PayPage() {
  return <PayScreen />;
}
