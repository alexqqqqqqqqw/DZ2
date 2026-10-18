import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthScreen } from "@/components/screens/auth-screen";
import { LoadingBlock } from "@/components/states";

export const metadata: Metadata = { title: "Регистрация" };

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Открываем регистрацию" />}>
      <AuthScreen mode="register" />
    </Suspense>
  );
}
