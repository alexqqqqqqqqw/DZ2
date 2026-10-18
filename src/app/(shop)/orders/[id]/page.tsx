import type { Metadata } from "next";

import { OrderScreen } from "@/components/screens/order-screen";

export const metadata: Metadata = { title: "Заказ" };

export default function OrderPage() {
  return <OrderScreen />;
}
