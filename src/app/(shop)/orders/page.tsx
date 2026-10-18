import type { Metadata } from "next";

import { OrdersScreen } from "@/components/screens/orders-screen";

export const metadata: Metadata = { title: "Заказы" };

export default function OrdersPage() {
  return <OrdersScreen />;
}
