import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthScreen } from "@/components/screens/auth-screen";
import { LoadingBlock } from "@/components/states";

export const metadata: Metadata = { title: "Вход" };

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Открываем вход" />}>
      <AuthScreen mode="login" />
    </Suspense>
  );
}
