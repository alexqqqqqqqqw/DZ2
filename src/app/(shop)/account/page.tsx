import type { Metadata } from "next";

import { AccountScreen } from "@/components/screens/account-screen";

export const metadata: Metadata = { title: "Профиль" };

export default function AccountPage() {
  return <AccountScreen />;
}
