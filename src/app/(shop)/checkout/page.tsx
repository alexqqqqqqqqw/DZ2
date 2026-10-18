import type { Metadata } from "next";
import { Suspense } from "react";

import { CheckoutScreen } from "@/components/screens/checkout-screen";
import { LoadingBlock } from "@/components/states";

export const metadata: Metadata = { title: "Доставка" };

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Открываем оформление" />}>
      <CheckoutScreen />
    </Suspense>
  );
}
